export declare function getOrCreateTenantLimits(tenantId: string): Promise<any>;
export declare function updateTenantLimits(args: {
    tenantId: string;
    maxDailyLlmCalls?: number | null;
    maxDailyTutorTurns?: number | null;
    allowedProviders?: string[] | null;
    blockedProviders?: string[] | null;
}): Promise<any>;
export declare function incrementTenantUsage(args: {
    tenantId: string;
    date: string;
    llmCalls?: number;
    tutorTurns?: number;
    sessionsPlanned?: number;
    safetyIncidents?: number;
}): Promise<any>;
export declare function getTenantUsageForDate(tenantId: string, date: string): Promise<any>;
export declare function createAuditLogEntry(args: {
    tenantId: string;
    userId: string;
    type: string;
    message: string;
    meta?: unknown;
}): Promise<any>;
