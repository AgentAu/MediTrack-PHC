/**
 * Firebase client setup. The client only uses Firebase
 * AUTHENTICATION (signing in and getting an ID token). All patient
 * data goes through the Express API, never straight to Firestore.
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missing = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length) {
  console.error(
    `[MediTrack] Missing Firebase config: ${missing.join(", ")}. ` +
      "Copy client/.env.example to client/.env and fill it in, then restart `npm run dev`."
  );
}

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
