
const admin = require('firebase-admin');

// --- START CONFIGURATION ---
// Option 1: Provide path to your service account JSON file
const serviceAccount = require('C:\\Users\\V I C T U S\\Downloads\\depart-b7ac4-firebase-adminsdk-fbsvc-0a5e6bb9bd.json'); // CORRECTED

// ... rest of the script
const USER_UID_TO_MAKE_ADMIN = "36P2yOEVhpawhT4bgUCVIJtihW83";

try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
} catch (e) {
    console.error("Firebase admin init error for script:", e);
    process.exit(1);
}
// ... rest of the script
admin.auth().setCustomUserClaims(USER_UID_TO_MAKE_ADMIN, { admin: true })
  .then(() => {
    console.log(`Successfully set admin claim for user: ${USER_UID_TO_MAKE_ADMIN}`);
    console.log('User may need to re-login or their ID token needs to refresh for the claim to be active.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error setting custom claim:', error);
    process.exit(1);
  });