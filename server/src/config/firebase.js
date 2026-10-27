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

/**
 * Loads the service account key from either:
 *   - FIREBASE_SERVICE_ACCOUNT env var (JSON text or base64 of it), used on Vercel
 *     and other hosts where you can't upload files, or
 *   - a JSON file at FIREBASE_SERVICE_ACCOUNT_PATH (default ./serviceAccountKey.json),
 *     used in local development.
 */
function loadServiceAccount() {
  const fromEnv = (process.env.FIREBASE_SERVICE_ACCOUNT || "").trim();
  if (fromEnv) {
    try {
      const json = fromEnv.startsWith("{") ? fromEnv : Buffer.from(fromEnv, "base64").toString("utf8");
      return JSON.parse(json);
    } catch {
      throw new Error("[MediTrack] FIREBASE_SERVICE_ACCOUNT is set but isn't valid JSON or base64-encoded JSON.");
    }
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";
  try {
    return JSON.parse(readFileSync(path.resolve(keyPath), "utf8"));
  } catch {
    throw new Error(
      `[MediTrack] Could not read the Firebase service account key at "${keyPath}". ` +
        "Download it from Firebase console > Project settings > Service accounts > Generate new private key " +
        "and save it in the server folder as serviceAccountKey.json, or set FIREBASE_SERVICE_ACCOUNT."
    );
  }
}

const serviceAccount = loadServiceAccount();

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;