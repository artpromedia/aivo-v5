import { prisma } from "./client";

export async function getOrCreateTenantLimits(tenantId: string) {
  let limits = await prisma.tenantLimits.findUnique({ where: { tenantId } });
  if (!limits) {
    limits = await prisma.tenantLimits.create({ data: { tenantId } });
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
  return prisma.tenantLimits.upsert({
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
  const existing = await prisma.tenantUsage.findUnique({
    where: {
      tenantId_date: {
        tenantId: args.tenantId,
        date: args.date
      }
    }
  });

  if (!existing) {
    return prisma.tenantUsage.create({
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

  return prisma.tenantUsage.update({
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
  return prisma.tenantUsage.findUnique({
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
  return prisma.auditLogEntry.create({
    data: {
      tenantId: args.tenantId,
      userId: args.userId,
      type: args.type,
      message: args.message,
      meta: args.meta as object ?? undefined
    }
  });
}
