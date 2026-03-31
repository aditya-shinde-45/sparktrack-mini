import supabase from '../../config/database.js';
import emailService from '../../services/emailService.js';

const REMINDER_MAX_GROUPS = 200;
const REMINDER_MAX_RECIPIENTS = 1200;
const REMINDER_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 min
const REMINDER_RATE_LIMIT_MAX_REQUESTS = 3;
const reminderRateMap = new Map();

/**
 * Escape a single CSV cell value.
 * Wraps in quotes if the value contains a comma, quote, or newline.
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  let str = String(value);

  // Prevent CSV/Excel formula injection when opened in spreadsheet tools.
  if (/^\s*[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function validateSearch(search) {
  const value = typeof search === 'string' ? search.trim() : '';
  if (value.length > 100) {
    throw new Error('Search query is too long (max 100 chars)');
  }
  return value;
}

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function escapeHtml(input) {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTemplate(template, groupId) {
  return String(template || '').replace(/\{\{\s*group_id\s*\}\}/gi, groupId || '');
}

function plainTextToHtml(text) {
  return escapeHtml(text).replace(/\n/g, '<br/>');
}

function sanitizeTemplateInput(value, maxLen) {
  const text = String(value || '')
    .replace(/\r/g, '')
    .replace(/\u0000/g, '')
    .trim();
  return text.length > maxLen ? text.slice(0, maxLen) : text;
}

function isValidGroupId(groupId) {
  return /^[A-Za-z0-9_-]{3,64}$/.test(String(groupId || ''));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function getAdminRateKey(user = {}) {
  return String(user.user_id || user.id || user.email || 'unknown-admin');
}

function checkReminderRateLimit(user = {}) {
  const key = getAdminRateKey(user);
  const now = Date.now();
  const current = reminderRateMap.get(key);

  if (!current || now - current.windowStart > REMINDER_RATE_LIMIT_WINDOW_MS) {
    reminderRateMap.set(key, { windowStart: now, count: 1 });
    return { allowed: true };
  }

  if (current.count >= REMINDER_RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterMs = REMINDER_RATE_LIMIT_WINDOW_MS - (now - current.windowStart);
    return { allowed: false, retryAfterMs };
  }

  current.count += 1;
  reminderRateMap.set(key, current);
  return { allowed: true };
}

function normalizeEnrollment(value) {
  return String(value || '').trim().toUpperCase();
}

function chunkArray(items, size = 200) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Fetch PBL group-member rows with backward-compatible handling for optional columns.
 * Some deployments may not have email_id in pbl yet.
 */
async function fetchPblMembersForStatus() {
  let { data, error } = await supabase
    .from('pbl')
    .select('group_id, enrollment_no, student_name, mentor_code, email_id')
    .order('group_id', { ascending: true });

  if (error) {
    const message = String(error.message || '').toLowerCase();
    const isEmailColumnIssue = message.includes('email_id') && message.includes('column');

    if (!isEmailColumnIssue) {
      throw error;
    }

    // Fallback for older schemas where email_id is absent.
    const fallback = await supabase
      .from('pbl')
      .select('group_id, enrollment_no, student_name, mentor_code')
      .order('group_id', { ascending: true });

    if (fallback.error) throw fallback.error;

    data = (fallback.data || []).map((row) => ({ ...row, email_id: null }));
  }

  return data || [];
}

/**
 * Resolve student emails by enrollment from master tables.
 * Primary: students1.student_email_id
 * Fallback: pbl_2025.email_id (legacy datasets)
 */
async function resolveEmailsByEnrollment(enrollments = []) {
  const uniqueEnrollments = [...new Set((enrollments || []).map(normalizeEnrollment).filter(Boolean))];
  if (uniqueEnrollments.length === 0) return new Map();

  const emailMap = new Map();

  // Query in chunks to avoid URI/query-size limits on large cohorts.
  const enrollmentChunks = chunkArray(uniqueEnrollments, 200);

  for (const chunk of enrollmentChunks) {
    const chunkCandidates = [...new Set(chunk.flatMap((e) => [e, e.toLowerCase(), e.toUpperCase()]))];
    const { data: studentsRows, error: studentsError } = await supabase
      .from('students1')
      .select('enrollment_no, student_email_id')
      .in('enrollment_no', chunkCandidates);

    if (studentsError) {
      console.warn('students1 email lookup warning:', studentsError.message || studentsError);
      continue;
    }

    for (const row of studentsRows || []) {
      const enrollment = normalizeEnrollment(row.enrollment_no);
      const email = String(row.student_email_id || '').trim();
      if (enrollment && email) {
        emailMap.set(enrollment, email);
      }
    }
  }

  const missing = uniqueEnrollments.filter((enrollment) => !emailMap.has(enrollment));
  if (missing.length > 0) {
    const missingChunks = chunkArray(missing, 200);

    for (const chunk of missingChunks) {
      const chunkCandidates = [...new Set(chunk.flatMap((e) => [e, e.toLowerCase(), e.toUpperCase()]))];
      const { data: legacyRows, error: legacyError } = await supabase
        .from('pbl_2025')
        .select('enrollement_no, email_id')
        .in('enrollement_no', chunkCandidates);

      if (legacyError) {
        console.warn('pbl_2025 email lookup warning:', legacyError.message || legacyError);
        continue;
      }

      for (const row of legacyRows || []) {
        const enrollment = normalizeEnrollment(row.enrollement_no);
        const email = String(row.email_id || '').trim();
        if (enrollment && email && !emailMap.has(enrollment)) {
          emailMap.set(enrollment, email);
        }
      }
    }
  }

  return emailMap;
}

/**
 * Convert an array of objects to a CSV string.
 * @param {string[]} headers - Column header labels (display names)
 * @param {string[]} keys    - Corresponding keys in each row object
 * @param {object[]} rows    - Data rows
 */
function buildCSV(headers, keys, rows) {
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map(row =>
    keys.map(k => escapeCSV(row[k] !== undefined ? row[k] : '')).join(',')
  );
  return [headerLine, ...dataLines].join('\r\n');
}

/**
 * Fetch project details rows for API table and CSV export.
 * One row per problem statement with grouped member details.
 */
async function getProjectDetailsRows({ search = '', limit = 100, offset = 0 } = {}) {
  let psQuery = supabase
    .from('problem_statement')
    .select('ps_id, group_id, title, type, technologybucket, domain, description, status, review_feedback')
    .order('ps_id', { ascending: false })
    .range(offset, offset + limit - 1);

  const trimmedSearch = validateSearch(search);
  if (trimmedSearch) {
    psQuery = psQuery.or(`group_id.ilike.%${trimmedSearch}%,title.ilike.%${trimmedSearch}%`);
  }

  const { data: statements, error: psError } = await psQuery;
  if (psError) throw psError;

  if (!statements || statements.length === 0) {
    return [];
  }

  const groupIds = [...new Set(statements.map((item) => item.group_id).filter(Boolean))];

  let membersByGroupId = {};
  if (groupIds.length > 0) {
    const { data: members, error: memberError } = await supabase
      .from('pbl')
      .select('group_id, enrollment_no, student_name, mentor_code')
      .in('group_id', groupIds)
      .order('enrollment_no', { ascending: true });

    if (memberError) throw memberError;

    membersByGroupId = (members || []).reduce((acc, item) => {
      if (!acc[item.group_id]) {
        acc[item.group_id] = [];
      }
      acc[item.group_id].push(item);
      return acc;
    }, {});
  }

  return statements.map((item) => {
    const members = membersByGroupId[item.group_id] || [];
    const mentorCodes = [...new Set(members.map((m) => m.mentor_code).filter(Boolean))];

    return {
      ps_id: item.ps_id,
      group_id: item.group_id || '',
      title: item.title || '',
      type: item.type || '',
      technology_bucket: item.technologybucket || '',
      domain: item.domain || '',
      description: item.description || '',
      status: item.status || '',
      review_feedback: item.review_feedback || '',
      member_count: members.length,
      member_enrollments: members.map((m) => m.enrollment_no).filter(Boolean).join('; '),
      member_names: members.map((m) => m.student_name).filter(Boolean).join('; '),
      mentor_codes: mentorCodes.join('; '),
      created_at: item.created_at || '',
      updated_at: item.updated_at || '',
    };
  });
}

/**
 * Build group-level status for project details:
 * - filledGroups: group has a problem_statement row with a non-empty title
 * - unfilledGroups: group exists in pbl but has no filled project detail
 */
async function buildProjectDetailsGroupStatus(search = '') {
  const trimmedSearch = validateSearch(search).toLowerCase();
  const groupMembers = await fetchPblMembersForStatus();
  const enrollments = (groupMembers || []).map((member) => member.enrollment_no);
  const enrollmentEmailMap = await resolveEmailsByEnrollment(enrollments);

  const groupsMap = new Map();
  for (const member of groupMembers || []) {
    const groupId = member.group_id;
    if (!groupId) continue;

    if (!groupsMap.has(groupId)) {
      groupsMap.set(groupId, {
        group_id: groupId,
        member_count: 0,
        member_names: [],
        mentor_codes: new Set(),
        member_emails: new Set(),
      });
    }

    const group = groupsMap.get(groupId);
    group.member_count += 1;
    if (member.student_name) group.member_names.push(member.student_name);
    if (member.mentor_code) group.mentor_codes.add(member.mentor_code);

    const enrollment = normalizeEnrollment(member.enrollment_no);
    const emailFromGroup = String(member.email_id || '').trim();
    const emailFromStudentMaster = enrollment ? (enrollmentEmailMap.get(enrollment) || '') : '';
    const selectedEmail = emailFromStudentMaster || emailFromGroup;
    if (selectedEmail) group.member_emails.add(selectedEmail);
  }

  const allGroupIds = [...groupsMap.keys()];
  if (allGroupIds.length === 0) {
    return {
      filledGroups: [],
      unfilledGroups: [],
      summary: { totalGroups: 0, filledCount: 0, unfilledCount: 0 },
    };
  }

  const { data: statements, error: psError } = await supabase
    .from('problem_statement')
    .select('ps_id, group_id, title, status')
    .in('group_id', allGroupIds)
    .order('ps_id', { ascending: false });

  if (psError) throw psError;

  const latestStatementByGroup = new Map();
  for (const ps of statements || []) {
    if (!ps.group_id) continue;
    if (!latestStatementByGroup.has(ps.group_id)) {
      latestStatementByGroup.set(ps.group_id, ps);
    }
  }

  const filledGroups = [];
  const unfilledGroups = [];

  for (const [groupId, group] of groupsMap.entries()) {
    const statement = latestStatementByGroup.get(groupId);
    const title = (statement?.title || '').trim();

    const normalized = {
      group_id: groupId,
      project_title: title,
      project_status: statement?.status || '',
      ps_id: statement?.ps_id || null,
      member_count: group.member_count,
      member_names: group.member_names.join('; '),
      mentor_codes: [...group.mentor_codes].join('; '),
      member_emails: [...group.member_emails],
    };

    const matchesSearch = !trimmedSearch
      || groupId.toLowerCase().includes(trimmedSearch)
      || title.toLowerCase().includes(trimmedSearch);

    if (!matchesSearch) continue;

    if (title) {
      filledGroups.push(normalized);
    } else {
      unfilledGroups.push({
        ...normalized,
        project_title: '',
        project_status: '',
        ps_id: null,
      });
    }
  }

  filledGroups.sort((a, b) => a.group_id.localeCompare(b.group_id));
  unfilledGroups.sort((a, b) => a.group_id.localeCompare(b.group_id));

  return {
    filledGroups,
    unfilledGroups,
    summary: {
      totalGroups: filledGroups.length + unfilledGroups.length,
      filledCount: filledGroups.length,
      unfilledCount: unfilledGroups.length,
    },
  };
}

/**
 * GET /api/export
 * Query params:
 *   formId      – evaluation form ID (optional; if omitted, exports all forms)
 *   groupPrefix – filter groups whose group_id starts with this prefix (case-insensitive)
 *   token       – JWT for authentication via query string (needed because window.location.href cannot send headers)
 */
const exportCSV = async (req, res) => {
  try {
    const { formId, groupPrefix } = req.query;

    // ── 1. Fetch submissions ────────────────────────────────────────────────
    let query = supabase
      .from('evaluation_form_submissions')
      .select('id, form_id, group_id, external_name, feedback, evaluations, created_at')
      .order('group_id', { ascending: true });

    if (formId) {
      query = query.eq('form_id', formId);
    }

    if (groupPrefix && groupPrefix.trim() !== '') {
      // Supabase ILIKE for prefix match
      query = query.ilike('group_id', `${groupPrefix.trim()}%`);
    }

    const { data: submissions, error: subError } = await query;
    if (subError) {
      console.error('Export – submissions fetch error:', subError);
      return res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
    }

    // ── 2. Fetch form fields (for dynamic column headers) ──────────────────
    let formFields = [];
    if (formId) {
      const { data: form, error: formError } = await supabase
        .from('evaluation_forms')
        .select('fields')
        .eq('id', formId)
        .single();

      if (!formError && form?.fields && Array.isArray(form.fields)) {
        formFields = [...form.fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
    }

    // ── 3. Flatten: one row per student ────────────────────────────────────
    const rows = [];

    for (const submission of submissions || []) {
      const evaluations = Array.isArray(submission.evaluations)
        ? submission.evaluations
        : [];

      for (const evaluation of evaluations) {
        const marks = evaluation.marks || {};
        const row = {
          group_id: submission.group_id,
          enrollment_no: evaluation.enrollment_no || evaluation.enrollement_no || '',
          student_name: evaluation.student_name || evaluation.name_of_student || '',
          total: evaluation.total ?? '',
          absent: evaluation.absent ? 'Yes' : 'No',
          external_name: submission.external_name || '',
          feedback: submission.feedback || '',
        };

        // Attach each mark field
        for (const key of Object.keys(marks)) {
          const val = marks[key];
          // Boolean marks → Yes / No
          row[`mark_${key}`] = typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val;
        }

        rows.push(row);
      }
    }

    // ── 4. Build CSV headers ───────────────────────────────────────────────
    let headers, keys;

    if (formFields.length > 0) {
      // Use form-defined field labels + order
      headers = [
        'Group ID',
        'Enrollment No',
        'Student Name',
        ...formFields.map(f => f.label || f.key),
        'Absent',
        'Total',
        'External Examiner',
        'Feedback',
      ];
      keys = [
        'group_id',
        'enrollment_no',
        'student_name',
        ...formFields.map(f => `mark_${f.key}`),
        'absent',
        'total',
        'external_name',
        'feedback',
      ];
    } else {
      // Fallback: derive keys from the first row's mark_* fields
      const markKeys = rows.length > 0
        ? Object.keys(rows[0]).filter(k => k.startsWith('mark_')).map(k => k.slice(5))
        : [];

      headers = [
        'Group ID',
        'Enrollment No',
        'Student Name',
        ...markKeys,
        'Absent',
        'Total',
        'External Examiner',
        'Feedback',
      ];
      keys = [
        'group_id',
        'enrollment_no',
        'student_name',
        ...markKeys.map(k => `mark_${k}`),
        'absent',
        'total',
        'external_name',
        'feedback',
      ];
    }

    // ── 5. Generate and send CSV ───────────────────────────────────────────
    const csv = buildCSV(headers, keys, rows);
    const filename = groupPrefix
      ? `evaluations_${groupPrefix.trim()}.csv`
      : 'evaluations_all.csv';

    // Prepend UTF-8 BOM so Excel on Windows opens the file correctly without garbled characters
    const BOM = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(BOM + csv);
  } catch (err) {
    console.error('Export CSV error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during export' });
  }
};

/**
 * GET /api/export/project-details
 * Query params:
 *   search - optional search by group_id or title
 */
const getProjectDetails = async (req, res) => {
  try {
    const { search, limit, page } = req.query;
    const safeLimit = Math.min(parsePositiveInt(limit, 100), 500);
    const safePage = parsePositiveInt(page, 1);
    const offset = (safePage - 1) * safeLimit;

    const rows = await getProjectDetailsRows({ search, limit: safeLimit, offset });

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');

    return res.status(200).json({
      success: true,
      message: 'Project details fetched successfully',
      data: {
        projectDetails: rows,
        pagination: {
          page: safePage,
          limit: safeLimit,
          returned: rows.length,
        },
      },
    });
  } catch (error) {
    console.error('Get project details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch project details',
      error: error.message,
    });
  }
};

/**
 * GET /api/export/project-details/csv
 * Query params:
 *   search - optional search by group_id or title
 */
const downloadProjectDetailsCSV = async (req, res) => {
  try {
    const { search } = req.query;
    const rows = await getProjectDetailsRows({ search, limit: 5000, offset: 0 });

    const headers = [
      'PS ID',
      'Group ID',
      'Project Title',
      'Type',
      'Technology Bucket',
      'Domain',
      'Description',
      'Status',
      'Review Feedback',
      'Member Count',
      'Member Enrollments',
      'Member Names',
      'Mentor Codes',
      'Created At',
      'Updated At',
    ];

    const keys = [
      'ps_id',
      'group_id',
      'title',
      'type',
      'technology_bucket',
      'domain',
      'description',
      'status',
      'review_feedback',
      'member_count',
      'member_enrollments',
      'member_names',
      'mentor_codes',
      'created_at',
      'updated_at',
    ];

    const csv = buildCSV(headers, keys, rows);
    const safeSearch = (search || 'all').toString().trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `project_details_${safeSearch || 'all'}.csv`;

    const BOM = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    return res.status(200).send(BOM + csv);
  } catch (error) {
    console.error('Download project details CSV error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to download project details CSV',
      error: error.message,
    });
  }
};

/**
 * GET /api/export/project-details/group-status
 * Query params:
 *   search - optional search by group_id or project title
 */
const getProjectDetailsGroupStatus = async (req, res) => {
  try {
    const { search } = req.query;
    const statusData = await buildProjectDetailsGroupStatus(search);

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');

    return res.status(200).json({
      success: true,
      message: 'Group project-details status fetched successfully',
      data: statusData,
    });
  } catch (error) {
    console.error('Get project-details group status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch group status',
      error: error.message,
    });
  }
};

/**
 * POST /api/export/project-details/reminder-email
 * Body:
 *   group_ids: optional string[] of specific unfilled groups
 *   search: optional search filter (used when group_ids not provided)
 */
const sendProjectDetailsReminderEmails = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');

    const limitCheck = checkReminderRateLimit(req.user || {});
    if (!limitCheck.allowed) {
      const retryAfterSec = Math.ceil((limitCheck.retryAfterMs || 0) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        message: `Too many reminder requests. Try again in ${retryAfterSec} seconds.`,
      });
    }

    const body = req.body || {};
    const rawGroupIds = Array.isArray(body.group_ids) ? body.group_ids : [];
    const requestedGroupIds = [...new Set(rawGroupIds.map((id) => String(id || '').trim()).filter(Boolean))];
    const invalidGroupIds = requestedGroupIds.filter((groupId) => !isValidGroupId(groupId));
    const search = typeof body.search === 'string' ? body.search : '';
    const customSubject = sanitizeTemplateInput(body.subject, 200);
    const customMessage = sanitizeTemplateInput(body.message, 5000);

    if (invalidGroupIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more group IDs are invalid.',
      });
    }

    if (customSubject.includes('\n')) {
      return res.status(400).json({
        success: false,
        message: 'Email subject cannot contain line breaks.',
      });
    }

    if (customSubject.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Email subject is too long. Maximum 200 characters allowed.',
      });
    }

    if (customMessage.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Email body is too long. Maximum 5000 characters allowed.',
      });
    }

    if (requestedGroupIds.length > REMINDER_MAX_GROUPS) {
      return res.status(400).json({
        success: false,
        message: `Too many groups requested. Maximum allowed is ${REMINDER_MAX_GROUPS}.`,
      });
    }

    // Guardrail: prevent accidental bulk sends without explicit group selection.
    if (requestedGroupIds.length === 0 && body.confirm_all !== true) {
      return res.status(400).json({
        success: false,
        message: 'Explicit group selection is required for reminder emails.',
      });
    }

    const statusData = await buildProjectDetailsGroupStatus(search);
    const availableUnfilled = statusData.unfilledGroups || [];

    const targetGroups = requestedGroupIds.length > 0
      ? availableUnfilled.filter((group) => requestedGroupIds.includes(group.group_id))
      : availableUnfilled;

    if (targetGroups.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No unfilled groups found for sending reminders.',
        data: {
          sentCount: 0,
          failedCount: 0,
          skippedCount: 0,
          sentGroups: [],
          failedGroups: [],
          skippedGroups: [],
        },
      });
    }

    const estimatedRecipients = targetGroups.reduce(
      (acc, group) => acc + (Array.isArray(group.member_emails) ? group.member_emails.length : 0),
      0,
    );
    if (estimatedRecipients > REMINDER_MAX_RECIPIENTS) {
      return res.status(400).json({
        success: false,
        message: `Too many recipients (${estimatedRecipients}). Narrow your selection below ${REMINDER_MAX_RECIPIENTS}.`,
      });
    }

    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const sentGroups = [];
    const failedGroups = [];
    const skippedGroups = [];

    for (const group of targetGroups) {
      const emails = [...new Set((group.member_emails || [])
        .map((email) => String(email || '').trim().toLowerCase())
        .filter(Boolean)
        .filter(isValidEmail))];

      if (emails.length === 0) {
        skippedCount += 1;
        skippedGroups.push({ group_id: group.group_id, reason: 'No valid member emails found' });
        continue;
      }

        const defaultSubjectTemplate = 'Reminder: Submit Project Details ({{group_id}})';
        const defaultBodyTemplate = `Dear Team {{group_id}},

Our records show that your group has not yet submitted the required project details on SparkTrack.

Please log in to the student dashboard and complete the Project Details/Problem Statement section at the earliest.

This is an automated reminder from the admin panel.

Regards,
      SparkTrack Admin`;

        const subject = renderTemplate(customSubject || defaultSubjectTemplate, group.group_id);
        const text = renderTemplate(customMessage || defaultBodyTemplate, group.group_id);
        const html = `<p>${plainTextToHtml(text)}</p>`;

      try {
        await emailService.sendMail(emails.join(','), subject, text, html);
        sentCount += 1;
          sentGroups.push({ group_id: group.group_id, recipients: emails });
      } catch (error) {
        failedCount += 1;
        failedGroups.push({ group_id: group.group_id, error: 'Failed to send email' });
      }
    }

    console.info('[Admin Reminder Mail]', {
      admin: getAdminRateKey(req.user || {}),
      selected_groups: targetGroups.length,
      sent: sentCount,
      failed: failedCount,
      skipped: skippedCount,
      search: validateSearch(search),
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'Project details reminder email process completed.',
      data: {
        sentCount,
        failedCount,
        skippedCount,
        sentGroups,
        failedGroups,
        skippedGroups,
      },
    });
  } catch (error) {
    console.error('Send project-details reminder emails error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send reminder emails',
      error: error.message,
    });
  }
};

export default {
  exportCSV,
  getProjectDetails,
  downloadProjectDetailsCSV,
  getProjectDetailsGroupStatus,
  sendProjectDetailsReminderEmails,
};
