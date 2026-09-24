import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD_dfDpul3I8fF-B9V-4OyFLNCXS7BVgTQ",
  authDomain: "study-plane-fca88.firebaseapp.com",
  projectId: "study-plane-fca88",
  storageBucket: "study-plane-fca88.firebasestorage.app",
  messagingSenderId: "155509626634",
  appId: "1:155509626634:web:1b7ad4964531a09f5accf3",
  measurementId: "G-5F03ZPJXW6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
