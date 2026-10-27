/**
 * /api/patients routes. Each route declares which roles may use it,
 * mirroring the permissions table:
 *
 *   view / register / edit patients ... admin, doctor, records
 *   archive / restore / view archived .. admin
 *   view consultation history .......... admin, doctor
 *   add consultation ................... doctor
 */

import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { ROLES } from "../config/roles.js";
import { asyncHandler, HttpError } from "../utils/httpError.js";
import { validatePatientInput, validateConsultationInput } from "../utils/validation.js";
import * as patients from "../services/patientService.js";
import * as consultations from "../services/consultationService.js";

const router = Router();
const { ADMIN, DOCTOR, RECORDS } = ROLES;
const ALL_STAFF = [ADMIN, DOCTOR, RECORDS];

function assertValid(errors) {
  if (Object.keys(errors).length) {
    throw new HttpError(400, "Some fields need attention.", errors);
  }
}

// GET /api/patients?q=hauwa&archived=false
router.get(
  "/",
  requireRole(...ALL_STAFF),
  asyncHandler(async (req, res) => {
    const archived = req.query.archived === "true";
    if (archived && req.user.role !== ADMIN) {
      throw new HttpError(403, "Only administrators can view archived patients.");
    }
    const list = await patients.listPatients({ search: String(req.query.q || ""), archived });
    res.json({ patients: list });
  })
);

// POST /api/patients
router.post(
  "/",
  requireRole(...ALL_STAFF),
  asyncHandler(async (req, res) => {
    const { data, errors } = validatePatientInput(req.body);
    assertValid(errors);
    const patient = await patients.createPatient(data, req.user);
    res.status(201).json({ patient });
  })
);

// GET /api/patients/:id  (archived records are visible to admins only)
router.get(
  "/:id",
  requireRole(...ALL_STAFF),
  asyncHandler(async (req, res) => {
    const patient = await patients.getPatient(req.params.id, { includeArchived: req.user.role === ADMIN });
    res.json({ patient });
  })
);

// PUT /api/patients/:id
router.put(
  "/:id",
  requireRole(...ALL_STAFF),
  asyncHandler(async (req, res) => {
    const { data, errors } = validatePatientInput(req.body);
    assertValid(errors);
    const patient = await patients.updatePatient(req.params.id, data, req.user);
    res.json({ patient });
  })
);

// PATCH /api/patients/:id/archive
router.patch(
  "/:id/archive",
  requireRole(ADMIN),
  asyncHandler(async (req, res) => {
    const patient = await patients.setArchived(req.params.id, true, req.user);
    res.json({ patient });
  })
);

// PATCH /api/patients/:id/restore
router.patch(
  "/:id/restore",
  requireRole(ADMIN),
  asyncHandler(async (req, res) => {
    const patient = await patients.setArchived(req.params.id, false, req.user);
    res.json({ patient });
  })
);

// GET /api/patients/:id/consultations
router.get(
  "/:id/consultations",
  requireRole(ADMIN, DOCTOR),
  asyncHandler(async (req, res) => {
    // Non-admins can't read history of archived patients.
    await patients.getPatient(req.params.id, { includeArchived: req.user.role === ADMIN });
    const list = await consultations.listConsultations(req.params.id);
    res.json({ consultations: list });
  })
);

// POST /api/patients/:id/consultations
router.post(
  "/:id/consultations",
  requireRole(DOCTOR),
  asyncHandler(async (req, res) => {
    const { data, errors } = validateConsultationInput(req.body);
    assertValid(errors);
    const consultation = await consultations.addConsultation(req.params.id, data, req.user);
    res.status(201).json({ consultation });
  })
);

export default router;
