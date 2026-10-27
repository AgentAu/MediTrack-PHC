import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState.jsx";

export default function NotFound() {
  return (
    <EmptyState icon="bi-signpost-split" title="Page not found" message="The address may be mistyped, or the page has moved.">
      <Link to="/" className="btn btn-outline-primary mt-3">
        Go to dashboard
      </Link>
    </EmptyState>
  );
}
