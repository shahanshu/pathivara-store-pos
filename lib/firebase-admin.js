// lib/firebase-admin.js
import admin from 'firebase-admin';

// Your existing service account initialization
const serviceAccountBase64 = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64;
if (!serviceAccountBase64) {
  throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64 is not set in .env.local');
}
const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'));

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL // IMPORTANT: Add this for Admin RTDB
    });
    console.log("Firebase Admin SDK initialized.");
  }
} catch (error) {
  console.error('Firebase Admin SDK initialization error:', error.stack);
}

// Get the Admin SDK's Realtime Database service instance
const rtdbAdmin = admin.database();

export default admin; // Export the default admin namespace
export { rtdbAdmin }; // Export the Admin RTDB service