import supabase from '../../config/database.js';

/**
 * Escape a single CSV cell value.
 * Wraps in quotes if the value contains a comma, quote, or newline.
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
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

export default { exportCSV };
