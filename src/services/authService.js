import { auth, db } from './firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const USERS_COLLECTION = 'users';

export async function login(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  // update lastLogin on successful sign in
  try {
    const uid = credential.user.uid;
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, { lastLogin: serverTimestamp() });
  } catch (e) {
    // ignore missing profile for now; profile creation should be handled at register
  }
  return credential;
}

export async function logout() {
  return signOut(auth);
}

export async function register({ email, password, fullName, role = 'leader', assignedClasses = [] }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;
  const userDoc = {
    uid,
    fullName: fullName || '',
    email,
    role,
    assignedClasses,
    lastLogin: serverTimestamp(),
  };
  await setDoc(doc(db, USERS_COLLECTION, uid), userDoc);
  return credential;
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  return snap.exists() ? snap.data() : null;
}

export async function createOrUpdateUserProfile(uid, data) {
  const ref = doc(db, USERS_COLLECTION, uid);
  await setDoc(ref, data, { merge: true });
}

export async function refreshLastLogin(uid) {
  const ref = doc(db, USERS_COLLECTION, uid);
  await updateDoc(ref, { lastLogin: serverTimestamp() });
}

export default {
  login,
  logout,
  register,
  getUserProfile,
  createOrUpdateUserProfile,
  refreshLastLogin,
};
