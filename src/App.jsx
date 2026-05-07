import { useState } from "react";
import AuthProvider, { useAuth } from "./context/AuthContext";
import AuthPage        from "./pages/AuthPage";
import ProfileSetup    from "./pages/ProfileSetup";
import Sidebar         from "./components/Sidebar";
import Dashboard       from "./pages/Dashboard";
import SkillsPage      from "./pages/SkillsPage";
import MatchesPage     from "./pages/MatchesPage";
import ChatPage        from "./pages/ChatPage";
import VideoPage       from "./pages/VideoPage";
import AIMatchingPage  from "./pages/AIMatchingPage";
import ProfilePage     from "./pages/ProfilePage";

function AppInner() {
  const { user, loading, logout } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (loading) return (
    <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div className="spinner spinner-brand" style={{ margin: "0 auto" }} />
      </div>
    </div>
  );

  if (!user) return <AuthPage />;

  // After signup: require profile completion before showing app
  if (!user.is_profile_complete) return <ProfileSetup user={user} />;

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
      <div className="main-content">
        {pages[page] || pages.dashboard}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
