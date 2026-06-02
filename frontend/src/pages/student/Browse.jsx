// pages/student/Browse.jsx — list real scholarships; "Apply Now" opens the wizard.
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { DARK_GREEN, LIGHT_GREEN_BORDER, LIGHT_GREEN_CARD, TYPE_COLORS } from "../../lib/theme";
import Icon from "../../components/Icon";
import { Spinner } from "../../components/ui";

export default function Browse({ onApply, mode = "all" }) {
  const isGigs = mode === "gigs";
  const [items, setItems] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([api.scholarships(), api.applications()]);
      setItems(s.scholarships || []);
      setAppliedIds(new Set((a.applications || []).map((x) => Number(x.scholarship_id))));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((o) => {
    // Gigs board shows only gigs; the scholarships browser hides gigs.
    if (isGigs && o.category !== "gig") return false;
    if (!isGigs && o.category === "gig") return false;
    const matchType = isGigs || filter === "all" || o.category === filter;
    const q = search.toLowerCase();
    const matchSearch = o.title.toLowerCase().includes(q) || o.provider.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "Georgia, serif" }}>{isGigs ? "Campus Gigs Board" : "Browse Scholarships"}</h1>
        <p className="text-slate-500 text-sm mt-1">{isGigs ? "Short-term, on-campus work — library and lab assistance, office help, and more." : "Real scholarship & grant programs from CHED, DOST, OWWA and partners."}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or provider..."
            className="w-full pl-10 pr-4 py-2.5 text-sm focus:outline-none rounded-xl bg-white" style={{ border: `1.5px solid ${LIGHT_GREEN_BORDER}` }} />
        </div>
        <div className="flex gap-2" style={{ display: isGigs ? "none" : "flex" }}>
          {["all", "scholarship", "grant"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all"
              style={{ background: filter === f ? DARK_GREEN : LIGHT_GREEN_CARD, color: filter === f ? "white" : DARK_GREEN, border: `1px solid ${filter === f ? DARK_GREEN : LIGHT_GREEN_BORDER}` }}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Spinner size={28} color={DARK_GREEN} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: `1px solid ${LIGHT_GREEN_BORDER}` }}>
          <p className="text-slate-500">{isGigs ? "No campus gigs are open right now. Check back soon." : "No scholarships match your search."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((opp) => {
            const applied = appliedIds.has(Number(opp.id));
            const closed = opp.status === "closed";
            const tc = TYPE_COLORS[opp.category] || TYPE_COLORS.scholarship;
            return (
              <div key={opp.id} className="rounded-2xl p-5 flex flex-col bg-white transition-all duration-200" style={{ border: `1px solid ${LIGHT_GREEN_BORDER}` }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = DARK_GREEN; e.currentTarget.style.boxShadow = "0 4px 14px rgba(74,124,63,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = LIGHT_GREEN_BORDER; e.currentTarget.style.boxShadow = "none"; }}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: tc.bg, color: tc.text }}>{opp.category}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: closed ? "#fee2e2" : "#d1fae5", color: closed ? "#b91c1c" : "#065f46" }}>
                    {closed ? "Closed" : "Open"}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm mb-1 leading-tight">{opp.title}</h3>
                <p className="text-slate-500 text-xs mb-2">{opp.provider}</p>
                <p className="text-slate-500 text-xs flex-1 mb-3" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{opp.description}</p>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${LIGHT_GREEN_BORDER}` }}>
                  <div>
                    <p className="font-bold text-sm" style={{ color: DARK_GREEN }}>{opp.amount}</p>
                    <p className="text-slate-400 text-xs">{opp.deadline ? `Deadline: ${opp.deadline}` : "Rolling"}</p>
                  </div>
                  <button onClick={() => { if (!applied && !closed) onApply(opp.id); }} disabled={applied || closed}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background: applied ? "#d1fae5" : closed ? "#e5e7eb" : DARK_GREEN, color: applied ? "#065f46" : closed ? "#6b7280" : "white" }}>
                    {applied ? "✓ Applied" : closed ? "Closed" : "Apply Now"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
