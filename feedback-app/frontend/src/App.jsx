import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FeedbackForm from './components/FeedbackForm';
import Dashboard from './components/Dashboard';
import DashboardForms from './components/DashboardForms';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-800">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/forms" />} />
          <Route path="/f/:uuid" element={<FeedbackForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/forms" element={<DashboardForms />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
