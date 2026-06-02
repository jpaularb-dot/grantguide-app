// pages/admin/ManageScholarships.jsx — CRUD for scholarship programs.
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { DARK_GREEN, LIGHT_GREEN_BG, LIGHT_GREEN_BORDER, LIGHT_GREEN_CARD, TYPE_COLORS } from "../../lib/theme";
import Icon from "../../components/Icon";
import { Spinner, Modal, Field, TextInput } from "../../components/ui";

const EMPTY = { title: "", provider: "", category: "scholarship", description: "", eligibility: "", amount: "", slots: "", deadline: "", status: "open", requirements: [] };

export default function ManageScholarships({ toast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // {…} or null
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems((await api.scholarships()).scholarships || []); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => setEditing({ ...EMPTY, requirements: [{ label: "", description: "" }] });
  const openEdit = async (id) => {
    const { scholarship } = await api.scholarship(id);
    setEditing({
      ...scholarship,
      slots: scholarship.slots ?? "",
      deadline: scholarship.deadline ?? "",
      requirements: (scholarship.requirements || []).map((r) => ({ label: r.label, description: r.description || "" })),
    });
  };

  const save = async () => {
    if (!editing.title || !editing.provider || !editing.description || !editing.eligibility) {
      toast({ type: "error", message: "Title, provider, description and eligibility are required." });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...editing, requirements: editing.requirements.filter((r) => r.label.trim()) };
      if (editing.id) { await api.updateScholarship(editing.id, payload); toast({ message: "Scholarship updated." }); }
      else { await api.createScholarship(payload); toast({ message: "Scholarship created." }); }
      setEditing(null);
      load();
    } catch (e) { toast({ type: "error", message: e.message }); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this scholarship? This also removes its applications.")) return;
    try { await api.deleteScholarship(id); toast({ message: "Scholarship deleted." }); load(); }
    catch (e) { toast({ type: "error", message: e.message }); }
  };

  const setReq = (i, key, val) => setEditing((e) => { const r = [...e.requirements]; r[i] = { ...r[i], [key]: val }; return { ...e, requirements: r }; });
  const addReq = () => setEditing((e) => ({ ...e, requirements: [...e.requirements, { label: "", description: "" }] }));
  const delReq = (i) => setEditing((e) => ({ ...e, requirements: e.requirements.filter((_, j) => j !== i) }));

  if (loading) return <div className="py-20 flex justify-center"><Spinner size={28} color={DARK_GREEN} /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "Georgia, serif" }}>Manage Listings</h1>
          <p className="text-slate-500 text-sm mt-1">Add, edit, and manage scholarships, grants, and campus gigs.</p>
        </div>
        <button onClick={openNew} className="text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2" style={{ background: DARK_GREEN }}>
          <Icon name="plus" size={15} /> New
        </button>
      </div>

      <div className="space-y-3">
        {items.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl p-4 flex items-center justify-between gap-3" style={{ border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: (TYPE_COLORS[s.category] || TYPE_COLORS.scholarship).bg, color: (TYPE_COLORS[s.category] || TYPE_COLORS.scholarship).text }}>{s.category}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.status === "open" ? "#d1fae5" : "#fee2e2", color: s.status === "open" ? "#065f46" : "#b91c1c" }}>{s.status}</span>
              </div>
              <p className="font-bold text-slate-800 truncate">{s.title}</p>
              <p className="text-slate-400 text-xs">{s.provider} · {s.requirement_count} requirements</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => openEdit(s.id)} className="p-2 rounded-lg" style={{ color: DARK_GREEN, background: LIGHT_GREEN_CARD }}><Icon name="edit" size={16} /></button>
              <button onClick={() => remove(s.id)} className="p-2 rounded-lg text-red-500" style={{ background: "#fee2e2" }}><Icon name="trash" size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} maxWidth="max-w-2xl">
        {editing && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-lg">{editing.id ? "Edit" : "New"} Scholarship</h3>
              <button onClick={() => setEditing(null)} className="text-slate-400 p-1"><Icon name="x" size={18} /></button>
            </div>
            <div className="space-y-4">
              <Field label="Title"><TextInput value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
              <Field label="Provider"><TextInput value={editing.provider} onChange={(e) => setEditing({ ...editing, provider: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm" style={{ background: LIGHT_GREEN_BG, border: `1.5px solid ${LIGHT_GREEN_BORDER}` }}>
                    <option value="scholarship">Scholarship</option><option value="grant">Grant</option><option value="gig">Campus Gig</option>
                  </select>
                </Field>
                <Field label="Status">
                  <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm" style={{ background: LIGHT_GREEN_BG, border: `1.5px solid ${LIGHT_GREEN_BORDER}` }}>
                    <option value="open">Open</option><option value="closed">Closed</option>
                  </select>
                </Field>
              </div>
              <Field label="Description"><textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm" style={{ background: LIGHT_GREEN_BG, border: `1.5px solid ${LIGHT_GREEN_BORDER}` }} /></Field>
              <Field label="Eligibility"><textarea rows={2} value={editing.eligibility} onChange={(e) => setEditing({ ...editing, eligibility: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm" style={{ background: LIGHT_GREEN_BG, border: `1.5px solid ${LIGHT_GREEN_BORDER}` }} /></Field>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Amount"><TextInput value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} placeholder="₱20,000/sem" /></Field>
                <Field label="Slots"><TextInput type="number" value={editing.slots} onChange={(e) => setEditing({ ...editing, slots: e.target.value })} /></Field>
                <Field label="Deadline"><TextInput type="date" value={editing.deadline} onChange={(e) => setEditing({ ...editing, deadline: e.target.value })} /></Field>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: DARK_GREEN }}>Required Documents</label>
                  <button onClick={addReq} className="text-xs font-semibold flex items-center gap-1" style={{ color: DARK_GREEN }}><Icon name="plus" size={12} /> Add</button>
                </div>
                <div className="space-y-2">
                  {editing.requirements.map((r, i) => (
                    <div key={i} className="flex gap-2">
                      <TextInput value={r.label} onChange={(e) => setReq(i, "label", e.target.value)} placeholder="Document label" />
                      <TextInput value={r.description} onChange={(e) => setReq(i, "description", e.target.value)} placeholder="Hint (optional)" />
                      <button onClick={() => delReq(i)} className="p-2 rounded-lg text-red-500 flex-shrink-0" style={{ background: "#fee2e2" }}><Icon name="trash" size={15} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditing(null)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500">Cancel</button>
              <button onClick={save} disabled={saving} className="text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2" style={{ background: DARK_GREEN, opacity: saving ? 0.7 : 1 }}>
                {saving ? <><Spinner /> Saving...</> : "Save"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
