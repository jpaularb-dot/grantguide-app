// pages/admin/Applicants.jsx — applicant records report.
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { DARK_GREEN, LIGHT_GREEN_BORDER, LIGHT_GREEN_CARD } from "../../lib/theme";
import { Spinner } from "../../components/ui";

export default function Applicants() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setRows((await api.adminApplicants()).applicants || []); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size={28} color={DARK_GREEN} /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "Georgia, serif" }}>Applicant Records</h1>
        <p className="text-slate-500 text-sm mt-1">Registered students and their application activity.</p>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: LIGHT_GREEN_CARD }}>
                {["Name", "Email", "Student ID", "Applications", "Approved", "Pending"].map((h) => (
                  <th key={h} className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider" style={{ color: DARK_GREEN }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: `1px solid ${LIGHT_GREEN_BORDER}` }}>
                  <td className="px-4 py-3 font-semibold text-slate-700">{r.full_name}</td>
                  <td className="px-4 py-3 text-slate-500">{r.email}</td>
                  <td className="px-4 py-3 text-slate-500">{r.student_id || "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{r.total_applications}</td>
                  <td className="px-4 py-3 text-emerald-600 font-semibold">{r.approved || 0}</td>
                  <td className="px-4 py-3 text-amber-600 font-semibold">{r.pending || 0}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No applicants yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
