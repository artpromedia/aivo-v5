import { Role } from "@prisma/client";

export const GUARDIAN_ROLES: Role[] = [Role.PARENT, Role.TEACHER];

export function isGuardianRole(role: Role) {
  return GUARDIAN_ROLES.includes(role);
}
