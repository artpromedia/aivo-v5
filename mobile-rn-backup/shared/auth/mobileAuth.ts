import * as SecureStore from "expo-secure-store";
import { AivoApiClient } from "@aivo/api-client";

const TOKEN_KEY = "aivo-mobile-access-token";

export type MobileAuthUser = {
  id: string;
  tenantId: string;
  roles: string[];
  name?: string;
  email?: string;
};

export type MobileAuthState = {
  accessToken: string | null;
  user: MobileAuthUser | null;
};

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function loadToken(): Promise<string | null> {
  try {
    return (await SecureStore.getItemAsync(TOKEN_KEY)) ?? null;
  } catch {
    return null;
  }
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function createMobileApiClient(getToken: () => Promise<string | null>) {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000";
  return new AivoApiClient(baseUrl, getToken);
}
