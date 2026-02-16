import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const USERS = 'users';

export async function createUserProfile(uid, profile) {
  const ref = doc(db, USERS, uid);
  const payload = { uid, ...profile, createdAt: serverTimestamp() };
  await setDoc(ref, payload);
  return payload;
}

export async function getUserProfile(uid) {
  const ref = doc(db, USERS, uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(uid, data) {
  const ref = doc(db, USERS, uid);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteUserProfile(uid) {
  const ref = doc(db, USERS, uid);
  await deleteDoc(ref);
}

export async function listUsers() {
  const col = collection(db, USERS);
  const snaps = await getDocs(col);
  return snaps.docs.map((d) => d.data());
}

export function subscribeUsers(onChange) {
  const col = collection(db, USERS);
  return onSnapshot(col, (snapshot) => {
    const data = snapshot.docs.map((d) => d.data());
    onChange(data, snapshot);
  });
}

export function subscribeUser(uid, onChange) {
  const ref = doc(db, USERS, uid);
  return onSnapshot(ref, (snapshot) => {
    onChange(snapshot.exists() ? snapshot.data() : null, snapshot);
  });
}

export function subscribeUsersByRole(role, onChange) {
  const q = query(collection(db, USERS), where('role', '==', role));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => d.data()), snapshot);
  });
}

// Note: Do NOT rely solely on client-side role checks. Enforce permissions
// with Firebase Security Rules for production.

export default {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  listUsers,
  subscribeUsers,
  subscribeUser,
  subscribeUsersByRole,
};
