// Firebase initialization (modular SDK v9+)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection } from 'firebase/firestore';

// Use environment variables (create a local `.env` from `.env.example`)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Primary collection references used across the app
const usersCollection = collection(db, 'users');
const classesCollection = collection(db, 'classes');
const attendanceSessionsCollection = collection(db, 'attendanceSessions');
const attendanceRecordsCollection = collection(db, 'attendanceRecords');

export {
  app,
  auth,
  db,
  usersCollection,
  classesCollection,
  attendanceSessionsCollection,
  attendanceRecordsCollection,
};

// Notes:
// - This file centralizes Firebase initialization so other services can import
//   `auth`, `db` and collection references.
// - For Firestore operations prefer imported collection references or helper
//   services in `src/services/*` to keep rules and access patterns consistent.
