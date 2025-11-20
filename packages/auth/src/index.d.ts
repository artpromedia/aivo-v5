import type { Role } from "@aivo/types";
export * from "./client";
export interface AuthUserClaims {
    sub: string;
    tenantId: string;
    roles: Role[];
    name?: string;
    email?: string;
}
export interface AuthTokenPayload extends AuthUserClaims {
    iat?: number;
    exp?: number;
}
export declare function signAccessToken(claims: AuthUserClaims, secret: string, ttlSeconds?: number): string;
export declare function verifyAccessToken(token: string, secret: string): AuthTokenPayload | null;
export type { Role } from "@aivo/types";
