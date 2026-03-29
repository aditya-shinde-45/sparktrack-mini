import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../api';
import { Download, Eye, Loader2, RefreshCw, Search } from 'lucide-react';

const API_BASE_URL =
  import.meta.env.MODE === 'development'
    ? import.meta.env.VITE_API_BASE_URL
    : import.meta.env.VITE_API_BASE_URL_PROD;

const ProjectDetailsTool = () => {
  const [rows, setRows] = useState([]);
  const [filledGroups, setFilledGroups] = useState([]);
  const [unfilledGroups, setUnfilledGroups] = useState([]);
  const [summary, setSummary] = useState({ totalGroups: 0, filledCount: 0, unfilledCount: 0 });
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [showReminderComposer, setShowReminderComposer] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [mailSubject, setMailSubject] = useState('Reminder: Submit Project Details ({{group_id}})');
  const [mailBody, setMailBody] = useState(`Dear Team {{group_id}},\n\nOur records show that your group has not yet submitted the required project details on SparkTrack.\n\nPlease log in to the student dashboard and complete the Project Details/Problem Statement section at the earliest.\n\nThis is an automated reminder from the admin panel.\n\nRegards,\nSparkTrack Admin`);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');

  const fetchRows = async (searchText = '', pageNo = 1) => {
    setLoading(true);
    setMessage('');

    const params = new URLSearchParams();
    const trimmedSearch = searchText.trim();
    if (trimmedSearch) {
      params.set('search', trimmedSearch);
    }
    params.set('limit', '100');
    params.set('page', String(Math.max(1, Number(pageNo) || 1)));
    const query = `?${params.toString()}`;

    const res = await apiRequest(`/api/export/project-details${query}`, 'GET');
    const statusRes = await apiRequest(`/api/export/project-details/group-status${query}`, 'GET');

    if (res.success !== false) {
      setRows(res?.data?.projectDetails || []);
    } else {
      setRows([]);
      setMessage(res.message || 'Failed to load project details.');
    }

    if (statusRes.success !== false) {
      setFilledGroups(statusRes?.data?.filledGroups || []);
      setUnfilledGroups(statusRes?.data?.unfilledGroups || []);
      setSummary(statusRes?.data?.summary || { totalGroups: 0, filledCount: 0, unfilledCount: 0 });
    } else {
      setFilledGroups([]);
      setUnfilledGroups([]);
      setSummary({ totalGroups: 0, filledCount: 0, unfilledCount: 0 });
      setMessage((prev) => prev || statusRes.message || 'Failed to load group status.');
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRows('', 1);
  }, []);

  useEffect(() => {
    setSelectedGroupIds(unfilledGroups.map((group) => group.group_id));
  }, [unfilledGroups]);

  const handleApplySearch = () => {
    setPage(1);
    setAppliedSearch(search);
    fetchRows(search, 1);
  };

  const handleReset = () => {
    setSearch('');
    setAppliedSearch('');
    setPage(1);
    fetchRows('', 1);
  };

  const handleNextPage = () => {
    const next = page + 1;
    setPage(next);
    fetchRows(appliedSearch, next);
  };

  const handlePreviousPage = () => {
    const prev = Math.max(1, page - 1);
    setPage(prev);
    fetchRows(appliedSearch, prev);
  };

  const handleDownloadCSV = async () => {
    setDownloading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Admin session missing. Please login again.');
      }
      const query = appliedSearch.trim() ? `?search=${encodeURIComponent(appliedSearch.trim())}` : '';

      const response = await fetch(`${API_BASE_URL}/api/export/project-details/csv${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('CSV download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = appliedSearch.trim()
        ? `project_details_${appliedSearch.trim().replace(/\s+/g, '_')}.csv`
        : 'project_details_all.csv';

      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error.message || 'Failed to download CSV.');
    }

    setDownloading(false);
  };

  const toggleGroupSelection = (groupId) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSendReminderEmails = async () => {
    if (selectedGroupIds.length === 0) {
      setMessage('Please select at least one group to send reminder emails.');
      return;
    }

    if (!mailSubject.trim() || !mailBody.trim()) {
      setMessage('Please provide both email subject and email body.');
      return;
    }

    const selectedGroups = unfilledGroups.filter((group) => selectedGroupIds.includes(group.group_id));
    const recipientCount = selectedGroups.reduce((count, group) => count + ((group.member_emails || []).length), 0);
    const confirmed = window.confirm(`Send reminder emails to ${selectedGroupIds.length} group(s) and ${recipientCount} recipient(s)?`);
    if (!confirmed) return;

    setSendingReminder(true);
    setMessage('');

    const payload = {
      group_ids: selectedGroupIds,
      search: appliedSearch,
      subject: mailSubject,
      message: mailBody,
    };

    const res = await apiRequest('/api/export/project-details/reminder-email', 'POST', payload);

    if (res.success !== false) {
      const sentCount = res?.data?.sentCount ?? 0;
      const failedCount = res?.data?.failedCount ?? 0;
      const skippedCount = res?.data?.skippedCount ?? 0;
      setMessage(`Reminder process complete. Sent: ${sentCount}, Failed: ${failedCount}, Skipped: ${skippedCount}.`);
      setShowReminderComposer(false);
    } else {
      setMessage(res.message || 'Failed to send reminder emails.');
    }

    setSendingReminder(false);
  };

  const totalProjects = useMemo(() => rows.length, [rows]);
  const selectedRecipientsCount = useMemo(() => {
    const selectedGroups = unfilledGroups.filter((group) => selectedGroupIds.includes(group.group_id));
    return selectedGroups.reduce((count, group) => count + ((group.member_emails || []).length), 0);
  }, [unfilledGroups, selectedGroupIds]);

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Project Details (Student Dashboard)</h2>
            <p className="mt-1 text-sm text-gray-600">
              View project details saved in problem statements and export them as CSV.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
            <Eye className="h-4 w-4" />
            {totalProjects} records
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Group ID or Project Title"
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <button
            onClick={handleApplySearch}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Search className="h-4 w-4" />
            View
          </button>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </button>

          <button
            onClick={handleDownloadCSV}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download CSV
          </button>
        </div>

        {message && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Group ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Project Title</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Technology</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Domain</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Members</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Mentor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading project details...
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No project details found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${row.ps_id}-${row.group_id}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.group_id || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{row.title || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{row.type || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{row.technology_bucket || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{row.domain || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                        {row.status || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.member_names || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{row.mentor_codes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Total Groups</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.totalGroups}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Filled Project Details</p>
          <p className="mt-2 text-2xl font-bold text-emerald-900">{summary.filledCount}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Not Filled</p>
          <p className="mt-2 text-2xl font-bold text-rose-900">{summary.unfilledCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
          <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-3">
            <h3 className="text-sm font-bold text-emerald-800">Groups Who Filled Project Details</h3>
          </div>
          <div className="max-h-80 overflow-auto">
            {filledGroups.length === 0 ? (
              <p className="px-4 py-4 text-sm text-gray-500">No groups found.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filledGroups.map((group) => (
                  <li key={`filled-${group.group_id}`} className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{group.group_id}</p>
                    <p className="text-sm text-gray-600">{group.project_title || 'Untitled Project'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-rose-200 bg-white shadow-sm">
          <div className="border-b border-rose-200 bg-rose-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-rose-800">Groups Who Have Not Filled Project Details</h3>
              <button
                onClick={() => setShowReminderComposer((prev) => !prev)}
                disabled={unfilledGroups.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>Mail</span>
                {showReminderComposer ? 'Hide Mail Composer' : 'Send Reminder Mail'}
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-auto">
            {unfilledGroups.length === 0 ? (
              <p className="px-4 py-4 text-sm text-gray-500">No groups found.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {unfilledGroups.map((group) => (
                  <li key={`unfilled-${group.group_id}`} className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{group.group_id}</p>
                    <p className="text-sm text-gray-600">{group.member_names || 'No members listed'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {showReminderComposer && (
        <div className="rounded-xl border border-rose-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-bold text-rose-800">Compose Reminder Mail</h4>
          <p className="mt-1 text-xs text-gray-600">
            Placeholder supported: <strong>{'{{group_id}}'}</strong>. Mail is sent to all listed team member emails of selected groups.
          </p>

          <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Subject</label>
              <input
                type="text"
                value={mailSubject}
                onChange={(e) => setMailSubject(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              <p><strong>Selected Groups:</strong> {selectedGroupIds.length}</p>
              <p><strong>Total Recipients:</strong> {selectedRecipientsCount}</p>
            </div>
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-xs font-semibold text-gray-700">Email Body</label>
            <textarea
              rows={8}
              value={mailBody}
              onChange={(e) => setMailBody(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-gray-700">Select groups and review recipients:</p>
            <div className="max-h-52 space-y-2 overflow-auto rounded-lg border border-gray-200 p-2">
              {unfilledGroups.map((group) => (
                <label key={`mail-${group.group_id}`} className="flex cursor-pointer items-start gap-2 rounded-md border border-gray-100 px-2 py-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedGroupIds.includes(group.group_id)}
                    onChange={() => toggleGroupSelection(group.group_id)}
                    className="mt-0.5"
                  />
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">{group.group_id}</p>
                    <p className="text-xs text-gray-600">
                      Recipients: {(group.member_emails && group.member_emails.length > 0)
                        ? group.member_emails.join(', ')
                        : 'No valid emails available'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={() => setShowReminderComposer(false)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSendReminderEmails}
              disabled={sendingReminder || selectedGroupIds.length === 0}
              className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingReminder ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send Mail to Selected Groups
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handlePreviousPage}
          disabled={loading || page <= 1}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Previous
        </button>
        <span className="px-2 text-sm font-semibold text-gray-700">Page {page}</span>
        <button
          onClick={handleNextPage}
          disabled={loading || rows.length < 100}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default ProjectDetailsTool;
