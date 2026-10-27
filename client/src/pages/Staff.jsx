import { useState } from "react";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { formatDate, plural } from "../lib/format.js";
import { ROLE_LABELS, ROLES } from "../lib/permissions.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { RoleBadge } from "../components/Badges.jsx";
import { ConfirmModal, Modal } from "../components/Modal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import FormField from "../components/FormField.jsx";
import LoadingState from "../components/LoadingState.jsx";

const ROLE_OPTIONS = [ROLES.DOCTOR, ROLES.RECORDS, ROLES.ADMIN];
const EMPTY_FORM = { name: "", email: "", password: "", role: "" };

const ROLE_HELP = {
  doctor: "Views patients and consultation history, adds consultations.",
  records: "Registers and edits patient details. Can't see clinical notes.",
  admin: "Manages staff and archives records. Can't add consultations.",
};

function AddStaffForm({ onCreated }) {
  const toast = useToast();
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((errs) => ({ ...errs, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientErrors = {};
    if (!values.name.trim()) clientErrors.name = "This field is required.";
    if (!values.email.trim()) clientErrors.email = "This field is required.";
    if (values.password.length < 6) clientErrors.password = "Use at least 6 characters.";
    if (!values.role) clientErrors.role = "Choose a role.";
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSubmitting(true);
    try {
      const { staff } = await api.createStaff(values);
      toast.success(`Account created for ${staff.name}. Share the email and temporary password with them.`);
      setValues(EMPTY_FORM);
      onCreated(staff);
    } catch (err) {
      setErrors(err.details || {});
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name) => ({ name, value: values[name], onChange: handleChange, error: errors[name] });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="d-grid gap-3">
        <FormField label="Full name" required autoComplete="off" {...field("name")} />
        <FormField label="Email" required type="email" autoComplete="off" {...field("email")} />
        <FormField
          label="Temporary password"
          required
          type="text"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          {...field("password")}
        />
        <div>
          <FormField label="Role" required as="select" {...field("role")}>
            <option value="" disabled>
              Select…
            </option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </FormField>
          {values.role && <p className="form-text mb-0">{ROLE_HELP[values.role]}</p>}
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
          {submitting ? "Creating account…" : "Create Account"}
        </button>
      </div>
    </form>
  );
}

export default function Staff() {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useApi(() => api.listStaff(), []);
  const staff = data?.staff || [];

  // Pending confirmations: { member, changes, title, message, label, variant }
  const [pending, setPending] = useState(null);
  const [working, setWorking] = useState(false);
  // Password reset dialog
  const [resetFor, setResetFor] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState("");

  const replaceMember = (updated) =>
    setData({ staff: staff.map((m) => (m.uid === updated.uid ? updated : m)) });

  const applyChange = async (member, changes, successMessage) => {
    setWorking(true);
    try {
      const { staff: updated } = await api.updateStaff(member.uid, changes);
      replaceMember(updated);
      toast.success(successMessage);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setWorking(false);
    }
  };

  const confirmPending = async () => {
    const ok = await applyChange(pending.member, pending.changes, pending.success);
    if (ok) setPending(null);
  };

  const requestRoleChange = (member, role) => {
    if (role === member.role) return;
    setPending({
      member,
      changes: { role },
      title: `Change ${member.name}'s role?`,
      message: `${member.name} will become a ${ROLE_LABELS[role].toLowerCase()} and will be signed out so the new permissions take effect. ${ROLE_HELP[role]}`,
      label: "Change role",
      variant: "primary",
      success: `${member.name} is now a ${ROLE_LABELS[role].toLowerCase()}.`,
    });
  };

  const requestActiveToggle = (member) => {
    const activate = member.active === false;
    setPending({
      member,
      changes: { active: activate },
      title: activate ? `Reactivate ${member.name}?` : `Deactivate ${member.name}?`,
      message: activate
        ? `${member.name} will be able to sign in again with their existing password.`
        : `${member.name} will be signed out and won't be able to sign in. Records they created are kept.`,
      label: activate ? "Reactivate" : "Deactivate",
      variant: activate ? "success" : "danger",
      success: activate ? `${member.name} reactivated.` : `${member.name} deactivated.`,
    });
  };

  const submitReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setResetError("Use at least 6 characters.");
      return;
    }
    const ok = await applyChange(resetFor, { password: newPassword }, `Password reset for ${resetFor.name}.`);
    if (ok) {
      setResetFor(null);
      setNewPassword("");
    }
  };

  return (
    <>
      <div className="mb-4">
        <h1 className="section-title h3 mb-0">Staff</h1>
        <p className="section-subtitle mb-0">Create accounts and control what each person can do.</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-4 order-lg-2">
          <div className="card">
            <div className="card-header">
              <i className="bi bi-person-plus me-2 text-primary" aria-hidden="true" />
              Add staff member
            </div>
            <div className="card-body">
              <AddStaffForm onCreated={(member) => setData({ staff: [...staff, member].sort((a, b) => a.name.localeCompare(b.name)) })} />
            </div>
          </div>
        </div>

        <div className="col-lg-8 order-lg-1">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>
                <i className="bi bi-person-badge me-2 text-primary" aria-hidden="true" />
                Staff accounts
              </span>
              {!loading && !error && <span className="text-muted small fw-normal">{plural(staff.length, "account")}</span>}
            </div>
            <div className="card-body">
              {loading ? (
                <LoadingState label="Loading staff…" />
              ) : error ? (
                <ErrorState error={error} onRetry={reload} />
              ) : staff.length === 0 ? (
                <EmptyState icon="bi-person-badge" title="No staff accounts yet" message="Add your first staff member using the form." />
              ) : (
                <div className="table-responsive">
                  <table className="table table-mt align-middle mb-0">
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Role</th>
                        <th scope="col">Status</th>
                        <th scope="col" className="text-end">
                          <span className="visually-hidden">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map((m) => {
                        const isSelf = m.uid === user?.uid;
                        const active = m.active !== false;
                        return (
                          <tr key={m.uid} className={active ? "" : "row-inactive"}>
                            <td>
                              <div className="fw-semibold">
                                {m.name} {isSelf && <span className="text-muted fw-normal small">(you)</span>}
                              </div>
                              <div className="text-muted small">{m.email}</div>
                              {m.createdAt && <div className="text-muted small">Added {formatDate(m.createdAt)}</div>}
                            </td>
                            <td style={{ minWidth: 170 }}>
                              {isSelf ? (
                                <RoleBadge role={m.role} />
                              ) : (
                                <select
                                  className="form-select form-select-sm"
                                  aria-label={`Role for ${m.name}`}
                                  value={m.role || ""}
                                  onChange={(e) => requestRoleChange(m, e.target.value)}
                                  disabled={!active}
                                >
                                  {ROLE_OPTIONS.map((r) => (
                                    <option key={r} value={r}>
                                      {ROLE_LABELS[r]}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td>
                              {active ? (
                                <span className="badge rounded-pill text-bg-success-subtle text-success-emphasis">Active</span>
                              ) : (
                                <span className="badge rounded-pill text-bg-secondary">Deactivated</span>
                              )}
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm" role="group" aria-label={`Actions for ${m.name}`}>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary"
                                  onClick={() => {
                                    setResetFor(m);
                                    setNewPassword("");
                                    setResetError("");
                                  }}
                                  title={`Reset password for ${m.name}`}
                                >
                                  <i className="bi bi-key" aria-hidden="true" />
                                  <span className="visually-hidden">Reset password for {m.name}</span>
                                </button>
                                {!isSelf && (
                                  <button
                                    type="button"
                                    className={`btn ${active ? "btn-outline-danger" : "btn-outline-success"}`}
                                    onClick={() => requestActiveToggle(m)}
                                    title={active ? `Deactivate ${m.name}` : `Reactivate ${m.name}`}
                                  >
                                    <i className={`bi ${active ? "bi-person-x" : "bi-person-check"}`} aria-hidden="true" />
                                    <span className="visually-hidden">{active ? "Deactivate" : "Reactivate"} {m.name}</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        show={Boolean(pending)}
        title={pending?.title}
        message={pending?.message}
        confirmLabel={pending?.label}
        confirmVariant={pending?.variant}
        busy={working}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />

      <Modal
        show={Boolean(resetFor)}
        title={`Reset password for ${resetFor?.name || ""}`}
        onClose={() => setResetFor(null)}
        busy={working}
      >
        <form onSubmit={submitReset} noValidate>
          <FormField
            label="New password"
            name="newPassword"
            type="text"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setResetError("");
            }}
            error={resetError}
          />
          <p className="form-text">
            {resetFor?.uid === user?.uid
              ? "You'll be signed out and will need to sign in with the new password."
              : "They'll be signed out and must sign in with this password."}
          </p>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setResetFor(null)} disabled={working}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={working}>
              {working && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
              Reset Password
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
