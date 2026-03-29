import supabase from '../../config/database.js';

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

  const { data: groupMembers, error: groupError } = await supabase
    .from('pbl')
    .select('group_id, enrollment_no, student_name, mentor_code')
    .order('group_id', { ascending: true });

  if (groupError) throw groupError;

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
      });
    }

    const group = groupsMap.get(groupId);
    group.member_count += 1;
    if (member.student_name) group.member_names.push(member.student_name);
    if (member.mentor_code) group.mentor_codes.add(member.mentor_code);
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

export default {
  exportCSV,
  getProjectDetails,
  downloadProjectDetailsCSV,
  getProjectDetailsGroupStatus,
};
