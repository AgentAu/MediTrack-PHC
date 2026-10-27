import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingState from "./LoadingState.jsx";
import EmptyState from "./EmptyState.jsx";

/**
 * Guards a route:
 *   - not signed in      -> redirect to /login (and come back after)
 *   - no role on account -> explain and offer sign out
 *   - role lacks `permission` -> "not available for your role"
 */
export default function RequireAuth({ children, permission }) {
  const { user, role, loading, can, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container py-5">
        <LoadingState label="Checking your session…" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (!role) {
    return (
      <div className="container py-5">
        <div className="card mx-auto" style={{ maxWidth: 520 }}>
          <div className="card-body p-4">
            <EmptyState
              icon="bi-person-lock"
              title="This account has no role yet"
              message="An administrator needs to assign you a role (doctor, records officer or administrator) before you can use MediTrack."
            >
              <button type="button" className="btn btn-outline-primary mt-3" onClick={logout}>
                Sign out
              </button>
            </EmptyState>
          </div>
        </div>
      </div>
    );
  }

  if (permission && !can(permission)) {
    return (
      <EmptyState
        icon="bi-shield-lock"
        title="This page isn't available for your role"
        message="Ask an administrator if you think you should have access."
      />
    );
  }

  return children;
}
