import jwt from "jsonwebtoken";
import type { Role, Permission, RoleAssignment } from "@aivo/types";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRoleAuthority,
  getPermissionsForRole,
  getAccessScope,
  isPlatformRole,
  isOrganizationalRole,
  isEducationalRole,
  getDashboardRoute,
  ROLE_HIERARCHY
} from "@aivo/types";

export * from "./client";

// Re-export role utilities for convenience
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRoleAuthority,
  getPermissionsForRole,
  getAccessScope,
  isPlatformRole,
  isOrganizationalRole,
  isEducationalRole,
  getDashboardRoute,
  ROLE_HIERARCHY
};

export interface AuthUserClaims {
  sub: string; // userId
  tenantId?: string;
  districtId?: string;
  schoolId?: string;
  roles: Role[];
  primaryRole?: Role;
  name?: string;
  email?: string;
}

export interface AuthTokenPayload extends AuthUserClaims {
  iat?: number;
  exp?: number;
}

export interface AuthContext {
  userId: string;
  tenantId?: string;
  districtId?: string;
  schoolId?: string;
  roles: Role[];
  primaryRole: Role;
  permissions: Permission[];
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

/**
 * Build auth context from token payload
 */
export function buildAuthContext(payload: AuthTokenPayload): AuthContext {
  const primaryRole = payload.primaryRole ?? payload.roles[0] ?? "LEARNER";
  const permissions = getPermissionsForRole(primaryRole);

  return {
    userId: payload.sub,
    tenantId: payload.tenantId,
    districtId: payload.districtId,
    schoolId: payload.schoolId,
    roles: payload.roles,
    primaryRole,
    permissions
  };
}

/**
 * Check if user has a specific permission
 */
export function userHasPermission(ctx: AuthContext, permission: Permission): boolean {
  return ctx.permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function userHasAnyPermission(ctx: AuthContext, permissions: Permission[]): boolean {
  return permissions.some(p => ctx.permissions.includes(p));
}

/**
 * Check if user has all of the specified permissions
 */
export function userHasAllPermissions(ctx: AuthContext, permissions: Permission[]): boolean {
  return permissions.every(p => ctx.permissions.includes(p));
}

/**
 * Check if user can manage another user based on role hierarchy
 */
export function canManageUser(actorCtx: AuthContext, targetRole: Role): boolean {
  return hasRoleAuthority(actorCtx.primaryRole, targetRole);
}

/**
 * Check if user has access to a specific scope
 */
export function hasAccessToScope(
  ctx: AuthContext,
  scope: { tenantId?: string; districtId?: string; schoolId?: string }
): boolean {
  // Platform roles have access to everything
  if (isPlatformRole(ctx.primaryRole)) {
    return true;
  }

  // Check tenant match
  if (scope.tenantId && ctx.tenantId !== scope.tenantId) {
    return false;
  }

  // District admins can access their district and all schools within
  if (ctx.primaryRole === "DISTRICT_ADMIN") {
    if (scope.districtId && ctx.districtId !== scope.districtId) {
      return false;
    }
    return true;
  }

  // School admins and below need exact school match
  if (scope.schoolId && ctx.schoolId !== scope.schoolId) {
    return false;
  }

  return true;
}

/**
 * Require a specific permission - throws if not met
 */
export function requirePermission(ctx: AuthContext, permission: Permission): void {
  if (!userHasPermission(ctx, permission)) {
    throw new AuthorizationError(
      `Permission denied: ${permission}`,
      permission,
      ctx.primaryRole
    );
  }
}

/**
 * Require any of the specified permissions - throws if none met
 */
export function requireAnyPermission(ctx: AuthContext, permissions: Permission[]): void {
  if (!userHasAnyPermission(ctx, permissions)) {
    throw new AuthorizationError(
      `Permission denied: requires one of [${permissions.join(", ")}]`,
      permissions[0],
      ctx.primaryRole
    );
  }
}

/**
 * Require a specific role or higher in hierarchy
 */
export function requireRole(ctx: AuthContext, role: Role): void {
  const ctxLevel = ROLE_HIERARCHY[ctx.primaryRole];
  const requiredLevel = ROLE_HIERARCHY[role];

  if (ctxLevel > requiredLevel) {
    throw new AuthorizationError(
      `Role denied: requires ${role} or higher`,
      undefined,
      ctx.primaryRole
    );
  }
}

/**
 * Custom authorization error
 */
export class AuthorizationError extends Error {
  public readonly code = "AUTHORIZATION_ERROR";
  public readonly permission?: Permission;
  public readonly userRole: Role;

  constructor(message: string, permission?: Permission, userRole: Role = "LEARNER") {
    super(message);
    this.name = "AuthorizationError";
    this.permission = permission;
    this.userRole = userRole;
  }
}

export type { Role, Permission, RoleAssignment } from "@aivo/types";
