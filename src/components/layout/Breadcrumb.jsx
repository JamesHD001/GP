import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../config/routeConfig';

function findRouteMatch(pathname) {
  // Exact match first
  let match = ROUTES.find((r) => r.path === pathname);
  if (match) return match;
  // Fallback: find route that is a prefix of the pathname (for potential nested routes)
  match = ROUTES.find((r) => pathname.startsWith(r.path));
  return match || null;
}

export default function Breadcrumb() {
  const { pathname } = useLocation();
  const route = findRouteMatch(pathname);

  return (
    <div className="mb-4 text-sm text-gray-600">
      <nav className="flex items-center space-x-2">
        <Link to="/" className="hover:underline text-gray-500">Home</Link>
        <span className="text-gray-400">/</span>
        {route ? (
          <>
            <Link to={route.path} className="text-gray-700 font-medium">
              {route.breadcrumbLabel || route.label}
            </Link>
            {pathname !== route.path && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-500">{pathname.replace(route.path + '/', '')}</span>
              </>
            )}
          </>
        ) : (
          <span className="text-gray-700">{pathname}</span>
        )}
      </nav>
    </div>
  );
}
