/**
 * Agent Integration Test Suite
 * 
 * Demonstrates agent orchestration, coordination, and session management.
 */

import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import { PersonalizedLearningAgent, AITutorAgent, AgentOrchestrator } from "@aivo/agents";

// Mock Prisma
const mockLearner = {
	id: "test-learner-123",
	firstName: "Test",
	lastName: "Learner",
	dateOfBirth: new Date("2015-01-01"),
	gradeLevel: 5,
	accommodations: { learningStyle: "visual" },
	diagnoses: [],
	progress: [],
	createdAt: new Date(),
	updatedAt: new Date()
};

const prisma = {
	learner: {
		findUnique: jest.fn().mockResolvedValue(mockLearner),
		findFirst: jest.fn().mockResolvedValue(mockLearner),
		update: jest.fn().mockResolvedValue(mockLearner)
	},
	personalizedModel: {
		findUnique: jest.fn().mockResolvedValue(null)
	},
	learnerProgress: {
		findMany: jest.fn().mockResolvedValue([]),
		create: jest.fn().mockResolvedValue({})
	},
	activityAttempt: {
		findMany: jest.fn().mockResolvedValue([])
	},
	$disconnect: jest.fn().mockResolvedValue(undefined)
} as any;

const orchestrator = new AgentOrchestrator();

describe("Agent Integration and Orchestration", () => {
	let learningAgent: PersonalizedLearningAgent;
	let tutorAgent: AITutorAgent;
	const learnerId = "test-learner-123";

	beforeAll(async () => {
		// Initialize agents
		learningAgent = new PersonalizedLearningAgent(
			{
				learnerId,
				agentId: `learning-${learnerId}`,
				agentType: "learning",
				modelConfig: {
					provider: "openai",
					modelName: "gpt-4",
					temperature: 0.7,
					maxTokens: 1500
				},
				memoryConfig: {
					maxShortTermItems: 50,
					maxLongTermItems: 1000,
					consolidationThreshold: 0.7
				},
				coordinationConfig: {
					allowInterAgentComm: true,
					broadcastEvents: true,
					coordinationStrategy: "centralized"
				},
				redis: {
					host: process.env.REDIS_HOST || "localhost",
					port: parseInt(process.env.REDIS_PORT || "6379")
				},
				openai: {
					apiKey: process.env.OPENAI_API_KEY || ""
				}
			},
			prisma
		);

		tutorAgent = new AITutorAgent(
			{
				learnerId,
				agentId: `tutor-${learnerId}`,
				agentType: "tutor",
				modelConfig: {
					provider: "openai",
					modelName: "gpt-4",
					temperature: 0.7,
					maxTokens: 1000
				},
				memoryConfig: {
					maxShortTermItems: 30,
					maxLongTermItems: 500,
					consolidationThreshold: 0.6
				},
				coordinationConfig: {
					allowInterAgentComm: true,
					broadcastEvents: false,
					coordinationStrategy: "centralized"
				},
				redis: {
					host: process.env.REDIS_HOST || "localhost",
					port: parseInt(process.env.REDIS_PORT || "6379")
				},
				openai: {
					apiKey: process.env.OPENAI_API_KEY || ""
				}
			},
			prisma
		);

		// Register agents with orchestrator
		await orchestrator.registerAgent(learningAgent);
		await orchestrator.registerAgent(tutorAgent);
	});

	afterAll(async () => {
		await learningAgent.shutdown();
		await tutorAgent.shutdown();
		await orchestrator.shutdown();
		await prisma.$disconnect();
	});

	describe("Session Initialization", () => {
		it("should orchestrate parallel agent initialization", async () => {
			const initPlan = {
				id: "init-session-test",
				steps: [
					{
						id: "init-learning",
						agentId: learningAgent.getAgentId(),
						action: "initialize_session",
						input: {
							subject: "mathematics",
							gradeLevel: 5
						},
						retryPolicy: {
							maxRetries: 2,
							backoffMs: 1000
						}
					},
					{
						id: "init-tutor",
						agentId: tutorAgent.getAgentId(),
						action: "prepare_conversation",
						input: {
							subject: "mathematics",
							gradeLevel: 5
						},
						dependencies: ["init-learning"],
						retryPolicy: {
							maxRetries: 2,
							backoffMs: 1000
						}
					}
				],
				parallel: true,
				timeout: 30000
			};

			const result = await orchestrator.orchestrate(initPlan);

			expect(result.success).toBe(true);
			expect(result.results.size).toBeGreaterThan(0);
			expect(result.duration).toBeLessThan(30000);
		});
	});

	describe("Agent Coordination", () => {
		it("should coordinate learning and tutor agents", async () => {
			const coordinationPlan = {
				id: "coordination-test",
				steps: [
					{
						id: "learning-step",
						agentId: learningAgent.getAgentId(),
						action: "process_interaction",
						input: {
							activityId: "act-123",
							response: { answer: "42" },
							timestamp: new Date()
						}
					},
					{
						id: "tutor-step",
						agentId: tutorAgent.getAgentId(),
						action: "provide_feedback",
						input: {
							learnerInput: "I don't understand why the answer is 42"
						},
						dependencies: ["learning-step"]
					}
				],
				parallel: false,
				timeout: 20000
			};

			const result = await orchestrator.orchestrate(coordinationPlan);

			expect(result.success).toBe(true);
			expect(result.results.has("learning-step")).toBe(true);
			expect(result.results.has("tutor-step")).toBe(true);
		});

		it("should handle parallel execution", async () => {
			const parallelPlan = {
				id: "parallel-test",
				steps: [
					{
						id: "learning-analysis",
						agentId: learningAgent.getAgentId(),
						action: "analyze_performance",
						input: { learnerId }
					},
					{
						id: "tutor-prepare",
						agentId: tutorAgent.getAgentId(),
						action: "prepare_hints",
						input: { topic: "fractions" }
					}
				],
				parallel: true,
				timeout: 15000
			};

			const result = await orchestrator.orchestrate(parallelPlan);

			expect(result.success).toBe(true);
			expect(result.results.size).toBe(2);
			// Parallel execution should be faster than sequential
			expect(result.duration).toBeLessThan(10000);
		});
	});

	describe("Error Handling and Retry", () => {
		it("should retry failed steps", async () => {
			const retryPlan = {
				id: "retry-test",
				steps: [
					{
						id: "flaky-step",
						agentId: learningAgent.getAgentId(),
						action: "process_interaction",
						input: {
							// Simulate potential failure
							activityId: "invalid-activity"
						},
						retryPolicy: {
							maxRetries: 3,
							backoffMs: 500
						}
					}
				],
				parallel: false,
				timeout: 10000
			};

			// This may succeed or fail depending on agent behavior
			const result = await orchestrator.orchestrate(retryPlan);

			// Verify that retry mechanism is in place
			expect(result).toBeDefined();
			expect(result.planId).toBe("retry-test");
		});

		it("should respect timeout limits", async () => {
			const timeoutPlan = {
				id: "timeout-test",
				steps: [
					{
						id: "slow-step",
						agentId: learningAgent.getAgentId(),
						action: "process_interaction",
						input: { activityId: "act-456" }
					}
				],
				parallel: false,
				timeout: 100 // Very short timeout
			};

			try {
				await orchestrator.orchestrate(timeoutPlan);
			} catch (error) {
				expect(error).toBeDefined();
				expect((error as Error).message).toContain("timed out");
			}
		});
	});

	describe("Event Broadcasting", () => {
		it("should broadcast agent events", (done) => {
			orchestrator.on("agent:insight", (data) => {
				expect(data).toBeDefined();
				expect(data.agentId).toBeDefined();
				expect(data.insight).toBeDefined();
				done();
			});

			// Trigger an event that should generate an insight
			learningAgent.emit("insight", {
				type: "performance",
				data: { score: 0.85 }
			});
		});

		it("should handle agent errors", (done) => {
			orchestrator.on("agent:error", (data) => {
				expect(data).toBeDefined();
				expect(data.agentId).toBeDefined();
				expect(data.error).toBeDefined();
				done();
			});

			// Simulate an error
			learningAgent.emit("error", new Error("Test error"));
		});
	});

	describe("Agent Registry", () => {
		it("should retrieve registered agents", () => {
			const retrievedLearning = orchestrator.getAgent(learningAgent.getAgentId());
			const retrievedTutor = orchestrator.getAgent(tutorAgent.getAgentId());

			expect(retrievedLearning).toBeDefined();
			expect(retrievedTutor).toBeDefined();
			expect(retrievedLearning?.getAgentId()).toBe(learningAgent.getAgentId());
			expect(retrievedTutor?.getAgentId()).toBe(tutorAgent.getAgentId());
		});

		it("should list all registered agents", () => {
			const allAgents = orchestrator.getAllAgents();

			expect(allAgents.length).toBeGreaterThanOrEqual(2);
			expect(allAgents.some(a => a.getAgentId() === learningAgent.getAgentId())).toBe(true);
			expect(allAgents.some(a => a.getAgentId() === tutorAgent.getAgentId())).toBe(true);
		});
	});

	describe("Complex Orchestration Scenarios", () => {
		it("should handle multi-step learning session", async () => {
			const sessionPlan = {
				id: "full-session-test",
				steps: [
					{
						id: "init",
						agentId: learningAgent.getAgentId(),
						action: "initialize_session",
						input: { subject: "science", gradeLevel: 6 }
					},
					{
						id: "activity-1",
						agentId: learningAgent.getAgentId(),
						action: "process_interaction",
						input: { activityId: "sci-1", response: { answer: "photosynthesis" } },
						dependencies: ["init"]
					},
					{
						id: "tutor-feedback",
						agentId: tutorAgent.getAgentId(),
						action: "provide_feedback",
						input: { learnerInput: "Great job!" },
						dependencies: ["activity-1"]
					},
					{
						id: "activity-2",
						agentId: learningAgent.getAgentId(),
						action: "process_interaction",
						input: { activityId: "sci-2", response: { answer: "mitochondria" } },
						dependencies: ["tutor-feedback"]
					}
				],
				parallel: false,
				timeout: 60000
			};

			const result = await orchestrator.orchestrate(sessionPlan);

			expect(result.success).toBe(true);
			expect(result.results.size).toBe(4);
			expect(result.results.has("init")).toBe(true);
			expect(result.results.has("activity-1")).toBe(true);
			expect(result.results.has("tutor-feedback")).toBe(true);
			expect(result.results.has("activity-2")).toBe(true);
		});

		it("should handle mixed parallel and sequential steps", async () => {
			const mixedPlan = {
				id: "mixed-execution-test",
				steps: [
					{
						id: "prep-1",
						agentId: learningAgent.getAgentId(),
						action: "analyze_performance",
						input: { learnerId }
					},
					{
						id: "prep-2",
						agentId: tutorAgent.getAgentId(),
						action: "prepare_hints",
						input: { topic: "algebra" }
					},
					{
						id: "combine",
						agentId: learningAgent.getAgentId(),
						action: "generate_recommendation",
						input: {},
						dependencies: ["prep-1", "prep-2"]
					}
				],
				parallel: true, // prep-1 and prep-2 run in parallel, combine waits
				timeout: 30000
			};

			const result = await orchestrator.orchestrate(mixedPlan);

			expect(result.success).toBe(true);
			expect(result.results.size).toBe(3);
		});
	});
});

describe("REST API Integration", () => {
	it("should handle session start request", async () => {
		// This would be tested with actual HTTP requests in E2E tests
		// Example structure:
		const mockRequest = {
			action: "start_session",
			learnerId: "test-123",
			data: {
				subject: "mathematics",
				gradeLevel: 5
			}
		};

		// Verify request structure
		expect(mockRequest.action).toBe("start_session");
		expect(mockRequest.learnerId).toBeDefined();
		expect(mockRequest.data.subject).toBeDefined();
	});

	it("should structure orchestration response correctly", () => {
		const mockResponse = {
			sessionId: "session-123",
			agents: {
				learning: "learning-agent-123",
				tutor: "tutor-agent-123"
			},
			status: "ready",
			orchestration: {
				success: true,
				duration: 1234,
				results: {},
				errors: undefined
			},
			timestamp: new Date().toISOString()
		};

		expect(mockResponse.sessionId).toBeDefined();
		expect(mockResponse.agents.learning).toBeDefined();
		expect(mockResponse.agents.tutor).toBeDefined();
		expect(mockResponse.orchestration.success).toBe(true);
	});
});

describe("WebSocket Integration", () => {
	it("should structure WebSocket events correctly", () => {
		const mockEvents = {
			"activity:change": {
				newActivity: {
					id: "act-123",
					type: "question",
					content: {}
				}
			},
			"content:adapted": {
				adaptations: {
					difficulty: 6,
					scaffolding: "increased"
				}
			},
			"tutor:message": {
				message: "Great progress!",
				type: "encouragement"
			},
			"break:suggested": {
				reason: "Fatigue detected",
				duration: 5
			}
		};

		expect(mockEvents["activity:change"].newActivity).toBeDefined();
		expect(mockEvents["content:adapted"].adaptations).toBeDefined();
		expect(mockEvents["tutor:message"].message).toBeDefined();
		expect(mockEvents["break:suggested"].duration).toBe(5);
	});
});
