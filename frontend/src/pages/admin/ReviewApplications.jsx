// pages/admin/ReviewApplications.jsx — review apps, verify docs, update status.
import { useEffect, useState } from "react";
import { api, fileUrl } from "../../api/client";
import { DARK_GREEN, LIGHT_GREEN_BG, LIGHT_GREEN_BORDER, LIGHT_GREEN_CARD, cap } from "../../lib/theme";
import Icon from "../../components/Icon";
import { Spinner, StatusBadge, Modal } from "../../components/ui";

const FILTERS = ["all", "pending", "reviewing", "approved", "rejected"];

export default function ReviewApplications({ toast }) {
  const [apps, setApps] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState("");
  const [working, setWorking] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const qs = filter === "all" ? "" : `?status=${filter}`;
      setApps((await api.applications(qs)).applications || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);

  const open = async (id) => {
    setDetail({ loading: true });
    setNote("");
    try {
      const { application } = await api.application(id);
      setDetail(application);
      setNote(application.review_note || "");
    } catch (e) { toast({ type: "error", message: e.message }); setDetail(null); }
  };

  const setStatus = async (status) => {
    setWorking(true);
    try {
      await api.setApplicationStatus(detail.id, { status, note });
      toast({ message: `Application marked ${status}.` });
      setDetail(null); load();
    } catch (e) { toast({ type: "error", message: e.message }); }
    finally { setWorking(false); }
  };

  const verifyDoc = async (docId, verified) => {
    try {
      await api.verifyDocument(docId, { verified });
      setDetail((d) => ({ ...d, documents: d.documents.map((x) => x.id === docId ? { ...x, verified } : x) }));
    } catch (e) { toast({ type: "error", message: e.message }); }
  };

  if (loading && apps.length === 0) return <div className="py-20 flex justify-center"><Spinner size={28} color={DARK_GREEN} /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "Georgia, serif" }}>Review Applications</h1>
        <p className="text-slate-500 text-sm mt-1">Verify documents and approve or reject applications.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="px-3 py-2 rounded-xl text-xs font-semibold capitalize"
            style={{ background: filter === f ? DARK_GREEN : LIGHT_GREEN_CARD, color: filter === f ? "white" : DARK_GREEN, border: `1px solid ${filter === f ? DARK_GREEN : LIGHT_GREEN_BORDER}` }}>{f}</button>
        ))}
      </div>

      {apps.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
          <p className="text-slate-500">No applications in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer hover:shadow-md transition" style={{ border: `1px solid ${LIGHT_GREEN_BORDER}` }} onClick={() => open(a.id)}>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">{a.full_name}</p>
                <p className="text-slate-400 text-xs truncate">{a.scholarship_title} · {a.applicant_email}</p>
                <p className="text-slate-400 text-xs">{a.doc_count} document(s) · {new Date(a.submitted_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <StatusBadge status={a.status} />
                <Icon name="chevron" size={16} className="text-slate-300" />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} maxWidth="max-w-2xl">
        {detail?.loading ? (
          <div className="p-10 flex justify-center"><Spinner size={24} color={DARK_GREEN} /></div>
        ) : detail ? (
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{detail.full_name}</h3>
                <p className="text-slate-500 text-sm">{detail.scholarship_title}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-slate-400 p-1"><Icon name="x" size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-4 rounded-xl p-4" style={{ background: LIGHT_GREEN_CARD }}>
              <Info k="Email" v={detail.applicant_email} />
              <Info k="Student ID" v={detail.student_id || "—"} />
              <Info k="Course" v={detail.course || "—"} />
              <Info k="Year Level" v={detail.year_level || "—"} />
              <Info k="GPA" v={detail.gpa || "—"} />
              <Info k="Household Income" v={detail.household_income || "—"} />
            </div>
            {detail.motivation && (
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: DARK_GREEN }}>Motivation</p>
                <p className="text-sm text-slate-600">{detail.motivation}</p>
              </div>
            )}

            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: DARK_GREEN }}>Documents</p>
            <div className="space-y-2 mb-4">
              {(detail.documents || []).map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 p-2 rounded-lg" style={{ background: LIGHT_GREEN_CARD }}>
                  <a href={fileUrl(d.file_url)} target="_blank" rel="noreferrer" className="text-slate-700 underline flex items-center gap-1.5 text-sm min-w-0 truncate"><Icon name="eye" size={13} /> {d.label}</a>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <StatusBadge status={d.verified} />
                    <button onClick={() => verifyDoc(d.id, "verified")} className="p-1.5 rounded-lg text-emerald-600" style={{ background: "#d1fae5" }}><Icon name="check" size={14} /></button>
                    <button onClick={() => verifyDoc(d.id, "rejected")} className="p-1.5 rounded-lg text-red-500" style={{ background: "#fee2e2" }}><Icon name="x" size={14} /></button>
                  </div>
                </div>
              ))}
              {(!detail.documents || detail.documents.length === 0) && <p className="text-slate-400 text-sm">No documents uploaded.</p>}
            </div>

            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: DARK_GREEN }}>Decision note (optional)</p>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Visible to the applicant…"
              className="w-full rounded-xl px-4 py-2.5 text-sm mb-4" style={{ background: LIGHT_GREEN_BG, border: `1.5px solid ${LIGHT_GREEN_BORDER}` }} />

            <div className="flex flex-wrap gap-2 justify-end">
              <button disabled={working} onClick={() => setStatus("reviewing")} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#dbeafe", color: "#1d4ed8" }}>Mark Reviewing</button>
              <button disabled={working} onClick={() => setStatus("rejected")} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#fee2e2", color: "#b91c1c" }}>Reject</button>
              <button disabled={working} onClick={() => setStatus("approved")} className="text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2" style={{ background: DARK_GREEN }}>
                {working ? <Spinner /> : <Icon name="check" size={15} />} Approve
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function Info({ k, v }) {
  return <div><span className="text-slate-400 text-xs block">{k}</span><span className="text-slate-700">{v}</span></div>;
}
