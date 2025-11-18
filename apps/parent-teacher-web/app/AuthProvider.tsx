"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AivoApiClient } from "@aivo/api-client";

type AuthState = {
  accessToken: string | null;
  user: {
    id: string;
    tenantId: string;
    roles: string[];
    email: string;
    name?: string;
  } | null;
};

const LOCAL_STORAGE_KEY = "aivo_auth_state";

function loadAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { accessToken: null, user: null };
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return { accessToken: null, user: null };
    return JSON.parse(raw) as AuthState;
  } catch {
    return { accessToken: null, user: null };
  }
}

function saveAuthState(state: AuthState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
}

function clearAuthState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
}

function createApiClient(getToken: () => Promise<string | null>) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  return new AivoApiClient(baseUrl, getToken);
}

type AuthContextValue = {
  state: AuthState;
  apiClient: ReturnType<typeof createApiClient>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const apiClientFactory = (tokenGetter: () => Promise<string | null>) =>
  createApiClient(tokenGetter);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({ accessToken: null, user: null });

  useEffect(() => {
    const initial = loadAuthState();
    setState(initial);
  }, []);

  const getToken = useCallback(async () => state.accessToken, [state.accessToken]);

  const apiClient = apiClientFactory(getToken);

  const login = async (email: string, password: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Login failed");
    }

    const data = await res.json();
    const newState: AuthState = {
      accessToken: data.accessToken,
      user: data.user
    };
    setState(newState);
    saveAuthState(newState);
  };

  const logout = () => {
    setState({ accessToken: null, user: null });
    clearAuthState();
  };

  return (
    <AuthContext.Provider value={{ state, apiClient, login, logout }}>
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
