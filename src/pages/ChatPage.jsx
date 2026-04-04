import { useState, useRef, useEffect, useCallback } from "react";
import { messagesApi, chatWsUrl } from "../api/client";
import { useApi } from "../hooks/useApi";
import { useWebSocket } from "../hooks/useWebSocket";

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
const fmtTime = ts => {
  try { return new Date(ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); }
  catch { return ""; }
};

export default function ChatPage({ user }) {
  const { data: inbox, loading, refetch } = useApi(() => messagesApi.inbox());
  const [contact,  setContact]  = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadMsg,  setLoadMsg]  = useState(false);
  const [input,    setInput]    = useState("");
  const [typing,   setTyping]   = useState(false);
  const bottomRef  = useRef(null);
  const typerTimer = useRef(null);

  // WebSocket — connect only when we have a conversation open
  const wsUrl = contact && user ? chatWsUrl(user.id, contact.id) : null;

  const onWsMsg = useCallback((msg) => {
    if (msg.type === "message") {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.message_id)) return prev;  // skip duplicate
        return [...prev, { id: msg.message_id, sender:{id:msg.sender_id}, content:msg.content, timestamp:msg.timestamp }];
      });
      refetch();
    }
    if (msg.type === "typing" && msg.user_id !== user?.id) {
      setTyping(true);
      clearTimeout(typerTimer.current);
      typerTimer.current = setTimeout(() => setTyping(false), 2500);
    }
  }, [user?.id, refetch]);

  const { send, connected } = useWebSocket(wsUrl, onWsMsg);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const openChat = async (c) => {
    setContact(c.user);
    setMessages([]);
    setLoadMsg(true);
    try {
      const hist = await messagesApi.history(c.user.id);
      setMessages(Array.isArray(hist) ? hist : []);
    } catch { setMessages([]); }
    setLoadMsg(false);
    refetch();
  };

  const sendMsg = () => {
    const text = input.trim();
    if (!text || !contact) return;
    // Optimistic insert
    setMessages(prev => [...prev, { id:`opt-${Date.now()}`, sender:{id:user.id}, content:text, timestamp:new Date().toISOString() }]);
    setInput("");
    if (connected) {
      send({ type:"message", sender_id:user.id, receiver_id:contact.id, content:text });
    } else {
      // Fallback REST if WebSocket not ready
      messagesApi.send(contact.id, text).then(refetch).catch(()=>{});
    }
  };

  const handleInput = e => {
    setInput(e.target.value);
    if (connected && contact) send({ type:"typing", user_id:user.id, is_typing:true });
  };

  const contacts = Array.isArray(inbox) ? inbox : [];

  return (
    <div className="page">
      <div className="topbar" style={{padding:"12px 16px"}}>
        <h2>Messages</h2>
        {connected && contact && (
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--brand)"}}>
            <div className="online-dot" style={{width:6,height:6}}/> Live
          </div>
        )}
      </div>

      <div className="chat-layout">
        {/* Contacts sidebar */}
        <div className="chat-list">
          {loading && <div style={{padding:16,textAlign:"center",color:"var(--muted)",fontSize:12}}>Loading…</div>}
          {contacts.map((c, i) => (
            <div key={c.user.id} className={`chat-item${contact?.id===c.user.id?" active":""}`}
              onClick={() => openChat(c)}>
              <div className="avatar avatar-sm" style={{background:AC[i%6].bg,color:AC[i%6].color}}>
                {initials(c.user)}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,color:"var(--ink)"}}>{c.user.full_name||c.user.username}</div>
                <div style={{fontSize:11,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1}}>
                  {c.last_message?.content || "No messages yet"}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                <div style={{fontSize:10,color:"var(--muted)"}}>{fmtTime(c.last_message?.timestamp)}</div>
                {c.unread_count > 0 && (
                  <div style={{width:16,height:16,borderRadius:"50%",background:"var(--brand)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:9,color:"white",fontWeight:700}}>{c.unread_count}</div>
                )}
              </div>
            </div>
          ))}
          {!loading && contacts.length===0 && (
            <div style={{padding:24,textAlign:"center",color:"var(--muted)",fontSize:12,lineHeight:1.6}}>
              No conversations yet.<br/>Match with someone first!
            </div>
          )}
        </div>

        {/* Chat window */}
        {contact ? (
          <div className="chat-window">
            <div style={{padding:"12px 16px",borderBottom:"0.5px solid var(--border)",
              display:"flex",alignItems:"center",gap:10,flexShrink:0,background:"var(--bg)"}}>
              <div className="avatar avatar-sm" style={{background:AC[0].bg,color:AC[0].color}}>{initials(contact)}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:"var(--ink)"}}>{contact.full_name||contact.username}</div>
                <div style={{fontSize:11,color:connected?"var(--brand)":"var(--muted)",display:"flex",alignItems:"center",gap:4}}>
                  {connected ? <><div className="online-dot" style={{width:6,height:6}}/>WebSocket live</> : "Connecting…"}
                </div>
              </div>
              <button className="btn btn-sm">📹 Video</button>
            </div>

            <div className="chat-messages">
              {loadMsg && <div style={{textAlign:"center",color:"var(--muted)",fontSize:12}}>Loading…</div>}
              {messages.map(msg => {
                const me = msg.sender?.id === user?.id;
                return (
                  <div key={msg.id} style={{display:"flex",flexDirection:"column",alignItems:me?"flex-end":"flex-start",gap:2}}>
                    <div className={`msg ${me?"outgoing":"incoming"}`}>{msg.content}</div>
                    <div style={{fontSize:10,color:"var(--muted)"}}>{fmtTime(msg.timestamp)}</div>
                  </div>
                );
              })}
              {typing && (
                <div style={{alignSelf:"flex-start",background:"var(--bg2)",borderRadius:12,
                  padding:"8px 13px",fontSize:12,color:"var(--muted)"}}>typing…</div>
              )}
              {!loadMsg && messages.length===0 && (
                <div style={{textAlign:"center",color:"var(--muted)",fontSize:12,marginTop:40}}>Say hello! 👋</div>
              )}
              <div ref={bottomRef}/>
            </div>

            <div style={{padding:"12px 16px",borderTop:"0.5px solid var(--border)",
              display:"flex",gap:8,alignItems:"center",flexShrink:0,background:"var(--bg)"}}>
              <input style={{flex:1,padding:"8px 14px",border:"0.5px solid var(--border2)",
                borderRadius:20,fontSize:13,fontFamily:"var(--font-body)",
                background:"var(--bg)",color:"var(--ink)",outline:"none"}}
                placeholder="Type a message…" value={input}
                onChange={handleInput} onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
              <button onClick={sendMsg}
                style={{width:36,height:36,borderRadius:"50%",background:"var(--brand)",
                  border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
            flexDirection:"column",gap:10,color:"var(--muted)"}}>
            <div style={{fontSize:36}}>💬</div>
            <div style={{fontSize:13}}>Select a conversation to start chatting</div>
          </div>
        )}
      </div>
    </div>
  );
}
