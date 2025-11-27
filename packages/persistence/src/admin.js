"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTenants = listTenants;
exports.getTenantById = getTenantById;
exports.createTenant = createTenant;
exports.updateTenant = updateTenant;
exports.listDistrictsForTenant = listDistrictsForTenant;
exports.createDistrict = createDistrict;
exports.listSchoolsForTenant = listSchoolsForTenant;
exports.createSchool = createSchool;
exports.listRoleAssignmentsForTenant = listRoleAssignmentsForTenant;
exports.upsertRoleAssignment = upsertRoleAssignment;
exports.deleteRoleAssignment = deleteRoleAssignment;
const client_1 = require("./client");
/**
 * List all tenants (platform admin only)
 */
async function listTenants() {
    const tenants = await client_1.prisma.tenant.findMany({
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
async function getTenantById(tenantId) {
    const tenant = await client_1.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { config: true }
    });
    if (!tenant)
        return null;
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
            allowedProviders: tenant.config.allowedProviders ?? [],
            dataResidency: tenant.config.dataResidency ?? undefined,
            curricula: tenant.config.curricula ?? []
        } : null
    };
}
/**
 * Create a new tenant with default configuration
 */
async function createTenant(input) {
    const tenant = await client_1.prisma.tenant.create({
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
async function updateTenant(tenantId, data) {
    const tenant = await client_1.prisma.tenant.update({
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
/**
 * List districts for a tenant
 */
async function listDistrictsForTenant(tenantId) {
    const districts = await client_1.prisma.district.findMany({
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
async function createDistrict(input) {
    const district = await client_1.prisma.district.create({
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
/**
 * List schools for a tenant, optionally filtered by district
 */
async function listSchoolsForTenant(tenantId, districtId) {
    const schools = await client_1.prisma.school.findMany({
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
async function createSchool(input) {
    const school = await client_1.prisma.school.create({
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
/**
 * List role assignments for a tenant
 */
async function listRoleAssignmentsForTenant(tenantId) {
    const assignments = await client_1.prisma.roleAssignment.findMany({
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
async function upsertRoleAssignment(input) {
    const assignment = await client_1.prisma.roleAssignment.upsert({
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
async function deleteRoleAssignment(userId, tenantId) {
    await client_1.prisma.roleAssignment.delete({
        where: {
            userId_tenantId: {
                userId,
                tenantId
            }
        }
    });
}
