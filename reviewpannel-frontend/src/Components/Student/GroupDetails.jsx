import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api.js';
import { User, Eye, X, Download, Github, Linkedin, Globe, Mail, Phone, GraduationCap } from 'lucide-react';

const GroupDetails = ({ enrollmentNo: propEnrollmentNo }) => {
  const [enrollmentNo, setEnrollmentNo] = useState(propEnrollmentNo || null);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberProfile, setMemberProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
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

  const handleMemberClick = async (member) => {
    setSelectedMember(member);
    setProfileLoading(true);
    try {
      const token = localStorage.getItem("student_token");
      const profileRes = await apiRequest(`/api/student/profile/${member.enrollement_no}`, "GET", null, token);
      setMemberProfile(profileRes?.profile || null);
    } catch (err) {
      console.error('Error fetching member profile:', err);
      setMemberProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const closeMemberProfile = () => {
    setSelectedMember(null);
    setMemberProfile(null);
  };

  if (loading) return <p className="text-center text-gray-600">Loading group details...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;

  // ✅ 1. If group already exists (updated to use full-width rows)
  if (groupDetails) {
    return (
      <div className="card col-span-1 p-6 bg-white rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Group: {groupDetails.group_id}</h2>
        <p className="text-base text-gray-800 mb-6">
          <strong>Guide Name:</strong> 
          <span className="text-purple-700 ml-2">{groupDetails.guide_name || "Not Assigned"}</span>
        </p>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Group Members ({groupDetails.members?.length || 0})</h3>
          
          {groupDetails.members && groupDetails.members.length > 0 ? (
            <div className="space-y-3">
              {groupDetails.members.map((member, idx) => (
                <div 
                  key={idx}
                  className={`w-full bg-gray-50 rounded-lg p-4 border-2 transition-all duration-200 hover:shadow-md cursor-pointer ${
                    member.enrollement_no === enrollmentNo 
                      ? 'border-purple-300 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                  onClick={() => handleMemberClick(member)}
                >
                  <div className="flex items-center justify-between">
                    {/* Left side - Profile info */}
                    <div className="flex items-center space-x-4">
                      {/* Profile Picture */}
                      <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300 flex-shrink-0">
                        {member.profile_picture_url ? (
                          <img
                            src={member.profile_picture_url}
                            alt={member.name_of_student}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center ${member.profile_picture_url ? 'hidden' : 'flex'}`}>
                          <User className="w-7 h-7 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* Member Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className={`text-lg font-semibold truncate ${
                            member.enrollement_no === enrollmentNo ? 'text-purple-700' : 'text-gray-900'
                          }`}>
                            {member.name_of_student}
                          </h4>
                          
                          {/* Badges */}
                          <div className="flex items-center gap-2">
                            {idx === 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Group Leader
                              </span>
                            )}
                            {member.enrollement_no === enrollmentNo && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 font-mono">
                          <span className="font-medium">Enrollment:</span> {member.enrollement_no}
                        </p>
                      </div>
                    </div>

                    {/* Right side - View button */}
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-500">Click to view</p>
                        <p className="text-xs text-gray-500">full profile</p>
                      </div>
                      <div className="flex-shrink-0 bg-white p-2 rounded-full shadow-sm border">
                        <Eye className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No members added yet</p>
              <p className="text-gray-400 text-sm mt-1">Group members will appear here</p>
            </div>
          )}
        </div>

        {/* Edit Group button (only for group leader) */}
        {groupDetails.members && groupDetails.members[0]?.enrollement_no === enrollmentNo && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
              onClick={() => navigate(`/edit-group/${groupDetails.group_id}`)}
            >
              Edit Group
            </button>
          </div>
        )}

        {/* Member Profile Modal */}
        {selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Member Profile</h3>
                <button
                  onClick={closeMemberProfile}
                  className="text-gray-400 hover:text-gray-600 transition duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {profileLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading profile...</p>
                  </div>
                ) : (
                  <div>
                    {/* Profile Header */}
                    <div className="flex flex-col items-center mb-6">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-3 border-2 border-gray-300">
                        {memberProfile?.profile_picture_url ? (
                          <img
                            src={memberProfile.profile_picture_url}
                            alt={selectedMember.name_of_student}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <div className={`flex items-center justify-center w-full h-full ${memberProfile?.profile_picture_url ? 'hidden' : 'block'}`}>
                          <User className="w-10 h-10 text-gray-400" />
                        </div>
                      </div>
                      
                      <h4 className="text-xl font-semibold text-gray-900 text-center">
                        {selectedMember.name_of_student}
                      </h4>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mt-2">
                        {selectedMember.enrollement_no}
                      </span>
                    </div>

                    {/* Profile Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <GraduationCap size={16} />
                            Class
                          </label>
                          <p className="text-sm text-gray-900">{memberProfile?.class || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                          <p className="text-sm text-gray-900">{memberProfile?.specialization || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Mail size={16} />
                            Email
                          </label>
                          <p className="text-sm text-gray-900 break-all">
                            {memberProfile?.email_id ? (
                              <a href={`mailto:${memberProfile.email_id}`} className="text-blue-600 hover:text-blue-800">
                                {memberProfile.email_id}
                              </a>
                            ) : 'N/A'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Phone size={16} />
                            Phone
                          </label>
                          <p className="text-sm text-gray-900">
                            {memberProfile?.phone ? (
                              <a href={`tel:${memberProfile.phone}`} className="text-blue-600 hover:text-blue-800">
                                {memberProfile.phone}
                              </a>
                            ) : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                          <p className="text-sm text-gray-900">{memberProfile?.bio || 'No bio available'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                          <div className="flex flex-wrap gap-1">
                            {memberProfile?.skills ? (
                              memberProfile.skills.split(',').map((skill, index) => (
                                <span 
                                  key={index} 
                                  className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                                >
                                  {skill.trim()}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">No skills listed</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
                          <div className="text-sm">
                            {memberProfile?.resume_url ? (
                              <a
                                href={memberProfile.resume_url}
                                download
                                className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-200"
                              >
                                <Download className="h-4 w-4 mr-2 text-white" />
                                <span className="text-white">Download Resume</span>
                              </a>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm font-medium">
                                Not Available
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Links</h5>
                      <div className="flex flex-wrap gap-2">
                        {memberProfile?.github_url && (
                          <a
                            href={memberProfile.github_url.startsWith('http') ? memberProfile.github_url : `https://${memberProfile.github_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200"
                          >
                            <Github className="h-4 w-4 mr-1" />
                            GitHub
                          </a>
                        )}
                        {memberProfile?.linkedin_url && (
                          <a
                            href={memberProfile.linkedin_url.startsWith('http') ? memberProfile.linkedin_url : `https://${memberProfile.linkedin_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition duration-200"
                          >
                            <Linkedin className="h-4 w-4 mr-1" />
                            LinkedIn
                          </a>
                        )}
                        {memberProfile?.portfolio_url && (
                          <a
                            href={memberProfile.portfolio_url.startsWith('http') ? memberProfile.portfolio_url : `https://${memberProfile.portfolio_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition duration-200"
                          >
                            <Globe className="h-4 w-4 mr-1" />
                            Portfolio
                          </a>
                        )}
                        {!memberProfile?.github_url && !memberProfile?.linkedin_url && !memberProfile?.portfolio_url && (
                          <p className="text-sm text-gray-500">No links available</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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

      {/* Request Modal */}
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
