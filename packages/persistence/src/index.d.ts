import { Prisma } from "@prisma/client";
export declare function getLearnerWithBrainProfile(learnerId: string): Promise<({
    brainProfile: {
        learnerId: string;
        id: string;
        region: string;
        currentGrade: number;
        updatedAt: Date;
        gradeBand: string;
        subjectLevels: Prisma.JsonValue;
        neurodiversity: Prisma.JsonValue;
        preferences: Prisma.JsonValue;
    } | null;
} & {
    tenantId: string;
    id: string;
    region: string;
    createdAt: Date;
    displayName: string;
    currentGrade: number;
    ownerId: string;
}) | null>;
export declare function upsertBrainProfile(args: {
    learnerId: string;
    tenantId: string;
    region: string;
    currentGrade: number;
    gradeBand: string;
    subjectLevels: Prisma.InputJsonValue;
    neurodiversity: Prisma.InputJsonValue;
    preferences: Prisma.InputJsonValue;
}): Promise<any>;
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
    learnerId: string;
    tenantId: string;
    subject: string;
    id: string;
    createdAt: Date;
    fromLevel: number;
    toLevel: number;
    direction: string;
    rationale: string;
    createdBy: string;
    status: string;
    decidedById: string | null;
    decidedAt: Date | null;
    decisionNotes: string | null;
}>;
export declare function listPendingProposalsForLearner(learnerId: string): Promise<{
    learnerId: string;
    tenantId: string;
    subject: string;
    id: string;
    createdAt: Date;
    fromLevel: number;
    toLevel: number;
    direction: string;
    rationale: string;
    createdBy: string;
    status: string;
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
    learnerId: string;
    tenantId: string;
    subject: string;
    id: string;
    createdAt: Date;
    fromLevel: number;
    toLevel: number;
    direction: string;
    rationale: string;
    createdBy: string;
    status: string;
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
}): Promise<any>;
export declare function listNotificationsForUser(userId: string): Promise<any>;
export declare function markNotificationRead(notificationId: string, userId: string): Promise<{
    count: number;
}>;
export declare function findUserWithRolesByEmail(email: string): Promise<null | {
    user: any;
    roles: string[];
}>;
export * from "./analytics";
export * from "./content";
export * from "./experiments";
export * from "./governance";
export * from "./safety";
export { prisma } from "./client";
