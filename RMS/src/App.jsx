import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from "./pages/Dashboard";
import Houses from "./pages/Houses";
import Bookings from "./pages/Bookings";
import BookingForm from "./components/BookingForm";
import Invoices from "./pages/Invoices";
import Home from './components/Home';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  // Check authentication and user role
  const isAuthenticated = localStorage.getItem('token') !== null;
  const userRole = localStorage.getItem('userRole');

  if (!isAuthenticated) {
    // Redirect to home page if not authenticated
    return <Navigate to="/" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // Redirect to landlord dashboard if role doesn't match
    return <Navigate to="/landlord-dashboard" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
      

        {/* Landlord Protected Routes */}
        <Route
          path="/houses"
          element={
            <ProtectedRoute requiredRole="landlord">
              <Houses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute requiredRole="landlord">
              <Bookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-form"
          element={
            <ProtectedRoute requiredRole="landlord">
              <BookingForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute requiredRole="landlord">
              <Invoices />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;