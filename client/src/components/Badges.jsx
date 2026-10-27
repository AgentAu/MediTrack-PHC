import { getInitials } from "../lib/format.js";
import { ROLE_LABELS } from "../lib/permissions.js";

export function Avatar({ firstName, lastName, size = 44 }) {
  return (
    <span className="avatar-circle" style={{ "--avatar-size": `${size}px` }} aria-hidden="true">
      {getInitials(firstName, lastName)}
    </span>
  );
}

export function GenderBadge({ gender }) {
  const normalized = (gender || "").toLowerCase();
  const map = {
    male: { label: "Male", cls: "text-bg-primary" },
    female: { label: "Female", cls: "text-bg-danger-subtle text-danger-emphasis" },
  };
  const entry = map[normalized] || { label: gender || "—", cls: "text-bg-secondary" };
  return <span className={`badge rounded-pill ${entry.cls}`}>{entry.label}</span>;
}

export function RoleBadge({ role }) {
  const cls = {
    admin: "role-badge role-admin",
    doctor: "role-badge role-doctor",
    records: "role-badge role-records",
  }[role];
  return <span className={cls || "role-badge"}>{ROLE_LABELS[role] || "No role"}</span>;
}
