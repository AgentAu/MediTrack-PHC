/**
 * Dashboard numbers. Counts use Firestore aggregation queries, which
 * cost one read per 1,000 matching documents instead of one read per
 * document, so the dashboard stays cheap on the free plan.
 */

import { db } from "../config/firebase.js";
import { toPatient } from "./patientService.js";

const patientsCol = db.collection("patients");

export async function getDashboardStats() {
  const active = patientsCol.where("archived", "==", false);

  const [total, male, female, consultations, recentSnap] = await Promise.all([
    active.count().get(),
    active.where("gender", "==", "Male").count().get(),
    active.where("gender", "==", "Female").count().get(),
    db.collectionGroup("consultations").count().get(),
    // Single-field ordering needs no composite index; archived ones
    // are filtered out in memory.
    patientsCol.orderBy("createdAt", "desc").limit(20).get(),
  ]);

  return {
    totalPatients: total.data().count,
    malePatients: male.data().count,
    femalePatients: female.data().count,
    totalConsultations: consultations.data().count,
    recentPatients: recentSnap.docs
      .map(toPatient)
      .filter((p) => !p.archived)
      .slice(0, 5),
  };
}
