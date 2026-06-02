// api/client.js — typed-ish fetch wrapper around the PHP backend.
const BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
const TOKEN_KEY = "gg_token";

// Resolve a stored document path to a full URL.
// Cloudinary URLs are already absolute and returned as-is; locally-stored
// files come back as "/uploads/xyz" and must point at the BACKEND, not the
// frontend domain (otherwise the SPA catches the path and shows the app).
export const fileUrl = (u) => {
  if (!u) return "";
  if (/^(https?:)?\/\//i.test(u) || u.startsWith("data:")) return u;
  return `${BASE}${u.startsWith("/") ? "" : "/"}${u}`;
};

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let payload;
  if (isForm) {
    payload = body; // FormData; let the browser set the boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { method, headers, body: payload });
  } catch {
    throw { message: "Cannot reach the server. Is the backend running?", status: 0 };
  }

  let data = {};
  try { data = await res.json(); } catch { /* non-JSON */ }

  if (!res.ok || data.success === false) {
    throw {
      message: data.message || `Request failed (${res.status}).`,
      status: res.status,
      errors: data.errors || null,
    };
  }
  return data.data ?? data;
}

export const api = {
  base: BASE,
  // auth
  register: (b) => request("/auth/register", { method: "POST", body: b }),
  login:    (b) => request("/auth/login", { method: "POST", body: b }),
  me:       ()  => request("/auth/me"),
  // scholarships
  scholarships: (qs = "")        => request(`/scholarships${qs}`),
  scholarship:  (id)             => request(`/scholarships/${id}`),
  createScholarship: (b)         => request("/scholarships", { method: "POST", body: b }),
  updateScholarship: (id, b)     => request(`/scholarships/${id}`, { method: "PUT", body: b }),
  deleteScholarship: (id)        => request(`/scholarships/${id}`, { method: "DELETE" }),
  // applications
  applications: (qs = "")        => request(`/applications${qs}`),
  application:  (id)             => request(`/applications/${id}`),
  createApplication: (b)         => request("/applications", { method: "POST", body: b }),
  setApplicationStatus: (id, b)  => request(`/applications/${id}/status`, { method: "PATCH", body: b }),
  // documents
  uploadDocument: (form)         => request("/documents", { method: "POST", body: form, isForm: true }),
  verifyDocument: (id, b)        => request(`/documents/${id}/verify`, { method: "PATCH", body: b }),
  // notifications
  notifications: ()             => request("/notifications"),
  readNotification: (id)        => request(`/notifications/${id}/read`, { method: "PATCH" }),
  // admin
  adminStats:      () => request("/admin/stats"),
  adminLogs:       () => request("/admin/logs"),
  adminApplicants: () => request("/admin/applicants"),
};
