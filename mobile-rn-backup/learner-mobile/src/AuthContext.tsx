import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createMobileApiClient, loadToken, saveToken, clearToken, type MobileAuthState } from "../../shared/auth/mobileAuth";

type AuthContextValue = {
  state: MobileAuthState;
  apiClient: ReturnType<typeof createMobileApiClient>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<MobileAuthState>({ accessToken: null, user: null });
  const [initializing, setInitializing] = useState(true);

  const getToken = useCallback(async () => state.accessToken, [state.accessToken]);

  const apiClient = createMobileApiClient(getToken);

  useEffect(() => {
    (async () => {
      const token = await loadToken();
      if (token) {
        try {
          const me = await apiClient.me();
          setState({
            accessToken: token,
            user: {
              id: me.userId,
              tenantId: me.tenantId,
              roles: me.roles,
              name: me.learner?.displayName,
              email: undefined
            }
          });
        } catch {
          await clearToken();
        }
      }
      setInitializing(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000";
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Login failed");
    }

    const data = await res.json();
    await saveToken(data.accessToken);
    setState({
      accessToken: data.accessToken,
      user: {
        id: data.user.id,
        tenantId: data.user.tenantId,
        roles: data.user.roles,
        name: data.user.name,
        email: data.user.email
      }
    });
  };

  const logout = async () => {
    await clearToken();
    setState({ accessToken: null, user: null });
  };

  if (initializing) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ state, apiClient, login, logout, loading: initializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
