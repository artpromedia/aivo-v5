export declare function recordTelemetryEvent(args: {
    tenantId: string;
    learnerId: string;
    type: string;
    subject?: string;
    payload?: unknown;
}): Promise<any>;
export declare function upsertSubjectProgressSnapshot(args: {
    learnerId: string;
    subject: string;
    date: string;
    masteryScore: number;
    minutesPracticed: number;
    difficultyLevel: number;
}): Promise<any>;
export declare function getSubjectTimeseriesForLearner(learnerId: string, subject: string): Promise<any>;
export declare function getAggregateTenantStats(tenantId: string): Promise<{
    learnersCount: any;
    avgMinutesPracticed: number;
    avgMasteryScore: number;
}>;
