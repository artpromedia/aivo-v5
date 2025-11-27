import { Prisma } from "@prisma/client";
import { prisma } from "./client";

const DEFAULT_REGION = "north_america";
const DEFAULT_TENANT = "demo-tenant";

function inferGradeBandFromLevel(level: number): string {
  if (!Number.isFinite(level)) return "6_8";
  if (level <= 5) return "k_5";
  if (level <= 8) return "6_8";
  return "9_12";
}

function extractJsonObject(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

// --- Learner queries -------------------------------------------------------

export async function getLearnerLearningContext(learnerId: string) {
  return prisma.learner.findUnique({
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
      plannedSessions: {
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

type LearnerContext = NonNullable<Awaited<ReturnType<typeof getLearnerLearningContext>>>;

function buildBrainProfileFromLearner(learner: LearnerContext) {
  const gradeLevel = learner.currentGrade ?? learner.gradeLevel ?? 6;
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

export async function getLearnerWithBrainProfile(learnerId: string) {
  const learner = await getLearnerLearningContext(learnerId);
  if (!learner) return null;

  return {
    ...learner,
    brainProfile: buildBrainProfileFromLearner(learner)
  };
}

export async function upsertBrainProfile(args: {
  learnerId: string;
  tenantId?: string;
  region: string;
  currentGrade: number;
  gradeBand: string;
  subjectLevels: Prisma.InputJsonValue;
  neurodiversity: Prisma.InputJsonValue;
  preferences: Prisma.InputJsonValue;
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

// --- Difficulty proposals --------------------------------------------------

export async function createDifficultyProposal(args: {
  learnerId: string;
  tenantId: string;
  subject: string;
  fromLevel: number;
  toLevel: number;
  direction: string;
  rationale: string;
  createdBy: "system" | "teacher" | "parent";
}) {
  return prisma.difficultyProposal.create({
    data: {
      learnerId: args.learnerId,
      tenantId: args.tenantId,
      subject: args.subject,
      fromLevel: args.fromLevel,
      toLevel: args.toLevel,
      direction: args.direction,
      rationale: args.rationale,
      createdBy: args.createdBy,
      status: "PENDING"
    }
  });
}

export async function listPendingProposalsForLearner(learnerId: string) {
  return prisma.difficultyProposal.findMany({
    where: {
      learnerId,
      status: "PENDING"
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function decideOnProposal(args: {
  proposalId: string;
  approve: boolean;
  decidedById: string;
  notes?: string;
}) {
  return prisma.difficultyProposal.update({
    where: { id: args.proposalId },
    data: {
      status: args.approve ? "APPROVED" : "REJECTED",
      decidedById: args.decidedById,
      decidedAt: new Date(),
      decisionNotes: args.notes ?? null
    }
  });
}

// --- Notifications ---------------------------------------------------------

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
  return prisma.extendedNotification.create({
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

export async function listNotificationsForUser(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number }
) {
  return prisma.extendedNotification.findMany({
    where: {
      recipientUserId: userId,
      status: options?.unreadOnly ? "unread" : undefined
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50
  });
}

export async function markNotificationRead(notificationId: string) {
  return prisma.extendedNotification.update({
    where: { id: notificationId },
    data: { status: "read" }
  });
}

// --- Auth helpers ----------------------------------------------------------

export async function findUserWithRolesByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: true
    }
  });

  if (!user) return null;

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

export * from "./analytics";
export * from "./content";
export * from "./experiments";
export * from "./governance";
export * from "./safety";
export * from "./sessions";
export * from "./admin";
export * from "./homework";
export * from "./regulation";
export { prisma } from "./client";
