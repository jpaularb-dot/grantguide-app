// pages/AuthPage.jsx — landing + role selection, then tailored login/registration.
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { DARK_GREEN, LIGHT_GREEN, LIGHT_GREEN_BG, LIGHT_GREEN_BORDER } from "../lib/theme";
import Icon from "../components/Icon";
import { Spinner, TextInput, Field } from "../components/ui";

// Per-role copy used across the landing card and the auth screen.
const ROLE = {
  student: {
    label: "Student",
    portal: "Student Portal",
    icon: "graduation",
    tagline: "Browse and apply for scholarships, grants, and campus gigs — then track your progress.",
    points: [
      ["Browse opportunities", "Scholarships, grants & campus gigs"],
      ["One-step apply", "Submit your form and documents together"],
      ["Live status tracker", "Follow your application in real time"],
    ],
    demo: { email: "student@grantguide.ph", password: "Student@12345" },
    canRegister: true,
  },
  admin: {
    label: "Scholarship Office / Admin",
    portal: "Scholarship Office Portal",
    icon: "shield",
    tagline: "Manage listings, verify documents, review applications, and monitor applicant activity.",
    points: [
      ["Manage listings", "Post scholarships, grants & campus gigs"],
      ["Verify documents", "Check submitted requirements"],
      ["Review & monitor", "Decide on applications and view logs"],
    ],
    demo: { email: "admin@grantguide.ph", password: "Admin@12345" },
    canRegister: false,
  },
};

export default function AuthPage() {
  const { login, register } = useAuth();
  const [step, setStep] = useState("role");        // "role" | "auth"
  const [role, setRole] = useState(null);           // "student" | "admin"
  const [mode, setMode] = useState("login");        // "login" | "register"
  const [form, setForm] = useState({ full_name: "", email: "", password: "", student_id: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const chooseRole = (r) => {
    setRole(r);
    setMode("login");
    setError(""); setErrors({});
    setForm({ full_name: "", email: "", password: "", student_id: "" });
    setStep("auth");
  };

  const backToRoles = () => { setStep("role"); setRole(null); setError(""); setErrors({}); };

  const fillDemo = () => {
    const d = ROLE[role].demo;
    setForm((f) => ({ ...f, email: d.email, password: d.password }));
    setError(""); setErrors({});
  };

  const submit = async () => {
    setError(""); setErrors({});
    if (!form.email || !form.password) { setError("Please fill in all required fields."); return; }
    if (mode === "register" && !form.full_name) { setError("Please enter your full name."); return; }
    setBusy(true);
    try {
      if (mode === "login") await login({ email: form.email, password: form.password });
      else await register(form);
      // App.jsx routes to the correct dashboard based on the account's real role.
    } catch (err) {
      setError(err.message || "Something went wrong.");
      if (err.errors) setErrors(err.errors);
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e) => { if (e.key === "Enter") submit(); };

  // ───────────────────────────── ROLE SELECTION (landing) ──────────────────
  if (step === "role") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif",
                 background: `linear-gradient(135deg, ${DARK_GREEN} 0%, #2d5227 55%, #1f3a1b 100%)` }}>
        {/* dotted texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${LIGHT_GREEN} 1px, transparent 0)`, backgroundSize: "42px 42px" }} />

        <div className="relative z-10 w-full max-w-4xl">
          {/* Brand + headline */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: LIGHT_GREEN }}>
              <Icon name="graduation" size={30} className="text-[#4a7c3f]" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight" style={{ fontFamily: "Georgia, serif" }}>GrantGuide</h1>
            <p className="text-base sm:text-lg mt-3 max-w-xl mx-auto leading-relaxed" style={{ color: LIGHT_GREEN }}>
              A student-led financial opportunity navigator — scholarships, grants, and campus gigs, all in one place.
            </p>
          </div>

          <p className="text-center text-white/80 text-sm font-medium mb-5">How would you like to continue?</p>

          {/* Role cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(["student", "admin"]).map((r) => {
              const m = ROLE[r];
              return (
                <div key={r} role="button" tabIndex={0}
                  onClick={() => chooseRole(r)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); chooseRole(r); } }}
                  className="text-left rounded-3xl p-6 bg-white transition-all duration-200 cursor-pointer outline-none"
                  style={{ border: `1px solid ${LIGHT_GREEN_BORDER}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 14px 34px rgba(0,0,0,0.22)"; e.currentTarget.style.borderColor = DARK_GREEN; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = LIGHT_GREEN_BORDER; }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: LIGHT_GREEN_BG }}>
                      <Icon name={m.icon} size={24} style={{ color: DARK_GREEN }} />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-800 text-lg leading-tight" style={{ fontFamily: "Georgia, serif" }}>{m.label}</h2>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8aa173" }}>{r === "student" ? "Apply & track" : "Manage & review"}</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mb-4 leading-relaxed">{m.tagline}</p>

                  <div className="space-y-2 mb-5">
                    {m.points.map(([t, d]) => (
                      <div key={t} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0" style={{ background: LIGHT_GREEN_BG }}>
                          <Icon name="check" size={10} style={{ color: DARK_GREEN }} />
                        </span>
                        <span className="text-xs text-slate-600"><span className="font-semibold text-slate-700">{t}</span> — {d}</span>
                      </div>
                    ))}
                  </div>

                  <span className="inline-flex items-center justify-center gap-2 w-full text-white font-bold py-3 rounded-xl text-sm transition-all"
                    style={{ background: DARK_GREEN }}>
                    Continue as {r === "student" ? "Student" : "Admin"}
                    <Icon name="chevron" size={15} />
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-center text-white/45 text-xs mt-8">
            Not sure? Students apply for opportunities; the Scholarship Office manages and reviews them.
          </p>
        </div>
      </div>
    );
  }

  // ───────────────────────────── AUTH (login / register) ───────────────────
  const m = ROLE[role];
  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Left brand panel, tailored to the chosen role */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-16 relative overflow-hidden" style={{ background: DARK_GREEN }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${LIGHT_GREEN} 1px, transparent 0)`, backgroundSize: "40px 40px" }} />
        <div className="relative z-10 text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-7" style={{ background: LIGHT_GREEN }}>
            <Icon name={m.icon} size={38} className="text-[#4a7c3f]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>GrantGuide</h1>
          <p className="text-lg mb-10" style={{ color: LIGHT_GREEN }}>{m.portal}</p>
          <div className="space-y-5 text-left">
            {m.points.map(([t, d]) => (
              <div key={t} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0" style={{ background: "rgba(181,194,122,0.25)" }}>
                  <Icon name="check" size={12} className="text-[#b5c27a]" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{t}</p>
                  <p className="text-sm" style={{ color: LIGHT_GREEN }}>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8" style={{ background: LIGHT_GREEN_BG }}>
        <div className="w-full max-w-md">
          <button onClick={backToRoles} className="flex items-center gap-1.5 text-sm font-semibold mb-4 transition-colors" style={{ color: DARK_GREEN }}>
            <Icon name="chevronL" size={15} /> Choose a different role
          </button>

          <div className="rounded-3xl p-8 shadow-xl" style={{ background: "white", border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
            {/* Portal badge */}
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: LIGHT_GREEN_BG }}>
                <Icon name={m.icon} size={20} style={{ color: DARK_GREEN }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8aa173" }}>{m.portal}</p>
                <h2 className="text-xl font-bold leading-tight" style={{ color: DARK_GREEN, fontFamily: "Georgia, serif" }}>
                  {mode === "login" ? "Welcome back" : "Create your account"}
                </h2>
              </div>
            </div>

            {/* Login / Register toggle — register only for students */}
            {m.canRegister && (
              <div className="flex rounded-2xl p-1 mb-6" style={{ background: LIGHT_GREEN_BG }}>
                {["login", "register"].map((x) => (
                  <button key={x} onClick={() => { setMode(x); setError(""); setErrors({}); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-200"
                    style={{ background: mode === x ? DARK_GREEN : "transparent", color: mode === x ? "white" : DARK_GREEN }}>
                    {x === "login" ? "Sign In" : "Register"}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-4" onKeyDown={onKey}>
              {mode === "register" && (
                <Field label="Full Name" error={errors.full_name}>
                  <TextInput name="full_name" value={form.full_name} onChange={handle} placeholder="Juan dela Cruz" />
                </Field>
              )}
              <Field label="Email" error={errors.email}>
                <TextInput name="email" type="email" value={form.email} onChange={handle} placeholder="you@university.edu" />
              </Field>
              {mode === "register" && (
                <Field label="Student ID (optional)">
                  <TextInput name="student_id" value={form.student_id} onChange={handle} placeholder="2024-00001" />
                </Field>
              )}
              <Field label="Password" error={errors.password}>
                <TextInput name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" />
              </Field>
            </div>

            {error && <p className="mt-3 text-red-500 text-xs">{error}</p>}

            <button onClick={submit} disabled={busy}
              className="w-full mt-6 text-white font-bold py-3.5 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2"
              style={{ background: DARK_GREEN, opacity: busy ? 0.7 : 1 }}>
              {busy ? <Spinner /> : (mode === "login" ? "Sign In to Dashboard →" : "Create My Account →")}
            </button>

            {m.canRegister && (
              <p className="text-center text-xs mt-4" style={{ color: "#6b8c5e" }}>
                {mode === "login" ? "No account yet? " : "Already have one? "}
                <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setErrors({}); }}
                  className="font-semibold underline underline-offset-2" style={{ color: DARK_GREEN }}>
                  {mode === "login" ? "Register here" : "Sign in"}
                </button>
              </p>
            )}
            {!m.canRegister && (
              <p className="text-center text-xs mt-4" style={{ color: "#6b8c5e" }}>
                Admin accounts are provisioned by the Scholarship Office.
              </p>
            )}

            {/* Demo quick-fill */}
            <div className="mt-6 pt-4 text-center" style={{ borderTop: `1px solid ${LIGHT_GREEN_BORDER}` }}>
              <p className="text-xs mb-2" style={{ color: "#6b8c5e" }}>Demo {m.label} account</p>
              <button onClick={fillDemo} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: LIGHT_GREEN_BG, color: DARK_GREEN, border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
                Fill demo credentials
              </button>
              <p className="text-[11px] mt-2 text-slate-400">{m.demo.email} / {m.demo.password}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
