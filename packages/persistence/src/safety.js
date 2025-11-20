"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSafetyIncident = logSafetyIncident;
const client_1 = require("./client");
const governance_1 = require("./governance");
const prismaAny = client_1.prisma;
async function logSafetyIncident(args) {
    const incident = await prismaAny.safetyIncident.create({
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
    await (0, governance_1.incrementTenantUsage)({
        tenantId: args.tenantId,
        date: today,
        safetyIncidents: 1
    });
    return incident;
}
