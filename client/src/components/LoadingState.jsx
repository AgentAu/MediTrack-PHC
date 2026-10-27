export default function LoadingState({ label = "Loading…" }) {
  return (
    <div className="text-center py-5 text-muted" role="status">
      <div className="spinner-border text-primary mb-3" aria-hidden="true" />
      <p className="mb-0 small">{label}</p>
    </div>
  );
}
