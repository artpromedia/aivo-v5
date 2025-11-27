import { Role } from "@prisma/client";
import {
  type Permission,
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
  ROLE_INFO,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS
} from "@aivo/types";

// Re-export for convenience
export {
  type Permission,
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
  ROLE_INFO,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS
};

/**
 * Guardian roles that can view learner data
 */
export const GUARDIAN_ROLES: Role[] = [Role.PARENT, Role.TEACHER, Role.THERAPIST];

/**
 * Administrative roles with elevated privileges
 */
export const ADMIN_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.GLOBAL_ADMIN,
  Role.DISTRICT_ADMIN,
  Role.SCHOOL_ADMIN
];

/**
 * Platform-level administrative roles
 */
export const PLATFORM_ADMIN_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.GLOBAL_ADMIN,
  Role.FINANCE_ADMIN,
  Role.TECH_SUPPORT,
  Role.LEGAL_COMPLIANCE
];

/**
 * Check if role is a guardian role
 */
export function isGuardianRole(role: Role): boolean {
  return GUARDIAN_ROLES.includes(role);
}

/**
 * Check if role is an admin role
 */
export function isAdminRole(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}

/**
 * Check if role is a platform admin role
 */
export function isPlatformAdminRole(role: Role): boolean {
  return PLATFORM_ADMIN_ROLES.includes(role);
}

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: Role): string {
  const roleKey = role as keyof typeof ROLE_INFO;
  return ROLE_INFO[roleKey]?.displayName ?? role;
}

/**
 * Get description for a role
 */
export function getRoleDescription(role: Role): string {
  const roleKey = role as keyof typeof ROLE_INFO;
  return ROLE_INFO[roleKey]?.description ?? "";
}

/**
 * Map Prisma Role enum to @aivo/types Role type
 */
export function prismaRoleToTypesRole(role: Role): string {
  return role as string;
}

