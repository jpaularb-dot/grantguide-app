// pages/admin/Logs.jsx — moderation / audit trail.
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { DARK_GREEN, LIGHT_GREEN_BORDER, LIGHT_GREEN_CARD } from "../../lib/theme";
import Icon from "../../components/Icon";
import { Spinner } from "../../components/ui";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setLogs((await api.adminLogs()).logs || []); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size={28} color={DARK_GREEN} /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "Georgia, serif" }}>Activity Logs</h1>
        <p className="text-slate-500 text-sm mt-1">Audit trail of administrative actions.</p>
      </div>

      <div className="bg-white rounded-2xl p-2" style={{ border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
        {logs.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No activity recorded yet.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: LIGHT_GREEN_BORDER }}>
            {logs.map((l) => (
              <div key={l.id} className="flex items-start gap-3 p-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: LIGHT_GREEN_CARD }}>
                  <Icon name="settings" size={15} style={{ color: DARK_GREEN }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">{l.admin_name || "System"}</span>{" "}
                    <span className="text-slate-500">{l.action.replace(/_/g, " ")}</span>
                    {l.entity && <span className="text-slate-400"> · {l.entity} #{l.entity_id}</span>}
                  </p>
                  {l.detail && <p className="text-slate-400 text-xs truncate">{l.detail}</p>}
                </div>
                <span className="text-slate-400 text-xs flex-shrink-0">{new Date(l.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
