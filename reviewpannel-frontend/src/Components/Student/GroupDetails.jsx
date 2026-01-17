import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api.js';
import { User, Eye, X, Download, Github, Linkedin, Globe, Mail, Phone, GraduationCap, Clock, CheckCircle, XCircle, Users, AlertTriangle } from 'lucide-react';

const GroupDetails = ({ enrollmentNo: propEnrollmentNo }) => {
  const [enrollmentNo, setEnrollmentNo] = useState(propEnrollmentNo || null);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [draftGroups, setDraftGroups] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberProfile, setMemberProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
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
      const token = localStorage.getItem("student_token");
      let hasGroup = false;

      // First, check if finalized group exists
      try {
        const groupRes = await apiRequest(`/api/students/pbl/gp/${storedEnrollment}`, "GET", null, token);
        const details = groupRes?.data?.groupDetails || groupRes?.groupDetails;

        if (details) {
          setGroupDetails(details);
          hasGroup = true;
          setLoading(false);
          return; // Stop here if group exists
        }
      } catch (err) {
        console.warn('No finalized group found:', err?.message);
      }

      // Only fetch drafts and invitations if no finalized group exists
      if (!hasGroup) {
        // Fetch draft groups (if leader)
        let leaderDrafts = [];
        try {
          const draftRes = await apiRequest(`/api/groups-draft/draft/leader/${storedEnrollment}`, "GET", null, token);
          leaderDrafts = draftRes?.data?.drafts || draftRes?.drafts || [];
        } catch (err) {
          console.warn('No draft groups found as leader:', err?.message);
          // Check if error is due to deadline
          if (err?.response?.status === 403 || err?.message?.toLowerCase().includes('disabled')) {
            setDeadlinePassed(true);
          }
        }

        // Fetch pending invitations (if member)
        let memberDrafts = [];
        try {
          const invitationsRes = await apiRequest(`/api/groups-draft/invitations/${storedEnrollment}`, "GET", null, token);
          const invitations = invitationsRes?.data?.invitations || invitationsRes?.invitations || [];
          
          // Separate pending invitations from accepted ones
          const pendingInvites = invitations.filter(inv => inv.status === 'pending');
          const acceptedInvites = invitations.filter(inv => inv.status === 'accepted');
          
          setRequests(pendingInvites);
          
          // If member has accepted invitations, fetch those draft groups too
          if (acceptedInvites.length > 0) {
            // Fetch all accepted group drafts
            const draftPromises = acceptedInvites.map(async (invite) => {
              try {
                const draftDetailsRes = await apiRequest(`/api/groups-draft/draft/${invite.group_id}`, "GET", null, token);
                const draftData = draftDetailsRes?.data?.draft || draftDetailsRes?.draft;
                return draftData ? { ...draftData, is_member: true } : null;
              } catch (err) {
                console.warn(`Failed to fetch draft ${invite.group_id}:`, err?.message);
                return null;
              }
            });
            
            const fetchedDrafts = await Promise.all(draftPromises);
            memberDrafts = fetchedDrafts.filter(d => d !== null);
          }
        } catch (err) {
          console.warn('No pending invitations:', err?.message);
          // Check if error is due to deadline
          if (err?.response?.status === 403 || err?.message?.toLowerCase().includes('disabled')) {
            setDeadlinePassed(true);
          }
        }

        // Combine and deduplicate drafts (leader drafts take precedence)
        const allDrafts = [...leaderDrafts];
        memberDrafts.forEach(memberDraft => {
          if (!allDrafts.find(d => d.group_id === memberDraft.group_id)) {
            allDrafts.push(memberDraft);
          }
        });
        
        setDraftGroups(allDrafts);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [propEnrollmentNo]);

  const handleResponse = async (requestId, response) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("student_token");
      
      // Find the request to get group_id before removing it
      const currentRequest = requests.find(req => req.request_id === requestId);
      
      await apiRequest(`/api/groups-draft/respond`, "POST", { 
        request_id: requestId, 
        status: response 
      }, token);

      setSelectedRequest(null);
      setRequests(prev => prev.filter(req => req.request_id !== requestId));
      setMessage(`✅ Invitation ${response} successfully!`);
      
      // If accepted, fetch the draft group details and show it
      if (response === 'accepted' && currentRequest?.group_id) {
        try {
          const draftDetailsRes = await apiRequest(`/api/groups-draft/draft/${currentRequest.group_id}`, "GET", null, token);
          const draftData = draftDetailsRes?.data?.draft || draftDetailsRes?.draft;
          if (draftData) {
            setDraftGroups(prev => [...prev, { ...draftData, is_member: true }]);
          }
        } catch (err) {
          console.warn('Failed to fetch draft details after acceptance:', err?.message);
        }
      }
    } catch (err) {
      if (err?.response?.status === 403) {
        setError('Group creation deadline has passed. This feature is currently disabled.');
        setDeadlinePassed(true);
      } else {
        setError(`Error handling ${response}: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to confirm and finalize this group? This action cannot be undone.')) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem("student_token");
      const response = await apiRequest(`/api/groups-draft/confirm/${groupId}`, "POST", {}, token);
      
      const finalizedData = response?.data || response;
      const finalGroupId = finalizedData?.group_id;
      
      // Show the generated group ID
      setMessage(`✅ Group confirmed and finalized successfully! Your Group ID is: ${finalGroupId}`);
      
      // Refresh data
      const groupRes = await apiRequest(`/api/students/pbl/gp/${enrollmentNo}`, "GET", null, token);
      const details = groupRes?.data?.groupDetails || groupRes?.groupDetails;
      if (details) {
        setGroupDetails(details);
      }
      setDraftGroups([]);
    } catch (err) {
      if (err?.response?.status === 403) {
        setError('Group creation deadline has passed. This feature is currently disabled.');
        setDeadlinePassed(true);
      } else {
        setError(`Error confirming group: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelDraft = async (groupId) => {
    if (!window.confirm('Are you sure you want to cancel this group draft?')) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem("student_token");
      await apiRequest(`/api/groups-draft/draft/${groupId}`, "DELETE", null, token);
      
      setDraftGroups(prev => prev.filter(d => d.group_id !== groupId));
      setMessage('✅ Draft cancelled successfully');
    } catch (err) {
      if (err?.response?.status === 403) {
        setError('Group creation deadline has passed. This feature is currently disabled.');
        setDeadlinePassed(true);
      } else {
        setError(`Error cancelling draft: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleMemberClick = async (member) => {
    setSelectedMember(member);
    setProfileLoading(true);
    try {
      const token = localStorage.getItem("student_token");
  const profileRes = await apiRequest(`/api/students/student/profile/${member.enrollement_no}`, "GET", null, token);
  setMemberProfile(profileRes?.data?.profile || profileRes?.profile || null);
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

  // Success message display
  const MessageAlert = () => message && (
    <div className="mb-4 p-4 rounded-lg border flex items-start gap-3 bg-green-50 border-green-200">
      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm font-medium text-green-800">{message}</p>
      <button onClick={() => setMessage('')} className="ml-auto text-green-600 hover:text-green-800">
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  // ✅ 1. If group already exists (finalized), show it first - highest priority
  if (groupDetails) {
    return (
      <div className="card col-span-1 p-6 bg-white rounded-xl shadow">
        <MessageAlert />
        {groupDetails.team_name && (
          <h1 className="text-base md:text-2xl font-bold mb-2 text-gray-900">{groupDetails.team_name}</h1>
        )}
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Group: {groupDetails.group_id}</h2>
        <p className="text-base text-gray-800 mb-6">
          <strong>Mentor:</strong> 
          <span className="text-purple-700 ml-2">{groupDetails.mentor_code || "Not Assigned"}</span>
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
                            {member.is_leader && (
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

        {/* Member Profile Modal */}
        {selectedMember && (
<div className="fixed inset-0 bg-white/60 backdrop-blur-md flex items-center justify-center z-50 p-4">

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

  // ✅ 2. Show draft groups (for leaders/members) - only if no finalized group
  if (draftGroups.length > 0) {
    return (
      <div className="card col-span-1 p-6 bg-white rounded-xl shadow space-y-6">
        <MessageAlert />
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-500" />
          Pending Group Invitations
        </h2>
        
        {draftGroups.map((draft) => (
          <div key={draft.group_id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{draft.group_name}</h3>
                <p className="text-sm text-gray-600">Group ID: {draft.group_id}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Created {new Date(draft.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                Waiting for Responses
              </span>
            </div>

            {/* Invitation Statistics - Only visible to group leader */}
            {!draft.is_member && (
              <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Member Responses
                </h4>
                <div className="space-y-2">
                  {draft.invitations && draft.invitations.map((inv, idx) => (
                    <div key={inv.request_id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-mono">{inv.enrollment_no}</span>
                      <span className={`flex items-center gap-1 ${
                        inv.status === 'accepted' ? 'text-green-600' :
                        inv.status === 'rejected' ? 'text-red-600' :
                        'text-orange-600'
                      }`}>
                        {inv.status === 'accepted' && <CheckCircle className="w-4 h-4" />}
                        {inv.status === 'rejected' && <XCircle className="w-4 h-4" />}
                        {inv.status === 'pending' && <Clock className="w-4 h-4" />}
                        <span className="capitalize">{inv.status}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {draft.all_accepted ? (
                draft.is_member ? (
                  <div className="text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {draft.accepted_count >= 1 ? `${draft.accepted_count} member(s) accepted. Waiting for leader to finalize...` : 'Waiting for members to accept...'}
                  </div>
                ) : (
                  <button
                    onClick={() => handleConfirmGroup(draft.group_id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirm & Finalize Group ({draft.accepted_count + 1} members)
                  </button>
                )
              ) : (
                <div className="text-sm text-orange-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Waiting for at least 1 member to accept...
                </div>
              )}
              {!draft.is_member && (
                <button
                  onClick={() => handleCancelDraft(draft.group_id)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 font-medium disabled:opacity-50"
                >
                  Cancel Draft
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ✅ 3. Show pending invitations if no group exists
  return (
    <div className="card col-span-1 p-6 flex flex-col justify-between bg-white rounded-xl shadow relative">
      <div>
        <MessageAlert />
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Group Details</h2>

        {requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.request_id}
                className="border border-purple-200 rounded-lg p-4 bg-purple-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-gray-900 font-semibold text-lg">{req.team_name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Leader:</span> {req.leader_enrollment}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Invited {new Date(req.invited_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                    Pending
                  </span>
                </div>
                <button
                  onClick={() => setSelectedRequest(req)}
                  className="mt-3 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-200 font-medium text-sm"
                >
                  View & Respond
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center pt-10">
            {deadlinePassed ? (
              <div className="max-w-md mx-auto">
                <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-amber-100 rounded-full">
                      <AlertTriangle className="w-8 h-8 text-amber-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-amber-900 mb-2">
                    Group Creation Deadline Passed
                  </h3>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    The deadline for creating new groups has expired. Group formation is currently disabled by the administrator.
                  </p>
                  <div className="mt-4 pt-4 border-t border-amber-200">
                    <p className="text-xs text-amber-700">
                      If you believe this is an error or need assistance, please contact your course coordinator or administrator.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <span className="material-icons text-5xl text-gray-300">group_add</span>
                <p className="text-gray-700 mt-2">Group has not been created yet.</p>
                <p className="text-gray-600 text-sm">
                  Click{' '}
                  <a className="text-violet-700 font-semibold hover:underline" href="/create-group">
                    here
                  </a>{' '}
                  to create a group.
                </p>
              </>
            )}
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
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Group Invitation</h3>
            <div className="space-y-2 mb-4">
              <p className="text-gray-800"><strong>Group ID:</strong> {selectedRequest.group_id}</p>
              <p className="text-gray-800"><strong>Team Name:</strong> {selectedRequest.team_name}</p>
              <p className="text-gray-800"><strong>Leader:</strong> {selectedRequest.leader_enrollment}</p>
              <p className="text-gray-800"><strong>Invited:</strong> {new Date(selectedRequest.invited_at).toLocaleString()}</p>
              <p className="text-gray-800">
                <strong>Status:</strong> 
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                  {selectedRequest.status}
                </span>
              </p>
            </div>

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
