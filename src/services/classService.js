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

const CLASSES = 'classes';

export async function createClass(data) {
  const col = collection(db, CLASSES);
  const payload = { ...data, createdAt: serverTimestamp() };
  const ref = await addDoc(col, payload);
  return { id: ref.id, ...payload };
}

export async function getClassById(id) {
  const ref = doc(db, CLASSES, id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateClass(id, data) {
  const ref = doc(db, CLASSES, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteClass(id) {
  const ref = doc(db, CLASSES, id);
  await deleteDoc(ref);
}

export async function listClasses() {
  const col = collection(db, CLASSES);
  const snaps = await getDocs(col);
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function subscribeClasses(onChange) {
  const col = collection(db, CLASSES);
  return onSnapshot(col, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })), snapshot);
  });
}

export function subscribeClassesForInstructor(instructorUID, onChange) {
  const q = query(collection(db, CLASSES), where('instructorUID', '==', instructorUID));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })), snapshot);
  });
}

export default {
  createClass,
  getClassById,
  updateClass,
  deleteClass,
  listClasses,
  subscribeClasses,
  subscribeClassesForInstructor,
};
