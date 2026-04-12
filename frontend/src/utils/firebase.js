import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const requiredConfig = [
  ["VITE_FIREBASE_API_KEY", firebaseConfig.apiKey],
  ["VITE_FIREBASE_AUTH_DOMAIN", firebaseConfig.authDomain],
  ["VITE_FIREBASE_PROJECT_ID", firebaseConfig.projectId],
  ["VITE_FIREBASE_APP_ID", firebaseConfig.appId]
];

const missingFirebaseConfigKeys = requiredConfig
  .filter(([, value]) => !value)
  .map(([key]) => key);

const firebaseConfigError = missingFirebaseConfigKeys.length
  ? new Error(
      `Missing Firebase client configuration: ${missingFirebaseConfigKeys.join(", ")}. ` +
        "Set these variables in frontend/.env for local development, or in Vercel Project Settings -> Environment Variables for deployments."
    )
  : null;

if (firebaseConfigError) {
  console.error(firebaseConfigError.message);
}

const app = firebaseConfigError ? null : initializeApp(firebaseConfig);
const auth = app ? getAuth(app) : null;
let analytics = null;

if (app && typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Firebase Analytics initialization failed", error);
  }
}

export { auth, app, analytics, firebaseConfigError, missingFirebaseConfigKeys };
