/**
 * patientService.js
 * ------------------------------------------------------------------
 * All Firestore reads/writes for patient records. Route handlers
 * call these functions; nothing else touches the `patients`
 * collection. (Same idea as storage.js in the original prototype.)
 *
 * Firestore layout:
 *   counters/patients                       { lastNumber }
 *   patients/PHC-0001                       patient fields
 *   patients/PHC-0001/consultations/{auto}  one doc per visit
 * ------------------------------------------------------------------
 */

import { db, FieldValue } from "../config/firebase.js";
import { HttpError } from "../utils/httpError.js";
import { buildSearchKeywords, normaliseSearchTerm } from "../utils/search.js";
import { serializeDoc } from "../utils/serialize.js";
import { todayIso } from "../utils/dates.js";

const patientsCol = db.collection("patients");
const counterRef = db.collection("counters").doc("patients");

const PATIENT_ID_PATTERN = /^PHC-\d{4,}$/;

export const toPatient = (doc) => serializeDoc(doc, "patientId");

/** Newest registrations first. */
const byNewest = (a, b) =>
  String(b.createdAt || b.dateRegistered || "").localeCompare(String(a.createdAt || a.dateRegistered || ""));

/**
 * Returns the document reference for a patient ID, or throws 404 for
 * IDs that can't possibly exist (keeps junk out of Firestore paths).
 * @param {string} patientId
 */
export function patientRef(patientId) {
  if (!PATIENT_ID_PATTERN.test(patientId || "")) throw new HttpError(404, "Patient not found.");
  return patientsCol.doc(patientId);
}

/**
 * Lists patients, optionally filtered by a search term.
 * @param {{ search?: string, archived?: boolean }} options
 */
export async function listPatients({ search = "", archived = false } = {}) {
  const term = normaliseSearchTerm(search);

  // Search uses the keyword array; the archived filter is applied in
  // memory so no composite Firestore index is needed.
  const snapshot = term
    ? await patientsCol.where("searchKeywords", "array-contains", term).get()
    : await patientsCol.where("archived", "==", archived).get();

  return snapshot.docs
    .map(toPatient)
    .filter((p) => Boolean(p.archived) === archived)
    .sort(byNewest);
}

/**
 * @param {string} patientId
 * @param {{ includeArchived?: boolean }} options
 */
export async function getPatient(patientId, { includeArchived = false } = {}) {
  const snap = await patientRef(patientId).get();
  if (!snap.exists) throw new HttpError(404, "Patient not found.");
  const patient = toPatient(snap);
  if (patient.archived && !includeArchived) throw new HttpError(404, "Patient not found.");
  return patient;
}

/**
 * Registers a new patient. The next PHC-#### number is taken from a
 * counter document INSIDE a transaction, so two staff registering at
 * the same moment can never be given the same ID.
 * @param {Object} data - validated patient fields
 * @param {{ uid: string, name: string }} user
 */
export async function createPatient(data, user) {
  const patientId = await db.runTransaction(async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const nextNumber = (counterSnap.exists ? counterSnap.data().lastNumber || 0 : 0) + 1;
    const newId = `PHC-${String(nextNumber).padStart(4, "0")}`;

    tx.set(counterRef, { lastNumber: nextNumber }, { merge: true });
    tx.create(patientsCol.doc(newId), {
      ...data,
      dateRegistered: todayIso(),
      archived: false,
      consultationCount: 0,
      searchKeywords: buildSearchKeywords({ ...data, patientId: newId }),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: { uid: user.uid, name: user.name },
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: { uid: user.uid, name: user.name },
    });

    return newId;
  });

  return getPatient(patientId);
}

/**
 * Updates demographic/medical fields. patientId, dateRegistered,
 * consultations and archive status can never be changed here.
 * @param {string} patientId
 * @param {Object} data - validated patient fields
 * @param {{ uid: string, name: string }} user
 */
export async function updatePatient(patientId, data, user) {
  const ref = patientRef(patientId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpError(404, "Patient not found.");
    if (snap.data().archived) throw new HttpError(409, "This patient is archived. Restore the record before editing it.");

    tx.update(ref, {
      ...data,
      searchKeywords: buildSearchKeywords({ ...data, patientId }),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: { uid: user.uid, name: user.name },
    });
  });

  return getPatient(patientId);
}

/**
 * Archives or restores a patient. Archived records are hidden from
 * everyday lists but nothing is deleted.
 * @param {string} patientId
 * @param {boolean} archived
 * @param {{ uid: string, name: string }} user
 */
export async function setArchived(patientId, archived, user) {
  const ref = patientRef(patientId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpError(404, "Patient not found.");
    if (Boolean(snap.data().archived) === archived) {
      throw new HttpError(409, archived ? "This patient is already archived." : "This patient isn't archived.");
    }

    tx.update(
      ref,
      archived
        ? {
            archived: true,
            archivedAt: FieldValue.serverTimestamp(),
            archivedBy: { uid: user.uid, name: user.name },
          }
        : {
            archived: false,
            archivedAt: FieldValue.delete(),
            archivedBy: FieldValue.delete(),
            restoredAt: FieldValue.serverTimestamp(),
            restoredBy: { uid: user.uid, name: user.name },
          }
    );
  });

  return getPatient(patientId, { includeArchived: true });
}
