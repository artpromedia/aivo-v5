-- Migration: Add Extended Roles and Permissions System
-- Description: Extends the Role enum with all 11 roles and adds Permission/RolePermission tables

-- Step 1: Add new role values to the Role enum
-- Note: PostgreSQL requires creating a new enum type and migrating
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'GLOBAL_ADMIN';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'FINANCE_ADMIN';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TECH_SUPPORT';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'LEGAL_COMPLIANCE';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DISTRICT_ADMIN';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SCHOOL_ADMIN';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'THERAPIST';

-- Step 2: Create Permission table
CREATE TABLE IF NOT EXISTS "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- Create unique index on permission code
CREATE UNIQUE INDEX IF NOT EXISTS "Permission_code_key" ON "Permission"("code");

-- Step 3: Create RolePermission junction table
CREATE TABLE IF NOT EXISTS "RolePermission" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for role-permission pairs
CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_role_permissionId_key" ON "RolePermission"("role", "permissionId");

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS "RolePermission_role_idx" ON "RolePermission"("role");
CREATE INDEX IF NOT EXISTS "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- Add foreign key constraint
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" 
    FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Create RoleChangeAudit table for audit logging
CREATE TABLE IF NOT EXISTS "RoleChangeAudit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "oldRole" "Role",
    "newRole" "Role" NOT NULL,
    "tenantId" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleChangeAudit_pkey" PRIMARY KEY ("id")
);

-- Create indexes for audit table
CREATE INDEX IF NOT EXISTS "RoleChangeAudit_userId_idx" ON "RoleChangeAudit"("userId");
CREATE INDEX IF NOT EXISTS "RoleChangeAudit_changedBy_idx" ON "RoleChangeAudit"("changedBy");
CREATE INDEX IF NOT EXISTS "RoleChangeAudit_createdAt_idx" ON "RoleChangeAudit"("createdAt");

-- Step 5: Migrate existing ADMIN users to SCHOOL_ADMIN
-- (Run this only if you have existing users with ADMIN role)
-- UPDATE "User" SET "role" = 'SCHOOL_ADMIN' WHERE "role" = 'ADMIN';
-- UPDATE "RoleAssignment" SET "role" = 'SCHOOL_ADMIN' WHERE "role" = 'ADMIN';
