import React from 'react';
import Layout from '../components/layout/Layout';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function LeaderDashboard() {
  return (
    <Layout>
      <DashboardLayout role="leader" />
    </Layout>
  );
}
