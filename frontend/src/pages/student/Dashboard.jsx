// pages/student/Dashboard.jsx
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { DARK_GREEN, LIGHT_GREEN, LIGHT_GREEN_BORDER, LIGHT_GREEN_CARD } from "../../lib/theme";
import Icon from "../../components/Icon";
import { StatusBadge, Spinner } from "../../components/ui";

export default function Dashboard({ setPage, openScholarship }) {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [a, s] = await Promise.all([api.applications(), api.scholarships("?status=open")]);
        setApps(a.applications || []);
        setScholarships(s.scholarships || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stat = (f) => apps.filter((a) => a.status === f).length;
  const stats = [
    { label: "Open Programs",        value: scholarships.length, icon: "star",  color: `linear-gradient(135deg, ${DARK_GREEN}, #2d5227)` },
    { label: "Applications",         value: apps.length,         icon: "file",  color: "linear-gradient(135deg,#0d9488,#0891b2)" },
    { label: "Under Review",         value: stat("reviewing"),   icon: "clock", color: "linear-gradient(135deg,#f59e0b,#f97316)" },
    { label: "Approved",             value: stat("approved"),    icon: "check", color: "linear-gradient(135deg,#10b981,#16a34a)" },
  ];

  if (loading) return <div className="py-20 flex justify-center"><Spinner size={28} color={DARK_GREEN} /></div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${LIGHT_GREEN}, #cdd98a)` }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
        <p className="text-sm font-medium mb-1" style={{ color: DARK_GREEN }}>Welcome back,</p>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "Georgia, serif", color: DARK_GREEN }}>{user.full_name} 👋</h1>
        <p className="text-sm" style={{ color: "#4a6b3a" }}>{user.student_id ? `Student ID: ${user.student_id}` : user.email}</p>
        <button onClick={() => setPage("browse")} className="mt-4 inline-flex items-center gap-2 font-semibold px-4 py-2 rounded-xl text-sm transition" style={{ background: DARK_GREEN, color: "white" }}>
          Browse Scholarships <Icon name="chevron" size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon, color }) => (
          <div key={label} className="rounded-2xl p-5" style={{ background: "white", border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: color }}>
              <Icon name={icon} size={18} className="text-white" />
            </div>
            <p className="text-3xl font-bold text-slate-800 mb-1">{value}</p>
            <p className="text-slate-500 text-xs font-medium leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5" style={{ background: "white", border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800">Recent Applications</h2>
          <button onClick={() => setPage("applications")} className="text-sm font-semibold" style={{ color: DARK_GREEN }}>View all →</button>
        </div>
        {apps.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="file" size={32} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No applications yet.</p>
            <button onClick={() => setPage("browse")} className="mt-2 text-sm font-semibold" style={{ color: DARK_GREEN }}>Browse scholarships</button>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.slice(0, 3).map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: LIGHT_GREEN_CARD }}>
                <div>
                  <p className="font-semibold text-slate-700 text-sm">{app.scholarship_title}</p>
                  <p className="text-slate-400 text-xs">{app.provider} · {new Date(app.submitted_at).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl p-5" style={{ background: "white", border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
        <h2 className="font-bold text-slate-800 mb-4">Featured Scholarships</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {scholarships.slice(0, 4).map((opp) => (
            <div key={opp.id} className="rounded-xl p-4 cursor-pointer transition-all" onClick={() => openScholarship(opp.id)}
              style={{ background: LIGHT_GREEN_CARD, border: `1px solid ${LIGHT_GREEN_BORDER}` }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = DARK_GREEN; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LIGHT_GREEN_BORDER; }}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: "#dce8c8", color: "#3d6b34" }}>{opp.category}</span>
                {opp.slots && <span className="text-slate-500 text-xs">{opp.slots} slots</span>}
              </div>
              <p className="font-semibold text-slate-700 text-sm mb-1">{opp.title}</p>
              <p className="text-slate-400 text-xs">{opp.provider}</p>
              <p className="font-bold text-sm mt-2" style={{ color: DARK_GREEN }}>{opp.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
