import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { calculateAge, formatDate, formatDateTime, plural } from "../lib/format.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Avatar, GenderBadge } from "../components/Badges.jsx";
import { ConfirmModal } from "../components/Modal.jsx";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";

function InfoRow({ label, value, end = true }) {
  return (
    <div className="d-flex justify-content-between gap-3 py-2 border-bottom info-row">
      <span className="text-muted">{label}</span>
      <span className={`fw-semibold${end ? " text-end" : ""}`}>{value || "—"}</span>
    </div>
  );
}

function ConsultationTimeline({ patientId, canAdd }) {
  const { data, loading, error, reload } = useApi(() => api.listConsultations(patientId), [patientId]);
  const consultations = data?.consultations || [];

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span>
          <i className="bi bi-clipboard2-pulse me-2 text-primary" aria-hidden="true" />
          Consultation history
        </span>
        {!loading && !error && <span className="text-muted small fw-normal">{plural(consultations.length, "record")}</span>}
      </div>
      <div className="card-body">
        {loading ? (
          <LoadingState label="Loading consultations…" />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : consultations.length === 0 ? (
          <EmptyState
            icon="bi-clipboard2-pulse"
            title="No consultations recorded yet"
            message={canAdd ? "Select Add Consultation to log this patient's first visit." : "Visits recorded by a doctor will appear here."}
          />
        ) : (
          <div className="timeline">
            {consultations.map((c) => (
              <article className="timeline-item" key={c.consultationId}>
                <div className="timeline-marker" aria-hidden="true" />
                <div className="timeline-content">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                    <h3 className="h6 mb-0">{c.complaint}</h3>
                    <span className="badge text-bg-light border">{formatDate(c.date)}</span>
                  </div>
                  <dl className="row small mb-0">
                    <dt className="col-sm-3 text-muted fw-normal">Diagnosis</dt>
                    <dd className="col-sm-9">{c.diagnosis || "—"}</dd>
                    <dt className="col-sm-3 text-muted fw-normal">Treatment</dt>
                    <dd className="col-sm-9">{c.treatment || "—"}</dd>
                    <dt className="col-sm-3 text-muted fw-normal">Prescription</dt>
                    <dd className="col-sm-9">{c.prescription || "—"}</dd>
                    {c.doctorNotes && (
                      <>
                        <dt className="col-sm-3 text-muted fw-normal">Doctor&apos;s notes</dt>
                        <dd className="col-sm-9 fst-italic">{c.doctorNotes}</dd>
                      </>
                    )}
                  </dl>
                  <p className="timeline-meta mb-0">
                    Recorded by {c.recordedBy?.name || "unknown"} on {formatDateTime(c.createdAt)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatientProfile() {
  const { patientId } = useParams();
  const { can } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useApi(() => api.getPatient(patientId), [patientId]);
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);

  if (loading) return <LoadingState label="Loading patient…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const patient = data.patient;
  const name = `${patient.firstName} ${patient.lastName}`;
  const age = calculateAge(patient.dateOfBirth);
  const isArchived = Boolean(patient.archived);

  const toggleArchive = async () => {
    setWorking(true);
    try {
      const result = isArchived ? await api.restorePatient(patientId) : await api.archivePatient(patientId);
      setData(result);
      toast.success(isArchived ? `${name} restored.` : `${name} archived.`);
      setConfirming(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Dashboard", to: "/" },
          isArchived ? { label: "Archived", to: "/patients/archived" } : { label: "Patients", to: "/patients" },
          { label: name },
        ]}
      />

      {isArchived && (
        <div className="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2" role="status">
          <span>
            <i className="bi bi-archive-fill me-2" aria-hidden="true" />
            Archived on {formatDate(patient.archivedAt)}
            {patient.archivedBy?.name ? ` by ${patient.archivedBy.name}` : ""}. Restore the record to edit it or add consultations.
          </span>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body p-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <Avatar firstName={patient.firstName} lastName={patient.lastName} size={72} />
            <div>
              <h1 className="h3 mb-1">{name}</h1>
              <div className="d-flex flex-wrap align-items-center gap-2 text-muted">
                <span className="fw-semibold text-primary">{patient.patientId}</span>
                <span aria-hidden="true">&bull;</span>
                <GenderBadge gender={patient.gender} />
                <span aria-hidden="true">&bull;</span>
                <span>{age !== null ? `${age} years old` : "Age unknown"}</span>
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            {!isArchived && can("patients:write") && (
              <Link to={`/patients/${patientId}/edit`} className="btn btn-outline-secondary">
                <i className="bi bi-pencil me-1" aria-hidden="true" />
                Edit Patient
              </Link>
            )}
            {!isArchived && can("consultations:add") && (
              <Link to={`/patients/${patientId}/consultations/new`} className="btn btn-success">
                <i className="bi bi-plus-circle-fill me-1" aria-hidden="true" />
                Add Consultation
              </Link>
            )}
            {can("patients:archive") && (
              <button
                type="button"
                className={`btn ${isArchived ? "btn-outline-success" : "btn-outline-danger"}`}
                onClick={() => setConfirming(true)}
              >
                <i className={`bi ${isArchived ? "bi-arrow-counterclockwise" : "bi-archive"} me-1`} aria-hidden="true" />
                {isArchived ? "Restore Patient" : "Archive Patient"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-header">
              <i className="bi bi-person-vcard me-2 text-primary" aria-hidden="true" />
              Patient information
            </div>
            <div className="card-body">
              <InfoRow label="Date of birth" value={formatDate(patient.dateOfBirth)} />
              <InfoRow label="Phone number" value={patient.phone} />
              <InfoRow label="Address" value={patient.address} />
              <InfoRow label="Date registered" value={formatDate(patient.dateRegistered)} />
              <InfoRow label="Registered by" value={patient.createdBy?.name} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <i className="bi bi-droplet-half me-2 text-primary" aria-hidden="true" />
              Medical information
            </div>
            <div className="card-body">
              <InfoRow label="Blood group" value={patient.bloodGroup} />
              <InfoRow label="Genotype" value={patient.genotype} />
              <div className="pt-3">
                <span className="text-muted d-block mb-1">Known allergies</span>
                {patient.allergies ? (
                  <p className="mb-0 fw-semibold text-danger">
                    <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
                    {patient.allergies}
                  </p>
                ) : (
                  <p className="mb-0 text-muted fst-italic">None recorded</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          {can("consultations:view") ? (
            <ConsultationTimeline patientId={patientId} canAdd={!isArchived && can("consultations:add")} />
          ) : (
            <div className="card">
              <div className="card-header">
                <i className="bi bi-clipboard2-pulse me-2 text-primary" aria-hidden="true" />
                Consultation history
              </div>
              <div className="card-body">
                <EmptyState
                  icon="bi-lock"
                  title="Visible to doctors and administrators"
                  message={`${plural(patient.consultationCount || 0, "consultation")} on file. Clinical notes are restricted to protect patient privacy.`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        show={confirming}
        title={isArchived ? "Restore patient record?" : "Archive patient record?"}
        message={
          isArchived
            ? `${name} (${patient.patientId}) will reappear in the patient list and can be edited again.`
            : `${name} (${patient.patientId}) will be hidden from patient lists. Their details and consultation history are kept, and an administrator can restore them at any time.`
        }
        confirmLabel={isArchived ? "Restore patient" : "Archive patient"}
        confirmVariant={isArchived ? "success" : "danger"}
        busy={working}
        onConfirm={toggleArchive}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
