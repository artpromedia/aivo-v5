export declare function logSafetyIncident(args: {
    tenantId: string;
    learnerId?: string;
    type: string;
    severity: "watch" | "concern" | "critical";
    message: string;
    rawModelResponse?: string | null;
}): Promise<any>;
