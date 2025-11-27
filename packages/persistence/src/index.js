"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.getLearnerLearningContext = getLearnerLearningContext;
exports.getLearnerWithBrainProfile = getLearnerWithBrainProfile;
exports.upsertBrainProfile = upsertBrainProfile;
exports.createDifficultyProposal = createDifficultyProposal;
exports.listPendingProposalsForLearner = listPendingProposalsForLearner;
exports.decideOnProposal = decideOnProposal;
exports.createNotification = createNotification;
exports.listNotificationsForUser = listNotificationsForUser;
exports.markNotificationRead = markNotificationRead;
exports.findUserWithRolesByEmail = findUserWithRolesByEmail;
const client_1 = require("./client");
const DEFAULT_REGION = "north_america";
const DEFAULT_TENANT = "demo-tenant";
function inferGradeBandFromLevel(level) {
    if (!Number.isFinite(level))
        return "6_8";
    if (level <= 5)
        return "k_5";
    if (level <= 8)
        return "6_8";
    return "9_12";
}
function extractJsonObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
// --- Learner queries -------------------------------------------------------
async function getLearnerLearningContext(learnerId) {
    return client_1.prisma.learner.findUnique({
        where: { id: learnerId },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            brainProfile: true,
            sessions: {
                orderBy: { createdAt: "desc" },
                take: 10
            },
            progressSnapshots: {
                orderBy: { date: "desc" },
                take: 10
            }
        }
    });
}
function buildBrainProfileFromLearner(learner) {
    const gradeLevel = learner.currentGrade ?? 6;
    const gradeBand = inferGradeBandFromLevel(gradeLevel);
    const profile = learner.brainProfile;
    return {
        learnerId: learner.id,
        id: profile?.id ?? `synthetic-${learner.id}`,
        region: profile?.region ?? learner.region ?? DEFAULT_REGION,
        currentGrade: gradeLevel,
        updatedAt: profile?.updatedAt ?? learner.createdAt,
        gradeBand: profile?.gradeBand ?? gradeBand,
        subjectLevels: profile?.subjectLevels ?? [],
        neurodiversity: profile?.neurodiversity ?? {},
        preferences: profile?.preferences ?? {}
    };
}
async function getLearnerWithBrainProfile(learnerId) {
    const learner = await getLearnerLearningContext(learnerId);
    if (!learner)
        return null;
    return {
        ...learner,
        brainProfile: buildBrainProfileFromLearner(learner)
    };
}
async function upsertBrainProfile(args) {
    return client_1.prisma.brainProfile.upsert({
        where: { learnerId: args.learnerId },
        create: {
            learnerId: args.learnerId,
            region: args.region,
            currentGrade: args.currentGrade,
            gradeBand: args.gradeBand,
            subjectLevels: args.subjectLevels,
            neurodiversity: args.neurodiversity,
            preferences: args.preferences
        },
        update: {
            region: args.region,
            currentGrade: args.currentGrade,
            gradeBand: args.gradeBand,
            subjectLevels: args.subjectLevels,
            neurodiversity: args.neurodiversity,
            preferences: args.preferences,
            updatedAt: new Date()
        }
    });
}
// --- Difficulty proposals --------------------------------------------------
async function createDifficultyProposal(args) {
    return client_1.prisma.difficultyProposal.create({
        data: {
            learnerId: args.learnerId,
            tenantId: args.tenantId,
            subject: args.subject,
            fromLevel: args.fromLevel,
            toLevel: args.toLevel,
            direction: args.direction,
            rationale: args.rationale,
            createdBy: args.createdBy,
            status: "pending"
        }
    });
}
async function listPendingProposalsForLearner(learnerId) {
    return client_1.prisma.difficultyProposal.findMany({
        where: {
            learnerId,
            status: "pending"
        },
        orderBy: { createdAt: "desc" }
    });
}
async function decideOnProposal(args) {
    return client_1.prisma.difficultyProposal.update({
        where: { id: args.proposalId },
        data: {
            status: args.approve ? "approved" : "rejected",
            decidedById: args.decidedById,
            decidedAt: new Date(),
            decisionNotes: args.notes ?? null
        }
    });
}
// --- Notifications ---------------------------------------------------------
async function createNotification(args) {
    return client_1.prisma.notification.create({
        data: {
            tenantId: args.tenantId,
            learnerId: args.learnerId,
            recipientUserId: args.recipientUserId,
            audience: args.audience,
            type: args.type,
            title: args.title,
            body: args.body,
            status: "unread",
            relatedDifficultyProposalId: args.relatedDifficultyProposalId ?? null
        }
    });
}
async function listNotificationsForUser(userId, options) {
    return client_1.prisma.notification.findMany({
        where: {
            recipientUserId: userId,
            status: options?.unreadOnly ? "unread" : undefined
        },
        orderBy: { createdAt: "desc" },
        take: options?.limit ?? 50
    });
}
async function markNotificationRead(notificationId) {
    return client_1.prisma.notification.update({
        where: { id: notificationId },
        data: { status: "read" }
    });
}
// --- Auth helpers ----------------------------------------------------------
async function findUserWithRolesByEmail(email) {
    const user = await client_1.prisma.user.findUnique({
        where: { email },
        include: {
            roles: true
        }
    });
    if (!user)
        return null;
    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            tenantId: user.tenantId,
            createdAt: user.createdAt
        },
        roles: user.roles.map(r => r.role)
    };
}
// --- Re-exports from submodules --------------------------------------------
__exportStar(require("./analytics"), exports);
__exportStar(require("./content"), exports);
__exportStar(require("./experiments"), exports);
__exportStar(require("./governance"), exports);
__exportStar(require("./safety"), exports);
__exportStar(require("./sessions"), exports);
__exportStar(require("./admin"), exports);
var client_2 = require("./client");
Object.defineProperty(exports, "prisma", { enumerable: true, get: function () { return client_2.prisma; } });
