// lib/firebase-admin.js
import admin from 'firebase-admin';

if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64) {
  throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64 is not set in .env.local');
}

const serviceAccountBase64 = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64;
const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'));

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (error) {
  console.error('Firebase admin initialization error', error.stack);
}

export default admin;