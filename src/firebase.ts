// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v9-compat and v9+
// Using existing project: studied-source-441116-f4
// NOTE: These are PUBLIC Firebase keys - safe to expose in client-side code
const firebaseConfig = {
  apiKey: "AIzaSyDlgQMPhUHlh6Jo2taRrL2tZkrIcutAjDo",
  authDomain: "studied-source-441116-f4.firebaseapp.com",
  projectId: "studied-source-441116-f4",
  storageBucket: "studied-source-441116-f4.firebasestorage.app",
  messagingSenderId: "323526251507",
  appId: "1:323526251507:web:9eb10357bd1b26f8bf3886",
  measurementId: "G-QR129FGELF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

export default app;
