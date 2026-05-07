import { useState } from "react";
import { skillsApi } from "../api/client";
import { useApi, useAction } from "../hooks/useApi";

const CATS = [
  { id: "programming", label: "Programming", icon: "💻", bg: "#EFF6FF" },
  { id: "design",      label: "Design",      icon: "🎨", bg: "#FAF5FF" },
  { id: "music",       label: "Music",       icon: "🎵", bg: "#FFF1F2" },
  { id: "language",    label: "Language",    icon: "🌍", bg: "#F0FDF4" },
  { id: "business",    label: "Business",    icon: "💼", bg: "#FFFBEB" },
  { id: "photography", label: "Photography", icon: "📷", bg: "#FFF7ED" },
  { id: "data_science",label: "Data Science",icon: "📊", bg: "#F0FDF4" },
  { id: "writing",     label: "Writing",     icon: "✍️", bg: "#EFF6FF" },
  { id: "other",       label: "Other",       icon: "✨", bg: "#F8FAFC" },
];

const catMeta = id => CATS.find(c => c.id === id) || CATS[8];

function LevelDots({ level }) {
  return (
    <div className="level-dots">
      {[1,2,3,4,5].map(i => <div key={i} className={`level-dot${i <= level ? " filled" : ""}`} />)}
    </div>
  );
}

function SkillCard({ s, onDelete }) {
  const cat = catMeta(s.skill.category);
  return (
    <div className="skill-row">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="skill-icon" style={{ background: cat.bg, fontSize: 16 }}>{cat.icon}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{s.skill.name}</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{cat.label}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <LevelDots level={s.level} />
        <span className={`chip ${s.type === "teach" ? "chip-teach" : "chip-learn"}`} style={{ fontSize: 11 }}>
          {s.type === "teach" ? "Teaching" : "Learning"}
        </span>
        <button className="btn btn-sm btn-ghost" style={{ color: "var(--muted-light)", padding: "3px 8px" }}
          onClick={() => onDelete(s.id)}>✕</button>
      </div>
    </div>
  );
}

export default function SkillsPage() {
  const { data, loading, refetch } = useApi(() => skillsApi.mySkills());
  const { run } = useAction();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ skill_name: "", skill_category: "programming", level: 3, type: "teach" });
  const [busy, setBusy] = useState(false);

  const skills = Array.isArray(data) ? data : data?.results || [];
  const teach  = skills.filter(s => s.type === "teach");
  const learn  = skills.filter(s => s.type === "learn");

  const add = async () => {
    if (!form.skill_name.trim()) return;
    setBusy(true);
    try {
      await skillsApi.addSkill(form);
      refetch();
      setShow(false);
      setForm({ skill_name: "", skill_category: "programming", level: 3, type: "teach" });
    } catch {}
    setBusy(false);
  };

  const del = async (id) => { await run(() => skillsApi.deleteSkill(id)); refetch(); };

  if (loading) return (
    <div className="page">
      <div className="topbar"><h2>My Skills</h2></div>
      <div className="page-body" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="spinner spinner-brand" />
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="topbar">
        <h2>My Skills</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShow(v => !v)}>
          {show ? "Cancel" : "+ Add skill"}
        </button>
      </div>

      <div className="page-body">
        {/* Add skill form */}
        {show && (
          <div className="card fade-up" style={{ border: "1px solid var(--brand-pale)", background: "var(--brand-light)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 14 }}>Add a skill</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="grid2" style={{ gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Skill name</label>
                  <input className="form-input" placeholder="e.g. Python, Guitar…"
                    value={form.skill_name} onChange={e => setForm({ ...form, skill_name: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && add()} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.skill_category}
                    onChange={e => setForm({ ...form, skill_category: e.target.value })}>
                    {CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid2" style={{ gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["teach", "learn"].map(t => (
                      <button key={t} className="btn btn-sm"
                        style={form.type === t ? { background: "var(--brand)", color: "white", borderColor: "var(--brand)", flex: 1 } : { flex: 1 }}
                        onClick={() => setForm({ ...form, type: t })}>
                        {t === "teach" ? "Teaching" : "Learning"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Level (1–5)</label>
                  <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                    {[1,2,3,4,5].map(l => (
                      <button key={l} onClick={() => setForm({ ...form, level: l })}
                        style={{
                          width: 34, height: 34, borderRadius: 8, border: "1px solid",
                          borderColor: form.level >= l ? "var(--brand)" : "var(--border-mid)",
                          background: form.level >= l ? "var(--brand)" : "var(--surface)",
                          color: form.level >= l ? "white" : "var(--muted)",
                          fontSize: 13, fontWeight: 600, cursor: "pointer"
                        }}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>

              <button className="btn btn-primary" onClick={add} disabled={busy}
                style={{ alignSelf: "flex-end", padding: "9px 24px" }}>
                {busy ? "Adding…" : "Add skill"}
              </button>
            </div>
          </div>
        )}

        {/* Teaching */}
        <div>
          <div className="section-title">Teaching ({teach.length})</div>
          {teach.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {teach.map(s => <SkillCard key={s.id} s={s} onDelete={del} />)}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "20px" }}>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>No teaching skills yet — add one above.</div>
            </div>
          )}
        </div>

        {/* Learning */}
        <div>
          <div className="section-title">Learning ({learn.length})</div>
          {learn.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {learn.map(s => <SkillCard key={s.id} s={s} onDelete={del} />)}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "20px" }}>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>No learning goals yet — add one above.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
