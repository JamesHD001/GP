import AttendanceManagerWidget from '../Shared/AttendanceManagerWidget';

// Wrapper for Admin — full access to all classes and sessions
export default function AdminAttendanceWidget() {
  return <AttendanceManagerWidget assignedClassesOnly={false} readOnly={false} />;
}
