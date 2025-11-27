export declare function getOrCreateExperiment(args: {
    tenantId: string;
    key: string;
    name: string;
    variants: {
        id: string;
        key: string;
        label: string;
        description?: string;
    }[];
}): Promise<{
    id: string;
    tenantId: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    status: string;
    key: string;
    variants: import("@prisma/client/runtime/library").JsonValue;
}>;
export declare function assignLearnerToExperiment(args: {
    learnerId: string;
    experimentId: string;
}): Promise<{
    assignment: any;
    variantKey: string;
}>;
export declare function getAssignmentForLearner(args: {
    learnerId: string;
    experimentId: string;
}): Promise<{
    id: string;
    experimentId: string;
    learnerId: string;
    variantKey: string;
    assignedAt: Date;
} | null>;
export declare function recordFeedback(args: {
    tenantId: string;
    learnerId?: string;
    userId?: string;
    targetType: string;
    targetId: string;
    role: string;
    rating: number;
    label?: string;
    comment?: string;
    experimentKey?: string;
    variantKey?: string;
}): Promise<{
    id: string;
    tenantId: string;
    createdAt: Date;
    label: string | null;
    learnerId: string | null;
    variantKey: string | null;
    targetType: string;
    targetId: string;
    role: string;
    rating: number;
    comment: string | null;
    experimentKey: string | null;
    userId: string | null;
}>;
export declare function aggregateFeedbackForTarget(args: {
    tenantId: string;
    targetType: string;
    targetId: string;
}): Promise<{
    count: number;
    avgRating: number;
}>;
