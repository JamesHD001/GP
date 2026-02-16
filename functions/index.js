/**
 * Cloud Functions for YSA GP Attendance Analytics
 * 
 * Deploy with: firebase deploy --only functions
 * 
 * Handles server-side analytics aggregation triggered by attendanceRecords changes.
 * Updates analytics/monthly/{YYYY-MM} documents with atomic increments to avoid conflicts.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * Trigger: attendanceRecords document created
 * Action: Increment analytics/monthly/{YYYY-MM} counters
 */
exports.onAttendanceRecordCreated = functions.firestore
  .document('attendanceRecords/{recordId}')
  .onCreate(async (snap, context) => {
    const record = snap.data();
    const session = await db.collection('attendanceSessions').doc(record.sessionId).get();
    const sessionData = session.data();

    if (!sessionData) {
      console.warn(`Session ${record.sessionId} not found`);
      return;
    }

    // Extract year-month from session date
    const sessionDate = sessionData.sessionDate.toDate ? sessionData.sessionDate.toDate() : new Date(sessionData.sessionDate);
    const yearMonth = sessionDate.toISOString().slice(0, 7); // YYYY-MM

    // Path to monthly analytics document
    const analyticsPath = `analytics/monthly/${yearMonth}`;

    // Create increment data based on attendance status
    const incrementData = {
      [`attendanceTotals.${record.status}`]: admin.firestore.FieldValue.increment(1),
      totalRecordsProcessed: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Update analytics document (create if doesn't exist, increment if does)
    await db.doc(analyticsPath).set(
      {
        month: yearMonth,
        attendanceTotals: {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        },
        ...incrementData,
      },
      { merge: true }
    );

    console.log(`Updated analytics for month ${yearMonth}: ${record.status}`);
  });

/**
 * Trigger: attendanceRecords document updated
 * Action: Adjust analytics counters for status changes
 */
exports.onAttendanceRecordUpdated = functions.firestore
  .document('attendanceRecords/{recordId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only process if status changed
    if (before.status === after.status) {
      return;
    }

    const session = await db.collection('attendanceSessions').doc(after.sessionId).get();
    const sessionData = session.data();

    if (!sessionData) {
      console.warn(`Session ${after.sessionId} not found`);
      return;
    }

    // Extract year-month from session date
    const sessionDate = sessionData.sessionDate.toDate ? sessionData.sessionDate.toDate() : new Date(sessionData.sessionDate);
    const yearMonth = sessionDate.toISOString().slice(0, 7); // YYYY-MM

    const analyticsPath = `analytics/monthly/${yearMonth}`;

    // Decrement old status, increment new status
    const incrementData = {
      [`attendanceTotals.${before.status}`]: admin.firestore.FieldValue.increment(-1),
      [`attendanceTotals.${after.status}`]: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.doc(analyticsPath).update(incrementData);

    console.log(`Updated analytics for month ${yearMonth}: ${before.status} → ${after.status}`);
  });

/**
 * Trigger: attendanceRecords document deleted
 * Action: Decrement analytics counters
 */
exports.onAttendanceRecordDeleted = functions.firestore
  .document('attendanceRecords/{recordId}')
  .onDelete(async (snap, context) => {
    const record = snap.data();
    const session = await db.collection('attendanceSessions').doc(record.sessionId).get();
    const sessionData = session.data();

    if (!sessionData) {
      console.warn(`Session ${record.sessionId} not found`);
      return;
    }

    // Extract year-month from session date
    const sessionDate = sessionData.sessionDate.toDate ? sessionData.sessionDate.toDate() : new Date(sessionData.sessionDate);
    const yearMonth = sessionDate.toISOString().slice(0, 7); // YYYY-MM

    const analyticsPath = `analytics/monthly/${yearMonth}`;

    // Decrement the status counter
    const incrementData = {
      [`attendanceTotals.${record.status}`]: admin.firestore.FieldValue.increment(-1),
      totalRecordsProcessed: admin.firestore.FieldValue.increment(-1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.doc(analyticsPath).update(incrementData);

    console.log(`Updated analytics for month ${yearMonth}: deleted ${record.status}`);
  });

/**
 * Trigger: Session created/updated
 * Action: Update analytics class count for the month
 */
exports.onSessionCreatedOrUpdated = functions.firestore
  .document('attendanceSessions/{sessionId}')
  .onWrite(async (change, context) => {
    // Rebuild class count for the month
    const session = change.after.data();

    if (!session) {
      return; // Session was deleted, skip
    }

    const sessionDate = session.sessionDate.toDate ? session.sessionDate.toDate() : new Date(session.sessionDate);
    const yearMonth = sessionDate.toISOString().slice(0, 7); // YYYY-MM

    // Query all sessions for this month
    const sessionsSnapshot = await db
      .collection('attendanceSessions')
      .where('sessionDate', '>=', new Date(`${yearMonth}-01`))
      .where('sessionDate', '<', new Date(`${yearMonth === '2999-12' ? '3000-01-01' : new Date(yearMonth + '-01').toISOString().slice(0, 4) + '-' + (parseInt(yearMonth.slice(5)) === 12 ? '01' : String(parseInt(yearMonth.slice(5)) + 1).padStart(2, '0')) + '-01'}`))
      .get();

    // Simpler approach: count unique sessions by month in analytics
    const analyticsPath = `analytics/monthly/${yearMonth}`;
    const classesSet = new Set();
    sessionsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.classId) {
        classesSet.add(data.classId);
      }
    });

    const uniqueClasses = classesSet.size;

    await db.doc(analyticsPath).set(
      {
        month: yearMonth,
        totalClasses: uniqueClasses,
        attendanceTotals: {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        },
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`Updated class count for month ${yearMonth}: ${uniqueClasses} classes`);
  });

/**
 * Optional: Scheduled function to populate populationStats nightly
 * Runs at 2 AM UTC daily
 */
exports.populateMonthlyPopulationStats = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    const currentYearMonth = new Date().toISOString().slice(0, 7);

    // Query users collection for YSA stats
    const usersSnapshot = await db.collection('users').where('isYsa', '==', true).get();

    let ysaTotal = 0;
    let ysaNonMembers = 0;
    let byuPathwayCount = 0;

    usersSnapshot.docs.forEach((doc) => {
      const user = doc.data();
      ysaTotal += 1;
      if (!user.isMember) {
        ysaNonMembers += 1;
      }
      if (user.isByuPathway) {
        byuPathwayCount += 1;
      }
    });

    // Update analytics for current month
    const analyticsPath = `analytics/monthly/${currentYearMonth}`;
    await db.doc(analyticsPath).set(
      {
        month: currentYearMonth,
        populationStats: {
          ysaTotal,
          ysaNonMembers,
          byuPathwayCount,
        },
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`Populated population stats for month ${currentYearMonth}`);
  });

/**
 * Optional: Callable function to generate class breakdown analytics
 * Returns detailed breakdown by class for a given month
 */
exports.generateClassBreakdown = functions.https.onCall(async (data, context) => {
  // Verify auth
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { month, classId } = data; // month: YYYY-MM, classId: (optional, for single class)

  const analyticsRefs = classId
    ? [{ classId, path: `analytics/monthly/${month}/classBreakdown/${classId}` }]
    : [];

  if (!classId) {
    // Get all classes for the month
    const classesSnapshot = await db.collection('classes').get();
    classesSnapshot.docs.forEach((doc) => {
      analyticsRefs.push({
        classId: doc.id,
        path: `analytics/monthly/${month}/classBreakdown/${doc.id}`,
      });
    });
  }

  const breakdownData = {};

  for (const ref of analyticsRefs) {
    const docSnap = await db.doc(ref.path).get();
    if (docSnap.exists) {
      breakdownData[ref.classId] = docSnap.data();
    }
  }

  return breakdownData;
});
