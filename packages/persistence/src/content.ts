import { prisma } from "./client";

export async function listCurriculumTopicsForTenant(tenantId: string) {
  return prisma.curriculumTopic.findMany({
    where: { tenantId },
    orderBy: [{ subject: "asc" }, { grade: "asc" }, { title: "asc" }]
  });
}

export async function createCurriculumTopic(args: {
  tenantId: string;
  subject: string;
  grade: number;
  region: string;
  standard: string;
  code?: string;
  title: string;
  description?: string;
}) {
  return prisma.curriculumTopic.create({
    data: {
      tenantId: args.tenantId,
      subject: args.subject,
      grade: args.grade,
      region: args.region,
      standard: args.standard,
      code: args.code,
      title: args.title,
      description: args.description
    }
  });
}

export async function updateCurriculumTopic(
  id: string,
  updates: {
    title?: string;
    description?: string;
    code?: string | null;
  }
) {
  return prisma.curriculumTopic.update({
    where: { id },
    data: {
      ...updates,
      updatedAt: new Date()
    }
  });
}

export async function listContentItemsForTopic(topicId: string) {
  return prisma.contentItem.findMany({
    where: { topicId },
    orderBy: [{ type: "asc" }, { createdAt: "desc" }]
  });
}

export async function createContentItem(args: {
  tenantId: string;
  topicId: string;
  subject: string;
  grade: number;
  type: string;
  title: string;
  body: string;
  questionFormat?: string;
  options?: Record<string, any>;
  correctAnswer?: string;
  accessibilityNotes?: string;
  status: string;
  createdByUserId: string;
  aiGenerated?: boolean;
  aiModel?: string;
}) {
  return prisma.contentItem.create({
    data: {
      tenantId: args.tenantId,
      topicId: args.topicId,
      subject: args.subject,
      grade: args.grade,
      type: args.type,
      title: args.title,
      body: args.body,
      questionFormat: args.questionFormat,
      options: args.options as any,
      correctAnswer: args.correctAnswer,
      accessibilityNotes: args.accessibilityNotes,
      status: args.status,
      createdByUserId: args.createdByUserId,
      aiGenerated: args.aiGenerated ?? false,
      aiModel: args.aiModel
    }
  });
}

export async function updateContentItem(
  id: string,
  updates: {
    title?: string;
    body?: string;
    status?: string;
    questionFormat?: string | null;
    options?: Record<string, any>;
    correctAnswer?: string | null;
    accessibilityNotes?: string | null;
  }
) {
  return prisma.contentItem.update({
    where: { id },
    data: {
      ...updates,
      options: updates.options as any,
      updatedAt: new Date()
    }
  });
}
