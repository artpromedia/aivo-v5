"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AivoApiClient = void 0;
class AivoApiClient {
    baseUrl;
    getToken;
    constructor(baseUrl, getToken) {
        this.baseUrl = baseUrl;
        this.getToken = getToken;
    }
    async request(path, options = {}) {
        const token = this.getToken ? await this.getToken() : null;
        const res = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(options.headers || {})
            }
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`API error ${res.status}: ${text}`);
        }
        return res.json();
    }
    // Auth
    me() {
        return this.request("/me");
    }
    // Learners
    createLearner(body) {
        return this.request("/learners", {
            method: "POST",
            body: JSON.stringify(body)
        });
    }
    getLearner(learnerId) {
        return this.request(`/learners/${learnerId}`);
    }
    // Baseline
    generateBaseline(body) {
        return this.request("/baseline/generate", {
            method: "POST",
            body: JSON.stringify(body)
        });
    }
    submitBaselineResponses(body) {
        return this.request("/baseline/submit", {
            method: "POST",
            body: JSON.stringify(body)
        });
    }
    // Difficulty proposals
    createDifficultyProposal(body) {
        return this.request("/difficulty/proposals", {
            method: "POST",
            body: JSON.stringify(body)
        });
    }
    decideOnDifficultyProposal(body) {
        return this.request(`/difficulty/proposals/${body.proposalId}/decision`, {
            method: "POST",
            body: JSON.stringify({ approve: body.approve, notes: body.notes })
        });
    }
    listDifficultyProposals(learnerId) {
        const search = new URLSearchParams({ learnerId });
        return this.request(`/difficulty/proposals?${search.toString()}`);
    }
    // Lessons
    generateLessonPlan(body) {
        return this.request("/lessons/generate", {
            method: "POST",
            body: JSON.stringify(body)
        });
    }
    // Admin: platform-level
    listTenants() {
        return this.request("/admin/tenants");
    }
    getTenantConfig(tenantId) {
        return this.request(`/admin/tenants/${tenantId}`);
    }
    // Admin: district-level
    listDistricts(tenantId) {
        return this.request(`/admin/tenants/${tenantId}/districts`);
    }
    listSchools(tenantId, districtId) {
        const search = new URLSearchParams({ ...(districtId ? { districtId } : {}) });
        const query = search.toString();
        const suffix = query ? `?${query}` : "";
        return this.request(`/admin/tenants/${tenantId}/schools${suffix}`);
    }
    listRoleAssignments(tenantId) {
        return this.request(`/admin/tenants/${tenantId}/roles`);
    }
    // Governance
    getTenantLimits(tenantId) {
        return this.request(`/governance/tenants/${tenantId}/limits`);
    }
    updateTenantLimits(tenantId, body) {
        return this.request(`/governance/tenants/${tenantId}/limits`, {
            method: "PUT",
            body: JSON.stringify(body)
        });
    }
    listAuditLogs(tenantId) {
        const search = new URLSearchParams({ tenantId });
        return this.request(`/governance/audit?${search.toString()}`);
    }
    listTenantUsage(tenantId) {
        const search = new URLSearchParams({ tenantId });
        return this.request(`/governance/usage?${search.toString()}`);
    }
    // Sessions
    getTodaySession(learnerId, subject) {
        const search = new URLSearchParams({ learnerId, subject });
        return this.request(`/sessions/today?${search.toString()}`);
    }
    startSession(body) {
        return this.request("/sessions/start", {
            method: "POST",
            body: JSON.stringify(body)
        });
    }
    updateActivityStatus(body) {
        return this.request(`/sessions/${body.sessionId}/activities/${body.activityId}`, {
            method: "PATCH",
            body: JSON.stringify({ status: body.status })
        });
    }
    planSession(body) {
        return this.request("/sessions/plan", {
            method: "POST",
            body: JSON.stringify(body)
        });
    }
    // Caregiver views
    getCaregiverLearnerOverview(learnerId) {
        return this.request(`/caregiver/learners/${learnerId}/overview`);
    }
    listNotifications() {
        return this.request("/caregiver/notifications");
    }
    markNotificationRead(notificationId) {
        return this.request(`/caregiver/notifications/${notificationId}/read`, {
            method: "POST"
        });
    }
    respondToDifficultyProposal(body) {
        return this.request(`/difficulty/proposals/${body.proposalId}/decision`, {
            method: "POST",
            body: JSON.stringify({ approve: body.decision === "approve" })
        });
    }
    // Analytics
    getLearnerAnalytics(learnerId) {
        return this.request(`/analytics/learners/${learnerId}`);
    }
    getTenantAnalytics(tenantId) {
        return this.request(`/analytics/tenants/${tenantId}`);
    }
    // Curriculum topics
    listCurriculumTopics() {
        return this.request("/content/topics");
    }
    createCurriculumTopic(body) {
        return this.request("/content/topics", {
            method: "POST",
            body: JSON.stringify(body)
        });
    }
    updateCurriculumTopic(body) {
        return this.request(`/content/topics/${body.topicId}`, {
            method: "PATCH",
            body: JSON.stringify({
                title: body.title,
                description: body.description,
                code: body.code
            })
        });
    }
    // Content items
    listContentItems(topicId) {
        const search = new URLSearchParams({ topicId });
        return this.request(`/content/items?${search.toString()}`);
    }
    createContentItem(body) {
        return this.request("/content/items", {
            method: "POST",
            body: JSON.stringify(body)
        });
    }
    updateContentItem(body) {
        return this.request(`/content/items/${body.itemId}`, {
            method: "PATCH",
            body: JSON.stringify({
                title: body.title,
                body: body.body,
                status: body.status,
                questionFormat: body.questionFormat,
                options: body.options,
                correctAnswer: body.correctAnswer,
                accessibilityNotes: body.accessibilityNotes
            })
        });
    }
    // AI-assisted content generation
    generateDraftContent(body) {
        return this.request("/content/generate-draft", {
            method: "POST",
            body: JSON.stringify(body)
        });
    }
    // Feedback & evaluation
    recordFeedback(body) {
        return this.request("/feedback", {
            method: "POST",
            body: JSON.stringify(body)
        });
    }
    getFeedbackAggregate(targetType, targetId) {
        const search = new URLSearchParams({ targetType, targetId });
        return this.request(`/feedback/aggregate?${search.toString()}`);
    }
}
exports.AivoApiClient = AivoApiClient;
