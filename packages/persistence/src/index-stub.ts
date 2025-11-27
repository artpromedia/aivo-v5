/**
 * @aivo/persistence - Minimal stub export
 * 
 * The full persistence layer (admin.ts, sessions.ts, etc.) requires
 * schema models that are not yet defined in prisma/schema.prisma:
 * - tenant, district, school, roleAssignment
 * - brainProfile, difficultyProposal
 * - Extended notification fields
 * 
 * This stub exports only the Prisma client for direct database access.
 * The full persistence API will be enabled once the schema is updated.
 */

export { prisma } from "./client";

// Re-export PrismaClient type for type usage
export { PrismaClient } from "@prisma/client";
