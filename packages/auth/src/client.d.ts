import { AivoApiClient } from "@aivo/api-client";
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
export declare const LOCAL_STORAGE_KEY = "aivo-auth";
export declare function loadAuthState(): AuthState;
export declare function saveAuthState(state: AuthState): void;
export declare function clearAuthState(): void;
export declare function createApiClient(getToken: () => Promise<string | null>): AivoApiClient;
