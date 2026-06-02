// pages/student/Applications.jsx — live status tracking + detail view.
import { useEffect, useState } from "react";
import { api, fileUrl } from "../../api/client";
import { DARK_GREEN, LIGHT_GREEN_BORDER, LIGHT_GREEN_CARD, TYPE_COLORS } from "../../lib/theme";
import Icon from "../../components/Icon";
import { Spinner, StatusBadge, Modal } from "../../components/ui";

const STEPS = ["Submitted", "Reviewing", "Verifying Docs", "Decision"];

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    (async () => {
      try { setApps((await api.applications()).applications || []); }
      finally { setLoading(false); }
    })();
  }, []);

  const openDetail = async (id) => {
    setDetail({ loading: true });
    try { setDetail((await api.application(id)).application); }
    catch { setDetail(null); }
  };

  if (loading) return <div className="py-20 flex justify-center"><Spinner size={28} color={DARK_GREEN} /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "Georgia, serif" }}>My Applications</h1>
        <p className="text-slate-500 text-sm mt-1">Track your live application statuses.</p>
      </div>

      {apps.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
          <Icon name="file" size={40} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No applications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => {
            const stepIndex = { pending: 0, reviewing: 1, approved: 3, rejected: 3 }[app.status] ?? 0;
            const tc = TYPE_COLORS[app.category] || TYPE_COLORS.scholarship;
            return (
              <div key={app.id} className="bg-white rounded-2xl p-5 cursor-pointer transition hover:shadow-md" style={{ border: `1px solid ${LIGHT_GREEN_BORDER}` }} onClick={() => openDetail(app.id)}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full capitalize" style={{ background: tc.bg, color: tc.text }}>{app.category}</span>
                      <StatusBadge status={app.status} />
                    </div>
                    <h3 className="font-bold text-slate-800">{app.scholarship_title}</h3>
                    <p className="text-slate-500 text-xs">{app.provider} · Applied {new Date(app.submitted_at).toLocaleDateString()}</p>
                  </div>
                  <p className="font-bold" style={{ color: DARK_GREEN }}>{app.amount}</p>
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="absolute top-3.5 left-0 right-0 h-0.5 z-0" style={{ background: LIGHT_GREEN_BORDER }} />
                    <div className="absolute top-3.5 left-0 h-0.5 z-0 transition-all duration-700" style={{ width: `${(stepIndex / (STEPS.length - 1)) * 100}%`, background: DARK_GREEN }} />
                    {STEPS.map((step, i) => {
                      const done = i <= stepIndex && app.status !== "rejected";
                      const rejected = app.status === "rejected" && i === stepIndex;
                      return (
                        <div key={step} className="relative z-10 flex flex-col items-center gap-1.5" style={{ flex: 1 }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: rejected ? "#fee2e2" : done ? DARK_GREEN : LIGHT_GREEN_CARD, color: rejected ? "#ef4444" : done ? "white" : "#94a3b8", border: `1.5px solid ${done && !rejected ? DARK_GREEN : LIGHT_GREEN_BORDER}` }}>
                            {done && !rejected ? <Icon name="check" size={12} /> : rejected ? <Icon name="x" size={12} /> : i + 1}
                          </div>
                          <span className="text-slate-500 text-center leading-tight" style={{ fontSize: "9px" }}>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)}>
        {detail?.loading ? (
          <div className="p-10 flex justify-center"><Spinner size={24} color={DARK_GREEN} /></div>
        ) : detail ? (
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{detail.scholarship_title}</h3>
                <p className="text-slate-500 text-sm">{detail.provider}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-slate-400 p-1"><Icon name="x" size={18} /></button>
            </div>
            <div className="mb-4"><StatusBadge status={detail.status} /></div>
            {detail.review_note && (
              <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e" }}>
                <strong>Office note:</strong> {detail.review_note}
              </div>
            )}
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: DARK_GREEN }}>Documents</p>
            <div className="space-y-1.5 mb-4">
              {(detail.documents || []).map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm p-2 rounded-lg" style={{ background: LIGHT_GREEN_CARD }}>
                  <a href={fileUrl(d.file_url)} target="_blank" rel="noreferrer" className="text-slate-700 underline flex items-center gap-1.5"><Icon name="file" size={13} /> {d.label}</a>
                  <StatusBadge status={d.verified} />
                </div>
              ))}
              {(!detail.documents || detail.documents.length === 0) && <p className="text-slate-400 text-sm">No documents.</p>}
            </div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: DARK_GREEN }}>History</p>
            <div className="space-y-1.5">
              {(detail.history || []).map((h, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 capitalize">{h.status}{h.note ? ` — ${h.note}` : ""}</span>
                  <span className="text-slate-400 text-xs">{new Date(h.changed_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
