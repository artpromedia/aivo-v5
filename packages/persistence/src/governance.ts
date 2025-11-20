import { prisma } from "./client";

const prismaAny = prisma as any;

export async function getOrCreateTenantLimits(tenantId: string) {
  let limits = await prismaAny.tenantLimits.findUnique({ where: { tenantId } });
  if (!limits) {
    limits = await prismaAny.tenantLimits.create({ data: { tenantId } });
  }
  return limits;
}

export async function updateTenantLimits(args: {
  tenantId: string;
  maxDailyLlmCalls?: number | null;
  maxDailyTutorTurns?: number | null;
  allowedProviders?: string[] | null;
  blockedProviders?: string[] | null;
}) {
  return prismaAny.tenantLimits.upsert({
    where: { tenantId: args.tenantId },
    create: {
      tenantId: args.tenantId,
      maxDailyLlmCalls: args.maxDailyLlmCalls ?? undefined,
      maxDailyTutorTurns: args.maxDailyTutorTurns ?? undefined,
      allowedProviders: args.allowedProviders ?? undefined,
      blockedProviders: args.blockedProviders ?? undefined
    },
    update: {
      maxDailyLlmCalls: args.maxDailyLlmCalls ?? undefined,
      maxDailyTutorTurns: args.maxDailyTutorTurns ?? undefined,
      allowedProviders: args.allowedProviders ?? undefined,
      blockedProviders: args.blockedProviders ?? undefined
    }
  });
}

export async function incrementTenantUsage(args: {
  tenantId: string;
  date: string;
  llmCalls?: number;
  tutorTurns?: number;
  sessionsPlanned?: number;
  safetyIncidents?: number;
}) {
  const existing = await prismaAny.tenantUsage.findUnique({
    where: {
      tenantId_date: {
        tenantId: args.tenantId,
        date: args.date
      }
    }
  });

  if (!existing) {
  return prismaAny.tenantUsage.create({
      data: {
        tenantId: args.tenantId,
        date: args.date,
        llmCalls: args.llmCalls ?? 0,
        tutorTurns: args.tutorTurns ?? 0,
        sessionsPlanned: args.sessionsPlanned ?? 0,
        safetyIncidents: args.safetyIncidents ?? 0
      }
    });
  }

  return prismaAny.tenantUsage.update({
    where: {
      tenantId_date: {
        tenantId: args.tenantId,
        date: args.date
      }
    },
    data: {
      llmCalls: existing.llmCalls + (args.llmCalls ?? 0),
      tutorTurns: existing.tutorTurns + (args.tutorTurns ?? 0),
      sessionsPlanned: existing.sessionsPlanned + (args.sessionsPlanned ?? 0),
      safetyIncidents: existing.safetyIncidents + (args.safetyIncidents ?? 0)
    }
  });
}

export async function getTenantUsageForDate(tenantId: string, date: string) {
  return prismaAny.tenantUsage.findUnique({
    where: {
      tenantId_date: {
        tenantId,
        date
      }
    }
  });
}

export async function createAuditLogEntry(args: {
  tenantId: string;
  userId: string;
  type: string;
  message: string;
  meta?: unknown;
}) {
  return prismaAny.auditLogEntry.create({
    data: {
      tenantId: args.tenantId,
      userId: args.userId,
      type: args.type,
      message: args.message,
      meta: args.meta ?? undefined
    }
  });
}
