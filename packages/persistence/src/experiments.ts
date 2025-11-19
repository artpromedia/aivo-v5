import { prisma } from "./client";

export async function getOrCreateExperiment(args: {
  tenantId: string;
  key: string;
  name: string;
  variants: { id: string; key: string; label: string; description?: string }[];
}) {
  const existing = await prisma.experiment.findFirst({
    where: { tenantId: args.tenantId, key: args.key }
  });
  if (existing) return existing;

  return prisma.experiment.create({
    data: {
      tenantId: args.tenantId,
      key: args.key,
      name: args.name,
      status: "running",
      variants: args.variants
    }
  });
}

export async function assignLearnerToExperiment(args: {
  learnerId: string;
  experimentId: string;
}): Promise<{ assignment: any; variantKey: string }> {
  const exp = await prisma.experiment.findUnique({
    where: { id: args.experimentId }
  });
  if (!exp) throw new Error("Experiment not found");

  const variants = exp.variants as any[];
  if (!variants.length) throw new Error("Experiment has no variants");

  // Simple deterministic assignment based on learnerId hash
  const index = Math.abs(hashString(args.learnerId)) % variants.length;
  const chosen = variants[index];

  const assignment = await prisma.experimentAssignment.upsert({
    where: {
      experimentId_learnerId: {
        experimentId: args.experimentId,
        learnerId: args.learnerId
      }
    },
    update: {
      variantKey: chosen.key
    },
    create: {
      experimentId: args.experimentId,
      learnerId: args.learnerId,
      variantKey: chosen.key
    }
  });

  return { assignment, variantKey: chosen.key };
}

export async function getAssignmentForLearner(args: {
  learnerId: string;
  experimentId: string;
}) {
  return prisma.experimentAssignment.findUnique({
    where: {
      experimentId_learnerId: {
        experimentId: args.experimentId,
        learnerId: args.learnerId
      }
    }
  });
}

export async function recordFeedback(args: {
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
}) {
  return prisma.feedback.create({
    data: {
      tenantId: args.tenantId,
      learnerId: args.learnerId,
      userId: args.userId,
      targetType: args.targetType,
      targetId: args.targetId,
      role: args.role,
      rating: args.rating,
      label: args.label,
      comment: args.comment,
      experimentKey: args.experimentKey,
      variantKey: args.variantKey
    }
  });
}

export async function aggregateFeedbackForTarget(args: {
  tenantId: string;
  targetType: string;
  targetId: string;
}) {
  const rows = await prisma.feedback.findMany({
    where: {
      tenantId: args.tenantId,
      targetType: args.targetType,
      targetId: args.targetId
    }
  });

  if (!rows.length) {
    return { count: 0, avgRating: 0 };
  }

  const count = rows.length;
  const avgRating =
    rows.reduce((sum, r) => sum + r.rating, 0) / (rows.length || 1);

  return { count, avgRating };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    // simple hash
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
