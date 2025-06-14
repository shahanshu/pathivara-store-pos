// lib/firebase-admin.js
import admin from 'firebase-admin';

const serviceAccountBase64 = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64;
if (!serviceAccountBase64) {
  // This should ideally not happen if your previous steps worked
  console.error('CRITICAL: FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64 is not set.');
  // throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64 is not set in .env.local');
}
const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'));

const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
if (!databaseURL){
    console.error('CRITICAL: NEXT_PUBLIC_FIREBASE_DATABASE_URL is not set for Admin SDK.');
    // throw new Error('NEXT_PUBLIC_FIREBASE_DATABASE_URL is not set in .env.local for Admin SDK');
}

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: databaseURL // Ensure this is your correct RTDB URL
    });
    console.log("Firebase Admin SDK initialized with Database URL.");
  }
} catch (error) {
  console.error('Firebase Admin SDK initialization error:', error.stack);
}

const rtdbAdmin = admin.apps.length ? admin.database() : null;
if (!rtdbAdmin && admin.apps.length) {
    console.error("Failed to get admin database instance, though admin app is initialized.");
}


export default admin;
export { rtdbAdmin };