import { Routes, Route } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import RequireAuth from "./components/RequireAuth.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PatientList from "./pages/PatientList.jsx";
import RegisterPatient from "./pages/RegisterPatient.jsx";
import EditPatient from "./pages/EditPatient.jsx";
import PatientProfile from "./pages/PatientProfile.jsx";
import AddConsultation from "./pages/AddConsultation.jsx";
import Staff from "./pages/Staff.jsx";
import NotFound from "./pages/NotFound.jsx";

/**
 * Route map. Every route inside <RequireAuth> needs a signed-in staff
 * member; the `permission` prop adds a role check on top.
 * (The server enforces the same rules independently.)
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<PatientList />} />
        <Route
          path="patients/new"
          element={
            <RequireAuth permission="patients:write">
              <RegisterPatient />
            </RequireAuth>
          }
        />
        <Route
          path="patients/archived"
          element={
            <RequireAuth permission="patients:archive">
              <PatientList archived />
            </RequireAuth>
          }
        />
        <Route path="patients/:patientId" element={<PatientProfile />} />
        <Route
          path="patients/:patientId/edit"
          element={
            <RequireAuth permission="patients:write">
              <EditPatient />
            </RequireAuth>
          }
        />
        <Route
          path="patients/:patientId/consultations/new"
          element={
            <RequireAuth permission="consultations:add">
              <AddConsultation />
            </RequireAuth>
          }
        />
        <Route
          path="staff"
          element={
            <RequireAuth permission="staff:manage">
              <Staff />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
