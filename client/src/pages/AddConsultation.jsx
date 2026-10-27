import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { todayIso } from "../lib/format.js";
import { useToast } from "../context/ToastContext.jsx";
import { Avatar } from "../components/Badges.jsx";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import FormField from "../components/FormField.jsx";
import LoadingState from "../components/LoadingState.jsx";

const REQUIRED = ["date", "complaint", "diagnosis"];

export default function AddConsultation() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => api.getPatient(patientId), [patientId]);

  const [values, setValues] = useState({
    date: todayIso(),
    complaint: "",
    diagnosis: "",
    treatment: "",
    prescription: "",
    doctorNotes: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <LoadingState label="Loading patient…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const patient = data.patient;
  const name = `${patient.firstName} ${patient.lastName}`;

  const handleChange = (e) => {
    const { name: field, value } = e.target;
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientErrors = {};
    REQUIRED.forEach((f) => {
      if (!values[f].trim()) clientErrors[f] = "This field is required.";
    });
    if (values.date > todayIso()) clientErrors.date = "Consultation date can't be in the future.";
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      toast.error("Fill in the date, complaint and diagnosis.");
      return;
    }

    setSubmitting(true);
    try {
      await api.addConsultation(patientId, values);
      toast.success("Consultation saved to patient history.");
      navigate(`/patients/${patientId}`);
    } catch (err) {
      setErrors(err.details || {});
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  const field = (fieldName) => ({ name: fieldName, value: values[fieldName], onChange: handleChange, error: errors[fieldName] });

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Patients", to: "/patients" },
          { label: name, to: `/patients/${patientId}` },
          { label: "Add consultation" },
        ]}
      />

      <div className="mb-4">
        <h1 className="section-title h3 mb-0">Add consultation</h1>
        <p className="section-subtitle mb-0">Saved entries are added to the patient&apos;s history and can&apos;t be edited later.</p>
      </div>

      <div className="card">
        <div className="card-body p-4">
          <div className="consultation-context mb-4">
            <div className="d-flex align-items-center gap-3">
              <Avatar firstName={patient.firstName} lastName={patient.lastName} size={48} />
              <div>
                <div className="fw-semibold">{name}</div>
                <div className="text-muted small">{patient.patientId}</div>
              </div>
            </div>
            {patient.allergies && (
              <p className="mb-0 mt-2 small fw-semibold text-danger">
                <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
                Allergies: {patient.allergies}
              </p>
            )}
          </div>

          {patient.archived ? (
            <EmptyState
              icon="bi-archive"
              title="This patient is archived"
              message="An administrator must restore the record before new consultations can be added."
            />
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <p className="required-field-hint">
                Fields marked <span className="text-danger">*</span> are required.
              </p>
              <div className="row g-3 mb-4">
                <FormField label="Date of visit" required type="date" max={todayIso()} className="col-md-4" {...field("date")} />
                <FormField
                  label="Presenting complaint"
                  required
                  placeholder="e.g. Fever and headache for 3 days"
                  className="col-md-8"
                  {...field("complaint")}
                />
                <FormField label="Diagnosis" required as="textarea" rows={2} className="col-12" {...field("diagnosis")} />
                <FormField label="Treatment" as="textarea" rows={2} className="col-md-6" {...field("treatment")} />
                <FormField label="Prescription" as="textarea" rows={2} className="col-md-6" {...field("prescription")} />
                <FormField label="Doctor's notes" optional as="textarea" rows={3} className="col-12" {...field("doctorNotes")} />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <Link to={`/patients/${patientId}`} className="btn btn-outline-secondary">
                  Cancel
                </Link>
                <button type="submit" className="btn btn-success px-4" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle-fill me-1" aria-hidden="true" />
                      Save Consultation
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
