import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC2b2agsYrCUEGsHBrFSUarHHA7nKYX0iM",
  authDomain: "lexiblitz-3d98a.firebaseapp.com",
  projectId: "lexiblitz-3d98a",
  storageBucket: "lexiblitz-3d98a.firebasestorage.app",
  messagingSenderId: "157034018430",
  appId: "1:157034018430:web:53e972ef8e3376350d8a2f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
