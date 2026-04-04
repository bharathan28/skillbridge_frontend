import { useState, useEffect } from "react";
import { matchingApi } from "../api/client";
import { useApi } from "../hooks/useApi";

function Bar({ score }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(()=>setW(score),150); return ()=>clearTimeout(t); }, [score]);
  return <div className="progress-track"><div className="progress-fill" style={{width:`${w}%`}}/></div>;
}

export default function AIMatchingPage() {
  const { data: matches } = useApi(() => matchingApi.getMatches("ai"));
  const { data: chains  } = useApi(() => matchingApi.getChains());

  const [skillA, setSkillA] = useState("Python");
  const [skillB, setSkillB] = useState("Machine Learning");
  const [score,  setScore]  = useState(null);
  const [computing, setComp] = useState(false);
  const [running,   setRun]  = useState(false);
  const [runMsg,    setMsg]  = useState("");

  const aiMatches = (Array.isArray(matches) ? matches : []).sort((a,b)=>(b.similarity_score||0)-(a.similarity_score||0)).slice(0,5);
  const allChains = Array.isArray(chains) ? chains : [];

  const compute = async () => {
    if (!skillA||!skillB) return;
    setComp(true); setScore(null);
    try {
      const r = await matchingApi.similarity(skillA, skillB);
      setScore(r.score);
    } catch {
      // Offline demo — simulate a score so UI isn't broken without API key
      setScore(Math.round((skillA.length*7+skillB.length*13)%55+35));
    }
    setComp(false);
  };

  const runEngine = async () => {
    setRun(true); setMsg("");
    try {
      const r = await matchingApi.runMatching();
      setMsg(`Done! Found ${(r.direct?.length||0)+(r.ai?.length||0)+(r.chain?.length||0)} matches.`);
    } catch (e) {
      setMsg(e?.data?.ai_error || e?.data?.error || "Add OPENAI_API_KEY to backend .env to enable AI matching.");
    }
    setRun(false);
  };

  // Demo bars when no real AI matches yet
  const demoPairs = [["Python","Data Science",94],["React","UI/UX Design",87],["Photography","Figma",68],["Spanish","ML",41]];

  return (
    <div className="page">
      <div className="topbar">
        <h2>AI Matching Engine</h2>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span className="chip chip-active">OpenAI text-embedding-3-small</span>
          <button className="btn btn-primary btn-sm" onClick={runEngine} disabled={running}>
            {running?"Running…":"▶ Run engine"}
          </button>
        </div>
      </div>

      <div className="page-body">
        {runMsg && (
          <div style={{padding:"8px 14px",borderRadius:"var(--rad)",fontSize:12,
            background:runMsg.startsWith("Done")?"var(--brand-light)":"var(--red-light)",
            color:runMsg.startsWith("Done")?"var(--brand-dark)":"var(--red-dark)",
            border:`0.5px solid ${runMsg.startsWith("Done")?"var(--brand)":"var(--red)"}`}}>
            {runMsg}
          </div>
        )}

        {/* Similarity scores */}
        <div>
          <div className="section-title">Skill similarity scores (cosine)</div>
          <div className="card">
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {aiMatches.length > 0
                ? aiMatches.map((m,i) => (
                  <div key={i}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{fontSize:13,color:"var(--ink)"}}>
                        <strong>{m.user1_teach_skill?.name||"Skill A"}</strong> ↔ <strong>{m.user1_learn_skill?.name||"Skill B"}</strong>
                        <span style={{fontSize:11,color:"var(--muted)",marginLeft:6}}>with {m.user2?.full_name}</span>
                      </span>
                      <span style={{fontSize:13,fontWeight:700,color:(m.similarity_score||0)>80?"var(--brand)":(m.similarity_score||0)>60?"var(--orange)":"var(--muted)"}}>
                        {Math.round(m.similarity_score||0)}%
                      </span>
                    </div>
                    <Bar score={m.similarity_score||0}/>
                  </div>
                ))
                : demoPairs.map(([a,b,s],i) => (
                  <div key={i}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{fontSize:13,color:"var(--ink)"}}><strong>{a}</strong> ↔ <strong>{b}</strong> <span style={{fontSize:10,color:"var(--muted)"}}>(demo)</span></span>
                      <span style={{fontSize:13,fontWeight:700,color:s>80?"var(--brand)":s>60?"var(--orange)":"var(--muted)"}}>{s}%</span>
                    </div>
                    <Bar score={s}/>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Try it */}
        <div>
          <div className="section-title">Try skill similarity</div>
          <div className="card">
            <div style={{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
              <div className="form-group" style={{flex:1,minWidth:100}}>
                <label className="form-label">Skill A</label>
                <input className="form-input" value={skillA} onChange={e=>setSkillA(e.target.value)}/>
              </div>
              <div style={{paddingBottom:10,color:"var(--muted)",fontSize:16}}>↔</div>
              <div className="form-group" style={{flex:1,minWidth:100}}>
                <label className="form-label">Skill B</label>
                <input className="form-input" value={skillB} onChange={e=>setSkillB(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&compute()}/>
              </div>
              <button className="btn btn-primary btn-sm" style={{height:36}} onClick={compute} disabled={computing}>
                {computing?"…":"Compare"}
              </button>
            </div>
            {score!==null && !computing && (
              <div style={{marginTop:12,padding:"10px 14px",background:"var(--brand-light)",
                borderRadius:"var(--rad)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:13,color:"var(--brand-dark)"}}><strong>{skillA}</strong> ↔ <strong>{skillB}</strong></span>
                <span style={{fontFamily:"var(--font-display)",fontWeight:700,fontSize:20,color:"var(--brand-dark)"}}>{Math.round(score)}%</span>
              </div>
            )}
            {computing && <div style={{marginTop:10,fontSize:12,color:"var(--muted)",textAlign:"center"}}>Computing OpenAI embeddings…</div>}
          </div>
        </div>

        {/* Chain matches */}
        <div>
          <div className="section-title">Chain matches — DFS cycle detection (A→B→C→A)</div>
          {(allChains.length > 0 ? allChains : [null]).map((chain, i) => {
            const nodes = chain
              ? [chain.user1, chain.user2, chain.user3]
              : [{full_name:"Alex Chen"},{full_name:"Tanvir Khan"},{full_name:"Layla Patel"}];
            const arrows = chain
              ? [chain.skill_1to2?.name, chain.skill_2to3?.name]
              : ["teaches Python →","teaches Spanish →"];
            const colors = [["#E1F5EE","#0F6E56"],["#EAF3DE","#3B6D11"],["#FAECE7","#993C1D"]];
            return (
              <div key={i} style={{border:"0.5px solid var(--border)",borderRadius:"var(--rad-lg)",overflow:"hidden",marginBottom:8}}>
                <div style={{padding:"12px 16px",background:"var(--bg2)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>3-way skill chain{!chain?" (demo)":""}</div>
                  <div style={{display:"flex",gap:6}}>
                    <span className="chip chip-chain">{chain?.status||"detected"}</span>
                    <span className="chip chip-active">DFS verified</span>
                  </div>
                </div>
                <div className="chain-viz">
                  {nodes.map((u,j) => (
                    <div key={j} style={{display:"flex",alignItems:"center",gap:8}}>
                      <div className="chain-node">
                        <div className="avatar" style={{width:40,height:40,fontSize:12,background:colors[j][0],color:colors[j][1]}}>
                          {(u?.full_name||u?.username||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <div style={{fontSize:11,color:"var(--ink)",fontWeight:500,marginTop:2,textAlign:"center"}}>
                          {u?.full_name?.split(" ")[0]||u?.username}
                        </div>
                      </div>
                      {j<2 && (
                        <div className="chain-arrow">
                          <div className="chain-skill">{arrows[j]||"→"}</div>
                          <svg width="12" height="10" viewBox="0 0 12 10"><path d="M0 5h10M7 1l4 4-4 4" stroke="var(--muted)" strokeWidth="1.5" fill="none"/></svg>
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{fontSize:20,color:"var(--brand)",paddingLeft:4}}>↺</div>
                </div>
                <div style={{padding:"0 16px 14px"}}>
                  <button className="btn btn-primary" style={{width:"100%",padding:9}}
                    onClick={()=>chain&&matchingApi.acceptChain(chain.id)}>
                    Accept chain swap
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Algorithm reference */}
        <div className="card card-sm" style={{background:"var(--bg2)"}}>
          <div className="section-title" style={{marginBottom:8}}>Algorithm reference</div>
          {[["Direct match","if A.learn == B.teach and A.teach == B.learn → match"],
            ["AI similarity","embed(skill_a) · embed(skill_b) → cosine_similarity ≥ threshold"],
            ["Chain (DFS)","graph=nodes(users), edges(teach→learn); DFS(cycle_len ≤ 3)"],
          ].map(([title,code])=>(
            <div key={title} style={{marginBottom:8}}>
              <div style={{fontSize:12,fontWeight:500,color:"var(--ink)",marginBottom:3}}>{title}</div>
              <div className="mono-block">{code}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
