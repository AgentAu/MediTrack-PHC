/**
 * api.js
 * ------------------------------------------------------------------
 * The ONLY place the client talks to the server (the React
 * equivalent of the old storage.js). Every request carries the
 * signed-in user's Firebase ID token so Express can verify who is
 * asking and what their role allows.
 * ------------------------------------------------------------------
 */

import { signOut } from "firebase/auth";
import { auth } from "./firebase.js";

const BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details || {};
  }
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const user = auth.currentUser;
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the MediTrack server. Check that the API is running, then try again.", 0);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Session revoked (role changed, account deactivated): sign out so
    // the user lands on the login page with fresh permissions.
    if (response.status === 401 && user) await signOut(auth);
    throw new ApiError(data?.error || `Request failed (${response.status}).`, response.status, data?.details);
  }

  return data;
}

const id = (value) => encodeURIComponent(value);

export const api = {
  getStats: () => request("/stats"),

  listPatients: ({ q = "", archived = false } = {}) =>
    request(`/patients?${new URLSearchParams({ q, archived: String(archived) })}`),
  getPatient: (patientId) => request(`/patients/${id(patientId)}`),
  createPatient: (data) => request("/patients", { method: "POST", body: data }),
  updatePatient: (patientId, data) => request(`/patients/${id(patientId)}`, { method: "PUT", body: data }),
  archivePatient: (patientId) => request(`/patients/${id(patientId)}/archive`, { method: "PATCH" }),
  restorePatient: (patientId) => request(`/patients/${id(patientId)}/restore`, { method: "PATCH" }),

  listConsultations: (patientId) => request(`/patients/${id(patientId)}/consultations`),
  addConsultation: (patientId, data) =>
    request(`/patients/${id(patientId)}/consultations`, { method: "POST", body: data }),

  listStaff: () => request("/staff"),
  createStaff: (data) => request("/staff", { method: "POST", body: data }),
  updateStaff: (uid, changes) => request(`/staff/${id(uid)}`, { method: "PATCH", body: changes }),
};
