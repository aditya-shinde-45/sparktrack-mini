import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api.js';

const GroupDetails = ({ enrollmentNo: propEnrollmentNo }) => {
  const [enrollmentNo, setEnrollmentNo] = useState(propEnrollmentNo || null);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let storedEnrollment = propEnrollmentNo;
    if (!storedEnrollment) {
      storedEnrollment = localStorage.getItem('enrollmentNumber');
    }
    if (!storedEnrollment) {
      setError('Enrollment number not found.');
      setLoading(false);
      return;
    }
    setEnrollmentNo(storedEnrollment);

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("student_token");
        const groupRes = await apiRequest(`/api/pbl/gp/${storedEnrollment}`, "GET", null, token);
        if (groupRes && groupRes.group_id) {
          setGroupDetails(groupRes);
        }
      } catch (err) {
        console.warn('No group found:', err?.message);
      }

      try {
        const token = localStorage.getItem("student_token");
        const reqRes = await apiRequest(`/api/group/requests/pending/${storedEnrollment}`, "GET", null, token);
        setRequests(reqRes || []);
      } catch (err) {
        setError('Failed to load pending requests.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propEnrollmentNo]);

  const handleResponse = async (requestId, response) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("student_token");
      await apiRequest(`/api/group/requests/accept`, "POST", { requestId, response }, token);

      setSelectedRequest(null);
      setRequests(prev => prev.filter(req => req.request_id !== requestId));

      if (response === 'accepted' && enrollmentNo) {
        const groupRes = await apiRequest(`/api/pbl/gp/${enrollmentNo}`, "GET", null, token);
        if (groupRes && groupRes.group_id) {
          setGroupDetails(groupRes);
        }
      }
    } catch (err) {
      setError(`Error handling ${response}.`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p className="text-center text-gray-600">Loading group details...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;

  // ✅ 1. If group already exists (updated to use new response structure)
  if (groupDetails) {
    return (
      <div className="card col-span-1 p-6 bg-white rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Group: {groupDetails.group_id}</h2>
        <p className="text-base text-gray-800"><strong>Guide Name:</strong> <span className="text-purple-700">{groupDetails.guide_name || "Not Assigned"}</span></p>
        <p className="mt-2 font-medium text-gray-900">Members:</p>
        {groupDetails.members && groupDetails.members.length > 0 ? (
          <ul className="list-disc pl-6 text-base text-gray-800">
            {groupDetails.members.map((m, idx) => (
              <li key={idx}>
                <span className={m.enrollement_no === enrollmentNo ? "font-bold text-purple-700" : "text-gray-800"}>
                  {m.name_of_student} <span className="text-xs text-gray-500">({m.enrollement_no})</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-base italic text-gray-500">No members added yet.</p>
        )}

        {/* Edit Group button (only for current user if leader logic is needed) */}
        {groupDetails.members &&
          groupDetails.members[0]?.enrollement_no === enrollmentNo && (
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => navigate(`/edit-group/${groupDetails.group_id}`)}
            >
              Edit Group
            </button>
          )}
      </div>
    );
  }

  // ✅ 2. Show pending requests if no group exists
  return (
    <div className="card col-span-1 p-6 flex flex-col justify-between bg-white rounded-xl shadow relative">
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Group Details</h2>

        {requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.request_id}
                className="flex items-center justify-between border-b py-3"
              >
                <div>
                  <p className="text-gray-900 font-medium">{req.leader_enrollment}</p>
                  <p className="text-sm text-gray-600">has invited you to join their group.</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(req)}
                  className="text-violet-700 font-semibold hover:underline text-sm"
                >
                  View Request
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center pt-10">
            <span className="material-icons text-5xl text-gray-300">group_add</span>
            <p className="text-gray-700 mt-2">Group has not been created yet.</p>
            <p className="text-gray-600 text-sm">
              Click{' '}
              <a className="text-violet-700 font-semibold hover:underline" href="/create-group">
                here
              </a>{' '}
              to create a group.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Group Request Details</h3>
            <p className="text-gray-800"><strong>Group ID:</strong> {selectedRequest.group_id}</p>
            <p className="text-gray-800"><strong>Team Name:</strong> {selectedRequest.team_name}</p>
            <p className="text-gray-800"><strong>Class:</strong> {selectedRequest.class_name}</p>
            <p className="text-gray-800"><strong>Leader Enrollment:</strong> {selectedRequest.leader_enrollment}</p>
            <p className="text-gray-800"><strong>Status:</strong> {selectedRequest.status}</p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                disabled={actionLoading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                onClick={() => handleResponse(selectedRequest.request_id, 'accepted')}
              >
                Accept
              </button>
              <button
                disabled={actionLoading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                onClick={() => handleResponse(selectedRequest.request_id, 'rejected')}
              >
                Decline
              </button>
              <button
                className="ml-auto text-sm text-gray-500 hover:underline"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetails;