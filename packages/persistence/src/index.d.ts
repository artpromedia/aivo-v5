import { Prisma, Role } from "@prisma/client";

export declare function getLearnerLearningContext(learnerId: string): Promise<any>;
export declare function getLearnerWithBrainProfile(learnerId: string): Promise<any>;
export declare function upsertPersonalizedModel(args: {
    learnerId: string;
    modelId?: string | null;
    systemPrompt?: string | null;
    vectorStoreId?: string | null;
    configuration?: Prisma.InputJsonValue;
    status?: string;
    summary?: string | null;
    performanceMetrics?: Prisma.InputJsonValue;
    lastTrainedAt?: Date | null;
}): Promise<any>;
export declare function upsertBrainProfile(args: {
    learnerId: string;
    tenantId?: string;
    region: string;
    currentGrade: number;
    gradeBand: string;
    subjectLevels: Prisma.InputJsonValue;
    neurodiversity: Prisma.InputJsonValue;
    preferences: Prisma.InputJsonValue;
}): Promise<any>;
export declare function createApprovalRequest(args: {
    learnerId: string;
    requesterId: string;
    approverId: string;
    type: string;
    details: Prisma.InputJsonValue;
    comments?: string;
}): Promise<any>;
export declare function createDifficultyProposal(args: {
    learnerId: string;
    requesterId: string;
    approverId: string;
    subject: string;
    fromLevel: number;
    toLevel: number;
    direction: string;
    rationale: string;
    createdBy: "system" | "teacher" | "parent";
}): Promise<any>;
export declare function listApprovalRequests(filters?: {
    learnerId?: string;
    approverId?: string;
    status?: string;
    limit?: number;
}): Promise<any[]>;
export declare function listPendingProposalsForLearner(learnerId: string): Promise<any[]>;
export declare function decideOnApprovalRequest(args: {
    approvalRequestId: string;
    approverId: string;
    status: string;
    comments?: string;
}): Promise<any>;
export declare function decideOnProposal(args: {
    proposalId: string;
    approve: boolean;
    decidedById: string;
    notes?: string;
}): Promise<any>;
export declare function createNotification(args: {
    tenantId?: string;
    learnerId: string;
    recipientUserId: string;
    audience: string;
    type: string;
    title: string;
    body: string;
    relatedDifficultyProposalId?: string;
}): Promise<any>;
export declare function listNotificationsForUser(userId: string, options?: {
    unreadOnly?: boolean;
    limit?: number;
}): Promise<any[]>;
export declare function markNotificationRead(args: {
    notificationId: string;
    userId: string;
}): Promise<{
    count: number;
}>;
export declare function findUserWithRolesByEmail(email: string): Promise<null | {
    user: {
        id: string;
        email: string | null;
        username: string;
        role: Role;
        password: string;
        createdAt: Date;
        updatedAt: Date;
    };
    roles: Role[];
}>;

export * from "./analytics";
export * from "./content";
export * from "./experiments";
export * from "./governance";
export * from "./safety";
export { prisma } from "./client";
