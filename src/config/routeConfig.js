import AdminDashboard from '../pages/AdminDashboard';
import InstructorDashboard from '../pages/InstructorDashboard';
import LeaderDashboard from '../pages/LeaderDashboard';

// Centralized route configuration with role-based access control
export const HOME_REDIRECT = {
  admin: '/admin',
  instructor: '/instructor',
  leader: '/leader',
};

export const ROUTES = [
  {
    path: '/admin',
    element: AdminDashboard,
    allowedRoles: ['admin'],
    label: 'Admin Dashboard',
    icon: 'users',
    showInNav: true,
    breadcrumbLabel: 'Admin',
    pageTitle: 'Admin — YSA GP Attendance',
    permissions: ['view', 'create', 'edit', 'delete', 'print'],
  },
  {
    path: '/instructor',
    element: InstructorDashboard,
    allowedRoles: ['instructor'],
    label: 'Instructor Dashboard',
    icon: 'chalkboard-teacher',
    showInNav: true,
    breadcrumbLabel: 'Instructor',
    pageTitle: 'Instructor — YSA GP Attendance',
    permissions: ['view', 'mark', 'print'],
  },
  {
    path: '/leader',
    element: LeaderDashboard,
    allowedRoles: ['leader'],
    label: 'Leader Dashboard',
    icon: 'eye',
    showInNav: true,
    breadcrumbLabel: 'Leader',
    pageTitle: 'Leader — YSA GP Attendance',
    permissions: ['view', 'print'],
  },
];

export default { ROUTES, HOME_REDIRECT };
