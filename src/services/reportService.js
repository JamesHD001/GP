/**
 * Report Service (Refactored for Analytics Architecture)
 * 
 * Responsibilities:
 * - Fetch pre-aggregated analytics documents (no aggregation loops)
 * - Fetch session/record data for report detailed view
 * - Compose plain data objects for export utilities
 * - Handle permission checking for report access
 * - Save report snapshots for audit trail
 * 
 * Architecture:
 * - Analytics: Server-side aggregated (Cloud Functions)
 * - UI: Calls reportService for data
 * - Utilities: Receive plain JS objects (printExport.js)
 * - Snapshots: Stored under reports/historySnapshots for audit
 */

import { db } from './firebaseConfig';
import { collection, doc, getDoc, getDocs, query, where, Timestamp, addDoc } from 'firebase/firestore';

/**
 * Fetch global monthly report data.
 * Admin/Leader only (enforced at UI level via permission checks).
 * 
 * @param {string} month - YYYY-MM format
 * @returns {Promise<Object>} Report data ready for printExport utilities
 */
export async function generateGlobalMonthlyReport(month) {
  try {
    // Fetch pre-aggregated analytics document
    const analyticsRef = doc(db, `analytics/monthly/${month}`);
    const analyticsSnap = await getDoc(analyticsRef);

    if (!analyticsSnap.exists()) {
      console.warn(`Analytics document for month ${month} does not exist`);
      return buildEmptyReport('YSA GP - All Classes', 'Leadership', month);
    }

    const analytics = analyticsSnap.data();

    // Fetch session details for detailed view (optional, for UI display)
    const sessions = await fetchSessionsByMonth(month);

    // Compose report object
    const reportData = {
      className: 'YSA GP - All Classes',
      instructorName: 'Leadership',
      month: new Date(
        ...(() => {
          const [y, m] = month.split('-').map(Number);
          return [y, m - 1];
        })()
      ).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      
      // From analytics (pre-aggregated)
      totalClasses: analytics.totalClasses || 0,
      totalMembers: analytics.populationStats?.ysaTotal || 0,
      totalNonMembers: analytics.populationStats?.ysaNonMembers || 0,
      byuPathwayIndicator: `${analytics.populationStats?.byuPathwayCount || 0} enrolled`,
      totalPresent: analytics.attendanceTotals?.present || 0,
      totalAbsent: analytics.attendanceTotals?.absent || 0,
      totalLate: analytics.attendanceTotals?.late || 0,
      totalExcused: analytics.attendanceTotals?.excused || 0,
      
      // Session details for detailed view
      sessions: sessions.map((s) => ({
        sessionId: s.id,
        sessionDate: s.sessionDate?.toDate?.()?.toISOString()?.split('T')[0] || (s.sessionDate || ''),
        className: s.className || 'Unknown Class',
        records: [], // Optional: fetch individual records if needed for detailed view
      })),
      
      // Metadata
      analyticsSnapshot: analytics,
      generatedAt: new Date().toISOString(),
    };

    return reportData;
  } catch (error) {
    console.error('Error generating global monthly report:', error);
    throw error;
  }
}

/**
 * Fetch class-specific monthly report data.
 * Admin/Instructor can access their assigned classes (enforced at UI level).
 * 
 * @param {string} classId - Class ID
 * @param {string} month - YYYY-MM format
 * @returns {Promise<Object>} Report data ready for printExport utilities
 */
export async function generateClassMonthlyReport(classId, month) {
  try {
    // Fetch class details
    const classRef = doc(db, 'classes', classId);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) {
      throw new Error(`Class ${classId} not found`);
    }

    const classData = classSnap.data();

    // Fetch class breakdown from analytics
    const classBreakdownRef = doc(db, `analytics/monthly/${month}/classBreakdown/${classId}`);
    const classBreakdownSnap = await getDoc(classBreakdownRef);

    let classBreakdown = {};
    if (classBreakdownSnap.exists()) {
      classBreakdown = classBreakdownSnap.data();
    }

    // Fetch session details for detailed view
    const sessions = await fetchSessionsByClassAndMonth(classId, month);

    // Compose report object
    const reportData = {
      className: classData.name || 'Unknown Class',
      instructorName: classData.instructorName || 'Unknown',
      month: new Date(
        ...(() => {
          const [y, m] = month.split('-').map(Number);
          return [y, m - 1];
        })()
      ).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      
      // From class breakdown analytics (if exists)
      totalClasses: classBreakdown.sessionsHeld || sessions.length || 0,
      totalMembers: classBreakdown.populationStats?.enrolledMembers || 0,
      totalNonMembers: classBreakdown.populationStats?.enrolledNonMembers || 0,
      byuPathwayIndicator: `${classBreakdown.populationStats?.byuPathwayEnrolled || 0} enrolled`,
      totalPresent: classBreakdown.attendanceTotals?.present || 0,
      totalAbsent: classBreakdown.attendanceTotals?.absent || 0,
      totalLate: classBreakdown.attendanceTotals?.late || 0,
      totalExcused: classBreakdown.attendanceTotals?.excused || 0,
      
      // Session details for detailed view
      sessions: sessions.map((s) => ({
        sessionId: s.id,
        sessionDate: s.sessionDate?.toDate?.()?.toISOString()?.split('T')[0] || (s.sessionDate || ''),
        className: classData.name,
        records: [], // Optional: fetch individual records if needed
      })),
      
      // Metadata
      analyticsSnapshot: classBreakdown,
      generatedAt: new Date().toISOString(),
    };

    return reportData;
  } catch (error) {
    console.error('Error generating class monthly report:', error);
    throw error;
  }
}

/**
 * Fetch all sessions in a given month.
 * Helper for populating session details in reports.
 * 
 * @param {string} month - YYYY-MM format
 * @returns {Promise<Array>} Array of session documents
 */
async function fetchSessionsByMonth(month) {
  try {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const sessionsRef = collection(db, 'attendanceSessions');
    const sessionsQuery = query(
      sessionsRef,
      where('sessionDate', '>=', startTimestamp),
      where('sessionDate', '<=', endTimestamp)
    );

    const snapshot = await getDocs(sessionsQuery);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching sessions by month:', error);
    return [];
  }
}

/**
 * Fetch sessions for a specific class in a given month.
 * Helper for populating session details in class reports.
 * 
 * @param {string} classId - Class ID
 * @param {string} month - YYYY-MM format
 * @returns {Promise<Array>} Array of session documents
 */
async function fetchSessionsByClassAndMonth(classId, month) {
  try {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const sessionsRef = collection(db, 'attendanceSessions');
    const sessionsQuery = query(
      sessionsRef,
      where('classId', '==', classId),
      where('sessionDate', '>=', startTimestamp),
      where('sessionDate', '<=', endTimestamp)
    );

    const snapshot = await getDocs(sessionsQuery);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching sessions by class and month:', error);
    return [];
  }
}

/**
 * Save a report snapshot to reports/historySnapshots for audit trail.
 * Called when user exports a report.
 * 
 * @param {Object} reportData - Report object from generateGlobalMonthlyReport or generateClassMonthlyReport
 * @param {string} userId - User ID of person exporting
 * @param {string} exportFormat - 'pdf' or 'print'
 * @returns {Promise<string>} Document ID of snapshot
 */
export async function saveReportSnapshot(reportData, userId, exportFormat = 'pdf') {
  try {
    const snapshotData = {
      generatedBy: userId,
      exportFormat,
      timestamp: Timestamp.now(),
      reportData: {
        className: reportData.className,
        instructorName: reportData.instructorName,
        month: reportData.month,
        totalClasses: reportData.totalClasses,
        totalPresent: reportData.totalPresent,
        totalAbsent: reportData.totalAbsent,
        totalLate: reportData.totalLate,
        totalExcused: reportData.totalExcused,
        totalMembers: reportData.totalMembers,
        totalNonMembers: reportData.totalNonMembers,
        byuPathwayIndicator: reportData.byuPathwayIndicator,
      },
      analyticsSnapshot: reportData.analyticsSnapshot || {},
    };

    const snapshotsRef = collection(db, 'reports/historySnapshots/exports');
    const docRef = await addDoc(snapshotsRef, snapshotData);

    console.log(`Saved report snapshot: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error saving report snapshot:', error);
    throw error;
  }
}

/**
 * Build empty report object (for months with no data).
 * 
 * @private
 */
function buildEmptyReport(className, instructorName, month) {
  const [y, m] = month.split('-').map(Number);
  return {
    className,
    instructorName,
    month: new Date(y, m - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    totalClasses: 0,
    totalMembers: 0,
    totalNonMembers: 0,
    byuPathwayIndicator: '0 enrolled',
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
    totalExcused: 0,
    sessions: [],
    analyticsSnapshot: {},
    generatedAt: new Date().toISOString(),
  };
}

export default {
  generateGlobalMonthlyReport,
  generateClassMonthlyReport,
  saveReportSnapshot,
};
