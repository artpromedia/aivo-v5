import type { Tenant, TenantConfig, District, School, RoleAssignment } from "@aivo/types";
export interface ListTenantsResponse {
    tenants: Tenant[];
}
export interface GetTenantConfigResponse {
    tenant: Tenant;
    config: TenantConfig;
}
export interface ListDistrictsResponse {
    districts: District[];
}
export interface ListSchoolsResponse {
    schools: School[];
}
export interface ListRoleAssignmentsResponse {
    assignments: RoleAssignment[];
}
