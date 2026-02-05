import React, { useState, useMemo, useEffect } from "react";
import { apiRequest } from "../../api";

const ProblemStatementModal = ({ 
  show, 
  onClose, 
  selectedGroupId, 
  problemStatement, 
  onSuccess, 
  isReadOnly 
}) => {
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "",
    technologyBucket: [],
    domain: [],
    description: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [techSearch, setTechSearch] = useState("");
  const [domainSearch, setDomainSearch] = useState("");
  const [showTechDropdown, setShowTechDropdown] = useState(false);
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);

  const technologyOptions = [
    "Artificial Intelligence (AI)", "Machine Learning (ML)", "Deep Learning",
    "Data Science & Analytics", "Big Data", "Internet of Things (IoT)",
    "Cloud Computing", "Edge Computing", "Blockchain", "Cyber Security",
    "Web Development", "Mobile Application Development", "Full Stack Development",
    "DevOps", "AR / VR / XR", "Computer Vision", "Natural Language Processing (NLP)",
    "Robotics & Automation", "Embedded Systems", "Digital Signal Processing (DSP)",
    "Networking & Communication", "Quantum Computing", "Low-Code / No-Code Platforms",
    "Software Engineering Tools", "Game Development"
  ];

  const domainOptions = [
    "Education (EdTech)", "Healthcare & Medical", "Agriculture & AgriTech",
    "Smart Cities", "FinTech & Banking", "E-Governance", "Transportation & Logistics",
    "Energy & Power", "Environment & Sustainability", "Climate & Disaster Management",
    "Retail & E-Commerce", "Manufacturing & Industry 4.0", "Defence & Security",
    "Media & Entertainment", "Tourism & Hospitality", "Sports & Fitness",
    "Social Welfare & NGOs", "Rural Development", "Urban Development",
    "Telecommunications", "Supply Chain Management", "LegalTech",
    "HR & Workforce Management", "Real Estate & Infrastructure", "Space & Research",
    "Open Innovation / Cross-Domain"
  ];

  const filteredTechOptions = useMemo(() => 
    technologyOptions.filter(tech => tech.toLowerCase().includes(techSearch.toLowerCase())),
    [techSearch]
  );

  const filteredDomainOptions = useMemo(() => 
    domainOptions.filter(domain => domain.toLowerCase().includes(domainSearch.toLowerCase())),
    [domainSearch]
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setShowTechDropdown(false);
        setShowDomainDropdown(false);
      }
    };
    if (showTechDropdown || showDomainDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTechDropdown, showDomainDropdown]);

  const resetForm = () => {
    setForm({ title: "", type: "", technologyBucket: [], domain: [], description: "" });
    setMessage("");
    setTechSearch("");
    setDomainSearch("");
    setShowTechDropdown(false);
    setShowDomainDropdown(false);
    setIsEditing(false);
  };

  const handleAdd = () => {
    resetForm();
    setShowAddEdit(true);
  };

  const handleView = () => {
    setShowView(true);
  };

  const handleEdit = () => {
    if (problemStatement) {
      setForm({
        title: problemStatement.title || "",
        type: problemStatement.type || "",
        technologyBucket: problemStatement.technologybucket ? problemStatement.technologybucket.split(", ").filter(Boolean) : [],
        domain: problemStatement.domain ? problemStatement.domain.split(", ").filter(Boolean) : [],
        description: problemStatement.description || ""
      });
      setIsEditing(true);
      setShowView(false);
      setShowAddEdit(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroupId) return;
    
    setSubmitting(true);
    setMessage("");
    
    const payload = {
      group_id: selectedGroupId,
      title: form.title,
      type: form.type,
      technologyBucket: form.technologyBucket.join(", "),
      domain: form.domain.join(", "),
      description: form.description
    };
    
    const token = localStorage.getItem("mentor_token");
    const response = await apiRequest(
      `/api/students/student/problem-statement`,
      "POST",
      payload,
      token
    );
    
    if (response?.success || response?.success !== false) {
      setMessage("Problem statement saved successfully!");
      const savedData = {
        title: form.title,
        type: form.type,
        technologybucket: form.technologyBucket.join(", "),
        domain: form.domain.join(", "),
        description: form.description
      };
      
      setTimeout(() => {
        setShowAddEdit(false);
        resetForm();
        if (onSuccess) onSuccess(savedData);
      }, 1500);
    } else {
      setMessage(response?.message || "Failed to save problem statement.");
    }
    
    setSubmitting(false);
  };

  // Render Add Button
  if (!problemStatement && selectedGroupId && !showAddEdit && !showView) {
    return (
      <button
        type="button"
        onClick={handleAdd}
        className="text-sm px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
      >
        + Add Problem Statement
      </button>
    );
  }

  // Render View Button
  if (problemStatement && selectedGroupId && !showAddEdit && !showView) {
    return (
      <button
        type="button"
        onClick={handleView}
        className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
      >
        View Details
      </button>
    );
  }

  return (
    <>
      {/* Add/Edit Modal */}
      {showAddEdit && (
        <div 
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
          style={{ zIndex: 9999, backgroundColor: 'transparent' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddEdit(false);
              resetForm();
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Problem Statement' : 'Add Problem Statement'}</h3>
              <button
                onClick={() => { setShowAddEdit(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Project Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  placeholder="Enter project title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                >
                  <option value="">Select Type</option>
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              {/* Technology Stack */}
              <div className="relative dropdown-container">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Technology Bucket</label>

                {form.technologyBucket.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    {form.technologyBucket.slice(0, 3).map((tech) => (
                      <span key={tech} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-full text-sm">
                        {tech}
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, technologyBucket: form.technologyBucket.filter(t => t !== tech) })}
                          className="hover:bg-purple-700 rounded-full w-4 h-4 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {form.technologyBucket.length > 3 && (
                      <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        +{form.technologyBucket.length - 3} more
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, technologyBucket: [] })}
                      className="text-sm text-purple-600 hover:text-purple-800 underline ml-2"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                <div
                  onClick={() => setShowTechDropdown(!showTechDropdown)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 flex items-center justify-between bg-white"
                >
                  <span className="text-gray-500 text-sm">
                    {form.technologyBucket.length === 0 ? "Select technologies..." : `${form.technologyBucket.length} selected`}
                  </span>
                  <span className="text-gray-400">{showTechDropdown ? "▲" : "▼"}</span>
                </div>

                {showTechDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-72 overflow-hidden">
                    <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-10">
                      <input
                        type="text"
                        value={techSearch}
                        onChange={(e) => setTechSearch(e.target.value)}
                        placeholder="🔍 Search technology..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="overflow-y-auto max-h-60">
                      {filteredTechOptions.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">No technologies found</div>
                      ) : (
                        filteredTechOptions.map((tech) => (
                          <label
                            key={tech}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-purple-50 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={form.technologyBucket.includes(tech)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setForm({ ...form, technologyBucket: [...form.technologyBucket, tech] });
                                } else {
                                  setForm({ ...form, technologyBucket: form.technologyBucket.filter(t => t !== tech) });
                                }
                              }}
                              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">{tech}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Domain */}
              <div className="relative dropdown-container">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Domain</label>

                {form.domain.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    {form.domain.slice(0, 3).map((dom) => (
                      <span key={dom} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-full text-sm">
                        {dom}
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, domain: form.domain.filter(d => d !== dom) })}
                          className="hover:bg-indigo-700 rounded-full w-4 h-4 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {form.domain.length > 3 && (
                      <span className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                        +{form.domain.length - 3} more
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, domain: [] })}
                      className="text-sm text-indigo-600 hover:text-indigo-800 underline ml-2"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                <div
                  onClick={() => setShowDomainDropdown(!showDomainDropdown)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 flex items-center justify-between bg-white"
                >
                  <span className="text-gray-500 text-sm">
                    {form.domain.length === 0 ? "Select domains..." : `${form.domain.length} selected`}
                  </span>
                  <span className="text-gray-400">{showDomainDropdown ? "▲" : "▼"}</span>
                </div>

                {showDomainDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-72 overflow-hidden">
                    <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-10">
                      <input
                        type="text"
                        value={domainSearch}
                        onChange={(e) => setDomainSearch(e.target.value)}
                        placeholder="🔍 Search domain..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="overflow-y-auto max-h-60">
                      {filteredDomainOptions.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">No domains found</div>
                      ) : (
                        filteredDomainOptions.map((domain) => (
                          <label
                            key={domain}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={form.domain.includes(domain)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setForm({ ...form, domain: [...form.domain, domain] });
                                } else {
                                  setForm({ ...form, domain: form.domain.filter(d => d !== domain) });
                                }
                              }}
                              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">{domain}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-vertical text-gray-900"
                  placeholder="Describe your problem statement..."
                />
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.includes("success") 
                    ? "bg-green-50 text-green-800 border border-green-200" 
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}>
                  {message}
                </div>
              )}
              </form>
            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => { setShowAddEdit(false); resetForm(); }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !form.title.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : (isEditing ? "Update" : "Submit")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showView && problemStatement && (
        <div 
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
          style={{ zIndex: 9999, backgroundColor: 'transparent' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowView(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Problem Statement Details</h3>
              <button
                onClick={() => setShowView(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <label className="block text-sm font-semibold text-purple-700 mb-2">Project Title</label>
                <p className="text-lg font-bold text-gray-900">{problemStatement.title || '—'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Project Type</label>
                  <p className="text-base text-gray-800">{problemStatement.type || 'Not specified'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Application Domain</label>
                  <div className="flex flex-wrap gap-2">
                    {problemStatement.domain ? (
                      problemStatement.domain.split(', ').filter(Boolean).map((d, i) => (
                        <span key={i} className="px-2 py-1 bg-indigo-600 text-white rounded-full text-xs">
                          {d}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <label className="block text-sm font-semibold text-purple-700 mb-2">Technology Stack</label>
                <div className="flex flex-wrap gap-2">
                  {problemStatement.technologybucket ? (
                    problemStatement.technologybucket.split(', ').filter(Boolean).map((tech, i) => (
                      <span key={i} className="px-2 py-1 bg-purple-600 text-white rounded-full text-xs">
                        {tech}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No technologies selected</span>
                  )}
                </div>
              </div>

              {problemStatement.description && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{problemStatement.description}</p>
                </div>
              )}
              </div>
            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-gray-200 bg-white">
              <button
                onClick={() => setShowView(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Close
              </button>
              <button
                onClick={handleEdit}
                disabled={isReadOnly}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title={isReadOnly ? "Cannot edit after evaluation is submitted" : "Edit problem statement"}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProblemStatementModal;
