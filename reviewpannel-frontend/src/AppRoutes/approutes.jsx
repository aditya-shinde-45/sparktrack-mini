import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Common Pages
import Home from '../Pages/Common/Home';
import Login from '../Pages/Common/Login';
import AboutPBL from '../Pages/Common/AboutPBL';
import ProblemStatementSih from '../Pages/Common/ProblemStatement';
import Download from '../Pages/Common/Download';
import Students from '../Pages/Common/students';
import LoadingTest from '../Pages/Common/LoadingTest';

// External Pages removed

// Admin Pages
import AdminDashboard from '../Pages/Admin/AdminDashboard';
import SubAdminDashboard from '../Pages/Admin/SubAdminDashboard';
import AssignExternal from '../Pages/Admin/AssignExternal';
import ViewMarks from '../Pages/Admin/ViewMarks';
import AddGroup from '../Pages/Admin/addGroup';
import Mentor from '../Pages/Admin/mentors';
import EvaluationFormBuilder from '../Pages/Admin/EvaluationFormBuilder';
import AdminNocDetails from '../Pages/Admin/AdminNocDetails';

// Admin Tools (parent and children)
import AdminToolTabs from '../Components/Admin/admintools';
import AdminDataManager from '../Components/Admin/AdminDataManager';
import DeadlineAdmin from '../Components/Admin/deadline';
import AnnouncementAdmin from '../Components/Admin/announcement';
import AdminPost from '../Components/Admin/post';
import RolePermissionManager from '../Components/Admin/role';
import ClassLead from '../Components/Admin/assignclasslead';
import ProjectDetailsTool from '../Components/Admin/ProjectDetailsTool';
// You can import other admin tool subpages here

// Students page
import StudentLogin from '../Pages/students/login';
import StudentDashboard from '../Pages/students/studentDashboard';
import ProblemStatement from '../Pages/students/problemstatement';
import StudentProfile from '../Pages/students/StudentProfile';
import TrackerSheet from '../Pages/students/trackersheet';
import NocPage from '../Pages/students/noc';
import Documentation from '../Pages/students/documentation';
import Tools from '../Pages/students/tools';
import CreateGroup from '../Pages/students/creategroup';
import InternshipDetails from '../Pages/students/InternshipDetails';

// Mentor Pages
import MentorDashboard from '../Pages/Mentor/MentorDashboard';
import ZerothReview from '../Pages/Mentor/ZerothReview';
import MentorEvaluation from '../Pages/Mentor/MentorEvaluation';
import MentorGroups from '../Pages/Mentor/MentorGroups';
import MentorSettings from '../Pages/Mentor/MentorSettings';
import MentorNoc from '../Pages/Mentor/MentorNoc';
import MentorTrackerSheet from '../Pages/Mentor/MentorTrackerSheet';

// Industry Mentor Pages
import IndustryMentorDashboard from '../Pages/Mentor/IndustryMentorDashboard';
import IndustryMentorGroups from '../Pages/Mentor/IndustryMentorGroups';


const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/pblmanagementfacultydashboardlogin" element={<Login />} />
      <Route path="/problem-statementsih" element={<ProblemStatementSih />} />
      <Route path="/aboutpbl" element={<AboutPBL />} />
      <Route path="/download" element={<Download />} />
      <Route path="/students" element={<Students />} />
      <Route path="/studentlogin" element={<StudentLogin />} />
      <Route path="/studentdashboard" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/problem-statement" element={
        <ProtectedRoute allowedRoles={['student']}>
          <ProblemStatement />
        </ProtectedRoute>
      } />
      <Route path="/student/student-profile" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentProfile />
        </ProtectedRoute>
      } />
      <Route path="/student/InternshipDetails" element={
        <ProtectedRoute allowedRoles={['student']}>
          <InternshipDetails />
        </ProtectedRoute>
      } />
      <Route path="/tracker-sheet" element={
        <ProtectedRoute allowedRoles={['student']}>
          <TrackerSheet />
        </ProtectedRoute>
      } />
      <Route path="/student/tracker-sheet" element={
        <ProtectedRoute allowedRoles={['student']}>
          <TrackerSheet />
        </ProtectedRoute>
      } />
      <Route path="/noc" element={
        <ProtectedRoute allowedRoles={['student']}>
          <NocPage />
        </ProtectedRoute>
      } />
      <Route path="/student/noc" element={
        <ProtectedRoute allowedRoles={['student']}>
          <NocPage />
        </ProtectedRoute>
      } />
      <Route path="/documentation" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Documentation />
        </ProtectedRoute>
      } />
      <Route path="/student/documentation" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Documentation />
        </ProtectedRoute>
      } />
      <Route path="/studenttools" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Tools />
        </ProtectedRoute>
      } />
      <Route path="/create-group" element={
        <ProtectedRoute allowedRoles={['student']}>
          <CreateGroup />
        </ProtectedRoute>
      } />
      <Route path="/loading-test" element={<LoadingTest />} />

      {/* Mentor Routes */}
      <Route path="/mentor/dashboard" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <MentorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/mentor/groups" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <MentorGroups />
        </ProtectedRoute>
      } />
      <Route path="/mentor/noc" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <MentorNoc />
        </ProtectedRoute>
      } />
      <Route path="/mentor/tracker-sheet" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <MentorTrackerSheet />
        </ProtectedRoute>
      } />
      <Route path="/mentor/groups/:groupId" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <MentorGroups />
        </ProtectedRoute>
      } />
      <Route path="/mentor/reviews" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <MentorEvaluation />
        </ProtectedRoute>
      } />
      <Route path="/mentor/evaluation" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <MentorEvaluation />
        </ProtectedRoute>
      } />
      <Route path="/mentor/zeroth-review" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <ZerothReview />
        </ProtectedRoute>
      } />
      <Route path="/mentor/schedule" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <MentorTrackerSheet />
        </ProtectedRoute>
      } />
      <Route path="/mentor/settings" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <MentorSettings />
        </ProtectedRoute>
      } />

      {/* Industry Mentor Routes */}
      <Route path="/industry-mentor/dashboard" element={
        <ProtectedRoute allowedRoles={['industry_mentor']}>
          <IndustryMentorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/industry-mentor/groups" element={
        <ProtectedRoute allowedRoles={['industry_mentor']}>
          <IndustryMentorGroups />
        </ProtectedRoute>
      } />
      <Route path="/industry-mentor/groups/:groupId" element={
        <ProtectedRoute allowedRoles={['industry_mentor']}>
          <IndustryMentorGroups />
        </ProtectedRoute>
      } />
      <Route path="/industry-mentor/evaluation" element={
        <ProtectedRoute allowedRoles={['industry_mentor']}>
          <MentorEvaluation />
        </ProtectedRoute>
      } />
      <Route path="/industry-mentor/reviews" element={
        <ProtectedRoute allowedRoles={['industry_mentor']}>
          <MentorEvaluation />
        </ProtectedRoute>
      } />


      {/* External Routes removed */}

      {/* Admin Routes */}
      <Route path="/admin-dashboard" element={
        <ProtectedRoute allowedRoles={['Admin']} adminScope="main">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/sub-admin-dashboard" element={
        <ProtectedRoute allowedRoles={['Admin']} adminScope="sub">
          <SubAdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/assign-external" element={
        <ProtectedRoute allowedRoles={['Admin']} adminScope="main">
          <AssignExternal />
        </ProtectedRoute>
      } />
      <Route path="/view-marks" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <ViewMarks />
        </ProtectedRoute>
      } />
      <Route path="/add-group" element={
        <ProtectedRoute allowedRoles={['Admin']} adminScope="main">
          <AddGroup />
        </ProtectedRoute>
      } />
      <Route path="/mentor" element={
        <ProtectedRoute allowedRoles={['Admin']} adminScope="main">
          <Mentor />
        </ProtectedRoute>
      } />
      <Route path="/admin-evaluation-forms" element={
        <ProtectedRoute allowedRoles={['Admin']} adminScope="main">
          <EvaluationFormBuilder />
        </ProtectedRoute>
      } />
      <Route path="/admin/noc" element={
        <ProtectedRoute allowedRoles={['Admin']} adminScope="main">
          <AdminNocDetails />
        </ProtectedRoute>
      } />

      {/* Nested Admin Tools Routes */}
      <Route path="/admintools" element={
        <ProtectedRoute allowedRoles={['Admin']} adminScope="main">
          <AdminToolTabs />
        </ProtectedRoute>
      }>
        {/* Nested routes under /admintools */}
        <Route path="data-management" element={<AdminDataManager />} />
        <Route path="project-details" element={<ProjectDetailsTool />} />
        <Route path="role-permission" element={<RolePermissionManager />} />
        <Route path="deadline" element={<DeadlineAdmin />} />
        <Route path="announcement" element={<AnnouncementAdmin />} />
        <Route path="post" element={<AdminPost />} />
        <Route path="classlead" element={<ClassLead />} />
      </Route>

      {/* Reviewer Admin Routes removed */}
    </Routes>
  );
};

export default AppRoutes;
