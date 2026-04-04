import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [tab, setTab]   = useState("login");
  const [form, setForm] = useState({ email:"alex@example.com", password:"password123", first_name:"", last_name:"", username:"" });
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setErr(""); setBusy(true);
    try {
      if (tab === "login") {
        if (!form.email || !form.password) { setErr("Email and password required."); return; }
        await login(form.email, form.password);
      } else {
        if (!form.email || !form.password || !form.username || !form.first_name) {
          setErr("All fields are required."); return;
        }
        await signup({ ...form, password2: form.password });
      }
    } catch (e) {
      setErr(
        e?.data?.email?.[0] ||
        e?.data?.non_field_errors?.[0] ||
        e?.data?.detail ||
        e?.data?.error ||
        "Login failed. Check your credentials."
      );
    } finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", padding:24, background:"var(--bg3)" }}>
      <div style={{ width:"100%", maxWidth:380, background:"var(--surface)",
        border:"0.5px solid var(--border)", borderRadius:"var(--rad-xl)",
        padding:32, display:"flex", flexDirection:"column", gap:18 }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:44, height:44, background:"var(--brand)", borderRadius:13,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:800,
              color:"var(--ink)", letterSpacing:"-0.5px" }}>SkillSwap AI</div>
            <div style={{ fontSize:12, color:"var(--muted)" }}>Exchange skills · Grow together</div>
          </div>
        </div>

        {/* Tab */}
        <div className="tab-switch">
          <button className={`tab-btn${tab==="login"?" active":""}`}
            onClick={() => { setTab("login"); setErr(""); }}>Sign in</button>
          <button className={`tab-btn${tab==="signup"?" active":""}`}
            onClick={() => { setTab("signup"); setErr(""); }}>Sign up</button>
        </div>

        {/* Form */}
        <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
          {tab === "signup" && (
            <>
              <div className="grid2" style={{ gap:8 }}>
                <div className="form-group">
                  <label className="form-label">First name</label>
                  <input className="form-input" placeholder="First" value={form.first_name}
                    onChange={e => set("first_name", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last name</label>
                  <input className="form-input" placeholder="Last" value={form.last_name}
                    onChange={e => set("last_name", e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" placeholder="your_username" value={form.username}
                  onChange={e => set("username", e.target.value)} />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="form-input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => set("email", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => set("password", e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()} />
          </div>

          {err && (
            <div style={{ background:"var(--red-light)", color:"var(--red-dark)", padding:"8px 12px",
              borderRadius:"var(--rad)", fontSize:12, border:"0.5px solid var(--red)" }}>
              {err}
            </div>
          )}

          <button className="btn btn-primary" onClick={submit} disabled={busy}
            style={{ padding:10, fontSize:14, borderRadius:"var(--rad)", width:"100%", marginTop:4 }}>
            {busy ? "Please wait…" : tab === "login" ? "Sign in →" : "Create account →"}
          </button>
        </div>

        <div className="divider" />
        <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center" }}>
          Demo: <strong>alex@example.com</strong> / <strong>password123</strong>
        </div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {["Django REST","JWT Auth","WebSockets","Agora SDK","OpenAI"].map(t => (
            <span key={t} className="chip chip-match" style={{ fontSize:10 }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
