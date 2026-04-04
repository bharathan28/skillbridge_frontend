import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, saveTokens, dropTokens, getAccess, getRefresh } from "../api/client";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [ready, setReady]   = useState(false);   // true once we know if logged in or not

  // On mount: restore session from stored token
  useEffect(() => {
    (async () => {
      if (getAccess()) {
        try { setUser(await authApi.me()); }
        catch { dropTokens(); }
      }
      setReady(true);
    })();
    // Listen for forced logout (token refresh failed)
    const bye = () => { dropTokens(); setUser(null); };
    window.addEventListener("ss:logout", bye);
    return () => window.removeEventListener("ss:logout", bye);
  }, []);

  const login = useCallback(async (email, password) => {
    const d = await authApi.login(email, password);
    saveTokens(d.access, d.refresh);
    setUser(d.user);
    return d.user;
  }, []);

  const signup = useCallback(async (form) => {
    const d = await authApi.signup(form);
    saveTokens(d.access, d.refresh);
    setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(getRefresh()); } catch {}
    dropTokens();
    setUser(null);
  }, []);

  const updateUser = useCallback(async (data) => {
    const updated = await authApi.update(data);
    setUser(updated);
    return updated;
  }, []);

  return (
    <Ctx.Provider value={{ user, ready, login, signup, logout, updateUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
