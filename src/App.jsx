import React from 'react';
import { Routes, Route, HashRouter, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import routeConfig, { ROUTES, HOME_REDIRECT } from './config/routeConfig';

function HomeRedirect() {
  const { role, loading } = useAuth();
  if (loading) return null;
  const target = HOME_REDIRECT[role] || '/login';
  return <Navigate to={target} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {ROUTES.map((r) => {
            const Element = r.element;
            return (
              <Route
                key={r.path}
                path={r.path}
                element={
                  <ProtectedRoute allowedRoles={r.allowedRoles}>
                    <Element />
                  </ProtectedRoute>
                }
              />
            );
          })}

          <Route path="/" element={<HomeRedirect />} />

          <Route path="*" element={<div className="p-8">Page not found</div>} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
