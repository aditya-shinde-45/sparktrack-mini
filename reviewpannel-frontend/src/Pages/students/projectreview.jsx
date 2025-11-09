import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Student/Header";
import Sidebar from "../../Components/Student/sidebar";
import { 
  Award,
  Star,
  TrendingUp,
  FileText,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Download,
  Eye,
  ChevronRight,
  BarChart3
} from "lucide-react";
import { apiRequest } from "../../api";

const ProjectReview = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeReview, setActiveReview] = useState("review3");
  
  // Review data
  const [reviews, setReviews] = useState({
    review1: null,
    review2: null,
    review3: null
  });

  useEffect(() => {
    fetchStudentData();
    fetchReviewData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem("student_token");
      const profileRes = await apiRequest("/api/student-auth/profile", "GET", null, token);
      const profileData = profileRes?.data?.profile || profileRes?.profile;
      setStudent(profileData);
    } catch (error) {
      console.error("Failed to fetch student data:", error);
    }
  };

  const fetchReviewData = async () => {
    try {
      const token = localStorage.getItem("student_token");
      const enrollment = localStorage.getItem("enrollment_no");
      
      // Fetch Review 1 marks (use API or dummy data)
      let review1Data = null;
      let review2Data = null;

      try {
        const review1Res = await apiRequest(
          `/api/announcements/announcement/review1marks?enrollement_no=${enrollment}`,
          "GET",
          null,
          token
        );
        review1Data = review1Res?.data?.review1Marks || review1Res?.review1Marks;
      } catch (err) {
        console.log("Review 1 API not available, using dummy data");
      }

      try {
        const review2Res = await apiRequest(
          `/api/announcements/announcement/review2marks?enrollement_no=${enrollment}`,
          "GET",
          null,
          token
        );
        review2Data = review2Res?.data?.review2Marks || review2Res?.review2Marks;
      } catch (err) {
        console.log("Review 2 API not available, using dummy data");
      }

      // Set dummy data for reviews - Updated marks out of 50
      setReviews({
        review1: review1Data || {
          total: 49,
          maxMarks: 50,
          feedback: "Excellent understanding of the problem statement and initial project design. The team has demonstrated strong planning and coordination skills. Technical feasibility analysis is comprehensive. Minor improvements suggested in documentation format. Overall outstanding performance in the first review!",
          evaluatedBy: "Dr. Priya Kulkarni (Internal Guide)",
          evaluatedDate: "2024-08-11",
          components: [
            { name: "Problem Understanding", marks: 10, maxMarks: 10 },
            { name: "Project Planning", marks: 10, maxMarks: 10 },
            { name: "Team Coordination", marks: 9, maxMarks: 10 },
            { name: "Initial Design", marks: 10, maxMarks: 10 },
            { name: "Presentation Skills", marks: 10, maxMarks: 10 }
          ]
        },
        review2: review2Data || {
          total: 39,
          maxMarks: 50,
          feedback: "Good progress in development phase. The technical implementation shows solid coding practices. However, there is room for improvement in code documentation and test coverage. The team needs to focus more on edge case handling and error management. Keep working on optimizing the database queries. Overall satisfactory progress!",
          evaluatedBy: "Dr. Rajesh Sharma (Internal Guide)",
          evaluatedDate: "2024-11-06",
          components: [
            { name: "Technical Implementation", marks: 8, maxMarks: 12 },
            { name: "Code Quality", marks: 8, maxMarks: 10 },
            { name: "Testing Coverage", marks: 6, maxMarks: 8 },
            { name: "Documentation", marks: 7, maxMarks: 10 },
            { name: "Progress & Commitment", marks: 10, maxMarks: 10 }
          ]
        },
        review3: null // Pending - scheduled for 10-11-2025
      });

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch review data:", error);
      setLoading(false);
    }
  };

  const getReviewStatus = (review) => {
    if (!review) return { status: "pending", color: "gray", text: "Not Evaluated" };
    const percentage = (review.total / review.maxMarks) * 100;
    
    if (percentage >= 80) return { status: "excellent", color: "green", text: "Excellent" };
    if (percentage >= 60) return { status: "good", color: "blue", text: "Good" };
    if (percentage >= 40) return { status: "average", color: "amber", text: "Average" };
    return { status: "needs_improvement", color: "red", text: "Needs Improvement" };
  };

  const calculateOverallProgress = () => {
    const completedReviews = Object.values(reviews).filter(r => r !== null).length;
    return Math.round((completedReviews / 3) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const currentReview = reviews[activeReview];
  const reviewStatus = getReviewStatus(currentReview);

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <Header
        name={student?.name_of_students || student?.name || "Student"}
        id={student?.enrollment_no || "----"}
      />
      
      <div className="flex flex-1 flex-col lg:flex-row mt-[70px] md:mt-[70px]">
        <Sidebar />
        
        <main className="flex-1 lg:ml-72 bg-gray-50">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold">
                        Project Reviews
                      </h1>
                      <p className="text-purple-100 text-sm mt-1">
                        {student?.group_id || "Team"} - Review Feedback & Marks
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <TrendingUp className="w-5 h-5" />
                  <div>
                    <p className="text-xs text-purple-100">Overall Progress</p>
                    <p className="text-lg font-bold">{calculateOverallProgress()}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Review Cards Overview */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["review1", "review2", "review3"].map((reviewKey, index) => {
                const review = reviews[reviewKey];
                const status = getReviewStatus(review);
                const isActive = activeReview === reviewKey;
                
                return (
                  <div
                    key={reviewKey}
                    onClick={() => setActiveReview(reviewKey)}
                    className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-lg ${
                      isActive ? "border-purple-500 shadow-md" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        Review {index + 1}
                      </h3>
                      {review ? (
                        <div className={`p-2 rounded-lg bg-${status.color}-100`}>
                          <CheckCircle className={`w-5 h-5 text-${status.color}-600`} />
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-gray-100">
                          <AlertCircle className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {review ? (
                      <>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-3xl font-bold text-purple-700">
                            {review.total}
                          </span>
                          <span className="text-gray-600">/ {review.maxMarks || 100}</span>
                        </div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold bg-${status.color}-100 text-${status.color}-700`}>
                          {status.text}
                        </span>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-gray-400 mb-2">--</p>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                          Not Evaluated
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Review Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {currentReview ? (
              <div className="space-y-6">
                {/* Review Header */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {activeReview === "review1" ? "Review 1" : activeReview === "review2" ? "Review 2" : "Review 3"} Details
                    </h2>
                    <span className={`px-4 py-2 rounded-lg text-sm font-bold bg-${reviewStatus.color}-100 text-${reviewStatus.color}-700`}>
                      {reviewStatus.text}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Award className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Marks</p>
                        <p className="text-xl font-bold text-gray-900">
                          {currentReview.total}/{currentReview.maxMarks || 100}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Evaluated By</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {currentReview.evaluatedBy || "Internal Faculty"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {currentReview.evaluatedDate ? 
                            new Date(currentReview.evaluatedDate).toLocaleDateString() : 
                            "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Score Percentage</span>
                      <span className="text-sm font-bold text-purple-700">
                        {Math.round((currentReview.total / (currentReview.maxMarks || 100)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all bg-gradient-to-r from-purple-600 to-blue-600`}
                        style={{ width: `${(currentReview.total / (currentReview.maxMarks || 100)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Component-wise Breakdown */}
                {currentReview.components && currentReview.components.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      Component-wise Marks
                    </h3>
                    
                    <div className="space-y-4">
                      {currentReview.components.map((component, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">{component.name}</span>
                            <span className="text-sm font-bold text-purple-700">
                              {component.marks}/{component.maxMarks}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                (component.marks / component.maxMarks) >= 0.8 ? "bg-green-500" :
                                (component.marks / component.maxMarks) >= 0.6 ? "bg-blue-500" :
                                (component.marks / component.maxMarks) >= 0.4 ? "bg-amber-500" :
                                "bg-red-500"
                              }`}
                              style={{ width: `${(component.marks / component.maxMarks) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback Section */}
                {currentReview.feedback && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      Evaluator Feedback
                    </h3>
                    <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-r-lg">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                        {currentReview.feedback}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Review Scheduled</h3>
                <p className="text-gray-600 mb-4">
                  This review is scheduled for evaluation. Please check back after the review date.
                </p>
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-purple-50 border-2 border-purple-200 rounded-lg mb-6">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div className="text-left">
                    <p className="text-xs text-gray-600">Review Date</p>
                    <p className="text-lg font-bold text-purple-700">10th November 2025</p>
                  </div>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
                >
                  <TrendingUp className="w-5 h-5" />
                  Refresh Status
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectReview;
