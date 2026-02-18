/**
 * Analytics Collection Structure Reference
 * 
 * Path: analytics/monthly/{YYYY-MM}
 * 
 * Pre-aggregated monthly analytics documents created and maintained by Cloud Functions.
 * Eliminates client-side aggregation loops; enables real-time dashboards and instant exports.
 */

/**
 * Monthly Analytics Document
 * 
 * Location: analytics/monthly/2026-02
 * 
 * {
 *   month: "2026-02",                                // YYYY-MM format, for indexing
 *   totalClasses: 4,                                 // Unique classes with sessions this month
 *   
 *   attendanceTotals: {
 *     present: 120,                                 // Total present counts across all sessions
 *     absent: 15,
 *     late: 8,
 *     excused: 5
 *   },
 *   
 *   populationStats: {
 *     ysaTotal: 45,                                 // YSA members (isYsa=true in users collection)
 *     ysaNonMembers: 12,                            // YSA non-members (isMember=false)
 *     byuPathwayCount: 5                            // BYU Pathway enrolled
 *   },
 *   
 *   classBreakdown: {
 *     "classId-1": {
 *       className: "Young Adults Class",
 *       instructorName: "John Smith",
 *       sessionsHeld: 3,
 *       attendanceTotals: {
 *         present: 45,
 *         absent: 5,
 *         late: 2,
 *         excused: 1
 *       }
 *     },
 *     "classId-2": { /* ... */ ,
 *     // ...},
 *   
 *   lastUpdated; Timestamp,                         // Server timestamp of last update
 *   totalRecordsProcessed; 148                      // For audit/debugging
 * }
 */

/**
 * Class Breakdown Sub-collection
 * 
 * Location: analytics/monthly/{YYYY-MM}/classBreakdown/{classId}
 * 
 * Detailed analytics per class per month (optional, created on-demand)
 * 
 * {
 *   classId: "classId-1",
 *   className: "Young Adults Class",
 *   instructorName: "John Smith",
 *   month: "2026-02",
 *   
 *   sessionsHeld: 3,
 *   
 *   attendanceTotals: {
 *     present: 45,
 *     absent: 5,
 *     late: 2,
 *     excused: 1
 *   },
 *   
 *   populationStats: {
 *     enrolledMembers: 20,                          // Members assigned/enrolled in this class
 *     enrolledNonMembers: 5,
 *     byuPathwayEnrolled: 2
 *   },
 *   
 *   sessionDetails: [
 *     {
 *       sessionId: "sessionId-1",
 *       sessionDate: "2026-02-01",
 *       presentCount: 20,
 *       absentCount: 2,
 *       lateCount: 1,
 *       excusedCount: 0
 *     },
 *     // ...
 *   ],
 *   
 *   lastUpdated: Timestamp
 * }
 */

/**
 * Trigger Flow:
 * 
 * 1. User marks attendance in UI
 * 2. AttendanceManagerWidget calls attendanceRecordService.markAttendance()
 * 3. Firestore creates/updates attendanceRecords/{recordId}
 * 4. Cloud Function onAttendanceRecordCreated/Updated triggers
 * 5. Function extracts session date, calculates YYYY-MM
 * 6. Function updates analytics/monthly/{YYYY-MM} with atomic increment:
 *    - attendanceTotals.{status} += 1
 *    - lastUpdated = now()
 * 7. No conflicts: atomic increments are conflict-free
 * 8. Real-time: analytics data updated within seconds
 * 
 * Queries:
 * - Monthly totals: db.doc('analytics/monthly/2026-02').get()
 * - All monthly docs: db.collection('analytics/monthly').orderBy('month').get()
 * - Class breakdown: db.doc('analytics/monthly/2026-02/classBreakdown/classId-1').get()
 */

/**
 * Advantages over client-side aggregation:
 * 
 * ✅ No loops over sessions/records in widget or service
 * ✅ Single Firestore read per report (instead of N+1 reads)
 * ✅ Atomic increments prevent concurrent update conflicts
 * ✅ Pre-aggregated data ready for instant export
 * ✅ Scales with confidence (no client-side bottleneck)
 * ✅ Historical snapshots preserve data as it was at export time
 * ✅ Easy to add analytics queries (dashboards, trends) later
 */

export const ANALYTICS_STRUCTURE = {
  MONTHLY_PATH: (yearMonth) => `analytics/monthly/${yearMonth}`,
  CLASS_BREAKDOWN_PATH: (yearMonth, classId) => `analytics/monthly/${yearMonth}/classBreakdown/${classId}`,
};
