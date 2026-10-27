/**
 * staffService.js
 * ------------------------------------------------------------------
 * Staff accounts live in two places that are kept in sync:
 *   - Firebase Authentication: email/password login, `disabled`
 *     flag, and the `role` custom claim (what the server trusts).
 *   - Firestore users/{uid}: name, email, role, active, for listing
 *     staff in the admin screen.
 * ------------------------------------------------------------------
 */

import { auth, db, FieldValue } from "../config/firebase.js";
import { ROLES } from "../config/roles.js";
import { HttpError } from "../utils/httpError.js";
import { serializeDoc } from "../utils/serialize.js";

const usersCol = db.collection("users");

export async function listStaff() {
  const snapshot = await usersCol.get();
  return snapshot.docs.map((doc) => serializeDoc(doc, "uid")).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Creates a login for a staff member and assigns their role.
 * @param {{ name: string, email: string, password: string, role: string }} data
 * @param {{ uid: string, name: string }} actor - the admin doing it
 */
export async function createStaff({ name, email, password, role }, actor) {
  let userRecord;
  try {
    userRecord = await auth.createUser({ email, password, displayName: name });
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      throw new HttpError(409, "A staff account with this email already exists.", { email: "This email is already in use." });
    }
    if (err.code === "auth/invalid-password") {
      throw new HttpError(400, "Choose a stronger password.", { password: "Use at least 6 characters." });
    }
    if (err.code === "auth/invalid-email") {
      throw new HttpError(400, "Enter a valid email address.", { email: "Enter a valid email address." });
    }
    throw err;
  }

  await auth.setCustomUserClaims(userRecord.uid, { role });
  await usersCol.doc(userRecord.uid).set({
    name,
    email,
    role,
    active: true,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actor ? { uid: actor.uid, name: actor.name } : null,
  });

  return serializeDoc(await usersCol.doc(userRecord.uid).get(), "uid");
}

/**
 * Changes a staff member's role, active status, name or password.
 * Any change that affects access signs them out everywhere so the
 * new permissions apply immediately.
 * @param {string} uid
 * @param {{ role?: string, active?: boolean, password?: string, name?: string }} changes
 * @param {{ uid: string, name: string }} actor
 */
export async function updateStaff(uid, changes, actor) {
  const ref = usersCol.doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Staff member not found.");

  const isSelf = uid === actor.uid;
  if (isSelf && changes.role !== undefined && changes.role !== ROLES.ADMIN) {
    throw new HttpError(400, "You can't remove your own administrator role. Ask another admin to do it.");
  }
  if (isSelf && changes.active === false) {
    throw new HttpError(400, "You can't deactivate your own account.");
  }

  const authUpdate = {};
  if (changes.name !== undefined) authUpdate.displayName = changes.name;
  if (changes.password !== undefined) authUpdate.password = changes.password;
  if (changes.active !== undefined) authUpdate.disabled = !changes.active;

  if (Object.keys(authUpdate).length) await auth.updateUser(uid, authUpdate);
  if (changes.role !== undefined) await auth.setCustomUserClaims(uid, { role: changes.role });

  const accessChanged =
    changes.role !== undefined || changes.active === false || changes.password !== undefined;
  if (accessChanged && !isSelf) await auth.revokeRefreshTokens(uid);

  const docUpdate = { updatedAt: FieldValue.serverTimestamp(), updatedBy: { uid: actor.uid, name: actor.name } };
  ["name", "role", "active"].forEach((key) => {
    if (changes[key] !== undefined) docUpdate[key] = changes[key];
  });
  await ref.update(docUpdate);

  return serializeDoc(await ref.get(), "uid");
}
