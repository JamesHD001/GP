import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import PageHeader from './PageHeader';
import Breadcrumb from './Breadcrumb';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <PageHeader />
          <Breadcrumb />
          {children}
        </main>
      </div>
    </div>
  );
}
