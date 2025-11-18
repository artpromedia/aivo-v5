import jwt from "jsonwebtoken";
import type { Role } from "@aivo/types";
export * from "./client";

export interface AuthUserClaims {
  sub: string; // userId
  tenantId: string;
  roles: Role[];
  name?: string;
  email?: string;
}

export interface AuthTokenPayload extends AuthUserClaims {
  iat?: number;
  exp?: number;
}

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour for now

export function signAccessToken(
  claims: AuthUserClaims,
  secret: string,
  ttlSeconds: number = ACCESS_TOKEN_TTL_SECONDS
): string {
  const payload: AuthTokenPayload = {
    ...claims
  };

  return jwt.sign(payload, secret, {
    expiresIn: ttlSeconds
  });
}

export function verifyAccessToken(
  token: string,
  secret: string
): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded as AuthTokenPayload;
  } catch {
    return null;
  }
}

export type { Role } from "@aivo/types";
