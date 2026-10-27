/**
 * validation.js
 * ------------------------------------------------------------------
 * Server-side validation and cleaning of everything the client
 * sends. The React forms validate too, but the server never trusts
 * the client: every rule here is enforced even if someone calls the
 * API directly.
 *
 * Each validator returns { data, errors } where `data` contains only
 * the allowed, trimmed fields and `errors` maps field name -> message.
 * ------------------------------------------------------------------
 */

import { ALL_ROLES } from "../config/roles.js";
import { isValidIsoDate, todayIso } from "./dates.js";

export const GENDERS = ["Male", "Female"];
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const GENOTYPES = ["AA", "AS", "SS", "AC"];

const REQUIRED = "This field is required.";

/** Trims a value to a string, or "" if it isn't one. */
const clean = (value) => (typeof value === "string" ? value.trim() : "");

/** "hAUWA  bello" -> "Hauwa Bello" */
export function capitalizeWords(str) {
  return clean(str)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function checkLength(errors, field, value, max) {
  if (value.length > max) errors[field] = `Keep this under ${max} characters.`;
}

/**
 * Validates patient demographic + medical fields (register and edit).
 * @param {Object} body
 */
export function validatePatientInput(body = {}) {
  const data = {
    firstName: capitalizeWords(body.firstName),
    lastName: capitalizeWords(body.lastName),
    gender: clean(body.gender),
    dateOfBirth: clean(body.dateOfBirth),
    phone: clean(body.phone),
    address: clean(body.address),
    bloodGroup: clean(body.bloodGroup),
    genotype: clean(body.genotype),
    allergies: clean(body.allergies),
  };
  const errors = {};

  ["firstName", "lastName", "gender", "dateOfBirth", "phone"].forEach((field) => {
    if (!data[field]) errors[field] = REQUIRED;
  });

  checkLength(errors, "firstName", data.firstName, 60);
  checkLength(errors, "lastName", data.lastName, 60);
  checkLength(errors, "address", data.address, 300);
  checkLength(errors, "allergies", data.allergies, 500);

  if (data.gender && !GENDERS.includes(data.gender)) errors.gender = "Choose Male or Female.";

  if (data.dateOfBirth) {
    if (!isValidIsoDate(data.dateOfBirth)) errors.dateOfBirth = "Enter a valid date.";
    else if (data.dateOfBirth > todayIso()) errors.dateOfBirth = "Date of birth can't be in the future.";
    else if (data.dateOfBirth < "1900-01-01") errors.dateOfBirth = "Enter a date after 1900.";
  }

  if (data.phone && !/^\+?[0-9\s\-()]{7,20}$/.test(data.phone)) {
    errors.phone = "Enter a valid phone number, e.g. 08012345678.";
  }

  if (data.bloodGroup && !BLOOD_GROUPS.includes(data.bloodGroup)) errors.bloodGroup = "Choose a blood group from the list.";
  if (data.genotype && !GENOTYPES.includes(data.genotype)) errors.genotype = "Choose a genotype from the list.";

  return { data, errors };
}

/**
 * Validates a new consultation entry.
 * @param {Object} body
 */
export function validateConsultationInput(body = {}) {
  const data = {
    date: clean(body.date),
    complaint: clean(body.complaint),
    diagnosis: clean(body.diagnosis),
    treatment: clean(body.treatment),
    prescription: clean(body.prescription),
    doctorNotes: clean(body.doctorNotes),
  };
  const errors = {};

  ["date", "complaint", "diagnosis"].forEach((field) => {
    if (!data[field]) errors[field] = REQUIRED;
  });

  if (data.date) {
    if (!isValidIsoDate(data.date)) errors.date = "Enter a valid date.";
    else if (data.date > todayIso()) errors.date = "Consultation date can't be in the future.";
  }

  checkLength(errors, "complaint", data.complaint, 300);
  ["diagnosis", "treatment", "prescription", "doctorNotes"].forEach((field) =>
    checkLength(errors, field, data[field], 2000)
  );

  return { data, errors };
}

/**
 * Validates the "add staff member" form.
 * @param {Object} body
 */
export function validateNewStaffInput(body = {}) {
  const data = {
    name: capitalizeWords(body.name),
    email: clean(body.email).toLowerCase(),
    password: typeof body.password === "string" ? body.password : "",
    role: clean(body.role),
  };
  const errors = {};

  if (!data.name) errors.name = REQUIRED;
  checkLength(errors, "name", data.name, 80);
  if (!data.email) errors.email = REQUIRED;
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email address.";
  if (data.password.length < 6) errors.password = "Use at least 6 characters.";
  if (!ALL_ROLES.includes(data.role)) errors.role = "Choose a role.";

  return { data, errors };
}

/**
 * Validates a partial staff update (role, active, password, name).
 * Only fields that are present are validated and returned.
 * @param {Object} body
 */
export function validateStaffUpdateInput(body = {}) {
  const data = {};
  const errors = {};

  if (body.role !== undefined) {
    if (!ALL_ROLES.includes(body.role)) errors.role = "Choose a role.";
    else data.role = body.role;
  }
  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") errors.active = "Active must be true or false.";
    else data.active = body.active;
  }
  if (body.password !== undefined) {
    if (typeof body.password !== "string" || body.password.length < 6) errors.password = "Use at least 6 characters.";
    else data.password = body.password;
  }
  if (body.name !== undefined) {
    const name = capitalizeWords(body.name);
    if (!name) errors.name = REQUIRED;
    else data.name = name;
  }

  if (Object.keys(data).length === 0 && Object.keys(errors).length === 0) {
    errors.form = "Nothing to update.";
  }

  return { data, errors };
}
