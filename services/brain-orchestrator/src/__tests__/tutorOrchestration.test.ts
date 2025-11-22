/**
 * Tutor Orchestration Service Integration Tests
 * 
 * Tests full workflow of starting session, processing input, and managing conversation
 */

import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import { getTutorOrchestrationService, TutorOrchestrationService } from "../tutorOrchestration";

describe("TutorOrchestrationService Integration", () => {
	let service: TutorOrchestrationService;
	const testSessionId = "test-session-1";
	const testLearnerId = "test-learner-1";

	beforeAll(async () => {
		service = getTutorOrchestrationService();
	});

	afterAll(async () => {
		await service.shutdown();
	});

	it("should start a tutoring session", async () => {
		await service.startSession(testSessionId, testLearnerId, {
			id: "activity-1",
			subject: "math",
			topic: "addition"
		});

		const summary = service.getSessionSummary(testSessionId);
		expect(summary).toBeDefined();
		expect(summary?.interactionCount).toBe(0);
	});

	it("should process help request and provide hint", async () => {
		const response = await service.processLearnerInput(
			testSessionId,
			"Can you help me?",
			"question"
		);

		expect(response).toBeDefined();
		expect(response.message).toBeDefined();
		expect(response.type).toBeDefined();
		expect(response.confidence).toBeGreaterThan(0);

		const summary = service.getSessionSummary(testSessionId);
		expect(summary?.interactionCount).toBe(1);
	});

	it("should set current question and evaluate answer", async () => {
		service.setCurrentQuestion(testSessionId, {
			id: "q-1",
			text: "What is 2 + 3?",
			type: "numeric",
			correctAnswer: 5
		});

		// Submit correct answer
		const response = await service.processLearnerInput(
			testSessionId,
			"5",
			"answer"
		);

		expect(response.type).toBe("encouragement");
		expect(response.emotion).toBe("excited");
	});

	it("should provide progressive hints", async () => {
		service.setCurrentQuestion(testSessionId, {
			id: "q-2",
			text: "What is 7 + 8?",
			type: "numeric",
			correctAnswer: 15
		});

		// First hint request
		const hint1 = await service.provideQuickHint(testSessionId, 0);
		expect(hint1).toBeDefined();

		// Second hint request (should be more detailed)
		const hint2 = await service.provideQuickHint(testSessionId, 1);
		expect(hint2).toBeDefined();

		const summary = service.getSessionSummary(testSessionId);
		expect(summary?.hintCount).toBeGreaterThan(0);
	});

	it("should handle frustration appropriately", async () => {
		const response = await service.handleFrustration(
			testSessionId,
			"this is too hard"
		);

		expect(response.type).toBeDefined();
		expect(response.emotion).toBe("sympathetic");

		const summary = service.getSessionSummary(testSessionId);
		expect(summary?.frustrationCount).toBeGreaterThan(0);
	});

	it("should handle confusion with clear explanation", async () => {
		const response = await service.handleConfusion(
			testSessionId,
			"addition"
		);

		expect(response.type).toBe("explanation");
		expect(response.message).toBeDefined();

		const summary = service.getSessionSummary(testSessionId);
		expect(summary?.confusionCount).toBeGreaterThan(0);
	});

	it("should track conversation history", async () => {
		const history = service.getConversationHistory(testSessionId);
		
		expect(history).toBeDefined();
		expect(history.length).toBeGreaterThan(0);
		expect(history[0].learnerInput).toBeDefined();
		expect(history[0].tutorResponse).toBeDefined();
		expect(history[0].timestamp).toBeDefined();
	});

	it("should suggest break after repeated frustration", async () => {
		// Simulate multiple frustrations
		await service.handleFrustration(testSessionId);
		await service.handleFrustration(testSessionId);

		const shouldBreak = service.shouldSuggestBreak(testSessionId);
		expect(shouldBreak).toBe(true);
	});

	it("should generate conversation insights", async () => {
		const insights = await service.getConversationInsights(testLearnerId);

		expect(insights).toBeDefined();
		expect(insights.totalInteractions).toBeGreaterThan(0);
		expect(insights.conversationQuality).toBeGreaterThanOrEqual(0);
		expect(insights.conversationQuality).toBeLessThanOrEqual(1);
		expect(insights.emotionalSupport).toBeGreaterThanOrEqual(0);
		expect(insights.emotionalSupport).toBeLessThanOrEqual(1);
		expect(insights.recommendations).toBeDefined();
	});

	it("should get session summary with metrics", async () => {
		const summary = service.getSessionSummary(testSessionId);

		expect(summary).toBeDefined();
		expect(summary?.interactionCount).toBeGreaterThan(0);
		expect(summary?.sessionDuration).toBeGreaterThan(0);
		expect(typeof summary?.frustrationCount).toBe("number");
		expect(typeof summary?.confusionCount).toBe("number");
	});

	it("should end session and cleanup", async () => {
		await service.endSession(testSessionId);

		const summary = service.getSessionSummary(testSessionId);
		expect(summary).toBeNull();
	});

	it("should handle multiple concurrent sessions", async () => {
		const session1 = "concurrent-1";
		const session2 = "concurrent-2";

		await service.startSession(session1, "learner-1", {
			id: "activity-1",
			subject: "math"
		});

		await service.startSession(session2, "learner-2", {
			id: "activity-2",
			subject: "reading"
		});

		const response1 = await service.processLearnerInput(
			session1,
			"Hello",
			"question"
		);

		const response2 = await service.processLearnerInput(
			session2,
			"Hi there",
			"question"
		);

		expect(response1).toBeDefined();
		expect(response2).toBeDefined();

		await service.endSession(session1);
		await service.endSession(session2);
	});
});

describe("TutorOrchestrationService Error Handling", () => {
	let service: TutorOrchestrationService;

	beforeAll(() => {
		service = getTutorOrchestrationService();
	});

	afterAll(async () => {
		await service.shutdown();
	});

	it("should throw error for non-existent session", async () => {
		await expect(
			service.processLearnerInput("non-existent", "Hello")
		).rejects.toThrow();
	});

	it("should return null summary for non-existent session", () => {
		const summary = service.getSessionSummary("non-existent");
		expect(summary).toBeNull();
	});

	it("should return empty history for non-existent session", () => {
		const history = service.getConversationHistory("non-existent");
		expect(history).toEqual([]);
	});
});
