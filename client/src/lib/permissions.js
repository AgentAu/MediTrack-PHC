/**
 * The permissions table, client side. Used to show or hide pages and
 * buttons. The server has its own copy of these rules (in its route
 * definitions) and is the one that actually enforces them.
 */

export const ROLES = Object.freeze({
  ADMIN: "admin",
  DOCTOR: "doctor",
  RECORDS: "records",
});

export const ROLE_LABELS = {
  admin: "Administrator",
  doctor: "Doctor",
  records: "Records officer",
};

const { ADMIN, DOCTOR, RECORDS } = ROLES;

const PERMISSIONS = {
  "patients:view": [ADMIN, DOCTOR, RECORDS],
  "patients:write": [ADMIN, DOCTOR, RECORDS],
  "patients:archive": [ADMIN],
  "consultations:view": [ADMIN, DOCTOR],
  "consultations:add": [DOCTOR],
  "staff:manage": [ADMIN],
};

/**
 * @param {string|null} role
 * @param {keyof PERMISSIONS} action
 * @returns {boolean}
 */
export function can(role, action) {
  return Boolean(role) && (PERMISSIONS[action] || []).includes(role);
}
