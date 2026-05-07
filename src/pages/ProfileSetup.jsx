
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const STEPS = ["Personal info", "Your bio", "Add skills"];

const CATS = [
  { id: "programming", label: "Programming", icon: "💻" },
  { id: "design",      label: "Design",      icon: "🎨" },
  { id: "music",       label: "Music",       icon: "🎵" },
  { id: "language",    label: "Language",    icon: "🌍" },
  { id: "business",    label: "Business",    icon: "💼" },
  { id: "data_science",label: "Data Science",icon: "📊" },
  { id: "writing",     label: "Writing",     icon: "✍️" },
  { id: "photography", label: "Photography", icon: "📷" },
  { id: "other",       label: "Other",       icon: "✨" },
];

export default function ProfileSetup({ user }) {
  const { updateUser } = useAuth();
  const [step,  setStep]  = useState(0);
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState("");
  const [form,  setForm]  = useState({ first_name: "", last_name: "", bio: "" });
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ name: "", category: "programming", type: "teach" });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const next = async () => {
    setErr("");
    if (step === 0) {
      if (!form.first_name.trim() || !form.last_name.trim()) {
        setErr("Please enter your first and last name."); return;
      }
    }
    if (step === 1) {
      if (!form.bio.trim()) { setErr("Please write a short bio."); return; }
      setBusy(true);
      try { await updateUser(form); } catch { setErr("Failed to save. Try again."); setBusy(false); return; }
      setBusy(false);
    }
    if (step === 2) {
      // Skills are optional — finish setup
      setBusy(true);
      try { await updateUser(form); } catch {}
      setBusy(false);
      return; // AuthContext re-fetches user → is_profile_complete becomes true → App unmounts setup
    }
    setStep(s => s + 1);
  };

  const addSkill = () => {
    if (!newSkill.name.trim()) return;
    setSkills(s => [...s, { ...newSkill, id: Date.now() }]);
    setNewSkill({ name: "", category: "programming", type: "teach" });
  };

  const removeSkill = id => setSkills(s => s.filter(x => x.id !== id));

  return (
    <div className="setup-page">
      <div className="setup-card fade-up">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>SkillBridge</span>
          </div>

          <div className="setup-step-indicator">
            {STEPS.map((_, i) => (
              <div key={i} className={`setup-step-dot${i <= step ? " active" : ""}`} />
            ))}
          </div>

          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 8 }}>
            Step {step + 1} of {STEPS.length}
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--ink)", marginBottom: 6 }}>
            {step === 0 && "What's your name?"}
            {step === 1 && "Tell people about yourself"}
            {step === 2 && "Add your first skills"}
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            {step === 0 && "This is how you'll appear to other members."}
            {step === 1 && "A great bio helps you get better matches."}
            {step === 2 && "Add skills you can teach or want to learn. You can add more later."}
          </p>
        </div>

        {/* Step 0 – Name */}
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="grid2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">First name</label>
                <input className="form-input" placeholder="Alex" value={form.first_name}
                  onChange={e => set("first_name", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Last name</label>
                <input className="form-input" placeholder="Johnson" value={form.last_name}
                  onChange={e => set("last_name", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 1 – Bio */}
        {step === 1 && (
          <div className="form-group">
            <label className="form-label">Short bio</label>
            <textarea className="form-input" rows={5} placeholder="e.g. I'm a frontend developer who loves design. Looking to improve my Spanish and can teach React or Figma in return."
              value={form.bio} onChange={e => set("bio", e.target.value)}
              style={{ resize: "none", lineHeight: 1.6 }} />
            <div style={{ fontSize: 11, color: "var(--muted-light)", marginTop: 4 }}>
              {form.bio.length}/300 characters
            </div>
          </div>
        )}

        {/* Step 2 – Skills */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="form-input" placeholder="e.g. Python, Guitar, Spanish…"
                value={newSkill.name} onChange={e => setNewSkill(s => ({ ...s, name: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addSkill()}
                style={{ flex: 1 }} />
              <select className="form-select" value={newSkill.type}
                onChange={e => setNewSkill(s => ({ ...s, type: e.target.value }))}
                style={{ width: 100 }}>
                <option value="teach">Teach</option>
                <option value="learn">Learn</option>
              </select>
              <button className="btn btn-primary" onClick={addSkill} style={{ flexShrink: 0 }}>Add</button>
            </div>

            {skills.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {skills.map(s => (
                  <div key={s.id} className="skill-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="skill-icon" style={{ background: "var(--brand-light)", fontSize: 15 }}>
                        {CATS.find(c => c.id === s.category)?.icon || "✨"}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.type === "teach" ? "Teaching" : "Learning"}</div>
                      </div>
                    </div>
                    <button className="btn btn-sm btn-ghost" style={{ color: "var(--muted)" }}
                      onClick={() => removeSkill(s.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {skills.length === 0 && (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted)", fontSize: 13 }}>
                No skills added yet — or skip and add them later.
              </div>
            )}
          </div>
        )}

        {err && <div className="alert alert-error" style={{ marginTop: 14 }}>{err}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
          {step > 0
            ? <button className="btn" onClick={() => { setStep(s => s - 1); setErr(""); }}>← Back</button>
            : <div />}
          <button className="btn btn-primary" onClick={next} disabled={busy}
            style={{ padding: "10px 24px", fontSize: 14 }}>
            {busy
              ? <><span className="spinner" /> Saving…</>
              : step === 2 ? "Finish setup →" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}
