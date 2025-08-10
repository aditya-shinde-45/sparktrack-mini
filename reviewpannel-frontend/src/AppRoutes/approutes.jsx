// AppRoutes.js

import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Login from '../Pages/Common/Login'; // ✅ Correct import name
import ExternalHome from '../Pages/External/ExternalHome'; // ✅ Correct import name
import AdminDashboard from '../Pages/Admin/AdminDashboard'; // ✅ Correct import name
import AssignExternal from '../Pages/Admin/AssignExternal'; // ✅ Correct import name
import ViewMarks from '../Pages/Admin/ViewMarks'; 

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/external-home" element={<ExternalHome />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/assign-external" element={<AssignExternal />} />
        <Route path="/view-marks" element={<ViewMarks />} />
    
        {/* Add more routes as needed */}
    </Routes> // ✅ Closing Routes tag
  );
};

export default AppRoutes;
