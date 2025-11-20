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
    tenantId: string;
    name: string;
    id: string;
    createdAt: Date;
    status: string;
    updatedAt: Date;
    description: string | null;
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
    learnerId: string;
    id: string;
    variantKey: string;
    experimentId: string;
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
    targetType: string;
    learnerId: string | null;
    tenantId: string;
    targetId: string;
    userId: string | null;
    id: string;
    createdAt: Date;
    role: string;
    rating: number;
    label: string | null;
    comment: string | null;
    experimentKey: string | null;
    variantKey: string | null;
}>;
export declare function aggregateFeedbackForTarget(args: {
    tenantId: string;
    targetType: string;
    targetId: string;
}): Promise<{
    count: number;
    avgRating: number;
}>;
