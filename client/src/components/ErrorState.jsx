import { Link } from "react-router-dom";
import EmptyState from "./EmptyState.jsx";

/**
 * Shown when an API request fails. 404s get a "go back" link,
 * everything else gets a retry button.
 */
export default function ErrorState({ error, onRetry, notFoundTitle = "Patient not found" }) {
  if (error?.status === 404) {
    return (
      <EmptyState
        icon="bi-exclamation-triangle"
        title={notFoundTitle}
        message="This record may have been archived, or the link is wrong. Return to the patient list to try again."
      >
        <Link to="/patients" className="btn btn-outline-primary mt-3">
          Back to patients
        </Link>
      </EmptyState>
    );
  }

  return (
    <EmptyState icon="bi-wifi-off" title="Couldn't load this page" message={error?.message}>
      {onRetry && (
        <button type="button" className="btn btn-outline-primary mt-3" onClick={onRetry}>
          Try again
        </button>
      )}
    </EmptyState>
  );
}
