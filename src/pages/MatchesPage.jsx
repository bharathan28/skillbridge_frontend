import { useState } from "react";
import { matchingApi } from "../api/client";
import { useApi, useAction } from "../hooks/useApi";

const AVATAR_COLORS = [
  { bg: "#EFF6FF", color: "#1D4ED8" }, { bg: "#F0FDF4", color: "#166534" },
  { bg: "#FFF7ED", color: "#9A3412" }, { bg: "#FAF5FF", color: "#7E22CE" },
  { bg: "#FFF1F2", color: "#9F1239" }, { bg: "#FFFBEB", color: "#92400E" },
];

const initials = u => {
  const n = u?.full_name || u?.username || "?";
  const p = n.trim().split(" ");
  return (p.length >= 2 ? p[0][0] + p[1][0] : n.slice(0, 2)).toUpperCase();
};

export default function MatchesPage({ setPage }) {
  const { data, loading, refetch } = useApi(() => matchingApi.getMatches());
  const { run } = useAction();
  const [filter,    setFilter]    = useState("all");
  const [requested, setRequested] = useState([]);
  const [running,   setRunning]   = useState(false);
  const [runMsg,    setRunMsg]    = useState(null);

  const all      = Array.isArray(data) ? data : [];
  const filtered = filter === "all" ? all : all.filter(m => m.type === filter);

  const runAI = async () => {
    setRunning(true); setRunMsg(null);
    try {
      const r = await matchingApi.runMatching();
      const total = (r.direct?.length || 0) + (r.ai?.length || 0) + (r.chain?.length || 0);
      setRunMsg({ ok: true, text: `Found ${total} matches! Showing results below.` });
      refetch();
    } catch (e) {
      setRunMsg({ ok: false, text: e?.data?.error || "Configure OPENAI_API_KEY in backend to enable AI matching." });
    }
    setRunning(false);
  };

  const request = async (match) => {
    try {
      await run(() => matchingApi.requestSwap(match.user2?.id, match.type));
      setRequested(r => [...r, match.id]);
    } catch {}
  };

  return (
    <div className="page">
      <div className="topbar">
        <h2>Discover</h2>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-primary btn-sm" onClick={runAI} disabled={running}>
            {running ? <><span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> Matching…</> : "✦ Run AI Match"}
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { key: "all",    label: "All" },
            { key: "direct", label: "Direct" },
            { key: "ai",     label: "AI" },
            { key: "chain",  label: "Chain" },
          ].map(f => (
            <button key={f.key} className="btn btn-sm"
              style={filter === f.key ? { background: "var(--brand)", color: "white", borderColor: "var(--brand)" } : {}}
              onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)", alignSelf: "center" }}>
            {filtered.length} {filter === "all" ? "total" : filter}
          </span>
        </div>

        {runMsg && (
          <div className={`alert ${runMsg.ok ? "alert-success" : "alert-error"}`}>
            {runMsg.text}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
            <div className="spinner spinner-brand" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: 13 }}>Loading matches…</div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🤝</div>
            <div className="empty-state-title">No matches yet</div>
            <div className="empty-state-sub">Click <strong>Run AI Match</strong> to find people to swap skills with.</div>
          </div>
        )}

        {filtered.map((m, i) => {
          const sent = requested.includes(m.id) || m.status !== "pending";
          return (
            <div key={m.id} className="match-card" style={{ alignItems: "flex-start" }}>
              <div className="avatar avatar-md" style={{ background: AVATAR_COLORS[i % 6].bg, color: AVATAR_COLORS[i % 6].color }}>
                {initials(m.user2)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 3 }}>
                  {m.user2?.full_name || m.user2?.username}
                </div>
                {m.user2?.bio && (
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6, lineHeight: 1.5 }}>
                    {m.user2.bio.slice(0, 80)}{m.user2.bio.length > 80 ? "…" : ""}
                  </div>
                )}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {m.user1_teach_skill?.name && (
                    <span className="chip chip-teach" style={{ fontSize: 10 }}>
                      Teaches {m.user1_teach_skill.name}
                    </span>
                  )}
                  {m.user1_learn_skill?.name && (
                    <span className="chip chip-learn" style={{ fontSize: 10 }}>
                      Wants {m.user1_learn_skill.name}
                    </span>
                  )}
                  <span className={`chip ${m.type === "direct" ? "chip-blue" : m.type === "ai" ? "chip-gray" : "chip-amber"}`} style={{ fontSize: 10 }}>
                    {m.type === "ai" ? "AI match" : m.type}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {m.similarity_score && (
                  <div className="score-circle">{Math.round(m.similarity_score)}%</div>
                )}
                <button
                  className={`btn btn-sm${!sent ? " btn-primary" : ""}`}
                  style={sent ? { color: "var(--brand)", borderColor: "var(--brand-pale)", background: "var(--brand-light)" } : {}}
                  onClick={() => { if (!sent) request(m); else setPage("chat"); }}>
                  {sent ? "Chat →" : "Connect"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
