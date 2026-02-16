import React from 'react';
import Layout from '../components/layout/Layout';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function AdminDashboard() {
  return (
    <Layout>
      <DashboardLayout role="admin" />
    </Layout>
  );
}
