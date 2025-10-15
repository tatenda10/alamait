import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoomBrowser from './pages/rooms/RoomBrowser';
import RoomDetails from './pages/rooms/RoomDetails';
import ApplicationForm from './pages/ApplicationForm';
import StudentLogin from './pages/StudentLogin';
import StudentDashboard from './pages/StudentDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<RoomBrowser />} />
          <Route path="/rooms/:id" element={<RoomDetails />} />
          <Route path="/apply" element={<ApplicationForm />} />
          <Route path="/login" element={<StudentLogin />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;