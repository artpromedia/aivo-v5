import type { LearnerSession, SessionPlanRun } from "@aivo/types";
export interface GetTodaySessionRequest {
    learnerId: string;
    subject: string;
}
export interface GetTodaySessionResponse {
    session: LearnerSession | null;
}
export interface StartSessionRequest {
    learnerId: string;
    subject: string;
}
export interface StartSessionResponse {
    session: LearnerSession;
}
export interface UpdateActivityStatusRequest {
    sessionId: string;
    activityId: string;
    status: "in_progress" | "completed" | "skipped";
}
export interface UpdateActivityStatusResponse {
    session: LearnerSession;
}
export interface PlanSessionRequest {
    learnerId: string;
    subject: string;
    region: string;
}
export interface PlanSessionResponse {
    run: SessionPlanRun;
}
