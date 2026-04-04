import { useState, useEffect, useCallback } from "react";
import { sessionsApi, videoWsUrl } from "../api/client";
import { useApi } from "../hooks/useApi";
import { useWebSocket } from "../hooks/useWebSocket";

const pad = n => String(n).padStart(2,"0");
const fmtDate = ts => { try { return new Date(ts).toLocaleDateString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); } catch { return ts; } };
const initials = u => { const n=u?.full_name||u?.username||"?"; const p=n.trim().split(" "); return (p.length>=2?p[0][0]+p[1][0]:n.slice(0,2)).toUpperCase(); };

export default function VideoPage({ user }) {
  const { data: sessions, loading, refetch } = useApi(() => sessionsApi.list());
  const [active,      setActive]      = useState(null);   // current session
  const [agoraInfo,   setAgoraInfo]   = useState(null);
  const [muted,       setMuted]       = useState(false);
  const [camOff,      setCamOff]      = useState(false);
  const [screen,      setScreen]      = useState(false);
  const [callOn,      setCallOn]      = useState(false);
  const [secs,        setSecs]        = useState(0);
  const [peerOn,      setPeerOn]      = useState(false);

  // Video signalling WebSocket
  const wsUrl = active?.agora_channel ? videoWsUrl(active.agora_channel) : null;
  const onSignal = useCallback(msg => {
    if (msg.type === "call_accept") setPeerOn(true);
    if (msg.type === "call_end") endCall();
  }, []);
  const { send: signal, connected: sigOn } = useWebSocket(wsUrl, onSignal);

  useEffect(() => {
    if (!callOn) return;
    const t = setInterval(() => setSecs(s => s+1), 1000);
    return () => clearInterval(t);
  }, [callOn]);

  const all      = Array.isArray(sessions) ? sessions : [];
  const upcoming = all.filter(s => s.status==="scheduled");
  const done     = all.filter(s => s.status==="completed").slice(0,3);

  const joinCall = async (session) => {
    try {
      const info = await sessionsApi.start(session.id);
      setAgoraInfo(info);
      setActive({ ...session, agora_channel: info.agora_channel });
    } catch {
      // Dev mode — no Agora keys yet
      setActive(session);
      setAgoraInfo({ agora_channel: session.agora_channel || "dev-ch", agora_app_id:"" });
    }
    setCallOn(true); setSecs(0); setPeerOn(false);
    refetch();
    setTimeout(() => signal({ type:"call_offer", from_user:user?.id }), 600);
  };

  const endCall = () => {
    signal({ type:"call_end", from_user:user?.id });
    if (active) sessionsApi.update(active.id, { status:"completed" }).then(refetch).catch(()=>{});
    setCallOn(false); setActive(null); setAgoraInfo(null); setSecs(0); setPeerOn(false);
  };

  const other = s => s?.host?.id===user?.id ? s?.guest : s?.host;

  if (loading) return (
    <div className="page"><div className="topbar"><h2>Video Sessions</h2></div>
    <div className="page-body" style={{alignItems:"center",color:"var(--muted)"}}>Loading…</div></div>
  );

  return (
    <div className="page">
      <div className="topbar">
        <h2>Video Sessions</h2>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {callOn && sigOn && <span className="chip chip-active">Signal live</span>}
          <span className="chip chip-match">Agora SDK</span>
        </div>
      </div>
      <div className="page-body">

        {/* Active call */}
        {callOn && active ? (
          <>
            <div className="section-title">Live · {other(active)?.full_name} · {active.topic||"Session"}</div>
            <div className="video-mock">
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                <div style={{width:72,height:72,borderRadius:"50%",background:"#1D9E75",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:24,fontWeight:800,color:"white",fontFamily:"var(--font-display)"}}>
                  {initials(other(active))}
                </div>
                <div style={{color:"rgba(255,255,255,.9)",fontSize:14,fontWeight:500}}>{other(active)?.full_name}</div>
                <div style={{color:"rgba(255,255,255,.5)",fontSize:12,display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:peerOn?"#5DCAA5":"#EF9F27"}}/>
                  {peerOn?`Connected · ${pad(Math.floor(secs/60))}:${pad(secs%60)}`:`Ringing… · ${pad(Math.floor(secs/60))}:${pad(secs%60)}`}
                </div>
                {screen && <div style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:6,padding:"4px 10px",fontSize:11,color:"rgba(255,255,255,.8)"}}>📺 Sharing screen</div>}
                {agoraInfo?.agora_channel && <div style={{fontSize:10,color:"rgba(255,255,255,.3)",fontFamily:"monospace"}}>ch: {agoraInfo.agora_channel}</div>}
              </div>

              {/* Self view */}
              <div style={{position:"absolute",bottom:14,right:14,width:82,height:62,borderRadius:8,
                background:"#0F1628",display:"flex",alignItems:"center",justifyContent:"center",
                border:"1.5px solid rgba(255,255,255,.15)"}}>
                {camOff
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"/></svg>
                  : <div style={{width:28,height:28,borderRadius:"50%",background:"var(--brand)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"white",fontFamily:"var(--font-display)"}}>{initials(user)}</div>
                }
              </div>

              {/* Controls */}
              <div className="video-controls">
                <button className="vc-btn mute" onClick={()=>setMuted(v=>!v)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={muted?"rgba(255,80,80,1)":"white"} strokeWidth="2">
                    {muted ? <><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/></> : <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></>}
                  </svg>
                </button>
                <button className="vc-btn mute" onClick={()=>setCamOff(v=>!v)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={camOff?"rgba(255,80,80,1)":"white"} strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                  </svg>
                </button>
                <button className="vc-btn screen" onClick={()=>setScreen(v=>!v)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={screen?"#5DCAA5":"white"} strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </button>
                <button className="vc-btn end" onClick={endCall}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="card card-sm">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--ink)"}}>{active.topic||"Session"}</div>
                  <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{active.duration_minutes} min · {other(active)?.full_name}</div>
                </div>
                <span className="chip chip-active">Live</span>
              </div>
              {agoraInfo?.agora_channel && (
                <><div className="divider"/>
                  <div className="mono-block" style={{fontSize:10}}>Channel: {agoraInfo.agora_channel} · App ID: {agoraInfo.agora_app_id||"(set AGORA_APP_ID in .env)"}</div>
                </>
              )}
            </div>
          </>
        ) : (
          <div>
            <div className="section-title">No active call</div>
            <div className="card card-sm" style={{background:"var(--bg2)",textAlign:"center",padding:28}}>
              <div style={{fontSize:32,marginBottom:8}}>📹</div>
              <div style={{fontSize:13,color:"var(--muted)"}}>Join a scheduled session below to start</div>
            </div>
          </div>
        )}

        {/* Upcoming */}
        <div>
          <div className="section-title">Upcoming sessions ({upcoming.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {upcoming.map(s => (
              <div key={s.id} className="card card-sm" style={{display:"flex",alignItems:"center",gap:12}}>
                <div className="avatar avatar-sm" style={{background:"#E1F5EE",color:"#0F6E56"}}>{initials(other(s))}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,color:"var(--ink)"}}>{other(s)?.full_name} · {s.topic||"Session"}</div>
                  <div style={{fontSize:11,color:"var(--muted)"}}>{fmtDate(s.scheduled_at)} · {s.duration_minutes} min</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={()=>joinCall(s)}>Join call</button>
              </div>
            ))}
            {upcoming.length===0 && <div style={{padding:20,textAlign:"center",color:"var(--muted)",fontSize:12,border:"1px dashed var(--border2)",borderRadius:"var(--rad-lg)"}}>No upcoming sessions. Schedule after matching!</div>}
          </div>
        </div>

        {done.length > 0 && (
          <div>
            <div className="section-title">Completed</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {done.map(s => (
                <div key={s.id} className="card card-sm" style={{display:"flex",alignItems:"center",gap:12}}>
                  <div className="avatar avatar-sm" style={{background:"#EAF3DE",color:"#3B6D11"}}>{initials(other(s))}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,color:"var(--ink)"}}>{other(s)?.full_name} · {s.topic||"Session"}</div>
                    <div style={{fontSize:11,color:"var(--muted)"}}>{fmtDate(s.scheduled_at)}</div>
                  </div>
                  <span className="chip chip-active">Done ✓</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
