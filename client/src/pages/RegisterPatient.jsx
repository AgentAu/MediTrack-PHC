import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import PatientForm from "../components/PatientForm.jsx";

export default function RegisterPatient() {
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (values) => {
    try {
      const { patient } = await api.createPatient(values);
      toast.success(`${patient.firstName} ${patient.lastName} registered as ${patient.patientId}.`);
      navigate(`/patients/${patient.patientId}`);
    } catch (err) {
      toast.error(err.message);
      throw err; // lets the form show field errors from the server
    }
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Dashboard", to: "/" }, { label: "Patients", to: "/patients" }, { label: "Register patient" }]} />

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="section-title h3 mb-0">Register new patient</h1>
          <p className="section-subtitle mb-0">A unique patient ID (PHC-####) is assigned when you save.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-4">
          <PatientForm onSubmit={handleSubmit} submitLabel="Register Patient" submittingLabel="Registering…" cancelTo="/patients" />
        </div>
      </div>
    </>
  );
}
