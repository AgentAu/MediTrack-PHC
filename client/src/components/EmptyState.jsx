/**
 * Friendly empty/notice block (replaces renderEmptyState from ui.js).
 */
export default function EmptyState({ icon = "bi-inbox", title, message, children }) {
  return (
    <div className="text-center py-5 text-muted empty-state">
      <i className={`bi ${icon} display-4 d-block mb-3`} aria-hidden="true" />
      <p className="fw-semibold mb-1 text-body">{title}</p>
      {message && <p className="small mb-0 mx-auto" style={{ maxWidth: 440 }}>{message}</p>}
      {children}
    </div>
  );
}
