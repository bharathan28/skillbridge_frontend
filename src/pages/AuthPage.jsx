import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/client";

function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [tab,      setTab]      = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState("");
  const [success,  setSuccess]  = useState("");

  const reset = (t) => { setTab(t); setErr(""); setSuccess(""); };

  const submit = async () => {
    setErr(""); setSuccess("");
    if (!email || !password) { setErr("Please fill in all fields."); return; }
    setBusy(true);
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        if (password.length < 8) { setErr("Password must be at least 8 characters."); setBusy(false); return; }
        await signup({ email, password, password2: password });
      }
    } catch (e) {
      setErr(
        e?.data?.email?.[0] ||
        e?.data?.non_field_errors?.[0] ||
        e?.data?.detail ||
        e?.data?.error ||
        "Something went wrong. Please try again."
      );
    } finally { setBusy(false); }
  };

  const submitForgot = async () => {
    setErr(""); setSuccess("");
    if (!email) { setErr("Please enter your email address."); return; }
    setBusy(true);
    try {
      await authApi.forgotPassword(email);
      setSuccess("Check your inbox — we've sent a reset link.");
    } catch {
      setSuccess("Check your inbox — we've sent a reset link.");
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      {/* Left brand panel */}
      <div className="auth-left">
        <div className="auth-left-blob1" />
        <div className="auth-left-blob2" />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 56 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "rgba(255,255,255,.15)",
              border: "1px solid rgba(255,255,255,.22)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ color: "white", fontSize: 20, fontWeight: 700, fontFamily: "var(--font-body)", letterSpacing: "-0.3px" }}>
              SkillBridge
            </span>
          </div>

          <div style={{ fontFamily: "var(--font-display)", fontSize: 48, lineHeight: 1.08, color: "white", marginBottom: 22, letterSpacing: "-0.5px" }}>
            Swap skills,<br />
            <em style={{ fontStyle: "italic", color: "rgba(255,255,255,.88)" }}>grow together.</em>
          </div>
          <p style={{ color: "rgba(255,255,255,.68)", fontSize: 15.5, lineHeight: 1.75, maxWidth: 340, marginBottom: 44, fontWeight: 300 }}>
            SkillBridge connects people who want to teach and learn — like a talent marketplace, but built on community.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: "✦", text: "AI-powered skill matching" },
              { icon: "⬡", text: "Real-time chat & video sessions" },
              { icon: "◈", text: "3-way chain skill swaps" },
            ].map(f => (
              <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: "rgba(255,255,255,.1)",
                  border: "1px solid rgba(255,255,255,.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, color: "rgba(255,255,255,.9)",
                  fontWeight: 600
                }}>{f.icon}</div>
                <span style={{ color: "rgba(255,255,255,.78)", fontSize: 14, fontWeight: 400 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        {/* Mobile logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-brand)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 17, color: "var(--ink)", letterSpacing: "-0.2px" }}>SkillBridge</span>
        </div>

        {tab === "forgot" ? (
          <div className="fade-up">
            <button onClick={() => reset("login")} style={{ color: "var(--muted)", fontSize: 13, fontWeight: 500, marginBottom: 26, display: "flex", alignItems: "center", gap: 6 }}>
              ← Back to sign in
            </button>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--ink)", marginBottom: 8, letterSpacing: "-0.3px" }}>
              Reset password
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 30, fontWeight: 300 }}>
              Enter your email and we'll send a reset link.
            </p>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Email address</label>
              <input className="form-input" type="email" 
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitForgot()} />
            </div>
            {err     && <div className="alert alert-error"   style={{ marginBottom: 14 }}>{err}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: 14 }}>{success}</div>}
            <button className="btn btn-primary" onClick={submitForgot} disabled={busy}
              style={{ width: "100%", padding: "12px", fontSize: 14 }}>
              {busy ? <><span className="spinner" /> Sending…</> : "Send reset link"}
            </button>
          </div>
        ) : (
          <div className="fade-up">
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 34, color: "var(--ink)", marginBottom: 6, letterSpacing: "-0.3px" }}>
              {tab === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 30, fontWeight: 300 }}>
              {tab === "login"
                ? "Sign in to your SkillBridge account."
                : "Join thousands swapping skills every day."}
            </p>

            <div className="tab-switch" style={{ marginBottom: 26 }}>
              <button className={`tab-btn${tab === "login" ? " active" : ""}`}
                onClick={() => reset("login")}>Sign in</button>
              <button className={`tab-btn${tab === "signup" ? " active" : ""}`}
                onClick={() => reset("signup")}>Create account</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input className="form-input" type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  {tab === "login" && (
                    <button onClick={() => reset("forgot")}
                      style={{ fontSize: 12, color: "var(--brand)", fontWeight: 600 }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="input-wrap">
                  <input className="form-input" type={showPw ? "text" : "password"}
                    placeholder={tab === "signup" ? "At least 8 characters" : "••••••••"}
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && submit()}
                    autoComplete={tab === "login" ? "current-password" : "new-password"} />
                  <span className="input-eye" onClick={() => setShowPw(v => !v)}>
                    <EyeIcon open={showPw} />
                  </span>
                </div>
              </div>

              {err && <div className="alert alert-error">{err}</div>}

              <button className="btn btn-primary" onClick={submit} disabled={busy}
                style={{ width: "100%", padding: "13px", fontSize: 14, marginTop: 4, borderRadius: 12 }}>
                {busy
                  ? <><span className="spinner" /> Please wait…</>
                  : tab === "login" ? "Sign in →" : "Create account →"}
              </button>

              {tab === "signup" && (
                <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", lineHeight: 1.7, fontWeight: 300 }}>
                  By signing up you agree to our Terms of Service and Privacy Policy.
                  You'll set up your profile after signing in.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
