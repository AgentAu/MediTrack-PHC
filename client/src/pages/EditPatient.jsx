import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { useToast } from "../context/ToastContext.jsx";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import PatientForm from "../components/PatientForm.jsx";
import ErrorState from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingState from "../components/LoadingState.jsx";

export default function EditPatient() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => api.getPatient(patientId), [patientId]);
  const patient = data?.patient;

  const handleSubmit = async (values) => {
    try {
      await api.updatePatient(patientId, values);
      toast.success("Patient details saved.");
      navigate(`/patients/${patientId}`);
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  if (loading) return <LoadingState label="Loading patient…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Patients", to: "/patients" },
          { label: `${patient.firstName} ${patient.lastName}`, to: `/patients/${patientId}` },
          { label: "Edit" },
        ]}
      />

      <div className="mb-4">
        <h1 className="section-title h3 mb-0">Edit patient details</h1>
        <p className="section-subtitle mb-0">
          {patient.firstName} {patient.lastName} &middot; <span className="fw-semibold text-primary">{patient.patientId}</span>
        </p>
      </div>

      <div className="card">
        <div className="card-body p-4">
          {patient.archived ? (
            <EmptyState
              icon="bi-archive"
              title="This patient is archived"
              message="Restore the record from the patient's profile before editing it."
            />
          ) : (
            <PatientForm
              initialValues={patient}
              onSubmit={handleSubmit}
              submitLabel="Save changes"
              submittingLabel="Saving…"
              cancelTo={`/patients/${patientId}`}
            />
          )}
        </div>
      </div>
    </>
  );
}
