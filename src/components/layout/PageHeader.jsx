import React from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../../config/routeConfig';

function findRoute(pathname) {
  let match = ROUTES.find((r) => r.path === pathname);
  if (match) return match;
  match = ROUTES.find((r) => pathname.startsWith(r.path));
  return match || null;
}

export default function PageHeader() {
  const { pathname } = useLocation();
  const route = findRoute(pathname);

  const title = (route && route.pageTitle) || 'YSA GP Attendance';

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
    </div>
  );
}
