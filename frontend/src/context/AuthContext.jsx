import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./authContext.js";
import * as authApi from "../api/auth.js";
import { clearToken, getToken, setToken, setUnauthorizedHandler } from "../api/client.js";
import { useToast } from "./toastContext.js";

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() => getToken());
  // `loading` covers the initial /auth/me so ProtectedRoute does not bounce on refresh.
  const [loading, setLoading] = useState(Boolean(getToken()));

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      // Only explain the bounce to someone who was actually signed in.
      setUser((current) => {
        if (current) toast.info("Your session has ended. Please sign in again.");
        return null;
      });
      setTokenState(null);
    });
  }, [toast]);

  useEffect(() => {
    // `loading` already starts false when there is no token, so nothing to do.
    if (!getToken()) return;

    let active = true;
    authApi
      .getMe()
      .then(({ user: me }) => active && setUser(me))
      .catch(() => active && logout())
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [logout]);

  const accept = useCallback(({ user: nextUser, token: nextToken }) => {
    setToken(nextToken);
    setTokenState(nextToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const login = useCallback(
    async (credentials) => accept(await authApi.signin(credentials)),
    [accept]
  );

  const signup = useCallback(async (payload) => accept(await authApi.signup(payload)), [accept]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      login,
      signup,
      logout,
      setUser,
    }),
    [user, token, loading, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
