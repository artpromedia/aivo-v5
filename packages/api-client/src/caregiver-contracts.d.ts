import type { CaregiverLearnerOverview, Notification, NotificationSummary, DifficultyProposalSummary } from "@aivo/types";
export interface GetCaregiverLearnerOverviewResponse {
    overview: CaregiverLearnerOverview;
}
export interface ListNotificationsResponse {
    items: NotificationSummary[];
}
export interface MarkNotificationReadResponse {
    notification: Notification;
}
export interface ListDifficultyProposalsResponse {
    items: DifficultyProposalSummary[];
}
