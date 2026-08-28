import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import config from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use the dedicated databaseId if provided
const firestoreDatabaseId = (config as any).firestoreDatabaseId;
export const db = firestoreDatabaseId && firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.coursework.me.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.coursework.students.readonly');

export const googleClientId =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  config.oAuthClientId ||
  '193033896599-c0m3c0k2ul5g343bo1dsiq0j23oc132r.apps.googleusercontent.com';

export default app;
