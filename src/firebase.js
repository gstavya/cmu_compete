// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCPMDovkepEAZG8x9KI7ToA8KPpx8bVvRw",
    authDomain: "cmu-compete.firebaseapp.com",
    projectId: "cmu-compete",
    storageBucket: "cmu-compete.firebasestorage.app",
    messagingSenderId: "997370663174",
    appId: "1:997370663174:web:637caba90f47f325d98e87",
    measurementId: "G-778ECCFJQS"
  };

let app, auth, googleAuthProvider, db, storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleAuthProvider = new GoogleAuthProvider();
  
  // Configure Google provider to require account selection
  googleAuthProvider.setCustomParameters({
    hd: 'andrew.cmu.edu', // Restrict to CMU domain
    prompt: 'select_account'
  });
  
  db = getFirestore(app);
  storage = getStorage(app);
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

export { auth, googleAuthProvider, db, storage };

