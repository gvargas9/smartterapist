import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ role }) => {
  const { user, loading } = useAuth();
  
  // In production mode, check authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If role is specified and doesn't match, redirect to appropriate dashboard
  if (role && user.role !== role) {
    if (user.role === 'client') {
      return <Navigate to="/client/dashboard" replace />;
    } else if (user.role === 'therapist') {
      return <Navigate to="/therapist/dashboard" replace />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      // Unknown role, log out for safety
      return <Navigate to="/login" replace />;
    }
  }
  
  // If everything is fine, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
