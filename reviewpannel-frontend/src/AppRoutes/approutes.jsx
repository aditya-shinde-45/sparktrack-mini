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
import TokenDebugger from '../Pages/Common/TokenDebugger';

// External Pages
import ExternalHome from '../Pages/External/ExternalHome';
import MentorSelection from '../Pages/External/MentorSelection';
import RegisterExternals from '../Pages/External/RegisterExternals';

// Admin Pages
import AdminDashboard from '../Pages/Admin/AdminDashboard';
import AssignExternal from '../Pages/Admin/AssignExternal';
import ViewMarks from '../Pages/Admin/ViewMarks';
import AddGroup from '../Pages/Admin/addGroup';
import Mentor from '../Pages/Admin/mentors';

// Admin Tools (parent and children)
import AdminToolTabs from '../Components/Admin/admintools';
import EditGroup from '../Components/Admin/editGroup';
import DeadlineAdmin from '../Components/Admin/deadline';
import AnnouncementAdmin from '../Components/Admin/announcement';
import AdminPost from '../Components/Admin/post';
// You can import other admin tool subpages here

// Students page
import StudentLogin from '../Pages/students/login';
import StudentDashboard from '../Pages/students/studentDashboard';
import ProblemStatement from '../Pages/students/problemstatement';
import StudentProfile from '../Pages/students/StudentProfile';

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
      <Route path="/debug-token" element={<TokenDebugger />} />


      {/* External/Mentor Routes */}
      <Route path="/mentor-selection" element={
        <ProtectedRoute allowedRoles={['External']}>
          <MentorSelection />
        </ProtectedRoute>
      } />
      <Route path="/register-externals" element={
        <ProtectedRoute allowedRoles={['Mentor']}>
          <RegisterExternals />
        </ProtectedRoute>
      } />
      <Route path="/external-home" element={
        <ProtectedRoute allowedRoles={['External', 'Mentor']}>
          <ExternalHome />
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin-dashboard" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <AdminDashboard />
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

      {/* Nested Admin Tools Routes */}
      <Route path="/admintools" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <AdminToolTabs />
        </ProtectedRoute>
      }>
        {/* Nested routes under /admintools */}
        <Route path="edit-group" element={<EditGroup />} />
        {/* Add other admin tool subpages here, e.g.: */}
        {/* <Route path="role-permission" element={<RolePermission />} /> */}
        <Route path="deadline" element={<DeadlineAdmin />} />
        <Route path="announcement" element={<AnnouncementAdmin />} />
        <Route path="post" element={<AdminPost />} />
        {/* <Route path="classlead" element={<ClassLead />} /> */}
      </Route>
    </Routes>
  );
};

export default AppRoutes;
