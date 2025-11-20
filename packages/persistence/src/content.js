"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCurriculumTopicsForTenant = listCurriculumTopicsForTenant;
exports.createCurriculumTopic = createCurriculumTopic;
exports.updateCurriculumTopic = updateCurriculumTopic;
exports.listContentItemsForTopic = listContentItemsForTopic;
exports.createContentItem = createContentItem;
exports.updateContentItem = updateContentItem;
const client_1 = require("./client");
async function listCurriculumTopicsForTenant(tenantId) {
    return client_1.prisma.curriculumTopic.findMany({
        where: { tenantId },
        orderBy: [{ subject: "asc" }, { grade: "asc" }, { title: "asc" }]
    });
}
async function createCurriculumTopic(args) {
    return client_1.prisma.curriculumTopic.create({
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
async function updateCurriculumTopic(id, updates) {
    return client_1.prisma.curriculumTopic.update({
        where: { id },
        data: {
            ...updates,
            updatedAt: new Date()
        }
    });
}
async function listContentItemsForTopic(topicId) {
    return client_1.prisma.contentItem.findMany({
        where: { topicId },
        orderBy: [{ type: "asc" }, { createdAt: "desc" }]
    });
}
async function createContentItem(args) {
    return client_1.prisma.contentItem.create({
        data: {
            tenantId: args.tenantId,
            topicId: args.topicId,
            subject: args.subject,
            grade: args.grade,
            type: args.type,
            title: args.title,
            body: args.body,
            questionFormat: args.questionFormat,
            options: args.options,
            correctAnswer: args.correctAnswer,
            accessibilityNotes: args.accessibilityNotes,
            status: args.status,
            createdByUserId: args.createdByUserId,
            aiGenerated: args.aiGenerated ?? false,
            aiModel: args.aiModel
        }
    });
}
async function updateContentItem(id, updates) {
    return client_1.prisma.contentItem.update({
        where: { id },
        data: {
            ...updates,
            options: updates.options,
            updatedAt: new Date()
        }
    });
}
