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
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const SESSIONS = 'attendanceSessions';

export async function createSession({ classId, sessionDate, notes = '', createdBy }) {
  const col = collection(db, SESSIONS);
  const payload = { classId, sessionDate, notes, createdBy, createdAt: serverTimestamp() };
  const ref = await addDoc(col, payload);
  return { id: ref.id, ...payload };
}

export async function getSessionById(id) {
  const ref = doc(db, SESSIONS, id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateSession(id, data) {
  const ref = doc(db, SESSIONS, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteSession(id) {
  const ref = doc(db, SESSIONS, id);
  await deleteDoc(ref);
}

export async function listSessionsByClass(classId) {
  const q = query(collection(db, SESSIONS), where('classId', '==', classId), orderBy('sessionDate', 'desc'));
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function subscribeSessionsByClass(classId, onChange) {
  const q = query(collection(db, SESSIONS), where('classId', '==', classId), orderBy('sessionDate', 'desc'));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })), snapshot);
  });
}

export function subscribeUpcomingSessions(limit = 10, onChange) {
  const q = query(collection(db, SESSIONS), orderBy('sessionDate', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    onChange(items.slice(0, limit), snapshot);
  });
}

export default {
  createSession,
  getSessionById,
  updateSession,
  deleteSession,
  listSessionsByClass,
  subscribeSessionsByClass,
  subscribeUpcomingSessions,
};
