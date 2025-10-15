// Simple Firebase test script
// Run this in browser console to test Firebase connection

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCR9IO7GQatt5oU33OLxW-vDyEtiZ4Og4I",
  authDomain: "my-timebox-project.firebaseapp.com",
  projectId: "my-timebox-project",
  storageBucket: "my-timebox-project.firebasestorage.app",
  messagingSenderId: "338798659890",
  appId: "1:338798659890:web:11d2c0820df2a5ef25af2b",
  measurementId: "G-3CBLF435L9"
};

// Test Firebase connection
async function testFirebase() {
  try {
    console.log('🔥 Testing Firebase connection...');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    
    // Test adding a document
    const testDoc = {
      message: 'Test message from browser console',
      timestamp: new Date(),
      test: true
    };
    
    const docRef = await addDoc(collection(db, 'testMessages'), testDoc);
    console.log('✅ Test document added with ID:', docRef.id);
    
    // Test reading documents
    const querySnapshot = await getDocs(collection(db, 'testMessages'));
    console.log('✅ Found', querySnapshot.size, 'test documents');
    
    querySnapshot.forEach((doc) => {
      console.log('📄 Document:', doc.id, '=>', doc.data());
    });
    
    return true;
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    return false;
  }
}

// Run the test
testFirebase();
