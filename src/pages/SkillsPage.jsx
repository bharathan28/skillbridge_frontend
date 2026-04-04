import { useState } from "react";
import { skillsApi } from "../api/client";
import { useApi, useAction } from "../hooks/useApi";

const CATS = ["programming","design","music","language","business","photography","data_science","writing","other"];
const EMOJI = { programming:"💻",design:"🎨",music:"🎵",language:"🌍",business:"💼",photography:"📷",data_science:"📊",writing:"✍️",other:"✨" };
const BG    = { programming:"#E1F5EE",design:"#EEEDFE",music:"#FBEAF0",language:"#E6F1FB",business:"#FAEEDA",photography:"#FAECE7",data_science:"#EAF3DE",writing:"#E6F1FB",other:"#F1EFE8" };

function LevelDots({ level }) {
  return (
    <div className="level-dots">
      {[1,2,3,4,5].map(i => <div key={i} className={`level-dot${i<=level?" filled":""}`}/>)}
    </div>
  );
}

function SkillRow({ s, onDelete }) {
  const cat = s.skill.category;
  return (
    <div className="skill-row">
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div className="skill-icon" style={{background:BG[cat]||"#E1F5EE"}}>{EMOJI[cat]||"✨"}</div>
        <div>
          <div style={{fontSize:14,fontWeight:500,color:"var(--ink)"}}>{s.skill.name}</div>
          <div style={{fontSize:11,color:"var(--muted)"}}>{s.skill.category}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <LevelDots level={s.level}/>
        <span className={`chip ${s.type==="teach"?"chip-teach":"chip-learn"}`}>
          {s.type==="teach"?"Teaching":"Learning"}
        </span>
        <button className="btn btn-sm" style={{padding:"3px 8px",color:"var(--muted)",fontSize:11}}
          onClick={() => onDelete(s.id)}>✕</button>
      </div>
    </div>
  );
}

export default function SkillsPage() {
  const { data, loading, refetch } = useApi(() => skillsApi.mySkills());
  const { run } = useAction();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ skill_name:"", skill_category:"programming", level:3, type:"teach" });
  const [busy, setBusy] = useState(false);

  const skills = Array.isArray(data)
  ? data
  : data?.results || data?.data || [];

  const teach = skills.filter(s => s.type === "teach");
  const learn = skills.filter(s => s.type === "learn");

  const add = async () => {
    if (!form.skill_name.trim()) return;
    setBusy(true);
    try { await skillsApi.addSkill(form); refetch(); setShow(false); setForm({skill_name:"",skill_category:"programming",level:3,type:"teach"}); }
    catch {}
    setBusy(false);
  };

  const del = async (id) => {
    await run(() => skillsApi.deleteSkill(id));
    refetch();
  };

  if (loading) return <div className="page"><div className="topbar"><h2>My Skills</h2></div><div className="page-body" style={{alignItems:"center",color:"var(--muted)"}}>Loading…</div></div>;

  return (
    <div className="page">
      <div className="topbar">
        <h2>My Skills</h2>
        <button className="btn btn-primary" onClick={() => setShow(v=>!v)}>{show?"Cancel":"+ Add skill"}</button>
      </div>
      <div className="page-body">

        {show && (
          <div className="card" style={{background:"var(--bg2)",border:"0.5px solid var(--brand)"}}>
            <div style={{fontSize:14,fontWeight:600,color:"var(--ink)",marginBottom:12}}>Add a new skill</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div className="form-group">
                <label className="form-label">Skill name</label>
                <input className="form-input" placeholder="e.g. JavaScript, Piano, Spanish…"
                  value={form.skill_name} onChange={e=>setForm({...form,skill_name:e.target.value})}
                  onKeyDown={e=>e.key==="Enter"&&add()}/>
              </div>
              <div className="grid2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.skill_category} onChange={e=>setForm({...form,skill_category:e.target.value})}>
                    {CATS.map(c=><option key={c} value={c}>{c.replace("_"," ")}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Level: {form.level}/5</label>
                  <input type="range" min="1" max="5" step="1" value={form.level}
                    onChange={e=>setForm({...form,level:parseInt(e.target.value)})} style={{marginTop:8}}/>
                </div>
              </div>
              <div style={{display:"flex",gap:16}}>
                <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13}}>
                  <input type="radio" name="stype" checked={form.type==="teach"} onChange={()=>setForm({...form,type:"teach"})}/> I can teach this
                </label>
                <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13}}>
                  <input type="radio" name="stype" checked={form.type==="learn"} onChange={()=>setForm({...form,type:"learn"})}/> I want to learn this
                </label>
              </div>
              <button className="btn btn-primary" style={{width:"100%"}} onClick={add} disabled={busy}>
                {busy?"Adding…":"Add skill"}
              </button>
            </div>
          </div>
        )}

        <div>
          <div className="section-title">Skills I can teach ({teach.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {teach.map(s => <SkillRow key={s.id} s={s} onDelete={del}/>)}
            {teach.length===0 && <Empty text="No teaching skills yet."/>}
          </div>
        </div>

        <div>
          <div className="section-title">Skills I want to learn ({learn.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {learn.map(s => <SkillRow key={s.id} s={s} onDelete={del}/>)}
            {learn.length===0 && <Empty text="No learning goals yet."/>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{padding:24,textAlign:"center",color:"var(--muted)",fontSize:13,
      border:"1px dashed var(--border2)",borderRadius:"var(--rad-lg)"}}>
      {text}
    </div>
  );
}
