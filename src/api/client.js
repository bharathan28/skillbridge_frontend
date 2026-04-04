
export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const WS_BASE  = import.meta.env.VITE_WS_URL  || "ws://localhost:8000";

// ── Token helpers ─────────────────────────────────────────────
export const getAccess  = () => localStorage.getItem("ss_access");
export const getRefresh = () => localStorage.getItem("ss_refresh");
export const saveTokens = (access, refresh) => {
  localStorage.setItem("ss_access",  access);
  if (refresh) localStorage.setItem("ss_refresh", refresh);
};
export const dropTokens = () => {
  localStorage.removeItem("ss_access");
  localStorage.removeItem("ss_refresh");
};

// ── Core fetch (attaches JWT, auto-refreshes on 401) ──────────
async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...opts.headers };
  const token = getAccess();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res = await fetch(`${BASE_URL}${path}`, { ...opts, headers });

  if (res.status === 401) {
    const refresh = getRefresh();
    if (refresh) {
      const r = await fetch(`${BASE_URL}/token/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (r.ok) {
        const d = await r.json();
        saveTokens(d.access, d.refresh);
        headers["Authorization"] = `Bearer ${d.access}`;
        res = await fetch(`${BASE_URL}${path}`, { ...opts, headers });
      } else {
        dropTokens();
        window.dispatchEvent(new Event("ss:logout"));
        throw { status: 401, data: { error: "Session expired. Please log in again." } };
      }
    }
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, data };
  return data;
}

const get    = (path, opts)      => api(path, { method: "GET", ...opts });
const post   = (path, body, o)   => api(path, { method: "POST",   body: JSON.stringify(body), ...o });
const patch  = (path, body, o)   => api(path, { method: "PATCH",  body: JSON.stringify(body), ...o });
const remove = (path, o)         => api(path, { method: "DELETE", ...o });

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  signup:  (data)          => post("/signup", data),
  login:   (email, pass)   => post("/login", { email, password: pass }),
  logout:  (refresh)       => post("/logout", { refresh }),
  me:      ()              => get("/me"),
  update:  (data)          => patch("/me", data),
};

// ── Skills ────────────────────────────────────────────────────
export const skillsApi = {
  mySkills:    ()       => get("/my-skills"),
  addSkill:    (data)   => post("/add-skill", data),
  deleteSkill: (id)     => remove(`/my-skills/${id}`),
  allSkills:   (q = {}) => get(`/skills?${new URLSearchParams(q)}`),
};

// ── Matching ─────────────────────────────────────────────────
export const matchingApi = {
  getMatches:    (type)   => get(`/matches${type ? `?type=${type}` : ""}`),
  runMatching:   ()       => post("/run-matching", {}),
  similarity:    (a, b)   => post("/similarity", { skill_a: a, skill_b: b }),
  requestSwap:   (uid, t) => post("/request-swap", { user_id: uid, type: t || "direct" }),
  acceptRequest: (id, ac) => post(`/accept-request/${id}`, { action: ac || "accept" }),
  getChains:     ()       => get("/chains"),
  acceptChain:   (id)     => post(`/chains/${id}/accept`, {}),
};

// ── Messages ─────────────────────────────────────────────────
export const messagesApi = {
  inbox:        ()      => get("/inbox"),
  history:      (uid)   => get(`/messages/${uid}`),
  send:         (uid, content) => post("/send-message", { receiver_id: uid, content }),
};

// ── Sessions ─────────────────────────────────────────────────
export const sessionsApi = {
  list:   ()      => get("/sessions"),
  create: (data)  => post("/sessions", data),
  update: (id, d) => patch(`/sessions/${id}`, d),
  start:  (id)    => post(`/sessions/${id}/start`, {}),
  rate:   (data)  => post("/rate", data),
};

// ── WebSocket URL builders ────────────────────────────────────
export const chatWsUrl  = (uid1, uid2) => {
  const [a, b] = [uid1, uid2].map(Number).sort((x, y) => x - y);
  return `${WS_BASE}/ws/chat/user_${a}_${b}/`;
};
export const videoWsUrl = (channel) => `${WS_BASE}/ws/video/${channel}/`;
