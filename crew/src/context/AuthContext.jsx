import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { getMe, API } from "../lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const me = await getMe().catch(() => null);
      setUser(me);
      setLoading(false);
    })();
  }, []);

  const logout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      logout,
      refresh: async () => setUser(await getMe()),
    }),
    [user, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
