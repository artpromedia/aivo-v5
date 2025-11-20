import type { LearnerAnalyticsOverview } from "@aivo/types";
export interface GetLearnerAnalyticsResponse {
    analytics: LearnerAnalyticsOverview;
}
export interface GetTenantAnalyticsResponse {
    tenantId: string;
    learnersCount: number;
    avgMinutesPracticed: number;
    avgMasteryScore: number;
}
