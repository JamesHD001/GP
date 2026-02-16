import React from 'react';
import Navigation from './Navigation';

export default function Sidebar() {
  return (
    <aside className="w-56 bg-gray-50 border-r p-4 min-h-[calc(100vh-64px)]">
      <div className="mb-4 text-xs text-gray-500">Navigation</div>
      <Navigation />
    </aside>
  );
}
