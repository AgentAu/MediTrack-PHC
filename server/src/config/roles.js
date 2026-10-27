/**
 * roles.js
 * ------------------------------------------------------------------
 * The three staff roles. Stored on each Firebase Auth user as a
 * custom claim ({ role: "doctor" }) so the server can read it from
 * the verified ID token without a database lookup.
 * ------------------------------------------------------------------
 */

export const ROLES = Object.freeze({
  ADMIN: "admin",
  DOCTOR: "doctor",
  RECORDS: "records",
});

export const ALL_ROLES = Object.values(ROLES);
