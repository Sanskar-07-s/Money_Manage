const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let db = null;
let isFirebaseAdminReady = false;
let firebaseAdminError = null;

try {
  let serviceAccount = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Supports Vercel/CI secret values where private_key contains escaped newlines.
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH.trim();
    const resolvedPath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(process.cwd(), configuredPath);

    if (fs.existsSync(resolvedPath)) {
      serviceAccount = require(resolvedPath);
    } else {
      console.warn('Firebase Admin not initialized. File not found at:', resolvedPath);
    }
  }

  if (serviceAccount) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    db = admin.firestore();
    isFirebaseAdminReady = true;
    console.log('Firebase Admin initialized successfully');
  } else {
    console.warn('Firebase Admin not initialized. Provide FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.');
  }
} catch (error) {
  firebaseAdminError = error;
  console.error('Firebase Admin Error:', error);
}

module.exports = { admin, db, isFirebaseAdminReady, firebaseAdminError };
