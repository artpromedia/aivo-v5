import type { Role } from "@aivo/types";
import type { FastifyRequest } from "fastify";
import { verifyAccessToken, type AuthTokenPayload } from "@aivo/auth";

export interface RequestUser {
  userId: string;
  tenantId: string;
  roles: Role[];
  name?: string;
  email?: string;
}

const DEV_JWT_SECRET = process.env.JWT_SECRET || "dev-secret-aivo";

export function getUserFromRequest(request: FastifyRequest): RequestUser | null {
  const authHeader = request.headers["authorization"];
  if (!authHeader || typeof authHeader !== "string") return null;

  const [scheme, token] = authHeader.split(" ");
  if (scheme.toLowerCase() !== "bearer" || !token) return null;

  const payload: AuthTokenPayload | null = verifyAccessToken(token, DEV_JWT_SECRET);
  if (!payload) return null;

  return {
    userId: payload.sub,
    tenantId: payload.tenantId,
    roles: payload.roles,
    name: payload.name,
    email: payload.email
  };
}

export function requireRole(user: RequestUser | null, allowed: Role[]): void {
  if (!user) {
    const err: any = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }
  const hasRole = user.roles.some((r) => allowed.includes(r));
  if (!hasRole) {
    const err: any = new Error("Forbidden: missing required role");
    err.statusCode = 403;
    err.allowed = allowed;
    throw err;
  }
}
