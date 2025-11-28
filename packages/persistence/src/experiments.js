'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getOrCreateExperiment = getOrCreateExperiment;
exports.assignLearnerToExperiment = assignLearnerToExperiment;
exports.getAssignmentForLearner = getAssignmentForLearner;
exports.recordFeedback = recordFeedback;
exports.aggregateFeedbackForTarget = aggregateFeedbackForTarget;
const client_1 = require('./client');
async function getOrCreateExperiment(args) {
  const existing = await client_1.prisma.experiment.findFirst({
    where: { tenantId: args.tenantId, key: args.key },
  });
  if (existing) return existing;
  return client_1.prisma.experiment.create({
    data: {
      tenantId: args.tenantId,
      key: args.key,
      name: args.name,
      status: 'running',
      variants: args.variants,
    },
  });
}
async function assignLearnerToExperiment(args) {
  const exp = await client_1.prisma.experiment.findUnique({
    where: { id: args.experimentId },
  });
  if (!exp) throw new Error('Experiment not found');
  const variants = exp.variants;
  if (!variants.length) throw new Error('Experiment has no variants');
  // Simple deterministic assignment based on learnerId hash
  const index = Math.abs(hashString(args.learnerId)) % variants.length;
  const chosen = variants[index];
  const assignment = await client_1.prisma.experimentAssignment.upsert({
    where: {
      experimentId_learnerId: {
        experimentId: args.experimentId,
        learnerId: args.learnerId,
      },
    },
    update: {
      variantKey: chosen.key,
    },
    create: {
      experimentId: args.experimentId,
      learnerId: args.learnerId,
      variantKey: chosen.key,
    },
  });
  return { assignment, variantKey: chosen.key };
}
async function getAssignmentForLearner(args) {
  return client_1.prisma.experimentAssignment.findUnique({
    where: {
      experimentId_learnerId: {
        experimentId: args.experimentId,
        learnerId: args.learnerId,
      },
    },
  });
}
async function recordFeedback(args) {
  return client_1.prisma.feedback.create({
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
      variantKey: args.variantKey,
    },
  });
}
async function aggregateFeedbackForTarget(args) {
  const rows = await client_1.prisma.feedback.findMany({
    where: {
      tenantId: args.tenantId,
      targetType: args.targetType,
      targetId: args.targetId,
    },
  });
  if (!rows.length) {
    return { count: 0, avgRating: 0 };
  }
  const count = rows.length;
  const avgRating = rows.reduce((sum, r) => sum + r.rating, 0) / (rows.length || 1);
  return { count, avgRating };
}
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    // simple hash
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
