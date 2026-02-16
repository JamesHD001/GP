import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const RECORDS = 'attendanceRecords';

export async function createRecord({ sessionId, participantUID, status = 'present', markedBy }) {
  const col = collection(db, RECORDS);
  const payload = { sessionId, participantUID, status, markedBy, markedAt: serverTimestamp() };
  const ref = await addDoc(col, payload);
  return { id: ref.id, ...payload };
}

export async function getRecordById(id) {
  const ref = doc(db, RECORDS, id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateRecord(id, data) {
  const ref = doc(db, RECORDS, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteRecord(id) {
  const ref = doc(db, RECORDS, id);
  await deleteDoc(ref);
}

export async function getRecordsBySession(sessionId) {
  const q = query(collection(db, RECORDS), where('sessionId', '==', sessionId));
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function subscribeRecordsBySession(sessionId, onChange) {
  const q = query(collection(db, RECORDS), where('sessionId', '==', sessionId));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })), snapshot);
  });
}

export async function markAttendance(sessionId, participantUID, status = 'present', markedBy) {
  // Try to find existing record for session+participant; update if exists else create
  const q = query(collection(db, RECORDS), where('sessionId', '==', sessionId), where('participantUID', '==', participantUID));
  const snaps = await getDocs(q);
  if (!snaps.empty) {
    const docRef = snaps.docs[0].ref;
    await updateDoc(docRef, { status, markedBy, markedAt: serverTimestamp() });
    const updatedSnap = await getDoc(docRef);
    return { id: updatedSnap.id, ...updatedSnap.data() };
  }
  return createRecord({ sessionId, participantUID, status, markedBy });
}

// Note: Client-side role checks are helpful for UX, but enforce permissions
// with Firestore Security Rules to prevent unauthorized writes.

export default {
  createRecord,
  getRecordById,
  updateRecord,
  deleteRecord,
  getRecordsBySession,
  subscribeRecordsBySession,
  markAttendance,
};
