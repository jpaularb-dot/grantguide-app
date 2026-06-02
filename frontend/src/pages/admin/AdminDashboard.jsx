// pages/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { DARK_GREEN, LIGHT_GREEN, LIGHT_GREEN_BORDER, LIGHT_GREEN_CARD } from "../../lib/theme";
import Icon from "../../components/Icon";
import { Spinner } from "../../components/ui";

export default function AdminDashboard({ setPage }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setData(await api.adminStats()); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size={28} color={DARK_GREEN} /></div>;
  const s = data?.stats || {};
  const cards = [
    { label: "Total Applications", value: s.total_applications, icon: "file",  color: `linear-gradient(135deg, ${DARK_GREEN}, #2d5227)` },
    { label: "Pending Review",     value: s.pending,            icon: "clock", color: "linear-gradient(135deg,#f59e0b,#f97316)" },
    { label: "Approved",           value: s.approved,           icon: "check", color: "linear-gradient(135deg,#10b981,#16a34a)" },
    { label: "Open Programs",      value: s.open_scholarships,  icon: "star",  color: "linear-gradient(135deg,#0d9488,#0891b2)" },
    { label: "Registered Students",value: s.total_students,     icon: "users", color: "linear-gradient(135deg,#6366f1,#4f46e5)" },
    { label: "Docs to Verify",     value: s.pending_documents,  icon: "shield",color: "linear-gradient(135deg,#ec4899,#db2777)" },
  ];
  const max = Math.max(1, ...(data?.applications_per_scholarship || []).map((r) => Number(r.applications)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "Georgia, serif" }}>Scholarship Office Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of programs, applications, and verification workload.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon, color }) => (
          <div key={label} className="rounded-2xl p-5" style={{ background: "white", border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: color }}>
              <Icon name={icon} size={18} className="text-white" />
            </div>
            <p className="text-3xl font-bold text-slate-800 mb-1">{value ?? 0}</p>
            <p className="text-slate-500 text-xs font-medium leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5" style={{ background: "white", border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
        <h2 className="font-bold text-slate-800 mb-4">Applications per Scholarship</h2>
        <div className="space-y-3">
          {(data?.applications_per_scholarship || []).map((r) => (
            <div key={r.title}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium truncate pr-2">{r.title}</span>
                <span className="text-slate-400">{r.applications}</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: LIGHT_GREEN_CARD }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${(Number(r.applications) / max) * 100}%`, background: DARK_GREEN }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => setPage("admin-applications")} className="text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2" style={{ background: DARK_GREEN }}>
          <Icon name="clipboard" size={15} /> Review Applications
        </button>
        <button onClick={() => setPage("admin-scholarships")} className="font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2" style={{ background: LIGHT_GREEN, color: DARK_GREEN }}>
          <Icon name="plus" size={15} /> Manage Scholarships
        </button>
      </div>
    </div>
  );
}
