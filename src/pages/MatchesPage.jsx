import { useState } from "react";
import { matchingApi } from "../api/client";
import { useApi, useAction } from "../hooks/useApi";

const AC = [
  {bg:"#E1F5EE",color:"#0F6E56"},{bg:"#EEEDFE",color:"#534AB7"},
  {bg:"#FAECE7",color:"#993C1D"},{bg:"#EAF3DE",color:"#3B6D11"},
  {bg:"#FBEAF0",color:"#993556"},{bg:"#E6F1FB",color:"#185FA5"},
];
const initials = u => {
  const n = u?.full_name || u?.username || "?";
  const p = n.trim().split(" ");
  return (p.length>=2 ? p[0][0]+p[1][0] : n.slice(0,2)).toUpperCase();
};

export default function MatchesPage({ setPage }) {
  const { data, loading, refetch } = useApi(() => matchingApi.getMatches());
  const { run } = useAction();
  const [filter,    setFilter]    = useState("all");
  const [requested, setRequested] = useState([]);
  const [running,   setRunning]   = useState(false);
  const [runMsg,    setRunMsg]    = useState("");

  const all      = Array.isArray(data) ? data : [];
  const filtered = filter === "all" ? all : all.filter(m => m.type === filter);

  const runAI = async () => {
    setRunning(true); setRunMsg("");
    try {
      const r = await matchingApi.runMatching();
      const total = (r.direct?.length||0) + (r.ai?.length||0) + (r.chain?.length||0);
      setRunMsg(`Found ${total} matches!`);
      refetch();
    } catch (e) {
      setRunMsg(e?.data?.error || "Set OPENAI_API_KEY in backend .env to enable AI matching.");
    }
    setRunning(false);
  };

  const request = async (match) => {
    try {
      await run(() => matchingApi.requestSwap(match.user2?.id, match.type));
      setRequested(r => [...r, match.id]);
    } catch {}
  };

  if (loading) return (
    <div className="page">
      <div className="topbar"><h2>Discover Matches</h2></div>
      <div className="page-body" style={{alignItems:"center",color:"var(--muted)"}}>Loading…</div>
    </div>
  );

  return (
    <div className="page">
      <div className="topbar">
        <h2>Discover Matches</h2>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
          {["all","direct","ai","chain"].map(f => (
            <button key={f} className="btn btn-sm"
              style={filter===f?{background:"var(--brand)",color:"white",borderColor:"var(--brand)"}:{}}
              onClick={() => setFilter(f)}>
              {f==="all"?"All":f==="ai"?"AI match":f==="direct"?"Direct":"Chain"}
            </button>
          ))}
          <button className="btn btn-sm btn-primary" onClick={runAI} disabled={running}>
            {running ? "Running…" : "✦ Run AI"}
          </button>
        </div>
      </div>

      <div className="page-body">
        {runMsg && (
          <div style={{padding:"8px 14px",borderRadius:"var(--rad)",fontSize:12,
            background:runMsg.includes("Found")?"var(--brand-light)":"var(--red-light)",
            color:runMsg.includes("Found")?"var(--brand-dark)":"var(--red-dark)",
            border:`0.5px solid ${runMsg.includes("Found")?"var(--brand)":"var(--red)"}`}}>
            {runMsg}
          </div>
        )}

        <div style={{fontSize:12,color:"var(--muted)"}}>
          {filtered.length} {filter==="all"?"total":filter} matches
        </div>

        {filtered.length === 0 && (
          <div style={{textAlign:"center",padding:40,color:"var(--muted)",
            border:"1px dashed var(--border2)",borderRadius:"var(--rad-lg)"}}>
            <div style={{fontSize:28,marginBottom:8}}>🔍</div>
            <div style={{fontSize:13}}>No matches yet — click <strong>Run AI</strong> to find some!</div>
          </div>
        )}

        {filtered.map((m, i) => {
          const sent = requested.includes(m.id) || m.status !== "pending";
          return (
            <div key={m.id} className="match-card" style={{alignItems:"flex-start"}}>
              <div className="avatar avatar-md" style={{background:AC[i%6].bg,color:AC[i%6].color}}>
                {initials(m.user2)}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:"var(--ink)",marginBottom:2}}>
                  {m.user2?.full_name || m.user2?.username}
                </div>
                <div style={{fontSize:12,color:"var(--muted)",marginBottom:5}}>
                  {m.user1_teach_skill?.name && <>Teaches <strong>{m.user1_teach_skill.name}</strong></>}
                  {m.user1_learn_skill?.name && <> · Wants <strong>{m.user1_learn_skill.name}</strong></>}
                </div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  <span className={`chip ${m.type==="direct"?"chip-match":m.type==="ai"?"chip-ai":"chip-chain"}`} style={{fontSize:10}}>
                    {m.type==="direct"?"Direct":m.type==="ai"?"AI match":"Chain"}
                  </span>
                  <span className={`chip chip-${m.status==="accepted"?"active":m.status==="pending"?"pending":"match"}`} style={{fontSize:10}}>
                    {m.status}
                  </span>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,flexShrink:0}}>
                <div className="score-circle">{m.similarity_score ? `${Math.round(m.similarity_score)}%` : "—"}</div>
                <button
                  className={`btn btn-sm${!sent?" btn-primary":""}`}
                  style={sent?{color:"var(--brand)",borderColor:"var(--brand)",fontSize:11}:{fontSize:11}}
                  onClick={() => { if (!sent) request(m); else setPage("chat"); }}>
                  {sent ? "Chat →" : "Request"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
