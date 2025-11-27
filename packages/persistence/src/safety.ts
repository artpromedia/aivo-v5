import { prisma } from "./client";
import { incrementTenantUsage } from "./governance";

export async function logSafetyIncident(args: {
  tenantId: string;
  learnerId?: string;
  type: string;
  severity: "WATCH" | "CONCERN" | "CRITICAL";
  message: string;
  rawModelResponse?: string | null;
}) {
  const incident = await prisma.safetyIncident.create({
    data: {
      tenantId: args.tenantId,
      learnerId: args.learnerId ?? null,
      type: args.type,
      severity: args.severity,
      message: args.message,
      rawModelResponse: args.rawModelResponse ?? null
    }
  });

  const today = new Date().toISOString().slice(0, 10);
  await incrementTenantUsage({
    tenantId: args.tenantId,
    date: today,
    safetyIncidents: 1
  });

  return incident;
}
