import React, { useState, useEffect } from "react";
import { apiRequest } from "../../api";
import MentorSidebar from "../../Components/Mentor/MentorSidebar";
import MentorHeader from "../../Components/Mentor/MentorHeader";
import { Plus, Save, UserPlus, Building, Mail, Phone, Calendar, FileText, CheckCircle, AlertCircle, ClipboardCheck, Users, Award, BookOpen, Target, X, Download, Eye, User, Building2, Briefcase, Maximize2 } from "lucide-react";

// Add custom CSS for animations and sliders
const customStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  .animate-slideDown {
    animation: slideDown 0.4s ease-out;
  }
  .animate-pulse-custom {
    animation: pulse 2s infinite;
  }
  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }
  .pdf-loading {
    transition: opacity 0.3s ease;
  }
  iframe[src*="pdf"] + .pdf-loading {
    opacity: 0;
    pointer-events: none;
  }
  .slider {
    position: relative;
    background: linear-gradient(90deg, #fed7aa 0%, #fdba74 50%, #f97316 100%);
    border-radius: 8px;
    height: 12px;
    outline: none;
    transition: all 0.3s ease;
  }
  .slider:hover {
    transform: scaleY(1.2);
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
  }
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 24px;
    width: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffffff 0%, #f97316 50%, #ea580c 100%);
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3);
    border: 3px solid #ffffff;
    transition: all 0.2s ease;
    position: relative;
  }
  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 6px 16px rgba(249, 115, 22, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.4);
  }
  .slider::-webkit-slider-thumb:active {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.6);
  }
  .slider::-moz-range-thumb {
    height: 24px;
    width: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffffff 0%, #f97316 50%, #ea580c 100%);
    cursor: pointer;
    border: 3px solid #ffffff;
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
    transition: all 0.2s ease;
  }
  .slider::-webkit-slider-track {
    height: 12px;
    border-radius: 8px;
    background: linear-gradient(90deg, #fed7aa 0%, #fdba74 50%, #f97316 100%);
    position: relative;
  }
  .slider::-moz-range-track {
    height: 12px;
    border-radius: 8px;
    background: linear-gradient(90deg, #fed7aa 0%, #fdba74 50%, #f97316 100%);
    border: none;
  }
  .toggle-switch {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .toggle-switch:hover {
    transform: scale(1.05);
  }
  .student-card {
    transition: all 0.3s ease;
  }
  .student-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
  .marks-grid {
    transition: all 0.4s ease;
  }
  .absent-overlay {
    animation: slideDown 0.5s ease-out;
  }
  .marks-display {
    background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 50%, #fb923c 100%);
    position: relative;
    overflow: hidden;
  }
  .marks-display::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    animation: shimmer 2s infinite;
  }
  @media (max-width: 1024px) {
    body {
      padding-bottom: 80px;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = customStyles;
  document.head.appendChild(styleSheet);
}

const ZerothReview = () => {
  const [mentor, setMentor] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState("");
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [memberEnrollment, setMemberEnrollment] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [verifyingStudent, setVerifyingStudent] = useState(false);
  const [verifiedStudent, setVerifiedStudent] = useState(null);
  const [verificationError, setVerificationError] = useState("");

  // Form state for the evaluation form
  const [formData, setFormData] = useState({
    project_id: "",
    class: "",
    date: new Date().toISOString().split('T')[0],
    guide_name: "",
    scope_redefinition: "",
    expert_name: "",
    expert_phone: "",
    expert_email: "",
  });

  // Students data (from selected group)
  const [students, setStudents] = useState([]);
  
  // Internship entries (multiple internships per student)
  const [internships, setInternships] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("mentor_token");
    if (!token) {
      window.location.href = '/login';
      return;
    }
    
    // Load saved expert details
    const savedExpert = localStorage.getItem('expert_details');
    if (savedExpert) {
      const expertData = JSON.parse(savedExpert);
      setFormData(prev => ({
        ...prev,
        expert_name: expertData.expert_name || '',
        expert_phone: expertData.expert_phone || '',
        expert_email: expertData.expert_email || ''
      }));
    }
    
    fetchMentorData(token);
  }, []);

  const fetchMentorData = async (token) => {
    try {
      setLoading(true);
      
      // Get mentor info from token
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const mentorInfo = {
        name: tokenData.mentor_name,
        id: tokenData.mentor_id,
        contact: tokenData.contact_number
      };
      setMentor(mentorInfo);
      setFormData(prev => ({ ...prev, guide_name: mentorInfo.name }));

      // Fetch mentor groups
      const groupsRes = await apiRequest("/api/mentors/groups", "GET", null, token);
      const mentorGroups = groupsRes?.data?.groups || groupsRes?.groups || [];
      setGroups(mentorGroups);

    } catch (error) {
      console.error("Error fetching mentor data:", error);
      setMessage({ type: "error", text: "Failed to load mentor data" });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async (groupId) => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem("mentor_token");
      
      // Fetch existing internship data for this group from internship_details table
      const internshipRes = await apiRequest(
        `/api/mentors/zeroth-review/${groupId}`,
        "GET",
        null,
        token
      );
      
      const existingInternships = internshipRes?.data?.internships || [];
      
      // If we have existing data, use it to populate students
      let groupStudents = [];
      
      if (existingInternships.length > 0) {
        // Extract unique students from internship data
        const studentMap = new Map();
        existingInternships.forEach(data => {
          if (!studentMap.has(data.enrollment_no)) {
            studentMap.set(data.enrollment_no, {
              enrollment_no: data.enrollment_no,
              name_of_students: data.student_name,
              student_name: data.student_name
            });
          }
        });
        groupStudents = Array.from(studentMap.values());
      } else {
        // Fallback: Fetch students from group endpoint
        try {
          const studentsRes = await apiRequest(
            `/api/students/group/${groupId}`,
            "GET",
            null,
            token
          );
          groupStudents = studentsRes?.data?.students || studentsRes?.students || [];
        } catch (err) {
          console.error("Error fetching students from group endpoint:", err);
        }
      }
      
      setGroupDetails({ groupId, students: groupStudents });
      setFormData(prev => ({ ...prev, project_id: groupId }));
      
      // Initialize students with existing marks if available
      if (groupStudents.length > 0) {
        setStudents(groupStudents.map((student) => {
          const existingData = existingInternships.find(
            int => int.enrollment_no === student.enrollment_no
          );
          
          return {
            enrollment_no: student.enrollment_no,
            name: student.name_of_students || student.student_name || 'Unknown',
            isAbsent: existingData?.total === 'Absent',
            marks: {
              literature_survey: existingData?.m1 || 0,
              status_sem7: existingData?.m2 || 0,
              technical_readiness: existingData?.m3 || 0,
              knowledge_problem: existingData?.m4 || 0,
              plan_development: existingData?.m5 || 0,
              total: existingData?.total === 'Absent' ? 'Absent' : (existingData?.total || 0)
            }
          };
        }));
      }

      // Initialize internships with existing data or empty rows
      if (existingInternships.length > 0) {
        setInternships(existingInternships.map((data) => ({
          enrollment_no: data.enrollment_no,
          student_name: data.student_name,
          company_name: data.organization_name || "",
          mode: data.internship_type || "Online",
          start_date: data.start_date || "",
          end_date: data.end_date || "",
          profile_task: data.role || "",
          remark: data.remark || "Pending"
        })));
        
        // Pre-fill expert info if exists
        if (existingInternships[0]?.external) {
          setFormData(prev => ({
            ...prev,
            expert_name: existingInternships[0].external || "",
            scope_redefinition: existingInternships[0].scope || ""
          }));
        }
      } else {
        // Initialize with one internship row per student
        setInternships(groupStudents.map((student) => ({
          enrollment_no: student.enrollment_no,
          student_name: student.name_of_students || student.student_name || 'Unknown',
          company_name: "",
          mode: "Development Internship",
          start_date: "",
          end_date: "",
          profile_task: "",
          remark: "Pending"
        })));
      }

    } catch (error) {
      console.error("Error fetching group details:", error);
      setMessage({ type: "error", text: "Failed to load group details" });
    } finally {
      setLoading(false);
    }
  };

  const handleGroupChange = (e) => {
    const groupId = e.target.value;
    setSelectedGroup(groupId);
    fetchGroupDetails(groupId);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Save expert details to localStorage
    if (name === 'expert_name' || name === 'expert_phone' || name === 'expert_email') {
      const currentExpert = JSON.parse(localStorage.getItem('expert_details') || '{}');
      const updatedExpert = { ...currentExpert, [name]: value };
      localStorage.setItem('expert_details', JSON.stringify(updatedExpert));
    }
  };

  const handleStudentMarksChange = (index, field, value) => {
    const newStudents = [...students];
    newStudents[index].marks[field] = parseInt(value) || 0;
    
    // Only calculate total if student is not absent
    if (!newStudents[index].isAbsent) {
      const marks = newStudents[index].marks;
      marks.total = marks.literature_survey + marks.status_sem7 + 
                    marks.technical_readiness + marks.knowledge_problem + 
                    marks.plan_development;
    }
    
    setStudents(newStudents);
  };

  const handleAbsentToggle = (index) => {
    const newStudents = [...students];
    newStudents[index].isAbsent = !newStudents[index].isAbsent;
    
    if (newStudents[index].isAbsent) {
      // Set all marks to 0 and total to "Absent"
      newStudents[index].marks = {
        literature_survey: 0,
        status_sem7: 0,
        technical_readiness: 0,
        knowledge_problem: 0,
        plan_development: 0,
        total: "Absent"
      };
    } else {
      // Reset total to calculated value
      const marks = newStudents[index].marks;
      marks.total = marks.literature_survey + marks.status_sem7 + 
                    marks.technical_readiness + marks.knowledge_problem + 
                    marks.plan_development;
    }
    
    setStudents(newStudents);
  };

  const handleInternshipChange = (index, field, value) => {
    const newInternships = [...internships];
    newInternships[index][field] = value;
    setInternships(newInternships);
  };

  const addInternshipRow = (enrollmentNo) => {
    const student = students.find(s => s.enrollment_no === enrollmentNo);
    setInternships([...internships, {
      enrollment_no: enrollmentNo,
      student_name: student.name,
      company_name: "",
      mode: "Development Internship",
      start_date: "",
      end_date: "",
      profile_task: "",
      remark: "Pending"
    }]);
  };

  const handleVerifyStudent = async () => {
    if (!memberEnrollment.trim()) {
      setVerificationError("Please enter an enrollment number");
      return;
    }

    if (!selectedGroup) {
      setVerificationError("Please select a group first");
      return;
    }

    try {
      setVerifyingStudent(true);
      setVerificationError("");
      setVerifiedStudent(null);
      const token = localStorage.getItem("mentor_token");

      console.log("Verifying student:", memberEnrollment.trim(), "in group:", selectedGroup);

      // Call API to verify student
      const response = await apiRequest(
        `/api/mentors/zeroth-review/verify-member`,
        "POST",
        {
          enrollment_no: memberEnrollment.trim(),
          group_id: selectedGroup
        },
        token
      );

      console.log("Verification response:", response);

      if (response?.success || response?.data?.success) {
        const student = response?.data?.student || response?.student;
        const inSameGroup = response?.data?.inSameGroup || response?.inSameGroup;
        const alreadyAdded = response?.data?.alreadyAdded || response?.alreadyAdded;

        if (alreadyAdded) {
          setVerificationError("This student is already added to the internship details");
          return;
        }

        if (!inSameGroup) {
          setVerificationError("Student not found in this group. Please verify the enrollment number.");
          return;
        }

        setVerifiedStudent({
          enrollment_no: student.enrollment_no || student.enrollement_no,
          name: student.name_of_student || student.student_name,
          guide_name: student.guide_name,
          group_id: student.group_id
        });
      } else {
        setVerificationError(response?.message || "Failed to verify student");
      }
    } catch (error) {
      console.error("Error verifying student:", error);
      setVerificationError(
        error?.response?.data?.message || error?.message || "Failed to verify student. Please try again."
      );
    } finally {
      setVerifyingStudent(false);
    }
  };

  const handleAddMissingMember = async () => {
    if (!verifiedStudent) {
      setMessage({ type: "error", text: "Please verify the student first" });
      return;
    }

    try {
      setAddingMember(true);
      const token = localStorage.getItem("mentor_token");

      console.log("Adding member with enrollment:", memberEnrollment.trim(), "to group:", selectedGroup);

      // Call API to add missing member
      const response = await apiRequest(
        `/api/mentors/zeroth-review/add-member`,
        "POST",
        {
          enrollment_no: memberEnrollment.trim(),
          group_id: selectedGroup
        },
        token
      );

      console.log("Add member response:", response);

      if (response?.success || response?.data?.success) {
        const newMember = response?.data?.student || response?.student;
        const wasMoved = response?.data?.moved || response?.moved;
        const previousGroup = response?.data?.previousGroup || response?.previousGroup;
        
        console.log("New member data:", newMember);
        
        if (newMember) {
          const enrollmentNo = newMember.enrollment_no || newMember.enrollement_no;
          const studentName = newMember.name_of_student || newMember.student_name || 'Unknown';
          
          // If student was moved from another group, refetch the entire group data
          if (wasMoved) {
            setMessage({ 
              type: "success", 
              text: `${studentName} moved from group ${previousGroup} to this group successfully` 
            });
            setAddMemberModalOpen(false);
            setMemberEnrollment("");
            setVerifiedStudent(null);
            setVerificationError("");
            
            // Refetch group details to show the moved student
            await fetchGroupDetails(selectedGroup);
            return;
          }
          
          // Add to internships array
          setInternships(prev => {
            const updated = [...prev, {
              enrollment_no: enrollmentNo,
              student_name: studentName,
              company_name: "",
              mode: "Development Internship",
              start_date: "",
              end_date: "",
              profile_task: "",
              remark: "Pending"
            }];
            console.log("Updated internships:", updated);
            return updated;
          });

          // Add to students array for marks
          setStudents(prev => {
            const updated = [...prev, {
              enrollment_no: enrollmentNo,
              name: studentName,
              isAbsent: false,
              marks: {
                literature_survey: 0,
                status_sem7: 0,
                technical_readiness: 0,
                knowledge_problem: 0,
                plan_development: 0,
                total: 0
              }
            }];
            console.log("Updated students:", updated);
            return updated;
          });

          setMessage({ type: "success", text: `Successfully added ${studentName}` });
          setAddMemberModalOpen(false);
          setMemberEnrollment("");
          setVerifiedStudent(null);
          setVerificationError("");
          
          // Scroll to show the new member
          setTimeout(() => {
            const internshipSection = document.querySelector('[class*="Internship Details"]');
            if (internshipSection) {
              internshipSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 300);
        }
      } else {
        setMessage({ type: "error", text: response?.message || "Failed to add member" });
      }
    } catch (error) {
      console.error("Error adding member:", error);
      console.error("Error details:", error?.response);
      setMessage({ 
        type: "error", 
        text: error?.response?.data?.message || error?.message || "Failed to add missing member. Please check if the student exists in the same group." 
      });
    } finally {
      setAddingMember(false);
    }
  };

  const handleViewLetter = async (enrollmentNo, studentName) => {
    try {
      const token = localStorage.getItem("mentor_token");
      
      console.log("Fetching letter for enrollment:", enrollmentNo);
      
      // Fetch the internship details for the student to get the file_url
      const response = await apiRequest(
        `/api/students/internship/enrollment/${enrollmentNo}`,
        "GET",
        null,
        token
      );
      
      console.log("API Response:", response);
      console.log("Response data:", response?.data);
      
      // Extract file_url from the internship object
      const internship = response?.data?.internship || response?.internship;
      const fileUrl = internship?.file_url;
      
      console.log("file_url:", fileUrl);
      
      if (fileUrl && fileUrl !== 'pending_upload') {
        let pdfUrl = fileUrl;
        
        console.log("PDF URL found:", pdfUrl);
        
        // Ensure the URL is properly formatted for PDF viewing
        if (pdfUrl && !pdfUrl.includes('#')) {
          pdfUrl += '#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH';
        }
        
        console.log("Final PDF URL:", pdfUrl);
        
        setSelectedPdfUrl(pdfUrl);
        setSelectedStudentName(studentName);
        setPdfViewerOpen(true);
        
        // Hide loading overlay after a short delay
        setTimeout(() => {
          const loadingEl = document.querySelector('.pdf-loading');
          if (loadingEl) {
            loadingEl.style.opacity = '0';
            loadingEl.style.pointerEvents = 'none';
          }
        }, 1500);
      } else {
        console.error("No file_url in response or file is pending upload");
        setMessage({ 
          type: "error", 
          text: fileUrl === 'pending_upload' ? "Student hasn't uploaded internship letter yet" : "No internship letter found for this student"
        });
      }
    } catch (error) {
      console.error("Error fetching PDF:", error);
      console.error("Error details:", error.response || error);
      setMessage({ 
        type: "error", 
        text: "Failed to load internship letter. " + (error?.message || "Please try again.")
      });
    }
  };

  const handleDownloadLetter = async (enrollmentNo, studentName) => {
    try {
      const token = localStorage.getItem("mentor_token");
      
      const response = await fetch(`/api/students/internship/download/${enrollmentNo}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${studentName}_internship_letter.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      setMessage({ 
        type: "error", 
        text: "Failed to download internship letter" 
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!selectedGroup) {
      setMessage({ type: "error", text: "Please select a group" });
      return;
    }

    if (!formData.expert_name || !formData.expert_phone || !formData.expert_email) {
      setMessage({ type: "error", text: "Please fill in Industry Expert details" });
      return;
    }

    try {
      setSubmitLoading(true);
      const token = localStorage.getItem("mentor_token");

      // Prepare data for submission - aligned with backend expectations
      const submissionData = {
        group_id: selectedGroup,
        project_id: formData.project_id,
        class: formData.class,
        date: formData.date,
        guide_name: formData.guide_name,
        scope_redefinition: formData.scope_redefinition,
        expert_name: formData.expert_name,
        expert_phone: formData.expert_phone,
        expert_email: formData.expert_email,
        students: students.map(student => ({
          enrollment_no: student.enrollment_no,
          name: student.name,
          marks: {
            literature_survey: student.marks.literature_survey,
            status_sem7: student.marks.status_sem7,
            technical_readiness: student.marks.technical_readiness,
            knowledge_problem: student.marks.knowledge_problem,
            plan_development: student.marks.plan_development,
            total: student.marks.total
          }
        })),
        internships: internships.map(internship => ({
          enrollment_no: internship.enrollment_no,
          student_name: internship.student_name,
          company_name: internship.company_name,
          mode: internship.mode,
          start_date: internship.start_date,
          end_date: internship.end_date,
          profile_task: internship.profile_task,
          remark: internship.remark
        }))
      };

      const response = await apiRequest(
        "/api/mentors/zeroth-review/submit",
        "POST",
        submissionData,
        token
      );

      if (response.success) {
        setMessage({ 
          type: "success", 
          text: "Zeroth Review submitted successfully!" 
        });
        
        // Reset form after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage({ 
          type: "error", 
          text: response.message || "Failed to submit" 
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to submit zeroth review" 
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading && !groups.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <MentorHeader name={mentor?.name} id={mentor?.id} />
      
      <div className="flex flex-1 flex-col lg:flex-row mt-[80px]">
        <MentorSidebar />
        
        <main className="flex-1 p-4 sm:p-6 lg:ml-72 mb-20 lg:mb-0">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="mb-6 sm:mb-8 bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Final Year Zeroth Review</h1>
                  <p className="text-gray-600">MIT School of Engineering - PBL Assessment</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Academic Year 2024-25</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>Initial Assessment Phase</span>
                </div>
              </div>
            </div>

            {/* Message Alert */}
            {message.text && (
              <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg flex items-start sm:items-center gap-3 border ${
                message.type === "success" 
                  ? "bg-green-50 border-green-200 text-green-800" 
                  : "bg-red-50 border-red-200 text-red-800"
              }`}>
                <div className={`p-1 rounded ${
                  message.type === "success" ? "bg-green-100" : "bg-red-100"
                }`}>
                  {message.type === "success" ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
                <p className="font-medium">{message.text}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Industry Expert Details */}
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Industry Expert Details</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expert Name *
                    </label>
                    <input
                      type="text"
                      name="expert_name"
                      value={formData.expert_name}
                      onChange={handleInputChange}
                      placeholder="Enter expert name"
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="expert_phone"
                      value={formData.expert_phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="expert_email"
                      value={formData.expert_email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm sm:text-base"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Group Selection */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Select Project Group</h2>
                </div>
                <select
                  value={selectedGroup}
                  onChange={handleGroupChange}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 text-sm sm:text-base"
                  required
                >
                  <option value="" disabled>Select a Project Group</option>
                  {groups.map((groupId) => (
                    <option key={groupId} value={groupId}>{groupId}</option>
                  ))}
                </select>
              </div>

              {selectedGroup && groupDetails && (
                <>
                  {/* Basic Information */}
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <FileText className="w-5 h-5 text-green-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Project ID</label>
                        <input
                          type="text"
                          name="project_id"
                          value={formData.project_id}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm sm:text-base"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                        <input
                          type="text"
                          name="class"
                          value={formData.class}
                          onChange={handleInputChange}
                          placeholder="e.g., BE-A (Optional)"
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white text-sm sm:text-base"
                          style={{ colorScheme: 'light' }}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Faculty Guide</label>
                        <input
                          type="text"
                          name="guide_name"
                          value={formData.guide_name}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm sm:text-base"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  {/* Student Evaluation */}
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <BookOpen className="w-5 h-5 text-orange-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Student Evaluation (25 Marks)</h2>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 mb-6 border border-orange-200">
                      <p className="text-sm text-gray-700">
                        <strong>Criteria:</strong> 1. Literature survey (5) | 2. Status of Sem-7 Paper (5) | 3. Technical Readiness (5) | 
                        4. In-depth knowledge of Problem & Solution (5) | 5. Plan of Development (5)
                      </p>
                    </div>
                    
                    {/* Individual Student Cards */}
                    <div className="space-y-4 sm:space-y-6">
                      {students.map((student, index) => (
                        <div key={index} className={`student-card bg-gradient-to-br ${student.isAbsent ? 'from-red-50 to-red-100 border-red-200' : 'from-orange-50 to-amber-50 border-orange-200'} rounded-xl p-4 sm:p-6 border animate-fadeIn`} style={{animationDelay: `${index * 0.1}s`}}>
                          {/* Student Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${student.isAbsent ? 'bg-red-500' : 'bg-orange-500'} rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 transition-all duration-300 ${student.isAbsent ? 'animate-pulse-custom' : ''}`}>
                                {student.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{student.name}</h3>
                                <p className="text-xs sm:text-sm text-gray-600">{student.enrollment_no}</p>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                              {/* Absent Toggle */}
                              <div className="flex items-center gap-2 sm:gap-3">
                                <label className="text-xs sm:text-sm font-medium text-gray-700">Absent:</label>
                                <button
                                  type="button"
                                  onClick={() => handleAbsentToggle(index)}
                                  className={`toggle-switch relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg ${
                                    student.isAbsent 
                                      ? 'bg-gradient-to-r from-red-500 to-red-600 focus:ring-red-500 shadow-red-200' 
                                      : 'bg-gradient-to-r from-gray-200 to-gray-300 focus:ring-gray-400 shadow-gray-200'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-lg ${
                                      student.isAbsent ? 'translate-x-6 shadow-red-300' : 'translate-x-1 shadow-gray-300'
                                    }`}
                                  />
                                </button>
                              </div>
                              {/* Total Marks */}
                              <div className="text-center sm:text-right mt-2 sm:mt-0">
                                <div className={`text-2xl sm:text-3xl font-bold transition-all duration-300 ${
                                  student.isAbsent ? 'text-red-600 animate-shake' : 'text-orange-600'
                                }`}>
                                  {student.marks.total}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                                  {student.isAbsent ? 'Absent' : 'Total Marks'}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Marks Grid - Hidden when absent */}
                          {!student.isAbsent && (
                            <div className="marks-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 animate-slideDown">
                              {[
                                { key: 'literature_survey', label: 'Literature Survey' },
                                { key: 'status_sem7', label: 'Sem-7 Paper Status' },
                                { key: 'technical_readiness', label: 'Technical Readiness' },
                                { key: 'knowledge_problem', label: 'Problem Knowledge' },
                                { key: 'plan_development', label: 'Development Plan' }
                              ].map((criterion, criterionIndex) => (
                                <div key={criterion.key} className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 animate-fadeIn" style={{animationDelay: `${criterionIndex * 0.1}s`}}>
                                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                                    {criterion.label}
                                  </label>
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <input
                                      type="range"
                                      min="0"
                                      max="5"
                                      value={student.marks[criterion.key]}
                                      onChange={(e) => handleStudentMarksChange(index, criterion.key, e.target.value)}
                                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                    />
                                    <div className="w-12 h-10 sm:w-14 sm:h-12 marks-display rounded-xl flex items-center justify-center font-bold text-orange-800 flex-shrink-0 shadow-sm transition-all duration-200 hover:shadow-md border border-orange-200 text-sm sm:text-base">
                                      {student.marks[criterion.key]}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 sm:mt-2 font-medium">Max: 5</div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Absent Message */}
                          {student.isAbsent && (
                            <div className="absent-overlay bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4 sm:p-8 text-center shadow-lg">
                              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-pulse-custom">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                              <div className="text-red-700 font-bold text-lg sm:text-xl mb-2">Student Marked as Absent</div>
                              <p className="text-red-600 text-xs sm:text-sm font-medium">All evaluation criteria are disabled. Toggle above to mark as present.</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Internship Details */}
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg">
                          <Building className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">Internship Details</h2>
                          <p className="text-sm text-gray-600">Professional experience and training records</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAddMemberModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                      >
                        <UserPlus className="w-4 h-4" />
                        Add Missing Member
                      </button>
                    </div>
                    
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-teal-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg flex-shrink-0">
                          <Briefcase className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-teal-800 mb-1">Internship Requirements</h4>
                          <p className="text-xs sm:text-sm text-teal-700 leading-relaxed">
                            Submit internship approval letter for 3-6 months duration. Focus on development roles, 
                            PPO opportunities, and reputable company profiles for optimal career growth.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                          <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                              <th className="px-3 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 min-w-[120px] sm:min-w-[140px]">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-500" />
                                  Student
                                </div>
                              </th>
                              <th className="px-3 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 min-w-[180px] sm:min-w-[200px]">
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-gray-500" />
                                  Company & Location
                                </div>
                              </th>
                              <th className="px-3 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 min-w-[130px] sm:min-w-[150px]">
                                <div className="flex items-center gap-2">
                                  <Briefcase className="w-4 h-4 text-gray-500" />
                                  Type
                                </div>
                              </th>
                              <th className="px-3 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 min-w-[110px] sm:min-w-[130px]">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  Start Date
                                </div>
                              </th>
                              <th className="px-3 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 min-w-[110px] sm:min-w-[130px]">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  End Date
                                </div>
                              </th>
                              <th className="px-3 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 min-w-[160px] sm:min-w-[180px]">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-gray-500" />
                                  Role & Responsibilities
                                </div>
                              </th>
                              <th className="px-3 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 min-w-[100px] sm:min-w-[120px]">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-gray-500" />
                                  Status
                                </div>
                              </th>
                              <th className="px-3 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 min-w-[80px] sm:min-w-[100px]">
                                <div className="flex items-center justify-center gap-2">
                                  <Eye className="w-4 h-4 text-gray-500" />
                                  Letter
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {internships.map((internship, index) => (
                              <tr key={index} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 group">
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 shadow-lg">
                                      {internship.student_name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-medium text-gray-900 text-sm truncate">
                                        {internship.student_name}
                                      </div>
                                      <div className="text-xs text-teal-600 truncate font-medium">
                                        {internship.enrollment_no}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={internship.company_name}
                                      onChange={(e) => handleInternshipChange(index, 'company_name', e.target.value)}
                                      placeholder="Company Name & Location"
                                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 hover:border-teal-300 bg-gradient-to-r from-white to-gray-50 shadow-sm hover:shadow-md"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                      <Building2 className="w-4 h-4 text-gray-400" />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="relative">
                                    <select
                                      value={internship.mode}
                                      onChange={(e) => handleInternshipChange(index, 'mode', e.target.value)}
                                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 hover:border-teal-300 bg-gradient-to-r from-white to-gray-50 shadow-sm hover:shadow-md appearance-none cursor-pointer"
                                    >
                                      <option value="Development Internship">Development</option>
                                      <option value="Research Internship">Research</option>
                                      <option value="Industrial Training">Industrial</option>
                                      <option value="Virtual Internship">Virtual</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="relative">
                                    <input
                                      type="date"
                                      value={internship.start_date}
                                      onChange={(e) => handleInternshipChange(index, 'start_date', e.target.value)}
                                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-900 bg-gradient-to-r from-white to-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 hover:border-teal-300 shadow-sm hover:shadow-md"
                                      style={{ colorScheme: 'light' }}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                      <Calendar className="w-4 h-4 text-gray-400" />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="relative">
                                    <input
                                      type="date"
                                      value={internship.end_date}
                                      onChange={(e) => handleInternshipChange(index, 'end_date', e.target.value)}
                                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-900 bg-gradient-to-r from-white to-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 hover:border-teal-300 shadow-sm hover:shadow-md"
                                      style={{ colorScheme: 'light' }}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                      <Calendar className="w-4 h-4 text-gray-400" />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="relative group">
                                    <input
                                      type="text"
                                      value={internship.profile_task}
                                      onChange={(e) => handleInternshipChange(index, 'profile_task', e.target.value)}
                                      placeholder="Role & key responsibilities"
                                      className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 hover:border-teal-300 bg-gradient-to-r from-white to-gray-50 shadow-sm hover:shadow-md"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedRole(internship.profile_task);
                                        setSelectedStudentName(internship.student_name);
                                        setRoleModalOpen(true);
                                      }}
                                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-teal-600 transition-colors"
                                      title="View in full screen"
                                    >
                                      <Maximize2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="relative">
                                    <select
                                      value={internship.remark}
                                      onChange={(e) => handleInternshipChange(index, 'remark', e.target.value)}
                                      className={`w-full px-4 py-3 border-2 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-teal-500 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer ${
                                        internship.remark === 'Approved' 
                                          ? 'text-green-700 bg-gradient-to-r from-green-50 to-green-100 border-green-300 hover:border-green-400' :
                                        internship.remark === 'Not Approved' 
                                          ? 'text-red-700 bg-gradient-to-r from-red-50 to-red-100 border-red-300 hover:border-red-400' :
                                          'text-amber-700 bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300 hover:border-amber-400'
                                      }`}
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Approved">Approved</option>
                                      <option value="Not Approved">Not Approved</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                      <svg className="w-4 h-4 text-current opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleViewLetter(internship.enrollment_no, internship.student_name)}
                                    className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 group-hover:shadow-2xl"
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span className="hidden sm:inline">View</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Scope Redefinition */}
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <FileText className="w-5 h-5 text-violet-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Scope Redefinition / Modules Suggested for Phase-2</h2>
                    </div>
                    <textarea
                      name="scope_redefinition"
                      value={formData.scope_redefinition}
                      onChange={handleInputChange}
                      rows="5"
                      placeholder="Enter scope redefinition and module suggestions..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-900 resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-center pt-4">
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className={`flex items-center gap-3 px-8 py-3 rounded-lg font-semibold text-lg shadow-sm transition-colors ${
                        submitLoading
                          ? "bg-gray-400 cursor-not-allowed text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {submitLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Submit Zeroth Review
                        </>
                      )}
                    </button>
                  </div>

                  {/* Mobile Bottom Bar */}
                  <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-700 shadow-2xl border-t border-blue-500">
                    <div className="px-6 py-4">
                      <button
                        type="submit"
                        disabled={submitLoading}
                        className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 ${
                          submitLoading
                            ? "bg-gray-400 cursor-not-allowed text-white"
                            : "bg-white text-blue-600 hover:bg-blue-50 hover:shadow-xl transform hover:scale-[1.02]"
                        }`}
                      >
                        {submitLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                            <span>Submitting Review...</span>
                          </>
                        ) : (
                          <>
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Save className="w-5 h-5 text-blue-600" />
                            </div>
                            <span>Submit Zeroth Review</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </form>
          </div>
        </main>
      </div>

      {/* Enhanced PDF Viewer Modal */}
      {pdfViewerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Enhanced Modal Header */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">Internship Letter</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-gray-600 font-medium">{selectedStudentName}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPdfViewerOpen(false)}
                  className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                >
                  <X className="w-6 h-6 text-gray-600 group-hover:text-gray-800" />
                </button>
              </div>
            </div>
            
            {/* Enhanced PDF Viewer */}
            <div className="flex-1 p-6 bg-gray-50">
              <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                {selectedPdfUrl ? (
                  <div className="w-full h-full relative">
                    {/* Primary PDF Viewer */}
                    <iframe
                      src={`${selectedPdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
                      className="w-full h-full border-0"
                      title={`${selectedStudentName} Internship Letter`}
                      onError={() => {
                        // Fallback: Try Google Docs viewer
                        const fallbackFrame = document.createElement('iframe');
                        fallbackFrame.src = `https://docs.google.com/viewer?url=${encodeURIComponent(selectedPdfUrl)}&embedded=true`;
                        fallbackFrame.className = 'w-full h-full border-0';
                        fallbackFrame.title = `${selectedStudentName} Internship Letter`;
                        const container = document.querySelector('.pdf-container');
                        if (container) {
                          container.innerHTML = '';
                          container.appendChild(fallbackFrame);
                        }
                      }}
                    />
                    
                    {/* Loading overlay */}
                    <div className="absolute inset-0 bg-white flex items-center justify-center pdf-loading">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Loading PDF...</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center p-8">
                      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                      </div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">PDF Not Available</h4>
                      <p className="text-gray-600">The internship letter could not be loaded.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Missing Member Modal */}
      {addMemberModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => !addingMember && !verifyingStudent && setAddMemberModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Add Missing Member</h2>
              </div>
              <button
                onClick={() => !addingMember && setAddMemberModalOpen(false)}
                disabled={addingMember}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800 font-medium">
                  ℹ️ This will search for the student in the PBL 2025 table with Group ID: <span className="font-bold">{selectedGroup}</span>
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enrollment Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={memberEnrollment}
                    onChange={(e) => {
                      setMemberEnrollment(e.target.value.toUpperCase());
                      setVerifiedStudent(null);
                      setVerificationError("");
                    }}
                    placeholder="e.g., MITU22BTCS0123"
                    disabled={addingMember || verifyingStudent}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed uppercase"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !verifyingStudent && !addingMember) {
                        if (!verifiedStudent) {
                          handleVerifyStudent();
                        } else {
                          handleAddMissingMember();
                        }
                      }
                    }}
                  />
                  <button
                    onClick={handleVerifyStudent}
                    disabled={verifyingStudent || addingMember || !memberEnrollment.trim()}
                    className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {verifyingStudent ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      "Check"
                    )}
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">
                    • Enter enrollment number and click "Check" to verify
                  </p>
                  <p className="text-xs text-gray-500">
                    • Student must exist in pbl_2025 table with the same group_id
                  </p>
                </div>
              </div>

              {/* Verification Error */}
              {verificationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{verificationError}</p>
                  </div>
                </div>
              )}

              {/* Verified Student Details */}
              {verifiedStudent && (
                <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-xl animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {verifiedStudent.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h3 className="text-sm font-bold text-green-800">Student Verified ✓</h3>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-gray-900">{verifiedStudent.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-gray-600">{verifiedStudent.enrollment_no}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-gray-600">Group: {verifiedStudent.group_id}</span>
                        </div>
                        {verifiedStudent.guide_name && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-gray-600">Guide: {verifiedStudent.guide_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setAddMemberModalOpen(false);
                    setMemberEnrollment("");
                    setVerifiedStudent(null);
                    setVerificationError("");
                  }}
                  disabled={addingMember || verifyingStudent}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMissingMember}
                  disabled={addingMember || verifyingStudent || !verifiedStudent}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addingMember ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Add Member
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Details Modal */}
      {roleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setRoleModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Role & Responsibilities</h2>
                  <p className="text-sm text-white/90">{selectedStudentName}</p>
                </div>
              </div>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200">
                <textarea
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    // Update the internship data
                    const internshipIndex = internships.findIndex(i => i.student_name === selectedStudentName);
                    if (internshipIndex !== -1) {
                      handleInternshipChange(internshipIndex, 'profile_task', e.target.value);
                    }
                  }}
                  placeholder="Enter role and key responsibilities..."
                  className="w-full h-64 px-4 py-3 border-2 border-teal-200 rounded-xl text-gray-800 font-medium text-base resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-white/50"
                />
              </div>
              
              {/* Action buttons */}
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedRole || '');
                    setMessage({ type: "success", text: "Copied to clipboard!" });
                    setTimeout(() => setMessage({ type: "", text: "" }), 2000);
                  }}
                  className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 font-medium text-sm transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => setRoleModalOpen(false)}
                  className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 font-semibold text-sm transition-all shadow-lg hover:shadow-xl"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZerothReview;