import type { TenantLimits, AuditLogEntry, TenantUsage } from "@aivo/types";
export interface GetTenantLimitsResponse {
    limits: TenantLimits;
}
export interface UpdateTenantLimitsRequest {
    maxDailyLlmCalls?: number | null;
    maxDailyTutorTurns?: number | null;
    allowedProviders?: string[] | null;
    blockedProviders?: string[] | null;
}
export interface UpdateTenantLimitsResponse {
    limits: TenantLimits;
}
export interface ListAuditLogsResponse {
    logs: AuditLogEntry[];
}
export interface ListTenantUsageResponse {
    usage: TenantUsage[];
}
