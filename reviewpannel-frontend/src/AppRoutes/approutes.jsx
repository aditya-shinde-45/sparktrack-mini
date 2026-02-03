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

// Admin Tools (parent and children)
import AdminToolTabs from '../Components/Admin/admintools';
import EditGroup from '../Components/Admin/editGroup';
import DeadlineAdmin from '../Components/Admin/deadline';
import AnnouncementAdmin from '../Components/Admin/announcement';
import AdminPost from '../Components/Admin/post';
import RolePermissionManager from '../Components/Admin/role';
import ClassLead from '../Components/Admin/assignclasslead';
// You can import other admin tool subpages here

// Students page
import StudentLogin from '../Pages/students/login';
import StudentDashboard from '../Pages/students/studentDashboard';
import ProblemStatement from '../Pages/students/problemstatement';
import StudentProfile from '../Pages/students/StudentProfile';
import TeamWorkspace from '../Pages/students/teamworkspace';
import ProjectPlanning from '../Pages/students/projectplanning';
import ProjectReview from '../Pages/students/projectreview';
import Documentation from '../Pages/students/documentation';
import Tools from '../Pages/students/tools';
import CreateGroup from '../Pages/students/creategroup';
import InternshipDetails from '../Pages/students/InternshipDetails';

// Mentor Pages
import MentorDashboard from '../Pages/Mentor/MentorDashboard';
import ZerothReview from '../Pages/Mentor/ZerothReview';
import MentorEvaluation from '../Pages/Mentor/MentorEvaluation';


const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/problem-statementsih" element={<ProblemStatementSih />} />
      <Route path="/aboutpbl" element={<AboutPBL />} />
      <Route path="/download" element={<Download />} />
      <Route path="/students" element={<Students />} />
      <Route path="/studentlogin" element={<StudentLogin />} />
      <Route path="/studentdashboard" element={<StudentDashboard />} />
      <Route path="/student/problem-statement" element={<ProblemStatement />} />
      <Route path="/student/student-profile" element={<StudentProfile />} />
      <Route path="/student/InternshipDetails" element={<InternshipDetails />} />
      <Route path="/team-workspace" element={<TeamWorkspace />} />
      <Route path="/project-planning" element={<ProjectPlanning />} />
      <Route path="/project-review" element={<ProjectReview />} />
      <Route path="/documentation" element={<Documentation />} />
      <Route path="/studenttools" element={<Tools />} />
      <Route path="/create-group" element={<CreateGroup />} />
      <Route path="/loading-test" element={<LoadingTest />} />

      {/* Mentor Routes */}
      <Route path="/mentor/dashboard" element={<MentorDashboard />} />
      <Route path="/mentor/groups" element={<MentorDashboard />} />
      <Route path="/mentor/reviews" element={<MentorDashboard />} />
      <Route path="/mentor/evaluation" element={<MentorEvaluation />} />
      <Route path="/mentor/zeroth-review" element={<ZerothReview />} />
      <Route path="/mentor/schedule" element={<MentorDashboard />} />
      <Route path="/mentor/settings" element={<MentorDashboard />} />


      {/* External Routes removed */}

      {/* Admin Routes */}
      <Route path="/admin-dashboard" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/sub-admin-dashboard" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <SubAdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/assign-external" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <AssignExternal />
        </ProtectedRoute>
      } />
      <Route path="/view-marks" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <ViewMarks />
        </ProtectedRoute>
      } />
      <Route path="/add-group" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <AddGroup />
        </ProtectedRoute>
      } />
      <Route path="/mentor" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <Mentor />
        </ProtectedRoute>
      } />
      <Route path="/admin-evaluation-forms" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <EvaluationFormBuilder />
        </ProtectedRoute>
      } />

      {/* Nested Admin Tools Routes */}
      <Route path="/admintools" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <AdminToolTabs />
        </ProtectedRoute>
      }>
        {/* Nested routes under /admintools */}
        <Route path="edit-group" element={<EditGroup />} />
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
