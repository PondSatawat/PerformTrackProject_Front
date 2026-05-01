import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // เพิ่ม Firestore

const firebaseConfig = {
  apiKey: "AIzaSyC-TIa2l2fQn7jksSAlEYUrK03uDfaBgsQ",
  authDomain: "performtrack-3211f.firebaseapp.com",
  projectId: "performtrack-3211f",
  storageBucket: "performtrack-3211f.firebasestorage.app",
  messagingSenderId: "1023294236154",
  appId: "1:1023294236154:web:3689c3fdb3c167cfebb043"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

export { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail };
export const loginWithGoogle = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);