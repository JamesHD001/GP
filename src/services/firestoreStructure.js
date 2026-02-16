// Firestore collection names and document templates for YSA GP Attendance System

export const COLLECTIONS = {
  USERS: 'users',
  CLASSES: 'classes',
  ATTENDANCE_SESSIONS: 'attendanceSessions',
  ATTENDANCE_RECORDS: 'attendanceRecords',
};

// Document templates / examples. Use service helpers to create these when writing.
export const TEMPLATES = {
  user: ({ uid, fullName, email, role = 'leader', assignedClasses = [] } = {}) => ({
    uid,
    fullName,
    email,
    role, // 'admin' | 'instructor' | 'leader'
    assignedClasses, // array of class ids
    lastLogin: null,
  }),

  class: ({ id, name, description = '', instructorUID = null } = {}) => ({
    id,
    name,
    description,
    instructorUID,
  }),

  attendanceSession: ({ id, classId, sessionDate, notes = '', createdBy } = {}) => ({
    id,
    classId,
    sessionDate, // timestamp or ISO string
    notes,
    createdBy,
  }),

  attendanceRecord: ({ sessionId, participantUID, status = 'present', markedBy, markedAt } = {}) => ({
    sessionId,
    participantUID,
    status, // 'present' | 'absent' | 'late' | 'excused'
    markedBy,
    markedAt, // timestamp
  }),
};

// Use these templates in services to ensure consistent document shape.
