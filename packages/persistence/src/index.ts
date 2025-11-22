import {
  ApprovalStatus,
  ApprovalType,
  PersonalizedModelStatus,
  Prisma,
  Role
} from "@prisma/client";
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

export async function getLearnerLearningContext(learnerId: string) {
  return prisma.learner.findUnique({
    where: { id: learnerId },
    include: {
      guardian: {
        select: {
          id: true,
          username: true,
          profile: true
        }
      },
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          profile: true
        }
      },
      learningModel: true,
      assessments: {
        orderBy: { createdAt: "desc" },
        take: 10
      },
      focusData: {
        orderBy: { timestamp: "desc" },
        take: 10
      },
      progress: {
        orderBy: { date: "desc" },
        take: 10
      }
    }
  });
}

type LearnerContext = NonNullable<Awaited<ReturnType<typeof getLearnerLearningContext>>>;

function buildBrainProfileFromLearner(learner: LearnerContext) {
  const gradeLevel = learner.actualLevel ?? learner.gradeLevel ?? 6;
  const gradeBand = inferGradeBandFromLevel(gradeLevel);
  const config = extractJsonObject(learner.learningModel?.configuration ?? null);
  const subjectLevels = Array.isArray((config as any).subjectLevels)
    ? ((config as any).subjectLevels as Prisma.JsonValue)
    : [];

  return {
    learnerId: learner.id,
    id: learner.learningModel?.id ?? `synthetic-${learner.id}`,
    region: (config.region as string) ?? DEFAULT_REGION,
    currentGrade: gradeLevel,
    updatedAt: learner.learningModel?.updatedAt ?? learner.updatedAt,
    gradeBand,
    subjectLevels,
    neurodiversity: (config.neurodiversity as Prisma.JsonValue) ?? {},
    preferences: (config.preferences as Prisma.JsonValue) ?? {}
  };
}

export async function getLearnerWithBrainProfile(learnerId: string) {
  const learner = await getLearnerLearningContext(learnerId);
  if (!learner) return null;

  return {
    ...learner,
    tenantId: DEFAULT_TENANT,
    displayName: `${learner.firstName} ${learner.lastName}`.trim(),
    currentGrade: learner.gradeLevel,
    ownerId: learner.guardianId,
    brainProfile: buildBrainProfileFromLearner(learner)
  } as LearnerContext & {
    tenantId: string;
    displayName: string;
    currentGrade: number;
    ownerId: string;
    brainProfile: ReturnType<typeof buildBrainProfileFromLearner>;
  };
}

export async function upsertPersonalizedModel(args: {
  learnerId: string;
  modelId?: string | null;
  systemPrompt?: string | null;
  vectorStoreId?: string | null;
  configuration?: Prisma.InputJsonValue;
  status?: PersonalizedModelStatus;
  performanceMetrics?: Prisma.InputJsonValue;
  lastTrainedAt?: Date | null;
}) {
  return prisma.personalizedModel.upsert({
    where: { learnerId: args.learnerId },
    create: {
      learnerId: args.learnerId,
      modelId: args.modelId ?? `model-${args.learnerId}`,
      systemPrompt:
        args.systemPrompt ??
        "You are a personalized learning companion who adapts to the learner's current needs.",
      vectorStoreId: args.vectorStoreId ?? null,
      configuration: args.configuration ?? {},
  status: args.status ?? PersonalizedModelStatus.TRAINING,
      performanceMetrics: args.performanceMetrics ?? Prisma.JsonNull,
      lastTrainedAt: args.lastTrainedAt ?? null
    },
    update: {
      modelId: args.modelId ?? undefined,
      systemPrompt: args.systemPrompt ?? undefined,
      vectorStoreId: args.vectorStoreId ?? undefined,
      configuration: args.configuration ?? undefined,
  status: args.status ?? undefined,
      performanceMetrics: args.performanceMetrics ?? undefined,
      lastTrainedAt: args.lastTrainedAt ?? undefined,
      updatedAt: new Date()
    }
  });
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
  return upsertPersonalizedModel({
    learnerId: args.learnerId,
    configuration: {
      region: args.region,
      currentGrade: args.currentGrade,
      gradeBand: args.gradeBand,
      subjectLevels: args.subjectLevels,
      neurodiversity: args.neurodiversity,
      preferences: args.preferences,
      tenantId: args.tenantId ?? DEFAULT_TENANT
    }
  });
}

export async function createApprovalRequest(args: {
  learnerId: string;
  requesterId: string;
  approverId: string;
  type: ApprovalType;
  details: Prisma.InputJsonValue;
  comments?: string;
}) {
  return prisma.approvalRequest.create({
    data: {
      learnerId: args.learnerId,
      requesterId: args.requesterId,
      approverId: args.approverId,
      type: args.type,
      status: ApprovalStatus.PENDING,
      details: args.details,
      comments: args.comments ?? null
    }
  });
}

export async function createDifficultyProposal(args: {
  learnerId: string;
  requesterId: string;
  approverId: string;
  subject: string;
  fromLevel: number;
  toLevel: number;
  direction: string;
  rationale: string;
  createdBy: "system" | "teacher" | "parent";
}) {
  return createApprovalRequest({
    learnerId: args.learnerId,
    requesterId: args.requesterId,
    approverId: args.approverId,
    type: "DIFFICULTY_CHANGE",
    details: {
      subject: args.subject,
      fromLevel: args.fromLevel,
      toLevel: args.toLevel,
      direction: args.direction,
      rationale: args.rationale,
      createdBy: args.createdBy
    }
  });
}

export async function listApprovalRequests(filters?: {
  learnerId?: string;
  approverId?: string;
  status?: ApprovalStatus;
  limit?: number;
}) {
  return prisma.approvalRequest.findMany({
    where: {
      learnerId: filters?.learnerId,
      approverId: filters?.approverId,
      status: filters?.status
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit
  });
}

export async function listPendingProposalsForLearner(learnerId: string) {
  return listApprovalRequests({ learnerId, status: "PENDING" });
}

export async function decideOnApprovalRequest(args: {
  approvalRequestId: string;
  approverId: string;
  status: "APPROVED" | "REJECTED" | "EXPIRED";
  comments?: string;
}) {
  return prisma.approvalRequest.update({
    where: { id: args.approvalRequestId },
    data: {
      approverId: args.approverId,
      status: args.status,
      comments: args.comments ?? undefined,
      decidedAt: new Date()
    }
  });
}

export async function decideOnProposal(args: {
  proposalId: string;
  approve: boolean;
  decidedById: string;
  notes?: string;
}) {
  return decideOnApprovalRequest({
    approvalRequestId: args.proposalId,
    approverId: args.decidedById,
    status: args.approve ? "APPROVED" : "REJECTED",
    comments: args.notes
  });
}

export async function createNotification(args: {
  tenantId?: string;
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
      userId: args.recipientUserId,
      learnerId: args.learnerId,
      type: args.type,
      title: args.title,
      message: args.body,
      data: {
        tenantId: args.tenantId ?? DEFAULT_TENANT,
        audience: args.audience,
        relatedDifficultyProposalId: args.relatedDifficultyProposalId ?? null
      },
      read: false,
      createdAt: new Date()
    }
  });
}

export async function listNotificationsForUser(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number }
) {
  const rows = await prisma.notification.findMany({
    where: {
      userId,
      read: options?.unreadOnly ? false : undefined
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50
  });

  return rows.map((row) => {
    const data = extractJsonObject(row.data ?? null);
    return {
      id: row.id,
      learnerId: row.learnerId ?? data.learnerId ?? null,
      tenantId: data.tenantId ?? DEFAULT_TENANT,
      recipientUserId: row.userId,
      audience: data.audience ?? "parent",
      type: row.type,
      title: row.title,
      body: row.message,
      createdAt: row.createdAt,
      status: row.read ? "read" : "unread",
      relatedDifficultyProposalId: data.relatedDifficultyProposalId ?? undefined
    };
  });
}

export async function markNotificationRead(args: { notificationId: string; userId: string }) {
  return prisma.notification.updateMany({
    where: {
      id: args.notificationId,
      userId: args.userId
    },
    data: {
      read: true
    }
  });
}

// --- Auth helpers ----------------------------------------------------------

export async function findUserWithRolesByEmail(email: string): Promise<
  | null
  | {
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
    }
> {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) return null;

  return {
    user,
    roles: [user.role]
  };
}

export * from "./analytics";
export * from "./content";
export * from "./experiments";
export * from "./governance";
export * from "./safety";
export { prisma } from "./client";
