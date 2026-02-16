import AttendanceManagerWidget from '../Shared/AttendanceManagerWidget';

// Wrapper for Instructor — access only to assigned classes
export default function InstructorAttendanceWidget() {
  return <AttendanceManagerWidget assignedClassesOnly={true} readOnly={false} />;
}
