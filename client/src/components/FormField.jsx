/**
 * Label + control + validation message, with Bootstrap classes.
 * Pass `as="select"` or `as="textarea"`; extra props go to the control.
 */
export default function FormField({
  label,
  name,
  required = false,
  optional = false,
  error,
  as = "input",
  className = "",
  children,
  ...controlProps
}) {
  const Control = as;
  const base = as === "select" ? "form-select" : "form-control";
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div className={className}>
      <label className="form-label" htmlFor={name}>
        {label} {required && <span className="text-danger">*</span>}
        {optional && <span className="text-muted fw-normal">(optional)</span>}
      </label>
      <Control
        id={name}
        name={name}
        className={`${base}${error ? " is-invalid" : ""}`}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        required={required}
        {...controlProps}
      >
        {children}
      </Control>
      {error && (
        <div className="invalid-feedback" id={errorId}>
          {error}
        </div>
      )}
    </div>
  );
}
