import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../config/routeConfig';

export default function Navigation() {
  const { role } = useAuth();

  const visibleRoutes = ROUTES.filter((r) => r.showInNav && r.allowedRoles.includes(role));

  return (
    <nav className="space-y-1">
      {visibleRoutes.map((r) => (
        <Link
          key={r.path}
          to={r.path}
          className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100"
        >
          <span className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">
            {/* icon placeholder */}
            {r.icon ? r.icon[0].toUpperCase() : '•'}
          </span>
          <span className="text-sm text-gray-800">{r.label}</span>
        </Link>
      ))}

      <Link className="block px-3 py-2 rounded hover:bg-gray-100 text-sm text-gray-600" to="/login">
        Login
      </Link>
    </nav>
  );
}
