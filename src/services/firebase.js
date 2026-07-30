import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDGvoZQKpW4XMbdDjYzz7GDRPFI_kDINZM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "family-tree-474d9.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "family-tree-474d9",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "family-tree-474d9.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "958812806914",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:958812806914:web:3a8799cc8b83bf27a5ac1b"
};

// Initialize Firebase instance
const app = initializeApp(firebaseConfig);
// Initialize Firebase Auth
const auth = getAuth(app);
// Initialize Cloud Firestore
const db = getFirestore(app);
// Initialize Cloud Storage
const storage = getStorage(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
  } else if (err.code == 'unimplemented') {
    console.warn('The current browser does not support all of the features required to enable persistence');
  }
});

export { app, auth, db, storage };
