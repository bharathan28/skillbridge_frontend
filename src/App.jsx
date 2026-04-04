import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage      from "./pages/AuthPage";
import Dashboard     from "./pages/Dashboard";
import SkillsPage    from "./pages/SkillsPage";
import MatchesPage   from "./pages/MatchesPage";
import ChatPage      from "./pages/ChatPage";
import VideoPage     from "./pages/VideoPage";
import AIMatchingPage from "./pages/AIMatchingPage";
import ProfilePage   from "./pages/ProfilePage";
import Sidebar       from "./components/Sidebar";
import "./index.css";

function Shell() {
  const { user, ready, logout } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (!ready) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background:"var(--bg3)", flexDirection:"column", gap:12 }}>
      <div style={{ width:40, height:40, background:"var(--brand)", borderRadius:12,
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div style={{ fontSize:13, color:"var(--muted)" }}>Loading SkillBridge…</div>
    </div>
  );

  if (!user) return <AuthPage />;

  const pages = {
    dashboard: <Dashboard     user={user} setPage={setPage} />,
    skills:    <SkillsPage    />,
    matches:   <MatchesPage   setPage={setPage} />,
    chat:      <ChatPage      user={user} />,
    video:     <VideoPage     user={user} />,
    ai:        <AIMatchingPage />,
    profile:   <ProfilePage   user={user} onLogout={logout} />,
  };

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} />
      <main className="main-content">{pages[page] || pages.dashboard}</main>
    </div>
  );
}

export default function App() {
  return <AuthProvider><Shell /></AuthProvider>;
}
