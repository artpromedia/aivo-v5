import type { Role } from "@aivo/types";

export interface RequestUser {
  userId: string;
  tenantId: string;
  roles: Role[];
}

export function getMockUserFromHeader(headerValue?: string | string[] | undefined): RequestUser {
  // For now, we accept an "x-aivo-user" header:
  // - "parent"
  // - "teacher"
  // - "district_admin"
  // - "platform_admin"
  const role = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  switch (role) {
    case "platform_admin":
      return {
        userId: "user-platform-admin",
        tenantId: "platform-tenant",
        roles: ["platform_admin"]
      };
    case "district_admin":
      return {
        userId: "user-district-admin",
        tenantId: "tenant-1",
        roles: ["district_admin"]
      };
    case "teacher":
      return {
        userId: "user-teacher-1",
        tenantId: "tenant-1",
        roles: ["teacher"]
      };
    case "parent":
    default:
      return {
        userId: "user-parent-1",
        tenantId: "tenant-1",
        roles: ["parent"]
      };
  }
}

export function requireRole(user: RequestUser, allowed: Role[]): void {
  const hasRole = user.roles.some((r) => allowed.includes(r));
  if (!hasRole) {
    const allowedText = allowed.join(", ");
    throw Object.assign(new Error("Forbidden: missing required role"), {
      statusCode: 403,
      allowed,
      allowedText
    });
  }
}
