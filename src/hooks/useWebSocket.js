import { useState, useEffect, useRef, useCallback } from "react";

// Auto-connects, auto-reconnects every 3s on drop, cleans up on unmount
export function useWebSocket(url, onMessage) {
  const [connected, setConnected] = useState(false);
  const ws      = useRef(null);
  const retry   = useRef(null);
  const dead    = useRef(false);
  const handler = useRef(onMessage);
  useEffect(() => { handler.current = onMessage; }, [onMessage]);

  const connect = useCallback(() => {
    if (dead.current || !url) return;
    try {
      const sock = new WebSocket(url);
      ws.current = sock;
      sock.onopen    = () => { if (!dead.current) setConnected(true); clearTimeout(retry.current); };
      sock.onclose   = () => { if (!dead.current) { setConnected(false); retry.current = setTimeout(connect, 3000); } };
      sock.onerror   = () => sock.close();
      sock.onmessage = (e) => { try { handler.current(JSON.parse(e.data)); } catch { handler.current(e.data); } };
    } catch {}
  }, [url]);

  useEffect(() => {
    dead.current = false;
    if (url) connect();
    return () => { dead.current = true; clearTimeout(retry.current); ws.current?.close(); };
  }, [url, connect]);

  const send = useCallback((data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(typeof data === "string" ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  return { send, connected };
}
