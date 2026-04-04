import { useState } from "react";
import { useApi, useAction } from "../hooks/useApi";
import { matchingApi, sessionsApi } from "../api/client";

const AC = [
  {bg:"#E1F5EE",color:"#0F6E56"},{bg:"#EEEDFE",color:"#534AB7"},
  {bg:"#FAECE7",color:"#993C1D"},{bg:"#EAF3DE",color:"#3B6D11"},
  {bg:"#FBEAF0",color:"#993556"},
];
const initials = u => {
  const n = u?.full_name || u?.username || "?";
  const p = n.trim().split(" ");
  return (p.length >= 2 ? p[0][0] + p[1][0] : n.slice(0,2)).toUpperCase();
};

export default function Dashboard({ user, setPage }) {
  const { data: matches,  refetch: reM } = useApi(() => matchingApi.getMatches());
  const { data: sessions              }  = useApi(() => sessionsApi.list());
  const { run } = useAction();
  const [accepted, setAccepted] = useState([]);

  const allM = Array.isArray(matches)  ? matches  : [];
  const allS = Array.isArray(sessions) ? sessions : [];

  const pending   = allM.filter(m => m.status === "pending" && m.user2?.id === user?.id).slice(0,2);
  const topMatch  = allM.filter(m => m.status === "accepted").sort((a,b) => (b.similarity_score||0)-(a.similarity_score||0)).slice(0,3);
  const upcoming  = allS.filter(s => s.status === "scheduled").slice(0,2);

  const accept = async (id) => {
    await run(() => matchingApi.acceptRequest(id, "accept"));
    setAccepted(a => [...a, id]);
    reM();
  };

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div style={{fontSize:12,color:"var(--muted)"}}>Good morning,</div>
          <h2>{user?.full_name || user?.username} 👋</h2>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button className="btn" onClick={() => setPage("matches")}>Find matches</button>
          <div className="avatar avatar-sm" style={{background:"var(--brand-light)",color:"var(--brand)",cursor:"pointer"}}
            onClick={() => setPage("profile")}>
            {initials(user)}
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="grid3">
          <div className="stat-card"><div className="stat-label">My matches</div>
            <div className="stat-value">{allM.length}</div></div>
          <div className="stat-card"><div className="stat-label">Active swaps</div>
            <div className="stat-value">{allM.filter(m=>m.status==="accepted").length}</div></div>
          <div className="stat-card"><div className="stat-label">Sessions done</div>
            <div className="stat-value">{user?.total_sessions || 0}</div></div>
        </div>

        {/* Pending requests */}
        {pending.length > 0 && (
          <div>
            <div className="section-title">Incoming requests</div>
            {pending.map(m => {
              const done = accepted.includes(m.id);
              return (
                <div key={m.id} className="request-card" style={{marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div className="avatar avatar-sm" style={{background:"#EEEDFE",color:"#534AB7"}}>{initials(m.user1)}</div>
                      <div>
                        <div style={{fontSize:14,fontWeight:600,color:"var(--ink)"}}>{m.user1?.full_name}</div>
                        <div style={{fontSize:11,color:"var(--muted)"}}>wants to swap skills</div>
                      </div>
                    </div>
                    <span className={`chip ${done ? "chip-active" : "chip-pending"}`}>{done ? "Accepted ✓" : "Pending"}</span>
                  </div>
                  {!done ? (
                    <div style={{display:"flex",gap:8}}>
                      <button className="btn btn-primary btn-sm" style={{flex:1}} onClick={() => accept(m.id)}>Accept swap ✓</button>
                      <button className="btn btn-sm">Decline</button>
                    </div>
                  ) : (
                    <button className="btn btn-primary btn-sm" style={{width:"100%"}} onClick={() => setPage("chat")}>Open chat →</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Top matches */}
        <div>
          <div className="section-title">Your top matches</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {topMatch.length > 0 ? topMatch.map((m, i) => (
              <div key={m.id} className="match-card" onClick={() => setPage("chat")}>
                <div className="avatar avatar-md" style={{background:AC[i%5].bg,color:AC[i%5].color}}>{initials(m.user2)}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--ink)",marginBottom:2}}>{m.user2?.full_name || m.user2?.username}</div>
                  <div style={{fontSize:12,color:"var(--muted)"}}>
                    {m.user1_teach_skill?.name && <>Teaches {m.user1_teach_skill.name}</>}
                    {m.user1_learn_skill?.name && <> · Wants {m.user1_learn_skill.name}</>}
                  </div>
                  <div style={{display:"flex",gap:4,marginTop:4}}>
                    <span className="chip chip-match" style={{fontSize:10}}>{m.type}</span>
                    <span className="chip chip-active" style={{fontSize:10}}>{m.status}</span>
                  </div>
                </div>
                <div className="score-pill">
                  <div className="score-circle">{m.similarity_score ? `${Math.round(m.similarity_score)}%` : "—"}</div>
                  <div style={{fontSize:10,color:"var(--muted)"}}>match</div>
                </div>
              </div>
            )) : (
              <div style={{textAlign:"center",padding:24,color:"var(--muted)",fontSize:13,
                border:"1px dashed var(--border2)",borderRadius:"var(--rad-lg)"}}>
                No matches yet.{" "}
                <button className="btn btn-sm btn-primary" style={{marginLeft:8}} onClick={() => setPage("matches")}>
                  Find matches →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming sessions */}
        <div>
          <div className="section-title">Upcoming sessions</div>
          {upcoming.length > 0 ? upcoming.map(s => {
            const other = s.host?.id === user?.id ? s.guest : s.host;
            return (
              <div key={s.id} className="card card-sm" style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
                <div style={{width:42,height:42,borderRadius:10,background:"var(--brand-light)",
                  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-dark)" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:500,color:"var(--ink)"}}>{s.topic || "Session"} with {other?.full_name}</div>
                  <div style={{fontSize:12,color:"var(--muted)"}}>
                    {new Date(s.scheduled_at).toLocaleDateString()} · {s.duration_minutes} min
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setPage("video")}>Join call</button>
              </div>
            );
          }) : (
            <div style={{padding:16,textAlign:"center",color:"var(--muted)",fontSize:12,
              border:"1px dashed var(--border2)",borderRadius:"var(--rad-lg)"}}>
              No upcoming sessions scheduled yet.
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <div className="section-title">Quick actions</div>
          <div className="grid2">
            <button className="btn" style={{padding:"10px 12px",textAlign:"left"}} onClick={() => setPage("skills")}>
              <div style={{fontSize:13,fontWeight:500,color:"var(--ink)"}}>+ Add a skill</div>
              <div style={{fontSize:11,color:"var(--muted)"}}>Teach or learn</div>
            </button>
            <button className="btn" style={{padding:"10px 12px",textAlign:"left"}} onClick={() => setPage("ai")}>
              <div style={{fontSize:13,fontWeight:500,color:"var(--ink)"}}>✦ AI match me</div>
              <div style={{fontSize:11,color:"var(--muted)"}}>OpenAI embeddings</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
