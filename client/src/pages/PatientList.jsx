import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { formatDate, plural } from "../lib/format.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Avatar, GenderBadge } from "../components/Badges.jsx";
import { ConfirmModal } from "../components/Modal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";

/**
 * Patient list. With `archived`, it becomes the admin-only Archived
 * Patients view, where the row action is Restore instead of Archive.
 */
export default function PatientList({ archived = false }) {
  const { can } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [input, setInput] = useState(query);
  const [pending, setPending] = useState(null); // patient awaiting archive/restore confirmation
  const [working, setWorking] = useState(false);

  // Debounce typing: update the URL (and therefore the request) 300 ms after the last keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      const term = input.trim();
      if (term !== query) setSearchParams(term ? { q: term } : {}, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [input, query, setSearchParams]);

  const { data, loading, error, reload, setData } = useApi(
    () => api.listPatients({ q: query, archived }),
    [query, archived]
  );
  const patients = data?.patients || [];

  const confirmAction = async () => {
    if (!pending) return;
    setWorking(true);
    try {
      if (archived) await api.restorePatient(pending.patientId);
      else await api.archivePatient(pending.patientId);
      setData({ patients: patients.filter((p) => p.patientId !== pending.patientId) });
      toast.success(
        archived
          ? `${pending.firstName} ${pending.lastName} restored.`
          : `${pending.firstName} ${pending.lastName} archived.`
      );
      setPending(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <h1 className="section-title h3 mb-0">{archived ? "Archived patients" : "Patients"}</h1>
          <p className="section-subtitle mb-0">
            {archived
              ? "Hidden from everyday lists. Restore a record to make it active again."
              : "Every registered patient at this facility."}
          </p>
        </div>
        {!archived && can("patients:write") && (
          <Link to="/patients/new" className="btn btn-primary">
            <i className="bi bi-person-plus-fill me-1" aria-hidden="true" />
            Register Patient
          </Link>
        )}
      </div>

      <div className="card">
        <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="input-group" style={{ maxWidth: 420 }}>
            <span className="input-group-text bg-white">
              <i className="bi bi-search" aria-hidden="true" />
            </span>
            <input
              type="search"
              className="form-control"
              placeholder="Search by name, patient ID or phone…"
              aria-label="Search patients"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          {!loading && !error && <span className="text-muted small">{plural(patients.length, "patient")}</span>}
        </div>
        <div className="card-body">
          {loading ? (
            <LoadingState label="Loading patients…" />
          ) : error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : patients.length === 0 ? (
            query ? (
              <EmptyState
                icon="bi-search"
                title={`No patients match "${query}"`}
                message="Search matches the start of a name, a patient ID (e.g. PHC-0012 or 12) or a phone number."
              />
            ) : archived ? (
              <EmptyState icon="bi-archive" title="No archived patients" message="Archived records will appear here." />
            ) : (
              <EmptyState
                icon="bi-people"
                title="No patients registered yet"
                message="Select Register Patient to add your first record."
              />
            )
          ) : (
            <div className="table-responsive">
              <table className="table table-mt align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">Patient ID</th>
                    <th scope="col">Name</th>
                    <th scope="col">Gender</th>
                    <th scope="col">Phone</th>
                    <th scope="col">{archived ? "Archived" : "Registered"}</th>
                    <th scope="col" className="text-end">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => {
                    const name = `${p.firstName} ${p.lastName}`;
                    return (
                      <tr key={p.patientId}>
                        <td className="fw-semibold text-primary">{p.patientId}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <Avatar firstName={p.firstName} lastName={p.lastName} size={36} />
                            <Link to={`/patients/${p.patientId}`} className="text-decoration-none fw-semibold">
                              {name}
                            </Link>
                          </div>
                        </td>
                        <td>
                          <GenderBadge gender={p.gender} />
                        </td>
                        <td>{p.phone || "—"}</td>
                        <td>{formatDate(archived ? p.archivedAt : p.dateRegistered)}</td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm" role="group" aria-label={`Actions for ${name}`}>
                            <Link to={`/patients/${p.patientId}`} className="btn btn-outline-primary" title={`View ${name}`}>
                              <i className="bi bi-eye" aria-hidden="true" />
                              <span className="visually-hidden">View {name}</span>
                            </Link>
                            {!archived && can("patients:write") && (
                              <Link
                                to={`/patients/${p.patientId}/edit`}
                                className="btn btn-outline-secondary"
                                title={`Edit ${name}`}
                              >
                                <i className="bi bi-pencil" aria-hidden="true" />
                                <span className="visually-hidden">Edit {name}</span>
                              </Link>
                            )}
                            {can("patients:archive") && (
                              <button
                                type="button"
                                className={`btn ${archived ? "btn-outline-success" : "btn-outline-danger"}`}
                                title={archived ? `Restore ${name}` : `Archive ${name}`}
                                onClick={() => setPending(p)}
                              >
                                <i className={`bi ${archived ? "bi-arrow-counterclockwise" : "bi-archive"}`} aria-hidden="true" />
                                <span className="visually-hidden">{archived ? "Restore" : "Archive"} {name}</span>
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

      <ConfirmModal
        show={Boolean(pending)}
        title={archived ? "Restore patient record?" : "Archive patient record?"}
        message={
          pending &&
          (archived
            ? `${pending.firstName} ${pending.lastName} (${pending.patientId}) will reappear in the patient list and can be edited again.`
            : `${pending.firstName} ${pending.lastName} (${pending.patientId}) will be hidden from patient lists. Their details and consultation history are kept, and an administrator can restore them at any time.`)
        }
        confirmLabel={archived ? "Restore patient" : "Archive patient"}
        confirmVariant={archived ? "success" : "danger"}
        busy={working}
        onConfirm={confirmAction}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
