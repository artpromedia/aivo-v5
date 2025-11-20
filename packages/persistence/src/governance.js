"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateTenantLimits = getOrCreateTenantLimits;
exports.updateTenantLimits = updateTenantLimits;
exports.incrementTenantUsage = incrementTenantUsage;
exports.getTenantUsageForDate = getTenantUsageForDate;
exports.createAuditLogEntry = createAuditLogEntry;
const client_1 = require("./client");
const prismaAny = client_1.prisma;
async function getOrCreateTenantLimits(tenantId) {
    let limits = await prismaAny.tenantLimits.findUnique({ where: { tenantId } });
    if (!limits) {
        limits = await prismaAny.tenantLimits.create({ data: { tenantId } });
    }
    return limits;
}
async function updateTenantLimits(args) {
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
async function incrementTenantUsage(args) {
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
async function getTenantUsageForDate(tenantId, date) {
    return prismaAny.tenantUsage.findUnique({
        where: {
            tenantId_date: {
                tenantId,
                date
            }
        }
    });
}
async function createAuditLogEntry(args) {
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
