import React from 'react';
import { useAuth } from '../../context/AuthContext';
import DASHBOARD_WIDGETS from '../../config/dashboardConfig';
import { roleHasPermission } from '../../utils/rolePermissions';

export default function DashboardLayout({ role: roleProp } = {}) {
  const { role: roleFromCtx } = useAuth();
  const role = roleProp || roleFromCtx;

  const widgets = (DASHBOARD_WIDGETS[role] || []).filter((w) =>
    // widget permissions requirement: all permissions must be satisfied by role
    (w.permissions || []).every((p) => roleHasPermission(role, p))
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map((w, idx) => {
          const Component = w.component;
          return (
            <div key={idx} className="p-4 bg-white rounded shadow">
              <div className="mb-2 text-sm font-medium text-gray-700">{w.title}</div>
              <Component />
            </div>
          );
        })}
      </div>
    </div>
  );
}
