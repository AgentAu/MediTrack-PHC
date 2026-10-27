import { useState } from "react";
import { Link } from "react-router-dom";
import FormField from "./FormField.jsx";
import { capitalizeWords, todayIso } from "../lib/format.js";

export const EMPTY_PATIENT = {
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  phone: "",
  address: "",
  bloodGroup: "",
  genotype: "",
  allergies: "",
};

const REQUIRED = ["firstName", "lastName", "gender", "dateOfBirth", "phone"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENOTYPES = ["AA", "AS", "SS", "AC"];

function validate(values) {
  const errors = {};
  REQUIRED.forEach((field) => {
    if (!String(values[field] || "").trim()) errors[field] = "This field is required.";
  });
  if (values.dateOfBirth && values.dateOfBirth > todayIso()) {
    errors.dateOfBirth = "Date of birth can't be in the future.";
  }
  if (values.phone && !/^\+?[0-9\s\-()]{7,20}$/.test(values.phone.trim())) {
    errors.phone = "Enter a valid phone number, e.g. 08012345678.";
  }
  return errors;
}

/**
 * Shared form for Register Patient and Edit Patient.
 *
 * @param {Object} props
 * @param {Object} props.initialValues
 * @param {(values: Object) => Promise<void>} props.onSubmit - throw an ApiError to show server-side field errors
 * @param {string} props.submitLabel
 * @param {string} props.submittingLabel
 * @param {string} props.cancelTo
 */
export default function PatientForm({ initialValues = EMPTY_PATIENT, onSubmit, submitLabel, submittingLabel, cancelTo }) {
  const [values, setValues] = useState({ ...EMPTY_PATIENT, ...initialValues });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((errs) => ({ ...errs, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientErrors = validate(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSubmitting(true);
    try {
      await onSubmit({
        ...values,
        firstName: capitalizeWords(values.firstName),
        lastName: capitalizeWords(values.lastName),
      });
    } catch (err) {
      setErrors(err.details || {});
      setSubmitting(false);
    }
  };

  const field = (name) => ({ name, value: values[name], onChange: handleChange, error: errors[name] });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="required-field-hint">
        Fields marked <span className="text-danger">*</span> are required.
      </p>

      <h2 className="form-section-title">Personal information</h2>
      <div className="row g-3 mb-4">
        <FormField label="First name" required className="col-md-6" autoComplete="off" {...field("firstName")} />
        <FormField label="Last name" required className="col-md-6" autoComplete="off" {...field("lastName")} />
        <FormField label="Gender" required as="select" className="col-md-4" {...field("gender")}>
          <option value="" disabled>
            Select…
          </option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </FormField>
        <FormField label="Date of birth" required type="date" max={todayIso()} className="col-md-4" {...field("dateOfBirth")} />
        <FormField label="Phone number" required type="tel" placeholder="080…" className="col-md-4" {...field("phone")} />
        <FormField label="Address" as="textarea" rows={2} className="col-12" {...field("address")} />
      </div>

      <h2 className="form-section-title">Medical information</h2>
      <div className="row g-3 mb-4">
        <FormField label="Blood group" as="select" className="col-md-6" {...field("bloodGroup")}>
          <option value="">Unknown</option>
          {BLOOD_GROUPS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </FormField>
        <FormField label="Genotype" as="select" className="col-md-6" {...field("genotype")}>
          <option value="">Unknown</option>
          {GENOTYPES.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </FormField>
        <FormField
          label="Known allergies"
          as="textarea"
          rows={2}
          placeholder="e.g. Penicillin, none known…"
          className="col-12"
          {...field("allergies")}
        />
      </div>

      <div className="d-flex justify-content-end gap-2">
        <Link to={cancelTo} className="btn btn-outline-secondary">
          Cancel
        </Link>
        <button type="submit" className="btn btn-primary px-4" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              {submittingLabel}
            </>
          ) : (
            <>
              <i className="bi bi-check-circle-fill me-1" aria-hidden="true" />
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
