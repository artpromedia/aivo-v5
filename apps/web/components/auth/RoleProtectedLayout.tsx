"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { usePermissions } from "@/lib/hooks/usePermissions";
import type { Permission } from "@aivo/types";

interface RoleProtectedLayoutProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean; // If true, requires all permissions; if false, requires any
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
  forbiddenComponent?: React.ReactNode;
}

/**
 * Layout wrapper that protects routes based on role or permissions
 * 
 * @example
 * ```tsx
 * // Allow only teachers and admins
 * <RoleProtectedLayout allowedRoles={[Role.TEACHER, Role.SCHOOL_ADMIN]}>
 *   <TeacherDashboard />
 * </RoleProtectedLayout>
 * 
 * // Require specific permission
 * <RoleProtectedLayout requiredPermission="manage_students">
 *   <StudentManager />
 * </RoleProtectedLayout>
 * ```
 */
export function RoleProtectedLayout({
  children,
  allowedRoles,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  redirectTo = "/login",
  loadingComponent,
  forbiddenComponent
}: RoleProtectedLayoutProps) {
  const router = useRouter();
  const {
    isLoading,
    isAuthenticated,
    role,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  } = usePermissions();

  useEffect(() => {
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Check role-based access
    if (allowedRoles && allowedRoles.length > 0 && role) {
      if (!allowedRoles.includes(role)) {
        router.push("/forbidden");
        return;
      }
    }

    // Check permission-based access
    if (requiredPermission) {
      if (!hasPermission(requiredPermission)) {
        router.push("/forbidden");
        return;
      }
    }

    // Check multiple permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAccess = requireAll
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);

      if (!hasAccess) {
        router.push("/forbidden");
        return;
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    role,
    allowedRoles,
    requiredPermission,
    requiredPermissions,
    requireAll,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    router,
    redirectTo
  ]);

  // Show loading state
  if (isLoading) {
    return loadingComponent ?? (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect
  }

  // Check role access
  if (allowedRoles && allowedRoles.length > 0 && role) {
    if (!allowedRoles.includes(role)) {
      return forbiddenComponent ?? <ForbiddenPage />;
    }
  }

  // Check permission access
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return forbiddenComponent ?? <ForbiddenPage />;
  }

  // Check multiple permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      return forbiddenComponent ?? <ForbiddenPage />;
    }
  }

  return <>{children}</>;
}

/**
 * Default forbidden page component
 */
function ForbiddenPage() {
  const router = useRouter();
  const { dashboardRoute } = usePermissions();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="text-center max-w-md px-4">
        <h1 className="text-6xl font-bold text-red-500 mb-4">403</h1>
        <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
        <p className="text-slate-400 mb-6">
          You don't have permission to access this page.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => router.push(dashboardRoute)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoleProtectedLayout;
