"use client";

import { Role } from "@prisma/client";
import { RoleProtectedLayout } from "@/components/auth/RoleProtectedLayout";

const ALLOWED_ROLES: Role[] = [
  Role.TEACHER,
  Role.THERAPIST,
  Role.SCHOOL_ADMIN,
  Role.DISTRICT_ADMIN,
  Role.GLOBAL_ADMIN,
  Role.SUPER_ADMIN
];

export default function TeacherPortalLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleProtectedLayout
      allowedRoles={ALLOWED_ROLES}
      redirectTo="/login"
    >
      {children}
    </RoleProtectedLayout>
  );
}
