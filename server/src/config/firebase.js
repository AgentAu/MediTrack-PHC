/**
 * firebase.js
 * ------------------------------------------------------------------
 * Initialises the Firebase Admin SDK once and exports the Firestore
 * and Auth handles. The Admin SDK runs with full privileges, which
 * is why ALL database access goes through this server: the React
 * client never talks to Firestore directly.
 * ------------------------------------------------------------------
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import admin from "firebase-admin";
import "dotenv/config";

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(path.resolve(keyPath), "utf8"));
} catch (err) {
  console.error(
    `\n[MediTrack] Could not read the Firebase service account key at "${keyPath}".\n` +
      "Download it from Firebase console > Project settings > Service accounts > Generate new private key,\n" +
      "save it in the server folder as serviceAccountKey.json (or set FIREBASE_SERVICE_ACCOUNT_PATH in .env).\n"
  );
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
