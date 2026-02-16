import UserManagementWidget from '../components/widgets/Admin/UserManagementWidget';
import ClassManagerWidget from '../components/widgets/Admin/ClassManagerWidget';
import AnalyticsOverviewWidget from '../components/widgets/Admin/AnalyticsOverviewWidget';
import AdminAttendanceWidget from '../components/widgets/Admin/AdminAttendanceWidget';

import AssignedClassesWidget from '../components/widgets/Instructor/AssignedClassesWidget';
import AttendanceQuickMarkWidget from '../components/widgets/Instructor/AttendanceQuickMarkWidget';
import MotivationWidget from '../components/widgets/Instructor/MotivationWidget';
import NextClassReminderWidget from '../components/widgets/Instructor/NextClassReminderWidget';
import InstructorAttendanceWidget from '../components/widgets/Instructor/InstructorAttendanceWidget';

import ReportsOverviewWidget from '../components/widgets/Leader/ReportsOverviewWidget';
import ReadOnlyStatsWidget from '../components/widgets/Leader/ReadOnlyStatsWidget';
import LeaderAttendanceWidget from '../components/widgets/Leader/LeaderAttendanceWidget';

// Dashboard widget configuration per role.
// Each entry is a small descriptor: component, title, permissions (array)
export const DASHBOARD_WIDGETS = {
  admin: [
    { component: AdminAttendanceWidget, title: 'Attendance Manager', permissions: ['mark', 'edit'] },
    { component: UserManagementWidget, title: 'User Management', permissions: ['manage'] },
    { component: ClassManagerWidget, title: 'Class Manager', permissions: ['manage'] },
    { component: AnalyticsOverviewWidget, title: 'Analytics Overview', permissions: ['view', 'print'] },
  ],

  instructor: [
    { component: InstructorAttendanceWidget, title: 'Attendance Marking', permissions: ['mark'] },
    { component: AssignedClassesWidget, title: 'Assigned Classes', permissions: ['view'] },
    { component: MotivationWidget, title: 'Motivation', permissions: ['view'] },
    { component: NextClassReminderWidget, title: 'Next Class Reminder', permissions: ['view'] },
  ],

  leader: [
    { component: LeaderAttendanceWidget, title: 'Attendance Records', permissions: ['view'] },
    { component: ReportsOverviewWidget, title: 'Reports Overview', permissions: ['view', 'print'] },
    { component: ReadOnlyStatsWidget, title: 'Read-only Stats', permissions: ['view'] },
  ],
};

export default DASHBOARD_WIDGETS;
