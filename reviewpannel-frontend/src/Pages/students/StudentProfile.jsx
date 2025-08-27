import React, { useEffect, useState } from 'react';
import Sidebar from '../../Components/Student/sidebar';
import Header from '../../Components/Student/Header';
import UserProfile from '../../Components/Student/userprofile';
import { apiRequest } from '../../api.js';

const StudentProfile = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem('student_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const profileRes = await apiRequest('/api/studentlogin/profile', 'GET', null, token);
        if (profileRes && profileRes.profile) {
          setStudent(profileRes.profile);
        }
      } catch (err) {
        console.error('Error fetching student data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-red-600">Please log in to view your profile.</div>
      </div>
    );
  }

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <Header
        name={student?.name_of_students || student?.name || 'Student'}
        id={student?.enrollment_no || '----'}
        welcomeText="Manage your profile and showcase your skills"
      />
      
      {/* Main content with proper spacing for fixed headers */}
      <div className="flex flex-1 flex-col lg:flex-row pt-[140px] sm:pt-[150px]">
        <Sidebar />
        <main className="flex-1 p-3 md:p-6 bg-white lg:ml-72 space-y-6">
          <UserProfile enrollmentNo={student.enrollment_no} />
        </main>
      </div>
    </div>
  );
};

export default StudentProfile;