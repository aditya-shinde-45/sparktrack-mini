
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import './App.css'


import AppRoutes from './AppRoutes/approutes'; 

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;