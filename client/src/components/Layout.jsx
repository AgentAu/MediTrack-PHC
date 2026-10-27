import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ROLE_LABELS } from "../lib/permissions.js";

/**
 * App shell: navbar (links depend on role), page content, footer.
 */
export default function Layout() {
  const { user, role, can, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu after navigating.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const navClass = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark navbar-mt sticky-top">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <i className="bi bi-heart-pulse-fill" aria-hidden="true" />
            MediTrack PHC
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            aria-controls="mainNav"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className={`collapse navbar-collapse${menuOpen ? " show" : ""}`} id="mainNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink className={navClass} to="/" end>
                  Dashboard
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className={navClass} to="/patients" end>
                  Patients
                </NavLink>
              </li>
              {can("patients:archive") && (
                <li className="nav-item">
                  <NavLink className={navClass} to="/patients/archived">
                    Archived
                  </NavLink>
                </li>
              )}
              {can("staff:manage") && (
                <li className="nav-item">
                  <NavLink className={navClass} to="/staff">
                    Staff
                  </NavLink>
                </li>
              )}
            </ul>

            <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2 gap-lg-3">
              {can("patients:write") && (
                <Link to="/patients/new" className="btn btn-register-nav">
                  <i className="bi bi-person-plus-fill me-1" aria-hidden="true" />
                  Register Patient
                </Link>
              )}
              <div className="nav-user">
                <div className="nav-user-text">
                  <span className="nav-user-name">{user?.name}</span>
                  <span className="nav-user-role">{ROLE_LABELS[role] || "No role"}</span>
                </div>
                <button type="button" className="btn btn-sm btn-signout" onClick={logout}>
                  <i className="bi bi-box-arrow-right me-1" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-4 py-md-5 fade-in-up" key={location.pathname}>
        <Outlet />
      </main>

      <footer className="footer-mt text-center">
        <div className="container">MediTrack PHC &middot; Electronic Patient Record Management System</div>
      </footer>
    </>
  );
}
