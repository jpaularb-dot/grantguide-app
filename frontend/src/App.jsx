// App.jsx — root component: session gating + role-based routing.
import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import { DARK_GREEN } from "./lib/theme";
import { Spinner, Toast } from "./components/ui";
import Shell from "./components/Shell";
import AuthPage from "./pages/AuthPage";

import Dashboard from "./pages/student/Dashboard";
import Browse from "./pages/student/Browse";
import ApplyWizard from "./pages/student/ApplyWizard";
import Applications from "./pages/student/Applications";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageScholarships from "./pages/admin/ManageScholarships";
import ReviewApplications from "./pages/admin/ReviewApplications";
import Applicants from "./pages/admin/Applicants";
import Logs from "./pages/admin/Logs";

export default function App() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [applyId, setApplyId] = useState(null);
  const [toast, setToast] = useState(null);

  // Set the default landing page per role whenever the user changes.
  useEffect(() => {
    if (user) setPage(user.role === "admin" ? "admin-dashboard" : "dashboard");
  }, [user?.id, user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#eef3dc" }}>
        <Spinner size={32} color={DARK_GREEN} />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const startApply = (id) => { setApplyId(id); setPage("apply"); };

  // ── Student routes ───────────────────────────────────────────────
  const studentPages = {
    dashboard:    <Dashboard setPage={setPage} openScholarship={startApply} />,
    browse:       <Browse onApply={startApply} />,
    gigs:         <Browse onApply={startApply} mode="gigs" />,
    applications: <Applications />,
    apply:        <ApplyWizard scholarshipId={applyId} toast={setToast}
                    onDone={(goApps) => { setApplyId(null); setPage(goApps ? "applications" : "browse"); }} />,
  };

  // ── Admin routes (RBAC enforced again on the backend) ────────────
  const adminPages = {
    "admin-dashboard":    <AdminDashboard setPage={setPage} />,
    "admin-scholarships": <ManageScholarships toast={setToast} />,
    "admin-applications": <ReviewApplications toast={setToast} />,
    "admin-applicants":   <Applicants />,
    "admin-logs":         <Logs />,
  };

  const routes = user.role === "admin" ? adminPages : studentPages;
  const fallback = user.role === "admin" ? "admin-dashboard" : "dashboard";

  return (
    <>
      <Shell page={page} setPage={setPage}>
        {routes[page] || routes[fallback]}
      </Shell>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
