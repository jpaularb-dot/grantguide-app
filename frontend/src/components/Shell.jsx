// components/Shell.jsx — sidebar + header layout, navigation differs by role.
import { DARK_GREEN, LIGHT_GREEN, LIGHT_GREEN_BG } from "../lib/theme";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";

const STUDENT_NAV = [
  { id: "dashboard",    label: "Dashboard",       icon: "home"      },
  { id: "browse",       label: "Browse",          icon: "search"    },
  { id: "gigs",         label: "Campus Gigs",     icon: "briefcase" },
  { id: "applications", label: "My Applications", icon: "file"      },
];

const ADMIN_NAV = [
  { id: "admin-dashboard",     label: "Dashboard",     icon: "chart"     },
  { id: "admin-scholarships",  label: "Scholarships",  icon: "graduation"},
  { id: "admin-applications",  label: "Applications",  icon: "clipboard" },
  { id: "admin-applicants",    label: "Applicants",    icon: "users"     },
  { id: "admin-logs",          label: "Activity Logs", icon: "settings"  },
];

export default function Shell({ page, setPage, children }) {
  const { user, logout } = useAuth();
  const nav = user.role === "admin" ? ADMIN_NAV : STUDENT_NAV;
  const title = (nav.find((n) => n.id === page)?.label) || "Dashboard";

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen" style={{ background: DARK_GREEN }}>
        <div className="px-6 py-7" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: LIGHT_GREEN }}>
              <Icon name="graduation" size={18} className="text-[#4a7c3f]" />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight block" style={{ fontFamily: "Georgia, serif" }}>GrantGuide</span>
              {user.role === "admin" && <span className="text-[10px] uppercase tracking-wider" style={{ color: LIGHT_GREEN }}>Scholarship Office</span>}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {nav.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setPage(id)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{ background: page === id ? LIGHT_GREEN : "transparent", color: page === id ? DARK_GREEN : "rgba(255,255,255,0.75)" }}>
              <Icon name={icon} size={16} />{label}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: LIGHT_GREEN, color: DARK_GREEN }}>
              {user.full_name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.full_name}</p>
              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{user.role === "admin" ? "Administrator" : (user.student_id || "Student")}</p>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: "rgba(255,255,255,0.6)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,100,100,0.15)"; e.currentTarget.style.color = "#fca5a5"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}>
            <Icon name="logout" size={16} />Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-20" style={{ background: DARK_GREEN }}>
          <div className="md:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: LIGHT_GREEN }}>
              <Icon name="graduation" size={14} className="text-[#4a7c3f]" />
            </div>
            <span className="font-bold text-white text-sm" style={{ fontFamily: "Georgia, serif" }}>GrantGuide</span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium" style={{ color: LIGHT_GREEN }}>{title}</p>
          </div>
          <div className="flex items-center gap-2 pl-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: LIGHT_GREEN, color: DARK_GREEN }}>
              {user.full_name[0].toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm font-semibold text-white">{user.full_name}</span>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="md:hidden flex overflow-x-auto" style={{ background: DARK_GREEN, borderBottom: `2px solid ${LIGHT_GREEN}` }}>
          {nav.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setPage(id)}
              className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors"
              style={{ borderColor: page === id ? LIGHT_GREEN : "transparent", color: page === id ? LIGHT_GREEN : "rgba(255,255,255,0.6)" }}>
              <Icon name={icon} size={14} />{label}
            </button>
          ))}
          <button onClick={logout} className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: "rgba(255,255,255,0.6)" }}>
            <Icon name="logout" size={14} />Out
          </button>
        </div>

        <main className="flex-1 p-5 md:p-6 w-full" style={{ background: LIGHT_GREEN_BG, maxWidth: "1100px", margin: "0 auto", width: "100%" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
