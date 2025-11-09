import React, { useState, useEffect } from "react";
import { 
  Crown, 
  Users, 
  Search, 
  UserPlus,
  X,
  Check,
  AlertCircle,
  Mail,
  Phone,
  GraduationCap,
  Award,
  Trash2,
  Edit,
  Save
} from "lucide-react";
import { apiRequest } from "../../api";

const AssignClassLead = () => {
  const [students, setStudents] = useState([]);
  const [classLeads, setClassLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form data for assigning class lead
  const [formData, setFormData] = useState({
    year: "",
    division: "",
    specialization: "",
    batch: "",
    responsibilities: []
  });

  const years = ["SE", "TE", "BE"];
  
  // Division configuration based on year
  const getDivisionsForYear = (year) => {
    switch(year) {
      case "SE":
        return Array.from({length: 22}, (_, i) => String(i + 1)); // 1-22 divisions
      case "TE":
      case "BE":
        return []; // No divisions, only specializations
      default:
        return [];
    }
  };

  // Specializations for TE and BE
  const specializations = [
    { id: "ai", name: "Artificial Intelligence" },
    { id: "cloud", name: "Cloud Computing" },
    { id: "cybersecurity", name: "Cybersecurity" },
    { id: "data-science", name: "Data Science" },
    { id: "iot", name: "Internet of Things" }
  ];

  // Batches for specializations (e.g., AI-1, AI-2)
  const batches = ["1", "2", "3"];

  const defaultResponsibilities = [
    "Coordinate class activities and events",
    "Act as liaison between students and faculty",
    "Maintain class attendance records",
    "Organize study groups and peer learning sessions",
    "Assist in project group formation",
    "Communicate important announcements to class"
  ];

  const mockStudents = [];

  const mockClassLeads = [];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const studentsRes = await apiRequest("/api/students", "GET");
      const leadsRes = await apiRequest("/api/class-leads", "GET");
      
      setStudents(Array.isArray(studentsRes?.data) ? studentsRes.data : mockStudents);
      setClassLeads(Array.isArray(leadsRes?.data) ? leadsRes.data : mockClassLeads);
    } catch (error) {
      console.error("Error fetching data:", error);
      setStudents(mockStudents);
      setClassLeads(mockClassLeads);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLead = async () => {
    try {
      const newLead = {
        id: Date.now(),
        student: selectedStudent,
        year: formData.year,
        division: formData.division,
        specialization: formData.specialization,
        batch: formData.batch,
        assignedDate: new Date().toISOString(),
        responsibilities: formData.responsibilities
      };
      
      setClassLeads([...classLeads, newLead]);
      setShowAssignModal(false);
      resetForm();
    } catch (error) {
      console.error("Error assigning class lead:", error);
    }
  };

  const handleRemoveLead = async (leadId) => {
    if (window.confirm("Are you sure you want to remove this class lead?")) {
      try {
        setClassLeads(classLeads.filter(lead => lead.id !== leadId));
      } catch (error) {
        console.error("Error removing class lead:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      year: "",
      division: "",
      specialization: "",
      batch: "",
      responsibilities: []
    });
    setSelectedStudent(null);
    setSearchQuery("");
  };

  const toggleResponsibility = (responsibility) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: prev.responsibilities.includes(responsibility)
        ? prev.responsibilities.filter(r => r !== responsibility)
        : [...prev.responsibilities, responsibility]
    }));
  };

  const getClassLabel = (lead) => {
    if (lead.year === "TE" || lead.year === "BE") {
      const spec = specializations.find(s => s.id === lead.specialization);
      return `${spec?.name || lead.specialization} - Batch ${lead.batch}`;
    } else if (lead.year === "SE") {
      return `Division ${lead.division}`;
    } else {
      return `Division ${lead.division}`;
    }
  };

  const filteredStudents = Array.isArray(students) 
    ? students.filter(student => {
        // Filter by year and division/specialization first
        if (!formData.year) return false;
        
        if (student.year !== formData.year) return false;
        
        if (formData.year === "SE" && formData.division) {
          if (student.division !== formData.division) return false;
        }
        
        if ((formData.year === "TE" || formData.year === "BE") && formData.specialization && formData.batch) {
          if (student.specialization !== formData.specialization || student.batch !== formData.batch) return false;
        }
        
        // Then filter by search query
        return student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               student.enrollment.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Crown className="w-8 h-8 text-purple-600" />
              Class Lead Management
            </h1>
            <p className="text-gray-600 mt-2">
              Assign and manage class leaders for different years, divisions, and specializations
            </p>
          </div>
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
          >
            <UserPlus className="w-5 h-5" />
            Assign Class Lead
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Class Leads</p>
                <p className="text-2xl font-bold text-gray-900">{classLeads.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">SE Classes</p>
                <p className="text-2xl font-bold text-blue-600">
                  {classLeads.filter(l => l.year === "SE").length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">TE/BE Specializations</p>
                <p className="text-2xl font-bold text-green-600">
                  {classLeads.filter(l => l.year === "TE" || l.year === "BE").length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Class Leads */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Current Class Leads</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classLeads.map(lead => (
            <div key={lead.id} className="bg-white rounded-xl shadow-sm border-2 border-purple-200 p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Crown className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{lead.student.name}</h3>
                    <p className="text-sm text-gray-600">{lead.student.enrollment}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveLead(lead.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Year: <span className="font-semibold text-gray-900">{lead.year}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-gray-400" />
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                    {getClassLabel(lead)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {lead.student.email}
                </div>
                <div className="text-xs text-gray-500">
                  Assigned: {new Date(lead.assignedDate).toLocaleDateString()}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Responsibilities:</p>
                <div className="space-y-1">
                  {lead.responsibilities.slice(0, 2).map((resp, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600">{resp}</p>
                    </div>
                  ))}
                  {lead.responsibilities.length > 2 && (
                    <p className="text-xs text-purple-600 font-medium">
                      +{lead.responsibilities.length - 2} more...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {classLeads.length === 0 && (
            <div className="col-span-full bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
              <Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Class Leads Assigned</h3>
              <p className="text-gray-600 mb-4">Start by assigning class leaders for different years and divisions</p>
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Assign First Class Lead
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowAssignModal(false);
              resetForm();
            }}
          ></div>
          
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Assign Class Lead</h2>
                    <p className="text-purple-100 text-sm mt-1">
                      Select year, division/specialization, and then student
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              <div className="space-y-6">
                {/* Step 1: Year Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold text-sm">1</div>
                    <h3 className="text-lg font-bold text-gray-900">Select Year</h3>
                  </div>

                  <select
                    value={formData.year}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        year: e.target.value,
                        division: "",
                        specialization: "",
                        batch: "",
                        responsibilities: []
                      });
                      setSelectedStudent(null);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-gray-900"
                  >
                    <option value="">Select Year</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Division/Specialization Selection */}
                {formData.year && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold text-sm">2</div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {formData.year === "SE" ? "Select Division" : "Select Specialization & Batch"}
                      </h3>
                    </div>

                    {/* Division for SE */}
                    {formData.year === "SE" && (
                      <select
                        value={formData.division}
                        onChange={(e) => {
                          setFormData({ ...formData, division: e.target.value });
                          setSelectedStudent(null);
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-gray-900"
                      >
                        <option value="">Select Division (1-22)</option>
                        {getDivisionsForYear(formData.year).map(div => (
                          <option key={div} value={div}>Division {div}</option>
                        ))}
                      </select>
                    )}

                    {/* Specialization and Batch for TE and BE */}
                    {(formData.year === "TE" || formData.year === "BE") && (
                      <div className="space-y-4">
                        <select
                          value={formData.specialization}
                          onChange={(e) => {
                            setFormData({ ...formData, specialization: e.target.value, batch: "" });
                            setSelectedStudent(null);
                          }}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-gray-900"
                        >
                          <option value="">Select Specialization</option>
                          {specializations.map(spec => (
                            <option key={spec.id} value={spec.id}>{spec.name}</option>
                          ))}
                        </select>

                        {formData.specialization && (
                          <select
                            value={formData.batch}
                            onChange={(e) => {
                              setFormData({ ...formData, batch: e.target.value });
                              setSelectedStudent(null);
                            }}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-gray-900"
                          >
                            <option value="">Select Batch</option>
                            {batches.map(batch => (
                              <option key={batch} value={batch}>
                                {specializations.find(s => s.id === formData.specialization)?.name.split(' ').map(w => w[0]).join('')}-{batch}
                              </option>
                            ))}
                          </select>
                        )}

                        {formData.specialization && formData.batch && (
                          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                            <p className="text-sm text-purple-800 font-medium">
                              Selected: {specializations.find(s => s.id === formData.specialization)?.name} - Batch {formData.batch}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Student Selection */}
                {((formData.year === "SE" && formData.division) ||
                  ((formData.year === "TE" || formData.year === "BE") && formData.specialization && formData.batch)) && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold text-sm">3</div>
                      <h3 className="text-lg font-bold text-gray-900">Select Student</h3>
                    </div>

                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name or enrollment..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-2 border-2 border-gray-200 rounded-xl p-2">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map(student => (
                          <button
                            key={student.id}
                            onClick={() => setSelectedStudent(student)}
                            className={`w-full p-3 rounded-lg text-left transition-all ${
                              selectedStudent?.id === student.id
                                ? "bg-purple-100 border-2 border-purple-500"
                                : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-600">{student.enrollment}</p>
                              </div>
                              {selectedStudent?.id === student.id && (
                                <Check className="w-5 h-5 text-purple-600" />
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">No students found for this class</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 4: Responsibilities */}
                {selectedStudent && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold text-sm">4</div>
                      <h3 className="text-lg font-bold text-gray-900">Assign Responsibilities</h3>
                    </div>

                    <div className="space-y-2">
                      {defaultResponsibilities.map((resp, idx) => (
                        <label
                          key={idx}
                          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            formData.responsibilities.includes(resp)
                              ? "bg-purple-50 border-2 border-purple-200"
                              : "bg-white border-2 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.responsibilities.includes(resp)}
                            onChange={() => toggleResponsibility(resp)}
                            className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{resp}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-3">
                      <p className="text-sm text-purple-800 font-medium">
                        <strong>{formData.responsibilities.length}</strong> responsibilities selected
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-200 bg-gray-50 p-6">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignLead}
                  disabled={
                    !selectedStudent || 
                    !formData.year || 
                    ((formData.year === "SE") && !formData.division) ||
                    ((formData.year === "TE" || formData.year === "BE") && (!formData.specialization || !formData.batch)) ||
                    formData.responsibilities.length === 0
                  }
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Award className="w-5 h-5" />
                  Assign as Class Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignClassLead;
