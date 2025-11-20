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
async function getLearnerWithBrainProfile(learnerId) {
    return client_1.prisma.learner.findUnique({
        where: { id: learnerId },
        include: { brainProfile: true }
    });
}
async function upsertBrainProfile(args) {
    return client_1.prisma.brainProfile.upsert({
        where: { learnerId: args.learnerId },
        create: {
            learnerId: args.learnerId,
            tenantId: args.tenantId,
            region: args.region,
            currentGrade: args.currentGrade,
            gradeBand: args.gradeBand,
            subjectLevels: args.subjectLevels,
            neurodiversity: args.neurodiversity,
            preferences: args.preferences
        },
        update: {
            tenantId: args.tenantId,
            region: args.region,
            currentGrade: args.currentGrade,
            gradeBand: args.gradeBand,
            subjectLevels: args.subjectLevels,
            neurodiversity: args.neurodiversity,
            preferences: args.preferences,
            lastUpdatedAt: new Date()
        }
    });
}
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
        }
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
async function createNotification(args) {
    // Temporary compatibility layer: Notification is not yet modeled in the
    // generated Prisma client types. Persist a JSON blob on the learner's
    // baseline assessment as an interim store so callers don't break.
    return client_1.prisma.baselineAssessment.create({
        data: {
            learnerId: args.learnerId,
            tenantId: args.tenantId,
            region: "north_america",
            grade: 0,
            subjects: [],
            items: {
                kind: "notification",
                payload: {
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
            },
            status: "draft"
        }
    });
}
async function listNotificationsForUser(userId) {
    // Temporary stub: notifications are currently stored as synthetic baseline
    // assessments with items.kind === "notification".
    const rows = await client_1.prisma.baselineAssessment.findMany({
        where: {
            items: {
                path: ["kind"],
                equals: "notification"
            }
        },
        orderBy: { createdAt: "desc" }
    });
    return rows.map((row) => row.items);
}
async function markNotificationRead(notificationId, userId) {
    // No-op stub for now; real implementation will switch to the Notification
    // model once the Prisma client is regenerated with that model.
    void notificationId;
    void userId;
    return { count: 0 };
}
// --- Auth helpers ----------------------------------------------------------
async function findUserWithRolesByEmail(email) {
    const user = await client_1.prisma.user.findUnique({
        where: { email },
        include: { tenant: true }
    });
    if (!user)
        return null;
    const assignments = await client_1.prisma.roleAssignment.findMany({
        where: { userId: user.id }
    });
    return {
        user,
        roles: assignments.map((a) => a.role)
    };
}
__exportStar(require("./analytics"), exports);
__exportStar(require("./content"), exports);
__exportStar(require("./experiments"), exports);
__exportStar(require("./governance"), exports);
__exportStar(require("./safety"), exports);
var client_2 = require("./client");
Object.defineProperty(exports, "prisma", { enumerable: true, get: function () { return client_2.prisma; } });
