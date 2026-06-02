// components/ui.jsx — small shared UI primitives.
import { useEffect } from "react";
import { DARK_GREEN, LIGHT_GREEN_BG, LIGHT_GREEN_BORDER, STATUS_COLORS, cap } from "../lib/theme";
import Icon from "./Icon";

export function Spinner({ size = 16, color = "white" }) {
  return (
    <span className="inline-block border-2 rounded-full animate-spin"
      style={{ width: size, height: size, borderColor: "rgba(0,0,0,0.15)", borderTopColor: color }} />
  );
}

export function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {cap(status)}
    </span>
  );
}

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  const ok = toast.type !== "error";
  return (
    <div className="fixed bottom-5 right-5 z-[60] max-w-sm rounded-xl px-4 py-3 shadow-lg text-sm font-medium flex items-start gap-2"
      style={{ background: ok ? DARK_GREEN : "#dc2626", color: "white" }}>
      <Icon name={ok ? "check" : "x"} size={16} />
      <span>{toast.message}</span>
    </div>
  );
}

export function Modal({ open, onClose, children, maxWidth = "max-w-lg" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: DARK_GREEN }}>
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export const inputStyle = {
  background: LIGHT_GREEN_BG,
  border: `1.5px solid ${LIGHT_GREEN_BORDER}`,
};

export function TextInput(props) {
  return (
    <input {...props}
      className={`w-full rounded-xl px-4 py-3 text-slate-700 text-sm focus:outline-none ${props.className || ""}`}
      style={{ ...inputStyle, ...(props.style || {}) }} />
  );
}
