// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Import the database instance creator and core ref/set/update/remove/push/serverTimestamp for convenience
import { getDatabase, ref, set, update, remove, push, serverTimestamp } from "firebase/database";
// **The 'get' function for RTDB is typically imported directly where needed, not re-exported like this usually**
// However, if you *really* want to re-export it from here, you'd also need to import it:
// import { get } from "firebase/database"; // This is the 'get' for RTDB

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app); // Firestore DB
const rtdb = getDatabase(app); // Realtime Database instance

// Export the instances and commonly used functions that operate on these instances.
// It's usually better practice for components to import `get` directly from "firebase/database"
export {
  app,
  auth,
  db, // Firestore
  rtdb, // Realtime Database instance
  ref, // RTDB ref
  set, // RTDB set
  update, // RTDB update
  remove, // RTDB remove
  push, // RTDB push
  serverTimestamp // RTDB serverTimestamp
  // If you re-exported 'get' above, you could add it here:
  // get as getRTDBData // aliasing it
};