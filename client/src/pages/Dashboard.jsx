import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { formatDate } from "../lib/format.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Avatar, GenderBadge } from "../components/Badges.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";

function StatCard({ icon, tone, value, label }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="stat-card">
        <div className={`stat-icon ${tone}`}>
          <i className={`bi ${icon}`} aria-hidden="true" />
        </div>
        <div>
          <div className="stat-value">{value ?? "–"}</div>
          <div className="stat-label">{label}</div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data, loading, error, reload } = useApi(() => api.getStats(), []);

  const handleSearch = (e) => {
    e.preventDefault();
    const term = search.trim();
    navigate(term ? `/patients?q=${encodeURIComponent(term)}` : "/patients");
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <h1 className="section-title h3 mb-0">Dashboard</h1>
          <p className="section-subtitle mb-0">Welcome back, {user?.name?.split(" ")[0]}.</p>
        </div>
        <form className="d-flex w-100" style={{ maxWidth: 420 }} role="search" onSubmit={handleSearch}>
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="bi bi-search" aria-hidden="true" />
            </span>
            <input
              type="search"
              className="form-control"
              placeholder="Search by name, patient ID or phone…"
              aria-label="Search patients"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Search
            </button>
          </div>
        </form>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <>
          <div className="row g-3 mb-4">
            <StatCard icon="bi-people-fill" tone="bg-primary-soft" value={data?.totalPatients} label="Total patients" />
            <StatCard icon="bi-gender-male" tone="bg-info-soft" value={data?.malePatients} label="Male patients" />
            <StatCard icon="bi-gender-female" tone="bg-warning-soft" value={data?.femalePatients} label="Female patients" />
            <StatCard
              icon="bi-clipboard2-pulse-fill"
              tone="bg-green-soft"
              value={data?.totalConsultations}
              label="Total consultations"
            />
          </div>

          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span>
                    <i className="bi bi-clock-history me-2 text-primary" aria-hidden="true" />
                    Recently registered patients
                  </span>
                  <Link to="/patients" className="small text-decoration-none">
                    View all
                  </Link>
                </div>
                <div className="card-body">
                  {loading ? (
                    <LoadingState label="Loading patients…" />
                  ) : data.recentPatients.length === 0 ? (
                    <EmptyState
                      icon="bi-people"
                      title="No patients registered yet"
                      message="Register your first patient to see them here."
                    />
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-mt align-middle mb-0">
                        <thead>
                          <tr>
                            <th scope="col">Patient</th>
                            <th scope="col">Gender</th>
                            <th scope="col">Phone</th>
                            <th scope="col">Registered</th>
                            <th scope="col" className="text-end">
                              <span className="visually-hidden">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.recentPatients.map((p) => (
                            <tr key={p.patientId}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <Avatar firstName={p.firstName} lastName={p.lastName} size={36} />
                                  <div>
                                    <Link to={`/patients/${p.patientId}`} className="fw-semibold text-decoration-none">
                                      {p.firstName} {p.lastName}
                                    </Link>
                                    <div className="text-muted small">{p.patientId}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <GenderBadge gender={p.gender} />
                              </td>
                              <td>{p.phone || "—"}</td>
                              <td>{formatDate(p.dateRegistered)}</td>
                              <td className="text-end">
                                <Link to={`/patients/${p.patientId}`} className="btn btn-sm btn-outline-primary">
                                  <i className="bi bi-eye me-1" aria-hidden="true" />
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-header">
                  <i className="bi bi-lightning-charge-fill me-2 text-primary" aria-hidden="true" />
                  Quick actions
                </div>
                <div className="card-body d-grid gap-2 align-content-start">
                  {can("patients:write") && (
                    <Link to="/patients/new" className="btn btn-primary text-start">
                      <i className="bi bi-person-plus-fill me-2" aria-hidden="true" />
                      Register new patient
                    </Link>
                  )}
                  <Link to="/patients" className="btn btn-outline-primary text-start">
                    <i className="bi bi-people-fill me-2" aria-hidden="true" />
                    View all patients
                  </Link>
                  {can("patients:archive") && (
                    <Link to="/patients/archived" className="btn btn-outline-secondary text-start">
                      <i className="bi bi-archive me-2" aria-hidden="true" />
                      Archived patients
                    </Link>
                  )}
                  {can("staff:manage") && (
                    <Link to="/staff" className="btn btn-outline-secondary text-start">
                      <i className="bi bi-person-badge me-2" aria-hidden="true" />
                      Manage staff
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
