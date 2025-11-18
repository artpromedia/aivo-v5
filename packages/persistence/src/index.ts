import {
  PrismaClient,
  DifficultyChangeDirection,
  DifficultyProposalStatus,
  SubjectCode,
  Region,
  GradeBand,
  BaselineStatus,
  Prisma
} from "@prisma/client";

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
  region: Region;
  currentGrade: number;
  gradeBand: GradeBand;
  subjectLevels: Prisma.InputJsonValue;
  neurodiversity: Prisma.InputJsonValue;
  preferences: Prisma.InputJsonValue;
}) {
  return prisma.learnerBrainProfile.upsert({
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

export async function createDifficultyProposal(args: {
  learnerId: string;
  tenantId: string;
  subject: SubjectCode;
  fromLevel: number;
  toLevel: number;
  direction: DifficultyChangeDirection;
  rationale: string;
  createdBy: "system" | "teacher" | "parent";
}) {
  return prisma.difficultyChangeProposal.create({
    data: {
      learnerId: args.learnerId,
      subject: args.subject,
      fromAssessedGradeLevel: args.fromLevel,
      toAssessedGradeLevel: args.toLevel,
      direction: args.direction,
      rationale: args.rationale,
      createdBy: args.createdBy,
      status: DifficultyProposalStatus.pending
    }
  });
}

export async function listPendingProposalsForLearner(learnerId: string) {
  return prisma.difficultyChangeProposal.findMany({
    where: {
      learnerId,
      status: DifficultyProposalStatus.pending
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
      status: args.approve ? DifficultyProposalStatus.approved : DifficultyProposalStatus.rejected,
      decidedByUserId: args.decidedById,
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
  // Temporary compatibility layer: Notification is not yet modeled in the
  // generated Prisma client types. Persist a JSON blob on the learner's
  // baseline assessment as an interim store so callers don't break.
  return prisma.baselineAssessment.create({
    data: {
      learnerId: args.learnerId,
      tenantId: args.tenantId,
      region: Region.north_america,
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
      status: BaselineStatus.draft
    }
  });
}

export async function listNotificationsForUser(userId: string) {
  // Temporary stub: notifications are currently stored as synthetic baseline
  // assessments with items.kind === "notification".
  const rows = await prisma.baselineAssessment.findMany({
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

export async function markNotificationRead(notificationId: string, userId: string) {
  // No-op stub for now; real implementation will switch to the Notification
  // model once the Prisma client is regenerated with that model.
  void notificationId;
  void userId;
  return { count: 0 };
}

// --- Auth helpers ----------------------------------------------------------

export async function findUserWithRolesByEmail(
  email: string
): Promise<null | { user: any; roles: string[] }> {
  const user = await (prisma as any).user.findUnique({
    where: { email },
    include: { tenant: true }
  });

  if (!user) return null;

  const assignments = await (prisma as any).roleAssignment.findMany({
    where: { userId: user.id }
  });

  return {
    user,
    roles: (assignments as any[]).map((a) => a.role as string)
  };
}
