import type { CaregiverLearnerOverview, Notification } from "@aivo/types";

export interface GetCaregiverLearnerOverviewResponse {
  overview: CaregiverLearnerOverview;
}

export interface ListNotificationsResponse {
  notifications: Notification[];
}

export interface MarkNotificationReadResponse {
  notification: Notification;
}
