// pages/student/ApplyWizard.jsx
// Requirement #1: a single, integrated workflow. The student reviews the
// scholarship, fills the application form, uploads each required document, and
// submits — all without leaving the page. Required documents are validated
// before the application can be submitted.
import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { DARK_GREEN, LIGHT_GREEN_BG, LIGHT_GREEN_BORDER, LIGHT_GREEN_CARD } from "../../lib/theme";
import Icon from "../../components/Icon";
import { Spinner, Field, TextInput } from "../../components/ui";

const STEPS = ["Overview", "Application Form", "Documents", "Review & Submit"];
const MAX_BYTES = 5 * 1024 * 1024;
const OK_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function ApplyWizard({ scholarshipId, onDone, toast }) {
  const { user } = useAuth();
  const [sch, setSch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    full_name: user.full_name || "",
    student_id: user.student_id || "",
    course: "", year_level: "", gpa: "", household_income: "", motivation: "",
  });
  const [files, setFiles] = useState({}); // { requirementId: File }
  const [fileErrors, setFileErrors] = useState({});
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const { scholarship } = await api.scholarship(scholarshipId);
        setSch(scholarship);
      } catch (e) {
        toast({ type: "error", message: e.message });
        onDone();
      } finally {
        setLoading(false);
      }
    })();
  }, [scholarshipId]);

  const handleForm = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const pickFile = (reqId, file) => {
    if (!file) return;
    const errs = { ...fileErrors };
    if (!OK_TYPES.includes(file.type)) { errs[reqId] = "Only PDF, JPG, PNG, or WEBP."; setFileErrors(errs); return; }
    if (file.size > MAX_BYTES) { errs[reqId] = "File exceeds 5MB."; setFileErrors(errs); return; }
    delete errs[reqId];
    setFileErrors(errs);
    setFiles((f) => ({ ...f, [reqId]: file }));
  };

  const requirements = sch?.requirements || [];
  const requiredReqs = requirements.filter((r) => Number(r.is_required) === 1);
  const missingDocs = requiredReqs.filter((r) => !files[r.id]);

  const validateForm = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required.";
    if (!form.course.trim()) e.course = "Course is required.";
    if (!form.year_level.trim()) e.year_level = "Year level is required.";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 1 && !validateForm()) return;
    if (step === 2 && missingDocs.length > 0) {
      toast({ type: "error", message: `Please upload all required documents (${missingDocs.length} missing).` });
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (missingDocs.length > 0) {
      toast({ type: "error", message: "Upload all required documents before submitting." });
      setStep(2);
      return;
    }
    setSubmitting(true);
    try {
      // 1) Create the application.
      const { id: appId } = await api.createApplication({ scholarship_id: scholarshipId, ...form });
      // 2) Upload each document, tied to the new application.
      for (const r of requirements) {
        const file = files[r.id];
        if (!file) continue;
        const fd = new FormData();
        fd.append("application_id", appId);
        fd.append("requirement_id", r.id);
        fd.append("label", r.label);
        fd.append("file", file);
        await api.uploadDocument(fd);
      }
      setDone(true);
    } catch (e) {
      toast({ type: "error", message: e.message || "Submission failed." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><Spinner size={28} color={DARK_GREEN} /></div>;
  if (!sch) return null;

  if (done) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center max-w-lg mx-auto" style={{ border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: LIGHT_GREEN_BG }}>
          <Icon name="check" size={28} style={{ color: DARK_GREEN }} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">Application Submitted!</h3>
        <p className="text-slate-500 text-sm mb-6">Your application and documents for <strong>{sch.title}</strong> are now with the Scholarship Office for review.</p>
        <button onClick={() => onDone(true)} className="text-white font-bold py-3 px-6 rounded-xl text-sm" style={{ background: DARK_GREEN }}>
          View My Applications →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button onClick={() => onDone()} className="text-sm font-semibold flex items-center gap-1" style={{ color: DARK_GREEN }}>
        <Icon name="chevronL" size={14} /> Back to Browse
      </button>

      {/* Stepper */}
      <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => {
            const active = i === step, complete = i < step;
            return (
              <div key={label} className="flex-1 flex flex-col items-center relative">
                {i > 0 && <div className="absolute top-3.5 right-1/2 left-[-50%] h-0.5" style={{ background: complete || active ? DARK_GREEN : LIGHT_GREEN_BORDER }} />}
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold relative z-10"
                  style={{ background: complete ? DARK_GREEN : active ? DARK_GREEN : LIGHT_GREEN_CARD, color: complete || active ? "white" : "#94a3b8", border: `1.5px solid ${complete || active ? DARK_GREEN : LIGHT_GREEN_BORDER}` }}>
                  {complete ? <Icon name="check" size={12} /> : i + 1}
                </div>
                <span className="text-center mt-1.5 leading-tight" style={{ fontSize: "10px", color: active ? DARK_GREEN : "#94a3b8", fontWeight: active ? 700 : 500 }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
        {/* STEP 0 — Overview */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: "#dce8c8", color: "#3d6b34" }}>{sch.category}</span>
              <h2 className="text-xl font-bold text-slate-800 mt-2">{sch.title}</h2>
              <p className="text-slate-500 text-sm">{sch.provider}</p>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">{sch.description}</p>
            <div className="rounded-xl p-4" style={{ background: LIGHT_GREEN_CARD, border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: DARK_GREEN }}>Eligibility</p>
              <p className="text-slate-600 text-sm">{sch.eligibility}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: LIGHT_GREEN_CARD, border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: DARK_GREEN }}>Required Documents ({requirements.length})</p>
              <div className="space-y-1.5">
                {requirements.map((r) => (
                  <div key={r.id} className="flex items-start gap-2 text-sm text-slate-700">
                    <Icon name="file" size={13} style={{ color: DARK_GREEN }} className="mt-0.5" />
                    <span>{r.label}{r.description ? <span className="text-slate-400"> — {r.description}</span> : null}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-lg" style={{ color: DARK_GREEN }}>{sch.amount}</span>
              <span className="text-slate-400">{sch.deadline ? `Deadline: ${sch.deadline}` : "Rolling"}</span>
            </div>
          </div>
        )}

        {/* STEP 1 — Application form */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Application Form</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" error={formErrors.full_name}><TextInput name="full_name" value={form.full_name} onChange={handleForm} /></Field>
              <Field label="Student ID"><TextInput name="student_id" value={form.student_id} onChange={handleForm} placeholder="2024-00001" /></Field>
              <Field label="Course / Program" error={formErrors.course}><TextInput name="course" value={form.course} onChange={handleForm} placeholder="BS Information Technology" /></Field>
              <Field label="Year Level" error={formErrors.year_level}><TextInput name="year_level" value={form.year_level} onChange={handleForm} placeholder="2nd Year" /></Field>
              <Field label="GPA / General Average"><TextInput name="gpa" value={form.gpa} onChange={handleForm} placeholder="1.75 or 90%" /></Field>
              <Field label="Annual Household Income"><TextInput name="household_income" value={form.household_income} onChange={handleForm} placeholder="Below ₱120,000" /></Field>
            </div>
            <Field label="Motivation / Personal Statement">
              <textarea name="motivation" value={form.motivation} onChange={handleForm} rows={4} placeholder="Briefly explain why you are applying and how this will help you."
                className="w-full rounded-xl px-4 py-3 text-slate-700 text-sm focus:outline-none" style={{ background: LIGHT_GREEN_BG, border: `1.5px solid ${LIGHT_GREEN_BORDER}` }} />
            </Field>
          </div>
        )}

        {/* STEP 2 — Documents (integrated upload) */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Upload Required Documents</h2>
              <p className="text-slate-500 text-sm">Attach each requirement below. PDF/JPG/PNG/WEBP, max 5MB each.</p>
            </div>
            {missingDocs.length > 0 && (
              <div className="rounded-xl p-3 flex gap-2 items-center text-sm" style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#b45309" }}>
                <Icon name="shield" size={16} /> {missingDocs.length} required document{missingDocs.length > 1 ? "s" : ""} still missing.
              </div>
            )}
            {requirements.map((r) => (
              <DocRow key={r.id} req={r} file={files[r.id]} error={fileErrors[r.id]} onPick={(f) => pickFile(r.id, f)}
                onClear={() => setFiles((prev) => { const c = { ...prev }; delete c[r.id]; return c; })} />
            ))}
          </div>
        )}

        {/* STEP 3 — Review & submit */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Review & Submit</h2>
            <div className="rounded-xl p-4 space-y-1.5 text-sm" style={{ background: LIGHT_GREEN_CARD, border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
              <Row k="Scholarship" v={sch.title} />
              <Row k="Applicant" v={form.full_name} />
              <Row k="Student ID" v={form.student_id || "—"} />
              <Row k="Course" v={form.course} />
              <Row k="Year Level" v={form.year_level} />
              <Row k="GPA" v={form.gpa || "—"} />
              <Row k="Household Income" v={form.household_income || "—"} />
            </div>
            <div className="rounded-xl p-4" style={{ background: LIGHT_GREEN_CARD, border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: DARK_GREEN }}>Attached Documents</p>
              <div className="space-y-1.5">
                {requirements.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{r.label}</span>
                    {files[r.id]
                      ? <span className="text-emerald-600 font-semibold flex items-center gap-1"><Icon name="check" size={13} /> {files[r.id].name.slice(0, 24)}</span>
                      : <span className="text-red-500 text-xs">Missing</span>}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-400">By submitting, you confirm the information and documents provided are accurate.</p>
          </div>
        )}

        {/* Footer nav */}
        <div className="flex items-center justify-between mt-6 pt-5" style={{ borderTop: `1px solid ${LIGHT_GREEN_BORDER}` }}>
          <button onClick={back} disabled={step === 0} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition" style={{ color: DARK_GREEN, opacity: step === 0 ? 0.4 : 1 }}>
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="text-white font-bold py-2.5 px-6 rounded-xl text-sm" style={{ background: DARK_GREEN }}>Continue →</button>
          ) : (
            <button onClick={submit} disabled={submitting} className="text-white font-bold py-2.5 px-6 rounded-xl text-sm flex items-center gap-2" style={{ background: DARK_GREEN, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? <><Spinner /> Submitting...</> : "Submit Application"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return <div className="flex justify-between"><span className="text-slate-400">{k}</span><span className="text-slate-700 font-medium text-right">{v}</span></div>;
}

function DocRow({ req, file, error, onPick, onClear }) {
  const ref = useRef(null);
  return (
    <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: file ? "#d1fae5" : LIGHT_GREEN_CARD }}>
          <Icon name={file ? "check" : "file"} size={18} style={{ color: file ? "#059669" : DARK_GREEN }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-700 text-sm">{req.label}{Number(req.is_required) === 1 && <span className="text-red-500">*</span>}</p>
          {req.description && <p className="text-slate-400 text-xs mb-2">{req.description}</p>}
          <input ref={ref} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => onPick(e.target.files[0])} />
          {file ? (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
              <Icon name="check" size={14} /> {file.name.slice(0, 30)}
              <button onClick={onClear} className="ml-1 text-slate-400 text-xs font-normal underline">Replace</button>
            </div>
          ) : (
            <button onClick={() => ref.current?.click()} className="rounded-xl py-2.5 px-4 text-sm w-full text-left transition" style={{ border: `2px dashed ${LIGHT_GREEN_BORDER}`, background: LIGHT_GREEN_CARD, color: "#64748b" }}>
              <Icon name="upload" size={14} className="inline mr-1" /> Choose file
            </button>
          )}
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}
