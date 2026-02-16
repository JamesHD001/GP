import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { currentUser, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(role)) {
    // Redirect to role-appropriate dashboard
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'instructor') return <Navigate to="/instructor" replace />;
    if (role === 'leader') return <Navigate to="/leader" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
