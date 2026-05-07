import { useState, useRef, useEffect, useCallback } from "react";
import { messagesApi, chatWsUrl } from "../api/client";
import { useApi } from "../hooks/useApi";
import { useWebSocket } from "../hooks/useWebSocket";

const AVATAR_COLORS = [
  { bg: "#EFF6FF", color: "#1D4ED8" }, { bg: "#F0FDF4", color: "#166534" },
  { bg: "#FFF7ED", color: "#9A3412" }, { bg: "#FAF5FF", color: "#7E22CE" },
  { bg: "#FFF1F2", color: "#9F1239" }, { bg: "#FFFBEB", color: "#92400E" },
];

const initials = u => {
  const n = u?.full_name || u?.username || "?";
  const p = n.trim().split(" ");
  return (p.length >= 2 ? p[0][0] + p[1][0] : n.slice(0, 2)).toUpperCase();
};

const fmtTime = ts => {
  try { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
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

  const wsUrl = contact && user ? chatWsUrl(user.id, contact.id) : null;

  const onWsMsg = useCallback((msg) => {
    if (msg.type === "message") {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.message_id)) return prev;
        return [...prev, { id: msg.message_id, sender: { id: msg.sender_id }, content: msg.content, timestamp: msg.timestamp }];
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
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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
    setMessages(prev => [...prev, { id: `opt-${Date.now()}`, sender: { id: user.id }, content: text, timestamp: new Date().toISOString() }]);
    setInput("");
    if (connected) {
      send({ type: "message", sender_id: user.id, receiver_id: contact.id, content: text });
    } else {
      messagesApi.send(contact.id, text).then(refetch).catch(() => {});
    }
  };

  const contacts = Array.isArray(inbox) ? inbox : [];

  return (
    <div className="page">
      <div className="chat-shell">
        {/* Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-header">Messages</div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading && <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Loading…</div>}
            {contacts.map((c, i) => (
              <div key={c.user.id} className={`inbox-item${contact?.id === c.user.id ? " active" : ""}`}
                onClick={() => openChat(c)}>
                <div className="avatar avatar-sm" style={{ background: AVATAR_COLORS[i % 6].bg, color: AVATAR_COLORS[i % 6].color, flexShrink: 0 }}>
                  {initials(c.user)}
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{c.user.full_name || c.user.username}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>{fmtTime(c.last_message?.timestamp)}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                    {c.last_message?.content || "No messages yet"}
                  </div>
                </div>
                {c.unread_count > 0 && (
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "white", fontWeight: 700, flexShrink: 0 }}>
                    {c.unread_count}
                  </div>
                )}
              </div>
            ))}
            {!loading && contacts.length === 0 && (
              <div style={{ padding: 28, textAlign: "center", color: "var(--muted)", fontSize: 13, lineHeight: 1.7 }}>
                No conversations yet.<br />Match with someone to start chatting!
              </div>
            )}
          </div>
        </div>

        {/* Chat window */}
        <div className="chat-main">
          {contact ? (
            <>
              <div className="chat-topbar">
                <div className="avatar avatar-sm" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                  {initials(contact)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{contact.full_name || contact.username}</div>
                  <div style={{ fontSize: 11, color: connected ? "var(--green)" : "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    {connected ? <><div className="online-dot" style={{ width: 7, height: 7 }} /> Online</> : "Connecting…"}
                  </div>
                </div>
              </div>

              <div className="messages-list">
                {loadMsg && <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Loading…</div>}
                {messages.map(msg => {
                  const me = msg.sender?.id === user?.id;
                  return (
                    <div key={msg.id} className={`msg-row${me ? " own" : ""}`}>
                      {!me && (
                        <div className="avatar avatar-xs" style={{ background: "#EFF6FF", color: "#1D4ED8", flexShrink: 0 }}>
                          {initials(contact)}
                        </div>
                      )}
                      <div>
                        <div className={`msg-bubble ${me ? "mine" : "theirs"}`}>{msg.content}</div>
                        <div className="msg-time" style={{ textAlign: me ? "right" : "left" }}>{fmtTime(msg.timestamp)}</div>
                      </div>
                    </div>
                  );
                })}
                {typing && (
                  <div className="msg-row">
                    <div className="msg-bubble theirs" style={{ display: "flex", gap: 4, padding: "10px 14px" }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--muted-light)", animation: `bounce .8s ${i * .15}s infinite alternate` }} />
                      ))}
                    </div>
                  </div>
                )}
                {!loadMsg && messages.length === 0 && (
                  <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, marginTop: 60 }}>
                    Say hello to {contact.first_name || contact.username}! 👋
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="chat-input-row">
                <input className="chat-input" placeholder="Type a message…"
                  value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMsg()} />
                <button className="send-btn" onClick={sendMsg}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--muted)" }}>
              <div style={{ fontSize: 48 }}>💬</div>
              <div style={{ fontSize: 16, fontFamily: "var(--font-display)", color: "var(--ink-3)" }}>Your conversations</div>
              <div style={{ fontSize: 13 }}>Select a conversation from the left to start chatting</div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-4px); } }`}</style>
    </div>
  );
}
