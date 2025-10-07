import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, uploadFile } from "../../api.js";

const MentorSelection = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMentor, setSelectedMentor] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [external1Name, setExternal1Name] = useState("");
  const [external2Name, setExternal2Name] = useState("");
  const [organization1Name, setOrganization1Name] = useState("");
  const [organization2Name, setOrganization2Name] = useState("");
  const [external1Contact, setExternal1Contact] = useState("");
  const [external2Contact, setExternal2Contact] = useState("");
  const [external1Email, setExternal1Email] = useState("");
  const [external2Email, setExternal2Email] = useState("");
  const navigate = useNavigate();

  // Load saved evaluator details from localStorage on component mount
  useEffect(() => {
    const savedExternal1 = localStorage.getItem("external1_name");
    const savedExternal2 = localStorage.getItem("external2_name");
    const savedOrg1 = localStorage.getItem("organization1_name");
    const savedOrg2 = localStorage.getItem("organization2_name");
    const savedExt1Contact = localStorage.getItem("external1_contact");
    const savedExt2Contact = localStorage.getItem("external2_contact");
    const savedExt1Email = localStorage.getItem("external1_email");
    const savedExt2Email = localStorage.getItem("external2_email");

    if (savedExternal1) setExternal1Name(savedExternal1);
    if (savedExternal2) setExternal2Name(savedExternal2);
    if (savedOrg1) setOrganization1Name(savedOrg1);
    if (savedOrg2) setOrganization2Name(savedOrg2);
    if (savedExt1Contact) setExternal1Contact(savedExt1Contact);
    if (savedExt2Contact) setExternal2Contact(savedExt2Contact);
    if (savedExt1Email) setExternal1Email(savedExt1Email);
    if (savedExt2Email) setExternal2Email(savedExt2Email);
  }, []);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const token = localStorage.getItem("token");
        const externalId = localStorage.getItem("external_id");
        
        // Check if this is MITADT external (case-insensitive)
        if (externalId?.toUpperCase() !== "MITADT") {
          navigate("/external-home");
          return;
        }

        const response = await apiRequest("/api/external-auth/mentors", "GET", null, token);
        
        if (response && response.data && response.data.mentors) {
          setMentors(response.data.mentors);
        } else {
          setError("No mentors found");
        }
      } catch (err) {
        setError(err.message || "Failed to load mentors");
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, [navigate]);

  const handleMentorSelect = async () => {
    if (!selectedMentor) {
      setError("Please select a mentor");
      return;
    }

    if (!external1Name.trim()) {
      setError("Please enter External 1 name");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch groups for the selected mentor
      const response = await apiRequest(
        `/api/external-auth/mentor-groups?mentor_name=${encodeURIComponent(selectedMentor)}`,
        "GET",
        null,
        token
      );

      if (response && response.data && response.data.groups) {
        // Store the selected mentor, their groups, and external evaluator details
        localStorage.setItem("selected_mentor", selectedMentor);
        localStorage.setItem("groups", JSON.stringify(response.data.groups));
        localStorage.setItem("external1_name", external1Name.trim());
        localStorage.setItem("external2_name", external2Name.trim());
        localStorage.setItem("organization1_name", organization1Name.trim());
        localStorage.setItem("organization2_name", organization2Name.trim());
        localStorage.setItem("external1_contact", external1Contact.trim());
        localStorage.setItem("external2_contact", external2Contact.trim());
        localStorage.setItem("external1_email", external1Email.trim());
        localStorage.setItem("external2_email", external2Email.trim());
        
        // Navigate to external home
        navigate("/external-home");
      } else {
        setError("No groups found for this mentor");
      }
    } catch (err) {
      setError(err.message || "Failed to load mentor groups");
    } finally {
      setLoading(false);
    }
  };

  // Filter mentors based on search term
  const filteredMentors = mentors.filter(mentor => 
    mentor.mentor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mentor.contact_number && mentor.contact_number.includes(searchTerm))
  );

  if (loading && mentors.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading mentors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-purple-600 mb-3">
            PBL REVIEW 2
          </h1>
          <div className="h-1 w-32 bg-purple-600 rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Configure external evaluators and select mentor for group evaluation
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm animate-shake">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: External Evaluators Information */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-900">External Evaluators</h3>
                <p className="text-sm text-gray-500">Enter evaluator details</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Evaluator 1 Section */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-xs mr-2">1</span>
                  Evaluator 1
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={external1Name}
                      onChange={(e) => setExternal1Name(e.target.value)}
                      placeholder="Enter evaluator name"
                      className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                      Organization
                    </label>
                    <input
                      type="text"
                      value={organization1Name}
                      onChange={(e) => setOrganization1Name(e.target.value)}
                      placeholder="Enter organization name"
                      className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={external1Contact}
                      onChange={(e) => setExternal1Contact(e.target.value)}
                      placeholder="Enter contact number"
                      className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={external1Email}
                      onChange={(e) => setExternal1Email(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Evaluator 2 Section */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-xs mr-2">2</span>
                  Evaluator 2
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                      Name
                    </label>
                    <input
                      type="text"
                      value={external2Name}
                      onChange={(e) => setExternal2Name(e.target.value)}
                      placeholder="Enter evaluator name"
                      className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                      Organization
                    </label>
                    <input
                      type="text"
                      value={organization2Name}
                      onChange={(e) => setOrganization2Name(e.target.value)}
                      placeholder="Enter organization name"
                      className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={external2Contact}
                      onChange={(e) => setExternal2Contact(e.target.value)}
                      placeholder="Enter contact number"
                      className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={external2Email}
                      onChange={(e) => setExternal2Email(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Mentor Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-900">Select Mentor</h3>
                <p className="text-sm text-gray-500">Search and choose mentor</p>
              </div>
            </div>

            {/* Search Box */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search mentor by name or contact..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400 shadow-sm"
                />
                <svg className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <p className="mt-2 text-xs text-gray-500">
                  Found {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Mentors Grid */}
            <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredMentors.length > 0 ? (
                <div className="space-y-2">
                  {filteredMentors.map((mentor, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedMentor(mentor.mentor_name)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                        selectedMentor === mentor.mentor_name
                          ? 'bg-purple-600 border-purple-700 shadow-lg transform scale-[1.02]'
                          : 'bg-gray-50 border-gray-200 hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedMentor === mentor.mentor_name
                              ? 'bg-white/20'
                              : 'bg-purple-100'
                          }`}>
                            <svg className={`h-6 w-6 ${
                              selectedMentor === mentor.mentor_name ? 'text-white' : 'text-purple-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="ml-4 flex-1">
                            <h4 className={`font-semibold text-sm ${
                              selectedMentor === mentor.mentor_name ? 'text-white' : 'text-gray-900'
                            }`}>
                              {mentor.mentor_name}
                            </h4>
                            {mentor.contact_number && (
                              <p className={`text-xs mt-0.5 ${
                                selectedMentor === mentor.mentor_name ? 'text-white/80' : 'text-gray-500'
                              }`}>
                                📞 {mentor.contact_number}
                              </p>
                            )}
                          </div>
                        </div>
                        {selectedMentor === mentor.mentor_name && (
                          <svg className="h-6 w-6 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-4 text-sm text-gray-500">No mentors found matching your search</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleMentorSelect}
            disabled={!selectedMentor || !external1Name.trim() || loading}
            className="px-12 py-4 bg-purple-600 text-white text-lg font-bold rounded-xl hover:bg-purple-700 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading Groups...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <span>Continue to Evaluation</span>
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #9333ea;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #7e22ce;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
};

export default MentorSelection;
