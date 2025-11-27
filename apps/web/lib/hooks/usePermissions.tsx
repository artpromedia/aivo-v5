"use client";

import { useSession } from "next-auth/react";
import { useMemo, useCallback } from "react";
import { Role } from "@prisma/client";
import {
  type Permission,
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  hasRoleAuthority as checkRoleAuthority,
  getPermissionsForRole,
  getDashboardRoute,
  isPlatformRole,
  isOrganizationalRole,
  isEducationalRole,
  ROLE_HIERARCHY
} from "@aivo/types";

/**
 * Extended session user type with role information
 */
interface SessionUser {
  id: string;
  role: Role;
  username: string;
  name?: string | null;
  email?: string | null;
}

/**
 * Permission check result with loading state
 */
interface PermissionState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: SessionUser | null;
  role: Role | null;
  permissions: Permission[];
}

/**
 * Hook return type
 */
interface UsePermissionsReturn extends PermissionState {
  // Permission checks
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  
  // Role checks
  hasRole: (role: Role) => boolean;
  hasRoleOrHigher: (role: Role) => boolean;
  canManageRole: (targetRole: Role) => boolean;
  
  // Role type checks
  isPlatformAdmin: boolean;
  isOrganizationAdmin: boolean;
  isEducator: boolean;
  
  // Navigation
  dashboardRoute: string;
  
  // Utilities
  requirePermission: (permission: Permission) => boolean;
  requireAnyPermission: (permissions: Permission[]) => boolean;
}

/**
 * React hook for permission-based access control
 * 
 * @example
 * ```tsx
 * const { hasPermission, role, isLoading } = usePermissions();
 * 
 * if (isLoading) return <Loading />;
 * if (!hasPermission("manage_students")) return <Forbidden />;
 * 
 * return <StudentManager />;
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
  const { data: session, status } = useSession();
  
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!session?.user;
  
  const user = useMemo<SessionUser | null>(() => {
    if (!session?.user) return null;
    return session.user as SessionUser;
  }, [session?.user]);
  
  const role = user?.role ?? null;
  
  // Get all permissions for the user's role
  const permissions = useMemo<Permission[]>(() => {
    if (!role) return [];
    return getPermissionsForRole(role as unknown as import("@aivo/types").Role);
  }, [role]);
  
  // Permission check functions
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!role) return false;
    return checkPermission(role as unknown as import("@aivo/types").Role, permission);
  }, [role]);
  
  const hasAnyPermission = useCallback((perms: Permission[]): boolean => {
    if (!role) return false;
    return checkAnyPermission(role as unknown as import("@aivo/types").Role, perms);
  }, [role]);
  
  const hasAllPermissions = useCallback((perms: Permission[]): boolean => {
    if (!role) return false;
    return checkAllPermissions(role as unknown as import("@aivo/types").Role, perms);
  }, [role]);
  
  // Role check functions
  const hasRole = useCallback((targetRole: Role): boolean => {
    return role === targetRole;
  }, [role]);
  
  const hasRoleOrHigher = useCallback((targetRole: Role): boolean => {
    if (!role) return false;
    const userLevel = ROLE_HIERARCHY[role as unknown as import("@aivo/types").Role];
    const targetLevel = ROLE_HIERARCHY[targetRole as unknown as import("@aivo/types").Role];
    return userLevel <= targetLevel;
  }, [role]);
  
  const canManageRole = useCallback((targetRole: Role): boolean => {
    if (!role) return false;
    return checkRoleAuthority(
      role as unknown as import("@aivo/types").Role,
      targetRole as unknown as import("@aivo/types").Role
    );
  }, [role]);
  
  // Role type checks
  const isPlatformAdmin = useMemo(() => {
    if (!role) return false;
    return isPlatformRole(role as unknown as import("@aivo/types").Role);
  }, [role]);
  
  const isOrganizationAdmin = useMemo(() => {
    if (!role) return false;
    return isOrganizationalRole(role as unknown as import("@aivo/types").Role);
  }, [role]);
  
  const isEducator = useMemo(() => {
    if (!role) return false;
    return isEducationalRole(role as unknown as import("@aivo/types").Role);
  }, [role]);
  
  // Dashboard route
  const dashboardRoute = useMemo(() => {
    if (!role) return "/";
    return getDashboardRoute(role as unknown as import("@aivo/types").Role);
  }, [role]);
  
  // Require functions (for conditional rendering)
  const requirePermission = useCallback((permission: Permission): boolean => {
    if (isLoading) return false;
    if (!isAuthenticated) return false;
    return hasPermission(permission);
  }, [isLoading, isAuthenticated, hasPermission]);
  
  const requireAnyPermission = useCallback((perms: Permission[]): boolean => {
    if (isLoading) return false;
    if (!isAuthenticated) return false;
    return hasAnyPermission(perms);
  }, [isLoading, isAuthenticated, hasAnyPermission]);
  
  return {
    // State
    isLoading,
    isAuthenticated,
    user,
    role,
    permissions,
    
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Role checks
    hasRole,
    hasRoleOrHigher,
    canManageRole,
    
    // Role type checks
    isPlatformAdmin,
    isOrganizationAdmin,
    isEducator,
    
    // Navigation
    dashboardRoute,
    
    // Utilities
    requirePermission,
    requireAnyPermission
  };
}

/**
 * Higher-order component for permission-based route protection
 * 
 * @example
 * ```tsx
 * export default withPermission(AdminPage, "manage_platform");
 * ```
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission
): React.FC<P> {
  return function ProtectedComponent(props: P) {
    const { hasPermission, isLoading, isAuthenticated } = usePermissions();
    
    if (isLoading) {
      return null; // Or loading component
    }
    
    if (!isAuthenticated || !hasPermission(permission)) {
      return null; // Or forbidden component
    }
    
    return <Component {...props} />;
  };
}

/**
 * Component that only renders children if user has permission
 * 
 * @example
 * ```tsx
 * <RequirePermission permission="manage_students">
 *   <DeleteButton />
 * </RequirePermission>
 * ```
 */
export function RequirePermission({
  permission,
  children,
  fallback = null
}: {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): React.ReactNode {
  const { hasPermission, isLoading } = usePermissions();
  
  if (isLoading) {
    return null;
  }
  
  if (!hasPermission(permission)) {
    return fallback;
  }
  
  return children;
}

/**
 * Component that only renders children if user has any of the permissions
 */
export function RequireAnyPermission({
  permissions,
  children,
  fallback = null
}: {
  permissions: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): React.ReactNode {
  const { hasAnyPermission, isLoading } = usePermissions();
  
  if (isLoading) {
    return null;
  }
  
  if (!hasAnyPermission(permissions)) {
    return fallback;
  }
  
  return children;
}

/**
 * Component that only renders children if user has the specified role or higher
 */
export function RequireRole({
  role,
  children,
  fallback = null
}: {
  role: Role;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): React.ReactNode {
  const { hasRoleOrHigher, isLoading } = usePermissions();
  
  if (isLoading) {
    return null;
  }
  
  if (!hasRoleOrHigher(role)) {
    return fallback;
  }
  
  return children;
}

export default usePermissions;
