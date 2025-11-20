export interface TenantUsage {
    tenantId: string;
    date: string;
    llmCalls: number;
    tutorTurns: number;
    sessionsPlanned: number;
    safetyIncidents: number;
}
export interface TenantLimits {
    tenantId: string;
    maxDailyLlmCalls?: number;
    maxDailyTutorTurns?: number;
    allowedProviders?: string[];
    blockedProviders?: string[];
}
export type AuditEventType = "tenant_policy_updated" | "provider_config_changed" | "role_assignment_changed" | "feature_flag_updated";
export interface AuditLogEntry {
    id: string;
    tenantId: string;
    userId: string;
    type: AuditEventType;
    message: string;
    createdAt: string;
    meta?: Record<string, unknown>;
}
