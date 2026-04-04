import { useState, useEffect, useCallback, useRef } from "react";

// useApi — fetch on mount, returns { data, loading, error, refetch }
export function useApi(fn, deps = []) {
  const [data, setData]     = useState(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState(null);
  const alive = useRef(true);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const run = useCallback(async () => {
    setLoad(true); setError(null);
    try {
      const r = await fn();
      if (alive.current) setData(r);
    } catch (e) {
      if (alive.current) setError(e?.data?.error || e?.data?.detail || "Error");
    } finally {
      if (alive.current) setLoad(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);
  return { data, loading, error, refetch: run };
}

// useAction — for mutations, returns { run, loading, error }
export function useAction() {
  const [loading, setLoad] = useState(false);
  const [error, setError]  = useState(null);

  const run = useCallback(async (fn) => {
    setLoad(true); setError(null);
    try { return await fn(); }
    catch (e) {
      const msg = e?.data?.error || e?.data?.detail || "Failed";
      setError(msg); throw e;
    } finally { setLoad(false); }
  }, []);

  return { loading, error, run };
}
