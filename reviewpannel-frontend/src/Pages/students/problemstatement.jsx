import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';
import Navbar from '../../Components/Common/Navbar';
import Footer from '../../Components/Common/Footer';

const ProblemStatementForm = ({ groupId, existing, onSubmit, onDelete }) => {
  const [form, setForm] = useState(
    existing || {
      title: '',
      type: '',
      technologyBucket: '',
      domain: '',
      description: '',
    }
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (existing) setForm(existing);
  }, [existing]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const endpoint = existing
      ? `/api/student/problem-statement/${groupId}`
      : `/api/student/problem-statement`;
    const method = existing ? 'PUT' : 'POST';
    const body = { group_id: groupId, ...form };
    const token = localStorage.getItem('student_token');
    const res = await apiRequest(endpoint, method, body, token);
    setLoading(false);
    setMessage(res.message || (existing ? 'Updated!' : 'Submitted!'));
    if (res.success !== false && onSubmit) onSubmit(res.problemStatement || form);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this problem statement?')) return;
    setLoading(true);
    setMessage('');
    const token = localStorage.getItem('student_token');
    const res = await apiRequest(`/api/student/problem-statement/${groupId}`, 'DELETE', null, token);
    setLoading(false);
    setMessage(res.message || 'Deleted!');
    if (res.success !== false && onDelete) onDelete();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto space-y-7 border border-purple-100"
    >
      <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 mb-4 tracking-tight">
        {existing ? 'Edit' : 'Submit'} Problem Statement
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
            placeholder="Title"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Type</label>
          <input
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition"
            placeholder="Type (e.g. Hardware/Software)"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Technology Bucket</label>
          <input
            name="technologyBucket"
            value={form.technologyBucket}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            placeholder="Technology Bucket"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Domain</label>
          <input
            name="domain"
            value={form.domain}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
            placeholder="Domain"
          />
        </div>
      </div>
      <div>
        <label className="block text-gray-700 font-semibold mb-2">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          rows={5}
          className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition"
          placeholder="Describe your problem statement"
        />
      </div>
      {message && (
        <div
          className={`p-3 rounded-lg text-center font-semibold shadow ${
            message.toLowerCase().includes('success') || message === 'Updated!' || message === 'Submitted!'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message}
        </div>
      )}
      <div className="flex gap-4 mt-2 justify-center">
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-white px-8 py-2 rounded-lg font-bold shadow hover:scale-105 transition"
        >
          {loading ? (existing ? 'Updating...' : 'Submitting...') : existing ? 'Update' : 'Submit'}
        </button>
        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="bg-gradient-to-r from-red-600 via-pink-500 to-purple-600 text-white px-8 py-2 rounded-lg font-bold shadow hover:scale-105 transition"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
};

const ProblemStatementSih = () => {
  const [groupId, setGroupId] = useState('');
  const [existingPS, setExistingPS] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch group_id from student profile API
    const token = localStorage.getItem('student_token');
    async function fetchStudentProfile() {
      const res = await apiRequest('/api/student/profile', 'GET', null, token);
      if (res && res.profile && res.profile.group_id) {
        setGroupId(res.profile.group_id);
        setLoading(true);
        // Fetch existing problem statement for this group
        const psRes = await apiRequest(`/api/student/problem-statement/${res.profile.group_id}`, 'GET', null, token);
        setLoading(false);
        if (psRes && psRes.problemStatement) setExistingPS(psRes.problemStatement);
        else setExistingPS(null);
      }
    }
    fetchStudentProfile();
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-[80vh] flex flex-col justify-center items-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-screen-md w-full mx-auto p-6 md:p-10 lg:p-12">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 mb-2 tracking-tight">
              Problem Statement Submission
            </h1>
            <p className="text-gray-600 text-lg">
              Submit, edit, or delete your group’s problem statement below.<br />
              <span className="font-semibold text-purple-700">Only one statement per group is allowed.</span>
            </p>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Group ID</label>
            <input
              type="text"
              value={groupId}
              disabled
              className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg bg-gray-100 text-gray-700 font-bold text-center"
              placeholder="Your Group ID"
            />
          </div>
          {loading ? (
            <div className="text-center text-purple-500 font-semibold text-lg">Loading...</div>
          ) : (
            <ProblemStatementForm
              groupId={groupId}
              existing={existingPS}
              onSubmit={setExistingPS}
              onDelete={() => setExistingPS(null)}
            />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProblemStatementSih;