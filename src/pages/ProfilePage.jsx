import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAccess } from "../api/client";

function Toggle({ on, onChange }) {
  return (
    <div className={`toggle ${on?"on":"off"}`} onClick={onChange} style={{cursor:"pointer"}}>
      <div className="toggle-knob"/>
    </div>
  );
}

export default function ProfilePage({ user, onLogout }) {
  const { updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name:user?.first_name||"", last_name:user?.last_name||"", bio:user?.bio||"" });
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notifications:true, aiMatching:true, chainMatching:true,
    sessionRecording:false, emailUpdates:true,
  });

  const save = async () => {
    setSaving(true);
    try { await updateUser(form); setEditing(false); }
    catch {}
    setSaving(false);
  };

  const token = getAccess();
  const tokenPreview = token ? token.slice(0,45)+"…" : "No token";

  const toggleSetting = k => setSettings(s => ({...s,[k]:!s[k]}));

  const settingsList = [
    {key:"notifications",   label:"Push notifications",  desc:"New matches and messages"},
    {key:"aiMatching",      label:"AI matching",         desc:"OpenAI text-embedding-3-small"},
    {key:"chainMatching",   label:"Chain matching",      desc:"Multi-user DFS cycle detection"},
    {key:"sessionRecording",label:"Session recording",   desc:"Auto-record video sessions"},
    {key:"emailUpdates",    label:"Email digest",        desc:"Weekly activity summary"},
  ];

  return (
    <div className="page">
      <div className="topbar">
        <h2>My Profile</h2>
        <button className="btn" onClick={() => setEditing(v=>!v)}>{editing?"Cancel":"Edit profile"}</button>
      </div>
      <div className="page-body">

        {/* Profile card */}
        <div className="card">
          <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
            <div className="avatar" style={{width:68,height:68,fontSize:20,flexShrink:0,
              background:"var(--brand-light)",color:"var(--brand)"}}>
              {(user?.full_name||user?.username||"AC").slice(0,2).toUpperCase()}
            </div>
            <div style={{flex:1}}>
              {editing ? (
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div className="grid2" style={{gap:8}}>
                    <input className="form-input" placeholder="First name" style={{fontSize:13}}
                      value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})}/>
                    <input className="form-input" placeholder="Last name" style={{fontSize:13}}
                      value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})}/>
                  </div>
                  <textarea className="form-input" placeholder="Bio…" rows={2} style={{fontSize:13,resize:"none"}}
                    value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/>
                  <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                    {saving?"Saving…":"Save changes"}
                  </button>
                </div>
              ) : (
                <>
                  <div style={{fontFamily:"var(--font-display)",fontSize:18,fontWeight:700,color:"var(--ink)",letterSpacing:"-0.3px"}}>
                    {user?.full_name||user?.username}
                  </div>
                  <div style={{fontSize:13,color:"var(--muted)",marginTop:2}}>{user?.email}</div>
                  {user?.bio && <div style={{fontSize:12,color:"var(--muted)",marginTop:4,lineHeight:1.5}}>{user.bio}</div>}
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}>
                    <div style={{display:"flex",gap:2}}>
                      {[1,2,3,4,5].map(i => <span key={i} style={{fontSize:13,color:i<=Math.floor(user?.rating||0)?"#EF9F27":"var(--border2)"}}>★</span>)}
                    </div>
                    <span style={{fontSize:12,color:"var(--muted)"}}>{user?.rating||0} · {user?.total_sessions||0} sessions</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="divider"/>
          <div className="grid2">
            <div className="stat-card"><div className="stat-label">Rating</div><div className="stat-value">{user?.rating||0}</div></div>
            <div className="stat-card"><div className="stat-label">Sessions</div><div className="stat-value">{user?.total_sessions||0}</div></div>
          </div>
        </div>

        {/* JWT token */}
        <div className="card card-sm" style={{background:"var(--bg2)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div style={{fontSize:13,fontWeight:500,color:"var(--ink)"}}>JWT Token</div>
            <span className="chip chip-active">Active</span>
          </div>
          <div className="mono-block">{tokenPreview}</div>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:6}}>
            Bearer token · 24h lifetime · Auto-refresh on expiry · Django SimpleJWT
          </div>
        </div>

        {/* Settings */}
        <div>
          <div className="section-title">Settings</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {settingsList.map(item => (
              <div key={item.key} className="skill-row" style={{cursor:"pointer"}} onClick={()=>toggleSetting(item.key)}>
                <div>
                  <div style={{fontSize:14,color:"var(--ink)"}}>{item.label}</div>
                  <div style={{fontSize:11,color:"var(--muted)"}}>{item.desc}</div>
                </div>
                <Toggle on={settings[item.key]} onChange={()=>toggleSetting(item.key)}/>
              </div>
            ))}
          </div>
        </div>

        {/* Stack badges */}
        <div className="card card-sm" style={{background:"var(--bg2)"}}>
          <div className="section-title" style={{marginBottom:8}}>Tech stack</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {["React.js","Vite","Django","DRF","PostgreSQL","Redis","Django Channels","Agora SDK","OpenAI","JWT","Vercel","Render"].map(t=>(
              <span key={t} className="chip chip-match" style={{fontSize:10}}>{t}</span>
            ))}
          </div>
        </div>

        <button className="btn" style={{color:"var(--red)",borderColor:"var(--red)",width:"100%",padding:10}}
          onClick={onLogout}>Sign out</button>
      </div>
    </div>
  );
}
