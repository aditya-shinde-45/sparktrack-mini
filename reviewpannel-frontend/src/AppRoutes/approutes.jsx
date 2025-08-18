import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Common Pages
import Home from '../Pages/Common/Home';
import Login from '../Pages/Common/Login';
import AboutPBL from '../Pages/Common/AboutPBL';
import ProblemStatementSih from '../Pages/Common/ProblemStatement';
import Download from '../Pages/Common/Download';

// External Pages
import ExternalHome from '../Pages/External/ExternalHome';

// Admin Pages
import AdminDashboard from '../Pages/Admin/AdminDashboard';
import AssignExternal from '../Pages/Admin/AssignExternal';
import ViewMarks from '../Pages/Admin/ViewMarks';
import AddGroup from '../Pages/Admin/addGroup';
import EditGroup from '../Pages/Admin/editGroup';
import Mentor from '../Pages/Admin/mentors';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/problem-statementsih" element={<ProblemStatementSih />} />
      <Route path="/aboutpbl" element={<AboutPBL />} />
      <Route path="/download" element={<Download />} />
      
      {/* External/Mentor Routes */}
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
      <Route path="/edit-group" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <EditGroup />
        </ProtectedRoute>
      } />
      <Route path="/mentor" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <Mentor />
        </ProtectedRoute>
      } />
      
      {/* Test Routes */}
    </Routes>
  );
};

export default AppRoutes;
