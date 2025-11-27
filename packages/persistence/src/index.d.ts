import { Prisma } from "@prisma/client";
export declare function getLearnerLearningContext(learnerId: string): Promise<({
    sessions: {
        id: string;
        tenantId: string;
        subject: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        learnerId: string;
        date: string;
        plannedMinutes: number;
        actualMinutes: number | null;
    }[];
    owner: {
        id: string;
        name: string | null;
        email: string;
    };
    brainProfile: {
        id: string;
        region: string;
        updatedAt: Date;
        learnerId: string;
        currentGrade: number;
        gradeBand: string;
        subjectLevels: Prisma.JsonValue;
        neurodiversity: Prisma.JsonValue;
        preferences: Prisma.JsonValue;
    } | null;
    progressSnapshots: {
        id: string;
        subject: string;
        learnerId: string;
        date: string;
        masteryScore: number;
        minutesPracticed: number;
        difficultyLevel: number;
    }[];
} & {
    id: string;
    tenantId: string;
    region: string;
    createdAt: Date;
    displayName: string;
    currentGrade: number;
    ownerId: string;
}) | null>;
export declare function getLearnerWithBrainProfile(learnerId: string): Promise<{
    brainProfile: {
        learnerId: string;
        id: string;
        region: string;
        currentGrade: number;
        updatedAt: Date;
        gradeBand: string;
        subjectLevels: string | number | boolean | Prisma.JsonObject | Prisma.JsonArray;
        neurodiversity: string | number | boolean | Prisma.JsonObject | Prisma.JsonArray;
        preferences: string | number | boolean | Prisma.JsonObject | Prisma.JsonArray;
    };
    sessions: {
        id: string;
        tenantId: string;
        subject: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        learnerId: string;
        date: string;
        plannedMinutes: number;
        actualMinutes: number | null;
    }[];
    owner: {
        id: string;
        name: string | null;
        email: string;
    };
    progressSnapshots: {
        id: string;
        subject: string;
        learnerId: string;
        date: string;
        masteryScore: number;
        minutesPracticed: number;
        difficultyLevel: number;
    }[];
    id: string;
    tenantId: string;
    region: string;
    createdAt: Date;
    displayName: string;
    currentGrade: number;
    ownerId: string;
} | null>;
export declare function upsertBrainProfile(args: {
    learnerId: string;
    tenantId?: string;
    region: string;
    currentGrade: number;
    gradeBand: string;
    subjectLevels: Prisma.InputJsonValue;
    neurodiversity: Prisma.InputJsonValue;
    preferences: Prisma.InputJsonValue;
}): Promise<{
    id: string;
    region: string;
    updatedAt: Date;
    learnerId: string;
    currentGrade: number;
    gradeBand: string;
    subjectLevels: Prisma.JsonValue;
    neurodiversity: Prisma.JsonValue;
    preferences: Prisma.JsonValue;
}>;
export declare function createDifficultyProposal(args: {
    learnerId: string;
    tenantId: string;
    subject: string;
    fromLevel: number;
    toLevel: number;
    direction: string;
    rationale: string;
    createdBy: "system" | "teacher" | "parent";
}): Promise<{
    id: string;
    tenantId: string;
    subject: string;
    createdAt: Date;
    status: string;
    createdBy: string;
    learnerId: string;
    fromLevel: number;
    toLevel: number;
    direction: string;
    rationale: string;
    decidedById: string | null;
    decidedAt: Date | null;
    decisionNotes: string | null;
}>;
export declare function listPendingProposalsForLearner(learnerId: string): Promise<{
    id: string;
    tenantId: string;
    subject: string;
    createdAt: Date;
    status: string;
    createdBy: string;
    learnerId: string;
    fromLevel: number;
    toLevel: number;
    direction: string;
    rationale: string;
    decidedById: string | null;
    decidedAt: Date | null;
    decisionNotes: string | null;
}[]>;
export declare function decideOnProposal(args: {
    proposalId: string;
    approve: boolean;
    decidedById: string;
    notes?: string;
}): Promise<{
    id: string;
    tenantId: string;
    subject: string;
    createdAt: Date;
    status: string;
    createdBy: string;
    learnerId: string;
    fromLevel: number;
    toLevel: number;
    direction: string;
    rationale: string;
    decidedById: string | null;
    decidedAt: Date | null;
    decisionNotes: string | null;
}>;
export declare function createNotification(args: {
    tenantId: string;
    learnerId: string;
    recipientUserId: string;
    audience: string;
    type: string;
    title: string;
    body: string;
    relatedDifficultyProposalId?: string;
}): Promise<{
    id: string;
    tenantId: string;
    title: string;
    createdAt: Date;
    type: string;
    body: string;
    status: string;
    learnerId: string;
    audience: string;
    relatedDifficultyProposalId: string | null;
    relatedBaselineAssessmentId: string | null;
    relatedSessionId: string | null;
    recipientUserId: string;
}>;
export declare function listNotificationsForUser(userId: string, options?: {
    unreadOnly?: boolean;
    limit?: number;
}): Promise<{
    id: string;
    tenantId: string;
    title: string;
    createdAt: Date;
    type: string;
    body: string;
    status: string;
    learnerId: string;
    audience: string;
    relatedDifficultyProposalId: string | null;
    relatedBaselineAssessmentId: string | null;
    relatedSessionId: string | null;
    recipientUserId: string;
}[]>;
export declare function markNotificationRead(notificationId: string): Promise<{
    id: string;
    tenantId: string;
    title: string;
    createdAt: Date;
    type: string;
    body: string;
    status: string;
    learnerId: string;
    audience: string;
    relatedDifficultyProposalId: string | null;
    relatedBaselineAssessmentId: string | null;
    relatedSessionId: string | null;
    recipientUserId: string;
}>;
export declare function findUserWithRolesByEmail(email: string): Promise<{
    user: {
        id: string;
        email: string;
        name: string | null;
        tenantId: string;
        createdAt: Date;
    };
    roles: string[];
} | null>;
export * from "./analytics";
export * from "./content";
export * from "./experiments";
export * from "./governance";
export * from "./safety";
export * from "./sessions";
export * from "./admin";
export { prisma } from "./client";
