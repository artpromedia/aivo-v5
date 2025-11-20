"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCAL_STORAGE_KEY = void 0;
exports.loadAuthState = loadAuthState;
exports.saveAuthState = saveAuthState;
exports.clearAuthState = clearAuthState;
exports.createApiClient = createApiClient;
const api_client_1 = require("@aivo/api-client");
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
exports.LOCAL_STORAGE_KEY = "aivo-auth";
function loadAuthState() {
    if (typeof window === "undefined") {
        return { accessToken: null, user: null };
    }
    try {
        const raw = window.localStorage.getItem(exports.LOCAL_STORAGE_KEY);
        if (!raw)
            return { accessToken: null, user: null };
        return JSON.parse(raw);
    }
    catch {
        return { accessToken: null, user: null };
    }
}
function saveAuthState(state) {
    if (typeof window === "undefined")
        return;
    window.localStorage.setItem(exports.LOCAL_STORAGE_KEY, JSON.stringify(state));
}
function clearAuthState() {
    if (typeof window === "undefined")
        return;
    window.localStorage.removeItem(exports.LOCAL_STORAGE_KEY);
}
function createApiClient(getToken) {
    return new api_client_1.AivoApiClient(API_BASE_URL, getToken);
}
