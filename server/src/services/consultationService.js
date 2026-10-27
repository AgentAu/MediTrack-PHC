/**
 * consultationService.js
 * ------------------------------------------------------------------
 * Consultations live in a subcollection under each patient. They are
 * append-only: there is deliberately no update or delete function.
 * A correction is recorded as a new consultation entry.
 * ------------------------------------------------------------------
 */

import { db, FieldValue } from "../config/firebase.js";
import { HttpError } from "../utils/httpError.js";
import { serializeDoc } from "../utils/serialize.js";
import { patientRef } from "./patientService.js";

/**
 * Newest consultation date first; same-day entries by time recorded.
 * @param {string} patientId
 */
export async function listConsultations(patientId) {
  const ref = patientRef(patientId);
  const patientSnap = await ref.get();
  if (!patientSnap.exists) throw new HttpError(404, "Patient not found.");

  const snapshot = await ref.collection("consultations").get();
  return snapshot.docs
    .map((doc) => serializeDoc(doc, "consultationId"))
    .sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt).localeCompare(String(a.createdAt)));
}

/**
 * Adds a consultation and bumps the patient's consultationCount in
 * the same transaction so the two can never disagree.
 * @param {string} patientId
 * @param {Object} data - validated consultation fields
 * @param {{ uid: string, name: string }} user
 */
export async function addConsultation(patientId, data, user) {
  const ref = patientRef(patientId);
  const consultationRef = ref.collection("consultations").doc();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpError(404, "Patient not found.");
    if (snap.data().archived) throw new HttpError(409, "This patient is archived. Restore the record before adding a consultation.");

    tx.create(consultationRef, {
      ...data,
      recordedBy: { uid: user.uid, name: user.name },
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(ref, {
      consultationCount: FieldValue.increment(1),
      lastConsultationDate: data.date,
    });
  });

  return serializeDoc(await consultationRef.get(), "consultationId");
}
