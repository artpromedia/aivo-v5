import { prisma } from "./client";
import { TenantType } from "@prisma/client";

/**
 * Admin data persistence layer
 * Handles tenants, districts, schools, and role assignments
 */

// ============ Tenants ============

export interface CreateTenantInput {
  name: string;
  type: TenantType;
  region: string;
}

export interface TenantRecord {
  id: string;
  name: string;
  type: string;
  region: string;
  isActive: boolean;
  createdAt: string;
}

export interface TenantConfigRecord {
  tenantId: string;
  name: string;
  defaultRegion: string;
  allowedProviders: string[];
  dataResidency?: string;
  curricula: CurriculumConfigItem[];
}

export interface TenantWithConfig {
  tenant: TenantRecord;
  config: TenantConfigRecord | null;
}

export interface CurriculumConfigItem {
  id: string;
  label: string;
  region: string;
  standard: string;
  subjects: string[];
}

/**
 * List all tenants (platform admin only)
 */
export async function listTenants(): Promise<TenantRecord[]> {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" }
  });

  return tenants.map(t => ({
    id: t.id,
    name: t.name,
    type: t.type,
    region: t.region,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString()
  }));
}

/**
 * Get a tenant by ID with its configuration
 */
export async function getTenantById(tenantId: string): Promise<TenantWithConfig | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { config: true }
  });

  if (!tenant) return null;

  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      type: tenant.type,
      region: tenant.region,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt.toISOString()
    },
    config: tenant.config ? {
      tenantId: tenant.id,
      name: tenant.name,
      defaultRegion: tenant.config.defaultRegion,
      allowedProviders: (tenant.config.allowedProviders as string[]) ?? [],
      dataResidency: tenant.config.dataResidency ?? undefined,
      curricula: (tenant.config.curricula as unknown as CurriculumConfigItem[]) ?? []
    } : null
  };
}

/**
 * Create a new tenant with default configuration
 */
export async function createTenant(input: CreateTenantInput): Promise<TenantRecord> {
  const tenant = await prisma.tenant.create({
    data: {
      name: input.name,
      type: input.type,
      region: input.region,
      isActive: true,
      config: {
        create: {
          defaultRegion: input.region,
          allowedProviders: ["openai", "anthropic"],
          dataResidency: input.region === "europe" ? "eu" : "us",
          curricula: []
        }
      }
    }
  });

  return {
    id: tenant.id,
    name: tenant.name,
    type: tenant.type,
    region: tenant.region,
    isActive: tenant.isActive,
    createdAt: tenant.createdAt.toISOString()
  };
}

/**
 * Update a tenant
 */
export async function updateTenant(tenantId: string, data: { name?: string; isActive?: boolean }): Promise<TenantRecord> {
  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data
  });

  return {
    id: tenant.id,
    name: tenant.name,
    type: tenant.type,
    region: tenant.region,
    isActive: tenant.isActive,
    createdAt: tenant.createdAt.toISOString()
  };
}

// ============ Districts ============

export interface DistrictRecord {
  id: string;
  tenantId: string;
  name: string;
  country: string;
  createdAt: string;
}

export interface CreateDistrictInput {
  tenantId: string;
  name: string;
  country: string;
}

/**
 * List districts for a tenant
 */
export async function listDistrictsForTenant(tenantId: string): Promise<DistrictRecord[]> {
  const districts = await prisma.district.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });

  return districts.map(d => ({
    id: d.id,
    tenantId: d.tenantId,
    name: d.name,
    country: d.country,
    createdAt: d.createdAt.toISOString()
  }));
}

/**
 * Create a district
 */
export async function createDistrict(input: CreateDistrictInput): Promise<DistrictRecord> {
  const district = await prisma.district.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      country: input.country
    }
  });

  return {
    id: district.id,
    tenantId: district.tenantId,
    name: district.name,
    country: district.country,
    createdAt: district.createdAt.toISOString()
  };
}

// ============ Schools ============

export interface SchoolRecord {
  id: string;
  tenantId: string;
  districtId: string | null;
  name: string;
  city?: string;
  createdAt: string;
}

export interface CreateSchoolInput {
  tenantId: string;
  districtId?: string;
  name: string;
  city?: string;
}

/**
 * List schools for a tenant, optionally filtered by district
 */
export async function listSchoolsForTenant(tenantId: string, districtId?: string): Promise<SchoolRecord[]> {
  const schools = await prisma.school.findMany({
    where: {
      tenantId,
      districtId: districtId ?? undefined
    },
    orderBy: { createdAt: "desc" }
  });

  return schools.map(s => ({
    id: s.id,
    tenantId: s.tenantId,
    districtId: s.districtId ?? null,
    name: s.name,
    city: s.city ?? undefined,
    createdAt: s.createdAt.toISOString()
  }));
}

/**
 * Create a school
 */
export async function createSchool(input: CreateSchoolInput): Promise<SchoolRecord> {
  const school = await prisma.school.create({
    data: {
      tenantId: input.tenantId,
      districtId: input.districtId ?? null,
      name: input.name,
      city: input.city ?? null
    }
  });

  return {
    id: school.id,
    tenantId: school.tenantId,
    districtId: school.districtId ?? null,
    name: school.name,
    city: school.city ?? undefined,
    createdAt: school.createdAt.toISOString()
  };
}

// ============ Role Assignments ============

export interface RoleAssignmentRecord {
  userId: string;
  tenantId: string;
  districtId: string | null;
  schoolId: string | null;
  role: string;
}

/**
 * List role assignments for a tenant
 */
export async function listRoleAssignmentsForTenant(tenantId: string): Promise<RoleAssignmentRecord[]> {
  const assignments = await prisma.roleAssignment.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });

  return assignments.map(a => ({
    userId: a.userId,
    tenantId: a.tenantId,
    districtId: a.districtId ?? null,
    schoolId: a.schoolId ?? null,
    role: a.role
  }));
}

/**
 * Create or update a role assignment
 */
export async function upsertRoleAssignment(input: {
  userId: string;
  tenantId: string;
  districtId?: string;
  schoolId?: string;
  role: string;
}): Promise<RoleAssignmentRecord> {
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
      districtId: input.districtId ?? null,
      schoolId: input.schoolId ?? null,
      role: input.role
    },
    update: {
      districtId: input.districtId ?? null,
      schoolId: input.schoolId ?? null,
      role: input.role
    }
  });

  return {
    userId: assignment.userId,
    tenantId: assignment.tenantId,
    districtId: assignment.districtId ?? null,
    schoolId: assignment.schoolId ?? null,
    role: assignment.role
  };
}

/**
 * Delete a role assignment
 */
export async function deleteRoleAssignment(userId: string, tenantId: string): Promise<void> {
  await prisma.roleAssignment.delete({
    where: {
      userId_tenantId: {
        userId,
        tenantId
      }
    }
  });
}
