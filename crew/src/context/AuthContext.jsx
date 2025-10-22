// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { getMe, postLogout } from "../lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const me = await getMe().catch(() => null);
      if (!alive) return;
      setUser(me);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const logout = async () => {
    await postLogout().catch(() => {});
    setUser(null);
  };

  const refresh = async () => {
    const me = await getMe().catch(() => null);
    setUser(me);
  };

  const value = useMemo(
    () => ({ user, loading, logout, refresh }),
    [user, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
