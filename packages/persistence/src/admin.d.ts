/**
 * Admin data persistence layer
 * Handles tenants, districts, schools, and role assignments
 */
export interface CreateTenantInput {
    name: string;
    type: "district" | "independent_school" | "clinic" | "homeschool_network";
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
export declare function listTenants(): Promise<TenantRecord[]>;
/**
 * Get a tenant by ID with its configuration
 */
export declare function getTenantById(tenantId: string): Promise<TenantWithConfig | null>;
/**
 * Create a new tenant with default configuration
 */
export declare function createTenant(input: CreateTenantInput): Promise<TenantRecord>;
/**
 * Update a tenant
 */
export declare function updateTenant(tenantId: string, data: {
    name?: string;
    isActive?: boolean;
}): Promise<TenantRecord>;
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
export declare function listDistrictsForTenant(tenantId: string): Promise<DistrictRecord[]>;
/**
 * Create a district
 */
export declare function createDistrict(input: CreateDistrictInput): Promise<DistrictRecord>;
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
export declare function listSchoolsForTenant(tenantId: string, districtId?: string): Promise<SchoolRecord[]>;
/**
 * Create a school
 */
export declare function createSchool(input: CreateSchoolInput): Promise<SchoolRecord>;
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
export declare function listRoleAssignmentsForTenant(tenantId: string): Promise<RoleAssignmentRecord[]>;
/**
 * Create or update a role assignment
 */
export declare function upsertRoleAssignment(input: {
    userId: string;
    tenantId: string;
    districtId?: string;
    schoolId?: string;
    role: string;
}): Promise<RoleAssignmentRecord>;
/**
 * Delete a role assignment
 */
export declare function deleteRoleAssignment(userId: string, tenantId: string): Promise<void>;
