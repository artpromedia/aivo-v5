import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function getLearnerWithBrainProfile(learnerId: string) {
  return prisma.learner.findUnique({
    where: { id: learnerId },
    include: { brainProfile: true }
  });
}

export async function upsertBrainProfile(args: {
  learnerId: string;
  tenantId: string;
  region: string;
  currentGrade: number;
  gradeBand: string;
  subjectLevels: unknown;
  neurodiversity: unknown;
  preferences: unknown;
}) {
  return prisma.brainProfile.upsert({
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

export async function createDifficultyProposal(args: {
  learnerId: string;
  tenantId: string;
  subject: string;
  fromLevel: number;
  toLevel: number;
  direction: "easier" | "harder";
  rationale: string;
  createdBy: "system" | "teacher" | "parent";
}) {
  return prisma.difficultyChangeProposal.create({
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

export async function listPendingProposalsForLearner(learnerId: string) {
  return prisma.difficultyChangeProposal.findMany({
    where: {
      learnerId,
      status: "pending"
    }
  });
}

export async function decideOnProposal(args: {
  proposalId: string;
  approve: boolean;
  decidedById: string;
  notes?: string;
}) {
  return prisma.difficultyChangeProposal.update({
    where: { id: args.proposalId },
    data: {
      status: args.approve ? "approved" : "rejected",
      decidedById: args.decidedById,
      decidedAt: new Date(),
      decisionNotes: args.notes
    }
  });
}

export async function createNotification(args: {
  tenantId: string;
  learnerId: string;
  recipientUserId: string;
  audience: string;
  type: string;
  title: string;
  body: string;
  relatedDifficultyProposalId?: string;
}) {
  return prisma.notification.create({
    data: {
      tenantId: args.tenantId,
      learnerId: args.learnerId,
      recipientUserId: args.recipientUserId,
      audience: args.audience,
      type: args.type,
      title: args.title,
      body: args.body,
      status: "unread",
      relatedDifficultyProposalId: args.relatedDifficultyProposalId
    }
  });
}

export async function listNotificationsForUser(userId: string) {
  return prisma.notification.findMany({
    where: { recipientUserId: userId },
    orderBy: { createdAt: "desc" }
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      recipientUserId: userId
    },
    data: {
      status: "read"
    }
  });
}
