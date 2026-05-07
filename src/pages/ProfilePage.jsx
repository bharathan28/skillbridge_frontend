import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Toggle({ on, onChange }) {
  return (
    <div className={`toggle ${on ? "on" : "off"}`} onClick={onChange} style={{ cursor: "pointer" }}>
      <div className="toggle-knob" />
    </div>
  );
}

function StarRating({ value }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24"
          fill={i <= Math.floor(value) ? "#F59E0B" : "none"}
          stroke={i <= Math.floor(value) ? "#F59E0B" : "#CBD5E1"}
          strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

const initials = u => {
  const n = u?.full_name || u?.username || "?";
  const p = n.trim().split(" ");
  return (p.length >= 2 ? p[0][0] + p[1][0] : n.slice(0, 2)).toUpperCase();
};

export default function ProfilePage({ user, onLogout }) {
  const { updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({ first_name: user?.first_name || "", last_name: user?.last_name || "", bio: user?.bio || "" });
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    aiMatching:    true,
    emailUpdates:  true,
    sessionReminders: true,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleSetting = k => setSettings(s => ({ ...s, [k]: !s[k] }));

  const save = async () => {
    setSaving(true);
    try {
      await updateUser(form);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently";

  return (
    <div className="page">
      <div className="topbar">
        <h2>Profile</h2>
        <button className="btn" onClick={() => { setEditing(v => !v); setSaved(false); }}>
          {editing ? "Cancel" : "Edit profile"}
        </button>
      </div>

      <div className="page-body">
        {saved && <div className="alert alert-success">Profile updated successfully ✓</div>}

        {/* Profile hero card */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
            <div className="avatar avatar-lg" style={{ background: "var(--brand-light)", color: "var(--brand)", fontSize: 24 }}>
              {initials(user)}
            </div>

            <div style={{ flex: 1 }}>
              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="grid2" style={{ gap: 10 }}>
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
                    <label className="form-label">Bio</label>
                    <textarea className="form-input" rows={3} style={{ resize: "none" }}
                      placeholder="Tell others what you can teach and what you want to learn…"
                      value={form.bio} onChange={e => set("bio", e.target.value)} />
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}
                    style={{ alignSelf: "flex-start", padding: "8px 20px" }}>
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.3px" }}>
                    {user?.full_name || user?.username}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{user?.email}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <StarRating value={user?.rating || 0} />
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      {(user?.rating || 0).toFixed(1)} · {user?.total_sessions || 0} sessions
                    </span>
                  </div>
                  {user?.bio && (
                    <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 10, lineHeight: 1.6, maxWidth: 420 }}>
                      {user.bio}
                    </p>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <span className="chip chip-gray" style={{ fontSize: 11 }}>Member since {memberSince}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="divider" />

          <div className="grid3">
            <div className="stat-card">
              <div className="stat-label">Rating</div>
              <div className="stat-value">{(user?.rating || 0).toFixed(1)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Sessions</div>
              <div className="stat-value">{user?.total_sessions || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Status</div>
              <div style={{ marginTop: 4 }}><span className="chip chip-green">Active</span></div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <div className="section-title">Preferences</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { key: "notifications",    label: "Push notifications",  desc: "New matches, messages and requests" },
              { key: "aiMatching",       label: "AI-powered matching", desc: "Use OpenAI embeddings for smart matches" },
              { key: "emailUpdates",     label: "Email digest",        desc: "Weekly summary of your activity" },
              { key: "sessionReminders", label: "Session reminders",   desc: "Get notified before scheduled sessions" },
            ].map(item => (
              <div key={item.key} className="skill-row" style={{ cursor: "pointer" }}
                onClick={() => toggleSetting(item.key)}>
                <div>
                  <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{item.desc}</div>
                </div>
                <Toggle on={settings[item.key]} onChange={() => toggleSetting(item.key)} />
              </div>
            ))}
          </div>
        </div>

        {/* Account actions */}
        <div className="card" style={{ background: "var(--bg)" }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Account</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn btn-danger" onClick={onLogout}
              style={{ justifyContent: "flex-start", padding: "10px 14px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
