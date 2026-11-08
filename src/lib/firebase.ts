import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getFunctions, type Functions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBIwYEuZrP65pFmotNvNBRvFOMRcV75YhE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'rihnofit.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'rihnofit',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'rihnofit.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '895663396417',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:895663396417:web:2542d06613886fb02058c0',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-XP2QVE98MC',
};

export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);
export const functions: Functions = getFunctions(firebaseApp);

let analytics: Analytics | null = null;
export async function getFirebaseAnalytics() {
  if (typeof window === 'undefined') return null;
  if (analytics) return analytics;
  if (await isSupported()) {
    analytics = getAnalytics(firebaseApp);
  }
  return analytics;
}

void getFirebaseAnalytics();

export { firebaseConfig };
