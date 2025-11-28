import { prisma } from "./client";
import { Role } from "@prisma/client";
import {
  type Permission,
  type Role as TypesRole,
  ROLE_PERMISSIONS,
  PERMISSION_INFO,
  hasRoleAuthority
} from "@aivo/types";

/**
 * Role and Permission Management Persistence Layer
 * 
 * Handles database operations for the extended role system including:
 * - Permission management
 * - Role assignments
 * - Audit logging for role changes
 */

// ============================================================================
// PERMISSION MANAGEMENT
// ============================================================================

export interface PermissionRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  createdAt: string;
}

/**
 * Get all permissions in the system
 */
export async function listPermissions(): Promise<PermissionRecord[]> {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ category: "asc" }, { code: "asc" }]
  });

  return permissions.map(p => ({
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description,
    category: p.category,
    createdAt: p.createdAt.toISOString()
  }));
}

/**
 * Get permission by code
 */
export async function getPermissionByCode(code: string): Promise<PermissionRecord | null> {
  const permission = await prisma.permission.findUnique({
    where: { code }
  });

  if (!permission) return null;

  return {
    id: permission.id,
    code: permission.code,
    name: permission.name,
    description: permission.description,
    category: permission.category,
    createdAt: permission.createdAt.toISOString()
  };
}

/**
 * Get all permissions for a specific role
 */
export async function getPermissionsForRole(role: Role): Promise<PermissionRecord[]> {
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { role },
    include: { permission: true },
    orderBy: { permission: { category: "asc" } }
  });

  return rolePermissions.map(rp => ({
    id: rp.permission.id,
    code: rp.permission.code,
    name: rp.permission.name,
    description: rp.permission.description,
    category: rp.permission.category,
    createdAt: rp.permission.createdAt.toISOString()
  }));
}

/**
 * Check if a role has a specific permission in the database
 */
export async function roleHasPermission(role: Role, permissionCode: string): Promise<boolean> {
  const count = await prisma.rolePermission.count({
    where: {
      role,
      permission: { code: permissionCode }
    }
  });

  return count > 0;
}

/**
 * Grant a permission to a role
 */
export async function grantPermissionToRole(
  role: Role,
  permissionCode: string
): Promise<void> {
  const permission = await prisma.permission.findUnique({
    where: { code: permissionCode }
  });

  if (!permission) {
    throw new Error(`Permission not found: ${permissionCode}`);
  }

  await prisma.rolePermission.upsert({
    where: {
      role_permissionId: {
        role,
        permissionId: permission.id
      }
    },
    create: {
      role,
      permissionId: permission.id
    },
    update: {}
  });
}

/**
 * Revoke a permission from a role
 */
export async function revokePermissionFromRole(
  role: Role,
  permissionCode: string
): Promise<void> {
  const permission = await prisma.permission.findUnique({
    where: { code: permissionCode }
  });

  if (!permission) {
    throw new Error(`Permission not found: ${permissionCode}`);
  }

  await prisma.rolePermission.deleteMany({
    where: {
      role,
      permissionId: permission.id
    }
  });
}

// ============================================================================
// ROLE ASSIGNMENT MANAGEMENT
// ============================================================================

export interface ExtendedRoleAssignment {
  id: string;
  userId: string;
  tenantId: string;
  districtId: string | null;
  schoolId: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string | null;
    username: string;
    name: string | null;
  };
}

/**
 * Get all role assignments for a user
 */
export async function getRoleAssignmentsForUser(userId: string): Promise<ExtendedRoleAssignment[]> {
  const assignments = await prisma.roleAssignment.findMany({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return assignments.map(a => ({
    id: a.id,
    userId: a.userId,
    tenantId: a.tenantId,
    districtId: a.districtId,
    schoolId: a.schoolId,
    role: a.role as Role,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    user: a.user ? {
      id: a.user.id,
      email: a.user.email,
      username: a.user.username,
      name: a.user.name
    } : undefined
  }));
}

/**
 * Get role assignments by tenant with optional filters
 */
export async function getRoleAssignmentsByTenant(
  tenantId: string,
  filters?: {
    role?: Role;
    districtId?: string;
    schoolId?: string;
  }
): Promise<ExtendedRoleAssignment[]> {
  const assignments = await prisma.roleAssignment.findMany({
    where: {
      tenantId,
      ...(filters?.role && { role: filters.role }),
      ...(filters?.districtId && { districtId: filters.districtId }),
      ...(filters?.schoolId && { schoolId: filters.schoolId })
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return assignments.map(a => ({
    id: a.id,
    userId: a.userId,
    tenantId: a.tenantId,
    districtId: a.districtId,
    schoolId: a.schoolId,
    role: a.role as Role,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    user: a.user ? {
      id: a.user.id,
      email: a.user.email,
      username: a.user.username,
      name: a.user.name
    } : undefined
  }));
}

/**
 * Assign or update a role for a user
 */
export async function assignRole(input: {
  userId: string;
  tenantId: string;
  role: Role;
  districtId?: string;
  schoolId?: string;
  changedBy: string;
  reason?: string;
}): Promise<ExtendedRoleAssignment> {
  // Get current assignment if exists
  const existing = await prisma.roleAssignment.findUnique({
    where: {
      userId_tenantId: {
        userId: input.userId,
        tenantId: input.tenantId
      }
    }
  });

  const oldRole = existing?.role as Role | undefined;

  // Create or update the assignment
  const assignment = await prisma.roleAssignment.upsert({
    where: {
      userId_tenantId: {
        userId: input.userId,
        tenantId: input.tenantId
      }
    },
    create: {
      userId: input.userId,
      tenantId: input.tenantId,
      role: input.role,
      districtId: input.districtId ?? null,
      schoolId: input.schoolId ?? null
    },
    update: {
      role: input.role,
      districtId: input.districtId ?? null,
      schoolId: input.schoolId ?? null
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          name: true
        }
      }
    }
  });

  // Also update the user's primary role
  await prisma.user.update({
    where: { id: input.userId },
    data: { role: input.role }
  });

  // Log the role change
  await logRoleChange({
    userId: input.userId,
    changedBy: input.changedBy,
    oldRole,
    newRole: input.role,
    tenantId: input.tenantId,
    reason: input.reason
  });

  return {
    id: assignment.id,
    userId: assignment.userId,
    tenantId: assignment.tenantId,
    districtId: assignment.districtId,
    schoolId: assignment.schoolId,
    role: assignment.role as Role,
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
    user: assignment.user ? {
      id: assignment.user.id,
      email: assignment.user.email,
      username: assignment.user.username,
      name: assignment.user.name
    } : undefined
  };
}

/**
 * Remove a role assignment
 */
export async function removeRoleAssignment(
  userId: string,
  tenantId: string,
  changedBy: string,
  reason?: string
): Promise<void> {
  const existing = await prisma.roleAssignment.findUnique({
    where: {
      userId_tenantId: { userId, tenantId }
    }
  });

  if (!existing) return;

  await prisma.roleAssignment.delete({
    where: {
      userId_tenantId: { userId, tenantId }
    }
  });

  // Log the removal
  await logRoleChange({
    userId,
    changedBy,
    oldRole: existing.role as Role,
    newRole: Role.LEARNER, // Default fallback
    tenantId,
    reason: reason ?? "Role assignment removed"
  });
}

// ============================================================================
// ROLE CHANGE AUDIT
// ============================================================================

export interface RoleChangeAuditRecord {
  id: string;
  userId: string;
  changedBy: string;
  oldRole: Role | null;
  newRole: Role;
  tenantId: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * Log a role change
 */
export async function logRoleChange(input: {
  userId: string;
  changedBy: string;
  oldRole?: Role;
  newRole: Role;
  tenantId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<RoleChangeAuditRecord> {
  const audit = await prisma.roleChangeAudit.create({
    data: {
      userId: input.userId,
      changedBy: input.changedBy,
      oldRole: input.oldRole ?? null,
      newRole: input.newRole,
      tenantId: input.tenantId ?? null,
      reason: input.reason ?? null,
      metadata: input.metadata as object | undefined
    }
  });

  return {
    id: audit.id,
    userId: audit.userId,
    changedBy: audit.changedBy,
    oldRole: audit.oldRole as Role | null,
    newRole: audit.newRole as Role,
    tenantId: audit.tenantId,
    reason: audit.reason,
    metadata: audit.metadata as Record<string, unknown> | null,
    createdAt: audit.createdAt.toISOString()
  };
}

/**
 * Get role change history for a user
 */
export async function getRoleChangeHistory(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<RoleChangeAuditRecord[]> {
  const audits = await prisma.roleChangeAudit.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0
  });

  return audits.map(a => ({
    id: a.id,
    userId: a.userId,
    changedBy: a.changedBy,
    oldRole: a.oldRole as Role | null,
    newRole: a.newRole as Role,
    tenantId: a.tenantId,
    reason: a.reason,
    metadata: a.metadata as Record<string, unknown> | null,
    createdAt: a.createdAt.toISOString()
  }));
}

/**
 * Get all role changes made by an admin
 */
export async function getRoleChangesByAdmin(
  adminUserId: string,
  options?: { limit?: number; offset?: number }
): Promise<RoleChangeAuditRecord[]> {
  const audits = await prisma.roleChangeAudit.findMany({
    where: { changedBy: adminUserId },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0
  });

  return audits.map(a => ({
    id: a.id,
    userId: a.userId,
    changedBy: a.changedBy,
    oldRole: a.oldRole as Role | null,
    newRole: a.newRole as Role,
    tenantId: a.tenantId,
    reason: a.reason,
    metadata: a.metadata as Record<string, unknown> | null,
    createdAt: a.createdAt.toISOString()
  }));
}

// ============================================================================
// ROLE VALIDATION
// ============================================================================

/**
 * Validate that an actor can assign a role to a target user
 */
export function canAssignRole(
  actorRole: Role,
  targetCurrentRole: Role | undefined,
  newRole: Role
): { allowed: boolean; reason?: string } {
  // Check if actor can manage the target's current role
  if (targetCurrentRole && !hasRoleAuthority(actorRole as unknown as TypesRole, targetCurrentRole as unknown as TypesRole)) {
    return {
      allowed: false,
      reason: `You cannot modify users with role ${targetCurrentRole}`
    };
  }

  // Check if actor can assign the new role
  if (!hasRoleAuthority(actorRole as unknown as TypesRole, newRole as unknown as TypesRole)) {
    return {
      allowed: false,
      reason: `You cannot assign role ${newRole}`
    };
  }

  return { allowed: true };
}

/**
 * Get all roles that an actor can assign
 */
export function getAssignableRoles(actorRole: Role): Role[] {
  const allRoles: Role[] = [
    Role.SUPER_ADMIN,
    Role.GLOBAL_ADMIN,
    Role.FINANCE_ADMIN,
    Role.TECH_SUPPORT,
    Role.LEGAL_COMPLIANCE,
    Role.DISTRICT_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.TEACHER,
    Role.THERAPIST,
    Role.PARENT,
    Role.LEARNER
  ];

  return allRoles.filter(role =>
    hasRoleAuthority(actorRole as unknown as TypesRole, role as unknown as TypesRole)
  );
}

// ============================================================================
// ROLE STATISTICS
// ============================================================================

export interface RoleStats {
  role: Role;
  count: number;
}

/**
 * Get role distribution for a tenant
 */
export async function getRoleStatsForTenant(tenantId: string): Promise<RoleStats[]> {
  const assignments = await prisma.roleAssignment.groupBy({
    by: ["role"],
    where: { tenantId },
    _count: { role: true }
  });

  return assignments.map(a => ({
    role: a.role as Role,
    count: a._count.role
  }));
}

/**
 * Get total users by role across all tenants
 */
export async function getGlobalRoleStats(): Promise<RoleStats[]> {
  const users = await prisma.user.groupBy({
    by: ["role"],
    _count: { role: true }
  });

  return users.map(u => ({
    role: u.role,
    count: u._count.role
  }));
}
