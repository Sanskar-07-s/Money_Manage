const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let db = null;
let isFirebaseAdminReady = false;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH.trim();
    const resolvedPath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(process.cwd(), configuredPath);

    if (fs.existsSync(resolvedPath)) {
      const serviceAccount = require(resolvedPath);
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }

      db = admin.firestore();
      isFirebaseAdminReady = true;
      console.log('Firebase Admin initialized successfully');
    } else {
      console.warn('Firebase Admin not initialized. File not found at:', resolvedPath);
    }
  } else {
    console.warn('Firebase Admin not initialized. Provide FIREBASE_SERVICE_ACCOUNT_PATH.');
  }
} catch (error) {
  console.error('Firebase Admin Error:', error);
}

module.exports = { admin, db, isFirebaseAdminReady };
