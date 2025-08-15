import React from 'react';
import { Routes, Route } from 'react-router-dom';

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

// Test Pages

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/problem-statementsih" element={<ProblemStatementSih />} />
      <Route path="/aboutpbl" element={<AboutPBL />} />
      <Route path="/download" element={<Download />} />
      
      {/* External Routes */}
      <Route path="/external-home" element={<ExternalHome />} />
      
      {/* Admin Routes */}
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/assign-external" element={<AssignExternal />} />
      <Route path="/view-marks" element={<ViewMarks />} />
      
      {/* Test Routes */}
    </Routes>
  );
};

export default AppRoutes;
