/**
 * Session persistence layer
 * Stores learning sessions with activities in the database
 */
export interface CreateSessionInput {
    learnerId: string;
    tenantId: string;
    subject: string;
    date: string;
    plannedMinutes: number;
    activities: SessionActivityInput[];
}
export interface SessionActivityInput {
    id: string;
    type: string;
    title: string;
    instructions: string;
    estimatedMinutes: number;
    status: "pending" | "in_progress" | "completed" | "skipped";
    startedAt?: string;
    completedAt?: string;
}
export interface UpdateActivityStatusInput {
    sessionId: string;
    activityId: string;
    status: "in_progress" | "completed" | "skipped";
}
export interface SessionRecord {
    id: string;
    learnerId: string;
    tenantId: string;
    date: string;
    subject: string;
    status: string;
    plannedMinutes: number;
    actualMinutes?: number;
    activities: ActivityRecord[];
    createdAt: string;
    updatedAt: string;
}
export interface ActivityRecord {
    id: string;
    sessionId: string;
    learnerId: string;
    subject: string;
    type: string;
    title: string;
    instructions: string;
    estimatedMinutes: number;
    status: string;
    startedAt?: string;
    completedAt?: string;
}
/**
 * Get a session for a learner on a specific date and subject
 */
export declare function getSessionForLearnerToday(learnerId: string, subject: string, date: string): Promise<SessionRecord | null>;
/**
 * Create a new learning session with activities
 */
export declare function createSession(input: CreateSessionInput): Promise<SessionRecord>;
/**
 * Start a session (mark as active)
 */
export declare function startSession(sessionId: string): Promise<SessionRecord | null>;
/**
 * Update an activity's status within a session
 */
export declare function updateActivityStatus(input: UpdateActivityStatusInput): Promise<SessionRecord | null>;
/**
 * Get recent sessions for a learner
 */
export declare function getRecentSessions(learnerId: string, limit?: number): Promise<SessionRecord[]>;
/**
 * Get session by ID
 */
export declare function getSessionById(sessionId: string): Promise<SessionRecord | null>;
