import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBkn7L2MopvsBiJeQ-xkdOIPrLKJmxFRg8",
  authDomain: "money-manage-79f73.firebaseapp.com",
  projectId: "money-manage-79f73",
  storageBucket: "money-manage-79f73.firebasestorage.app",
  messagingSenderId: "266735297854",
  appId: "1:266735297854:web:591f20fa9ebfa24f1b386f",
  measurementId: "G-1D0LDM0NDX"
};

let app = null;
let auth = null;
let analytics = null;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    if (typeof window !== "undefined") {
      analytics = getAnalytics(app);
    }
} catch (e) {
    console.warn("Error initializing firebase client", e);
}

export { auth, app, analytics };
