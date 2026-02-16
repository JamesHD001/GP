import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { currentUser, userProfile, logout, role } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl font-semibold">YSA GP Attendance</div>
          <div className="text-sm text-gray-500">Local Unit</div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-700">{userProfile?.fullName || currentUser?.email}</div>
          <div className="text-xs text-gray-500">{role}</div>
          <button
            onClick={logout}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
