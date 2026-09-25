/**
 * LearnLens Frontend Firebase Client Initializer
 *
 * Plug-and-play client configuration for Vite, Next.js, or Create-React-App frontends.
 * Reads environment variables configured in the shared .env file.
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, onSnapshot, collection } from "firebase/firestore";

// Helper to resolve environment variables across Vite (import.meta.env) and Webpack/Next.js (process.env)
const getEnv = (key, fallback = "") => {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

export const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY", getEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "AIzaSyBthKMnShNRdfR4r4KaUfpVOWJ3ogQ4RZw")),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN", getEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "gen-lang-client-0427554587.firebaseapp.com")),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID", getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "gen-lang-client-0427554587")),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET", getEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "gen-lang-client-0427554587.firebasestorage.app")),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", getEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "229055675286")),
  appId: getEnv("VITE_FIREBASE_APP_ID", getEnv("NEXT_PUBLIC_FIREBASE_APP_ID", "1:229055675286:web:6ed01f89c92ffb5a087bb7")),
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Real-time subscription to a student's mastery record for dashboards.
 * @param {string} studentId
 * @param {string} domain
 * @param {function} callback
 * @returns {function} Unsubscribe listener
 */
export function subscribeToStudentMastery(studentId, domain, callback) {
  const docRef = doc(db, "mastery_states", `${studentId}_${domain}`);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    }
  });
}

/**
 * Real-time subscription to high-priority alerts for Teacher Dashboards.
 * @param {function} callback
 * @returns {function} Unsubscribe listener
 */
export function subscribeToTriageAlerts(callback) {
  const alertsCol = collection(db, "triage_alerts");
  return onSnapshot(alertsCol, (snapshot) => {
    const alerts = [];
    snapshot.forEach((d) => alerts.push({ id: d.id, ...d.data() }));
    callback(alerts);
  });
}

export default app;
