import { useState } from "react";
import { useApi, useAction } from "../hooks/useApi";
import { matchingApi, sessionsApi } from "../api/client";

const AVATAR_COLORS = [
  { bg: "#EFF6FF", color: "#1D4ED8" }, { bg: "#F0FDF4", color: "#166534" },
  { bg: "#FFF7ED", color: "#9A3412" }, { bg: "#FAF5FF", color: "#7E22CE" },
  { bg: "#FFF1F2", color: "#9F1239" },
];

const initials = u => {
  const n = u?.full_name || u?.username || "?";
  const p = n.trim().split(" ");
  return (p.length >= 2 ? p[0][0] + p[1][0] : n.slice(0, 2)).toUpperCase();
};

const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export default function Dashboard({ user, setPage }) {
  const { data: matches,  refetch: reM } = useApi(() => matchingApi.getMatches());
  const { data: sessions              }  = useApi(() => sessionsApi.list());
  const { run } = useAction();
  const [accepted, setAccepted] = useState([]);

  const allM = Array.isArray(matches)  ? matches  : [];
  const allS = Array.isArray(sessions) ? sessions : [];

  const pending  = allM.filter(m => m.status === "pending" && m.user2?.id === user?.id).slice(0, 3);
  const topMatch = allM.filter(m => m.status === "accepted")
    .sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0)).slice(0, 4);
  const upcoming = allS.filter(s => s.status === "scheduled").slice(0, 2);

  const accept = async (id) => {
    await run(() => matchingApi.acceptRequest(id, "accept"));
    setAccepted(a => [...a, id]);
    reM();
  };

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{greet()},</div>
          <h2>{user?.first_name || user?.username} 👋</h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => setPage("matches")}>Find matches</button>
          <button className="btn btn-sm" onClick={() => setPage("skills")}>+ Skill</button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="grid3">
          <div className="stat-card">
            <div className="stat-label">Matches</div>
            <div className="stat-value">{allM.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active swaps</div>
            <div className="stat-value">{allM.filter(m => m.status === "accepted").length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Sessions</div>
            <div className="stat-value">{user?.total_sessions || 0}</div>
          </div>
        </div>

        {/* Pending requests */}
        {pending.length > 0 && (
          <div>
            <div className="section-title">Incoming requests</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pending.map(m => {
                const done = accepted.includes(m.id);
                return (
                  <div key={m.id} className="request-card">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                        <div className="avatar avatar-sm" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                          {initials(m.user1)}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{m.user1?.full_name}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>wants to swap skills with you</div>
                        </div>
                      </div>
                      <span className={`chip ${done ? "chip-green" : "chip-amber"}`}>
                        {done ? "Accepted" : "Pending"}
                      </span>
                    </div>
                    {!done ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => accept(m.id)}>
                          Accept ✓
                        </button>
                        <button className="btn btn-sm" style={{ flex: 1 }}>Decline</button>
                      </div>
                    ) : (
                      <button className="btn btn-primary btn-sm" style={{ width: "100%" }} onClick={() => setPage("chat")}>
                        Open chat →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top matches */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div className="section-title" style={{ margin: 0 }}>Your matches</div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, color: "var(--brand)" }}
              onClick={() => setPage("matches")}>View all →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topMatch.length > 0 ? topMatch.map((m, i) => (
              <div key={m.id} className="match-card" onClick={() => setPage("chat")}>
                <div className="avatar avatar-md" style={{ background: AVATAR_COLORS[i % 5].bg, color: AVATAR_COLORS[i % 5].color }}>
                  {initials(m.user2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>
                    {m.user2?.full_name || m.user2?.username}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {m.user1_teach_skill?.name && <>Teaches {m.user1_teach_skill.name}</>}
                    {m.user1_learn_skill?.name && <> · Wants {m.user1_learn_skill.name}</>}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
                    <span className="chip chip-blue" style={{ fontSize: 10 }}>{m.type}</span>
                    <span className={`chip ${m.status === "accepted" ? "chip-green" : "chip-amber"}`} style={{ fontSize: 10 }}>{m.status}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div className="score-circle">
                    {m.similarity_score ? `${Math.round(m.similarity_score)}%` : "—"}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>match</div>
                </div>
              </div>
            )) : (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">No matches yet</div>
                <div className="empty-state-sub">
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => setPage("matches")}>
                    Find matches →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming sessions */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div className="section-title" style={{ margin: 0 }}>Upcoming sessions</div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, color: "var(--brand)" }}
              onClick={() => setPage("video")}>Schedule →</button>
          </div>

          {upcoming.length > 0 ? upcoming.map(s => {
            const other = s.host?.id === user?.id ? s.guest : s.host;
            return (
              <div key={s.id} className="card card-sm" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--brand-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
                    {s.topic || "Session"} with {other?.first_name || other?.username}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {new Date(s.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {s.duration_minutes} min
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setPage("video")}>Join →</button>
              </div>
            );
          }) : (
            <div className="empty-state" style={{ padding: "24px" }}>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>No upcoming sessions</div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <div className="section-title">Quick actions</div>
          <div className="grid2">
            {[
              { label: "Add a skill", sub: "Teach or learn something new", page: "skills", icon: "+" },
              { label: "Run AI match", sub: "Find your best matches", page: "ai",     icon: "✦" },
            ].map(a => (
              <button key={a.page} className="btn" style={{ padding: "12px 14px", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}
                onClick={() => setPage(a.page)}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{a.icon} {a.label}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{a.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
