// theme.js — shared design tokens (kept consistent with the original UI).
export const DARK_GREEN = "#4a7c3f";
export const LIGHT_GREEN = "#b5c27a";
export const LIGHT_GREEN_BG = "#eef3dc";
export const LIGHT_GREEN_CARD = "#f4f7e8";
export const LIGHT_GREEN_BORDER = "#d4e0a8";

export const STATUS_COLORS = {
  pending:   { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-400"  },
  reviewing: { bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500"   },
  approved:  { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500"},
  rejected:  { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500"    },
  verified:  { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500"},
};

export const TYPE_COLORS = {
  scholarship: { bg: "#dce8c8", text: "#3d6b34" },
  grant:       { bg: "#dbeafe", text: "#1d4ed8" },
  gig:         { bg: "#fde9d2", text: "#b45309" },
};

export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
