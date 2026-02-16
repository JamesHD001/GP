import AttendanceManagerWidget from '../Shared/AttendanceManagerWidget';

// Wrapper for Leader — read-only access to all attendance data
export default function LeaderAttendanceWidget() {
  return <AttendanceManagerWidget assignedClassesOnly={false} readOnly={true} />;
}
