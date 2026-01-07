import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api.js';
import { User, Mail, Phone, Github, Linkedin, Globe, Upload, Eye, Download, Edit, Save, X, Camera } from 'lucide-react';

const UserProfile = ({ enrollmentNo }) => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({});
  const [resumeFile, setResumeFile] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);

  useEffect(() => {
    if (enrollmentNo) {
      fetchProfile();
    }
  }, [enrollmentNo]);

  useEffect(() => {
    return () => {
      if (profilePicturePreview) {
        URL.revokeObjectURL(profilePicturePreview);
      }
    };
  }, [profilePicturePreview]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('student_token');
      const res = await apiRequest(`/api/students/student/profile/${enrollmentNo}`, 'GET', null, token);
      if (res && res.profile) {
        setProfile(res.profile);
        setEditForm(res.profile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({ ...profile });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(profile);
    setResumeFile(null);
    setProfilePicture(null);
    if (profilePicturePreview) {
      URL.revokeObjectURL(profilePicturePreview);
      setProfilePicturePreview(null);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('student_token');
      
      const formData = new FormData();
      Object.keys(editForm).forEach(key => {
        if (editForm[key] !== null && editForm[key] !== undefined) {
          formData.append(key, editForm[key]);
        }
      });
      
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      const API_BASE_URL = import.meta.env.MODE === "development" 
        ? import.meta.env.VITE_API_BASE_URL 
        : import.meta.env.VITE_API_BASE_URL_PROD;

      const res = await fetch(`${API_BASE_URL}/api/students/student/profile/${enrollmentNo}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
        setProfile(data.profile);
        setIsEditing(false);
        setResumeFile(null);
        setProfilePicture(null);
        
        if (profilePicturePreview) {
          URL.revokeObjectURL(profilePicturePreview);
          setProfilePicturePreview(null);
        }
        
        const currentStudent = JSON.parse(localStorage.getItem('student') || '{}');
        localStorage.setItem('student', JSON.stringify({...currentStudent, ...data.profile}));
        
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: data.profile }));
        
        alert('Profile updated successfully!');
      } else {
        console.error('Error updating profile:', data.message);
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload PDF or Word document only');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload JPG, PNG, or WebP image only');
        return;
      }
      
      if (profilePicturePreview) {
        URL.revokeObjectURL(profilePicturePreview);
      }
      
      const previewUrl = URL.createObjectURL(file);
      setProfilePicturePreview(previewUrl);
      setProfilePicture(file);
    }
  };

  const handleViewResume = () => {
    setShowResumeModal(true);
  };

  const closeResumeModal = () => {
    setShowResumeModal(false);
  };

  // Check if the resume is a PDF
  const isResumePDF = (url) => {
    if (!url) return false;
    return url.toLowerCase().includes('.pdf') || url.includes('pdf');
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-xl"></div>;
  }

  const getProfileImageSrc = () => {
    if (profilePicturePreview) {
      return profilePicturePreview;
    }
    if (profile?.profile_picture_url) {
      return profile.profile_picture_url;
    }
    return null;
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="text-purple-600" size={24} />
            User Profile
          </h2>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Edit size={16} />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Save size={16} />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Profile Picture Section */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-4 border-purple-200">
              {getProfileImageSrc() ? (
                <img 
                  src={getProfileImageSrc()} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={48} className="text-gray-400" />
              )}
            </div>
            
            {isEditing && (
              <label htmlFor="profile-picture" className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700 transition">
                <Camera size={16} />
                <input
                  id="profile-picture"
                  type="file"
                  onChange={handleProfilePictureChange}
                  accept="image/*"
                  className="hidden"
                />
              </label>
            )}
            
            {profilePicture && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-700 px-2 py-1 rounded text-xs whitespace-nowrap">
                {profilePicturePreview ? 'Preview ready' : 'New image selected'}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Personal Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Bio</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={editForm.bio || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-gray-900 bg-white"
                  placeholder="Tell us about yourself..."
                  style={{ color: '#111827' }}
                />
              ) : (
                <p className="text-gray-800">{profile?.bio || 'No bio added yet'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Skills</label>
              {isEditing ? (
                <input
                  type="text"
                  name="skills"
                  value={editForm.skills || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-gray-900 bg-white"
                  placeholder="e.g. React, Node.js, Python, etc."
                  style={{ color: '#111827' }}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.skills ? profile.skills.split(',').map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {skill.trim()}
                    </span>
                  )) : <span className="text-gray-500">No skills added yet</span>}
                </div>
              )}
            </div>
          </div>

          {/* Contact & Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Contact & Links</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                <Mail size={16} />
                Email
              </label>
              <p className="text-gray-800">{profile?.email_id || profile?.email || 'Not provided'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                <Github size={16} />
                GitHub
              </label>
              {isEditing ? (
                <input
                  type="url"
                  name="github_url"
                  value={editForm.github_url || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-gray-900 bg-white"
                  placeholder="https://github.com/username"
                  style={{ color: '#111827' }}
                />
              ) : profile?.github_url ? (
                <a href={profile.github_url} target="_blank" rel="noopener noreferrer" 
                   className="text-purple-600 hover:text-purple-800 underline">
                  View GitHub Profile
                </a>
              ) : (
                <p className="text-gray-500">Not provided</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                <Linkedin size={16} />
                LinkedIn
              </label>
              {isEditing ? (
                <input
                  type="url"
                  name="linkedin_url"
                  value={editForm.linkedin_url || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-gray-900 bg-white"
                  placeholder="https://linkedin.com/in/username"
                  style={{ color: '#111827' }}
                />
              ) : profile?.linkedin_url ? (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                   className="text-purple-600 hover:text-purple-800 underline">
                  View LinkedIn Profile
                </a>
              ) : (
                <p className="text-gray-500">Not provided</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                <Globe size={16} />
                Portfolio
              </label>
              {isEditing ? (
                <input
                  type="url"
                  name="portfolio_url"
                  value={editForm.portfolio_url || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-gray-900 bg-white"
                  placeholder="https://yourportfolio.com"
                  style={{ color: '#111827' }}
                />
              ) : profile?.portfolio_url ? (
                <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer"
                   className="text-purple-600 hover:text-purple-800 underline">
                  View Portfolio Website
                </a>
              ) : (
                <p className="text-gray-500">Not provided</p>
              )}
            </div>
          </div>
        </div>

        {/* Resume/CV Section */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Upload size={20} />
            Resume/CV
          </h3>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-gray-900 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload PDF or Word document (Max 5MB)
                </p>
              </div>
              
              {resumeFile && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 flex items-center gap-2">
                    <Upload size={16} />
                    Selected: {resumeFile.name}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              {profile?.resume_url ? (
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleViewResume}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    <Eye size={16} />
                    View Resume
                  </button>
                  <a
                    href={profile.resume_url}
                    download
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    <Download size={16} />
                    Download
                  </a>
                </div>
              ) : (
                <p className="text-gray-500 italic">No resume uploaded yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Resume Modal */}
      {showResumeModal && profile?.resume_url && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Eye size={20} />
                Resume Preview
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={profile.resume_url}
                  download
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition text-sm"
                >
                  <Download size={14} />
                  Download
                </a>
                <button
                  onClick={closeResumeModal}
                  className="text-gray-400 hover:text-gray-600 transition duration-200"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-4 overflow-hidden">
              {isResumePDF(profile.resume_url) ? (
                <iframe
                  src={profile.resume_url}
                  className="w-full h-full border border-gray-300 rounded-lg"
                  title="Resume Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-gray-400 mb-4">
                    <Upload size={48} />
                  </div>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">
                    Document Preview Not Available
                  </h4>
                  <p className="text-gray-500 mb-4">
                    This document format cannot be previewed in the browser. 
                    Please download to view the content.
                  </p>
                  <a
                    href={profile.resume_url}
                    download
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    <Download size={16} />
                    Download Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfile;