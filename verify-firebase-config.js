// Firebase Configuration Verification Script
// Run this in your browser console to check your Firebase setup

console.log('=== Firebase Configuration Verification ===');

// Check if Firebase is loaded
if (typeof firebase === 'undefined') {
  console.error('❌ Firebase is not loaded');
} else {
  console.log('✅ Firebase is loaded');
}

// Check Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCPMDovkepEAZG8x9KI7ToA8KPpx8bVvRw",
  authDomain: "cmu-compete.firebaseapp.com",
  projectId: "cmu-compete",
  storageBucket: "cmu-compete.firebasestorage.app",
  messagingSenderId: "997370663174",
  appId: "1:997370663174:web:637caba90f47f325d98e87",
  measurementId: "G-778ECCFJQS"
};

console.log('Firebase Config:', firebaseConfig);

// Test storage bucket URL
const storageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o`;
console.log('Storage URL:', storageUrl);

// Test if storage bucket is accessible
fetch(storageUrl)
  .then(response => {
    console.log('✅ Storage bucket is accessible');
    console.log('Response status:', response.status);
  })
  .catch(error => {
    console.error('❌ Storage bucket is not accessible:', error);
  });

// Check authentication
import { auth } from './src/firebase.js';
if (auth.currentUser) {
  console.log('✅ User is authenticated:', auth.currentUser.uid);
} else {
  console.log('❌ User is not authenticated');
}

console.log('=== End Verification ===');
