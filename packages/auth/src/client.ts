import { AivoApiClient } from "@aivo/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export type AuthState = {
  accessToken: string | null;
  user: {
    id: string;
    tenantId: string;
    roles: string[];
    name?: string;
    email?: string;
  } | null;
};

export const LOCAL_STORAGE_KEY = "aivo-auth";

export function loadAuthState(): AuthState {
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

export function saveAuthState(state: AuthState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
}

export function clearAuthState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
}

export function createApiClient(getToken: () => Promise<string | null>) {
  return new AivoApiClient(API_BASE_URL, getToken);
}
