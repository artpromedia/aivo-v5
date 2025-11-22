import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import {
	PersonalizedLearningAgent,
	type LearningContext,
	type PerformanceMetrics,
	type LearningDecision
} from "../PersonalizedLearningAgent";
import type { AgentConfig } from "../lib/agents/base/AgentFramework";
import type { PrismaClient } from "@prisma/client";

// Type guard for response data
interface AgentResponseData {
	decision: LearningDecision;
	feedback: string;
	analysis: any;
	modelPrediction: any;
}

function isAgentResponseData(data: unknown): data is AgentResponseData {
	return typeof data === "object" && data !== null && "decision" in data;
}

// Mock Prisma Client
const mockPrismaClient = {
	learner: {
		findUnique: jest.fn()
	}
} as unknown as PrismaClient;

describe("PersonalizedLearningAgent", () => {
	let agent: PersonalizedLearningAgent;
	let config: AgentConfig;

	beforeEach(() => {
		// Reset mocks
		jest.clearAllMocks();

		// Setup basic config
		config = {
			learnerId: "test-learner-123",
			agentId: "personalized-agent-1",
			modelConfig: {
				provider: "openai",
				modelName: "gpt-4-turbo-preview",
				temperature: 0.7,
				maxTokens: 1000
			},
			memoryConfig: {
				maxShortTermItems: 10,
				maxLongTermItems: 50,
				consolidationThreshold: 5
			},
			coordinationConfig: {
				allowInterAgentComm: true,
				broadcastEvents: true,
				coordinationStrategy: "hybrid"
			}
		};

		// Mock learner data
		(mockPrismaClient.learner.findUnique as jest.Mock).mockResolvedValue({
			id: "test-learner-123",
			displayName: "Alex Johnson",
			dateOfBirth: new Date("2015-03-15"),
			brainProfile: {
				neurodiversity: {
					adhd: true,
					dyslexia: false,
					autism: false
				},
				preferences: {
					prefersVisual: true,
					prefersStepByStep: true
				}
			}
		});

		agent = new PersonalizedLearningAgent(config, mockPrismaClient);
	});

	describe("Initialization", () => {
		test("should initialize with learner profile", async () => {
			await agent.initialize();

			expect(mockPrismaClient.learner.findUnique).toHaveBeenCalledWith({
				where: { id: "test-learner-123" },
				include: {
					brainProfile: {
						include: {
							neurodiversity: true,
							preferences: true
						}
					}
				}
			});
		});

		test("should throw error if learner not found", async () => {
			(mockPrismaClient.learner.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(agent.initialize()).rejects.toThrow(
				"Learner test-learner-123 not found"
			);
		});

		test("should calculate optimal session length for ADHD learner", async () => {
			await agent.initialize();

			const profile = await (agent as any).learnerProfile;
			expect(profile.derivedMetrics.optimalSessionLength).toBeLessThanOrEqual(15);
		});
	});

	describe("Performance Assessment", () => {
		beforeEach(async () => {
			await agent.initialize();
		});

		test("should detect struggling learner", async () => {
			const context: LearningContext = {
				currentActivity: { difficulty: 5 },
				recentPerformance: {
					accuracy: 35,
					responseTime: [10, 12, 15],
					hintsUsed: 8,
					attemptsPerQuestion: [3, 4, 5],
					consecutiveCorrect: 0,
					consecutiveIncorrect: 4,
					engagementScore: 40
				},
				sessionDuration: 15,
				lastBreakTime: 5,
				focusLevel: 50,
				strugglesDetected: ["fraction_addition", "place_value"]
			};

			const response = await agent.processInput(context);
			const responseData = response.data as AgentResponseData;

			// Should reduce difficulty when struggling (accuracy < 50%)
			expect(response.action).toBe("adjust_difficulty");
			expect(response.confidence).toBeGreaterThan(0.7);
			expect(responseData.decision.details.newDifficulty).toBeLessThan(5);
		});

		test("should detect mastery and suggest advancement", async () => {
			const context: LearningContext = {
				currentActivity: { difficulty: 5 },
				recentPerformance: {
					accuracy: 96,
					responseTime: [3, 4, 3],
					hintsUsed: 0,
					attemptsPerQuestion: [1, 1, 1],
					consecutiveCorrect: 12,
					consecutiveIncorrect: 0,
					engagementScore: 85
				},
				sessionDuration: 12,
				lastBreakTime: 2,
				focusLevel: 90,
				strugglesDetected: []
			};

			const response = await agent.processInput(context);
			const responseData = response.data as AgentResponseData;

			// Should increase difficulty when showing mastery (accuracy > 90%, consecutive correct >= 10)
			expect(response.action).toBe("adjust_difficulty");
			expect(responseData.decision.details.newDifficulty).toBeGreaterThan(5);
		});
	});

	describe("Break Detection", () => {
		beforeEach(async () => {
			await agent.initialize();
		});

		test("should suggest break for ADHD learner after 10 minutes", async () => {
			const context: LearningContext = {
				currentActivity: { difficulty: 5 },
				recentPerformance: {
					accuracy: 75,
					responseTime: [8, 9, 10],
					hintsUsed: 2,
					attemptsPerQuestion: [1, 2, 1],
					consecutiveCorrect: 3,
					consecutiveIncorrect: 1,
					engagementScore: 60
				},
				sessionDuration: 22,
				lastBreakTime: 0,
				focusLevel: 50,
				strugglesDetected: []
			};

			const response = await agent.processInput(context);
			const responseData = response.data as AgentResponseData;

			expect(response.action).toBe("take_break");
			expect(responseData.decision.details.breakType).toBeDefined();
		});

		test("should suggest movement break for low focus", async () => {
			const context: LearningContext = {
				currentActivity: { difficulty: 5 },
				recentPerformance: {
					accuracy: 70,
					responseTime: [12, 15, 18],
					hintsUsed: 3,
					attemptsPerQuestion: [2, 2, 3],
					consecutiveCorrect: 2,
					consecutiveIncorrect: 2,
					engagementScore: 45
				},
				sessionDuration: 25,
				lastBreakTime: 5,
				focusLevel: 25,
				strugglesDetected: ["word_problems"]
			};

			const response = await agent.processInput(context);
			const responseData = response.data as AgentResponseData;

			if (response.action === "take_break") {
				expect(responseData.decision.details.breakType).toBe("movement");
			}
		});
	});

	describe("Emotional State Detection", () => {
		beforeEach(async () => {
			await agent.initialize();
		});

		test("should detect frustration from consecutive errors", async () => {
			const context: LearningContext = {
				currentActivity: { difficulty: 7 },
				recentPerformance: {
					accuracy: 30,
					responseTime: [15, 20, 25],
					hintsUsed: 6,
					attemptsPerQuestion: [4, 5, 6],
					consecutiveCorrect: 0,
					consecutiveIncorrect: 5,
					engagementScore: 25
				},
				sessionDuration: 10,
				lastBreakTime: 0,
				focusLevel: 35,
				strugglesDetected: ["algebra", "variables"]
			};

			(mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
				choices: [
					{
						message: {
							content: JSON.stringify({
								action: "adjust_difficulty",
								reason: "Learner showing frustration, reducing difficulty",
								confidence: 0.8,
								details: {
									newDifficulty: 4
								},
								adaptations: []
							})
						}
					}
				]
			});

			const response = await agent.processInput(context);
			const responseData = response.data as AgentResponseData;

			expect(response.reasoning).toContain("frustration");
			expect(responseData.decision.details.newDifficulty).toBeLessThan(7);
		});

		test("should detect boredom from high accuracy with low engagement", async () => {
			const context: LearningContext = {
				currentActivity: { difficulty: 3 },
				recentPerformance: {
					accuracy: 98,
					responseTime: [2, 2, 3],
					hintsUsed: 0,
					attemptsPerQuestion: [1, 1, 1],
					consecutiveCorrect: 15,
					consecutiveIncorrect: 0,
					engagementScore: 30
				},
				sessionDuration: 8,
				lastBreakTime: 0,
				focusLevel: 40,
				strugglesDetected: []
			};

			(mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
				choices: [
					{
						message: {
							content: JSON.stringify({
								action: "adjust_difficulty",
								reason: "Learner bored, increasing challenge",
								confidence: 0.75,
								details: {
									newDifficulty: 5
								},
								adaptations: []
							})
						}
					}
				]
			});

			const response = await agent.processInput(context);
			const responseData = response.data as AgentResponseData;

			expect(response.action).toBe("adjust_difficulty");
			expect(responseData.decision.details.newDifficulty).toBeGreaterThan(3);
		});
	});

	describe("Accommodation Application", () => {
		beforeEach(async () => {
			await agent.initialize();
		});

		test("should apply ADHD accommodations", async () => {
			const context: LearningContext = {
				currentActivity: { difficulty: 5 },
				recentPerformance: {
					accuracy: 65,
					responseTime: [8, 10, 12],
					hintsUsed: 3,
					attemptsPerQuestion: [2, 2, 3],
					consecutiveCorrect: 2,
					consecutiveIncorrect: 1,
					engagementScore: 55
				},
				sessionDuration: 8,
				lastBreakTime: 0,
				focusLevel: 60,
				strugglesDetected: []
			};

			(mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
				choices: [
					{
						message: {
							content: JSON.stringify({
								action: "continue",
								reason: "Good progress, continue",
								confidence: 0.8,
								details: {},
								adaptations: []
							})
						}
					}
				]
			});

			const response = await agent.processInput(context);
			const responseData = response.data as AgentResponseData;

			const adhdAdaptation = responseData.decision.adaptations.find(
				(a: any) => a.type === "structure"
			);

			expect(adhdAdaptation).toBeDefined();
			expect(adhdAdaptation.modification.chunkContent).toBe(true);
			expect(adhdAdaptation.modification.frequentBreaks).toBe(true);
		});

		test("should apply dyslexia accommodations", async () => {
			// Update learner to have dyslexia
			(mockPrismaClient.learner.findUnique as jest.Mock).mockResolvedValue({
				id: "test-learner-123",
				displayName: "Alex Johnson",
				dateOfBirth: new Date("2015-03-15"),
				brainProfile: {
					neurodiversity: {
						adhd: false,
						dyslexia: true,
						autism: false
					},
					preferences: {}
				}
			});

			// Reinitialize agent
			agent = new PersonalizedLearningAgent(config, mockPrismaClient);
			await agent.initialize();

			const context: LearningContext = {
				currentActivity: { difficulty: 5 },
				recentPerformance: {
					accuracy: 70,
					responseTime: [10, 12, 11],
					hintsUsed: 2,
					attemptsPerQuestion: [2, 1, 2],
					consecutiveCorrect: 3,
					consecutiveIncorrect: 1,
					engagementScore: 65
				},
				sessionDuration: 10,
				lastBreakTime: 0,
				focusLevel: 70,
				strugglesDetected: []
			};

			(mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
				choices: [
					{
						message: {
							content: JSON.stringify({
								action: "continue",
								reason: "Continue with support",
								confidence: 0.8,
								details: {},
								adaptations: []
							})
						}
					}
				]
			});

			const response = await agent.processInput(context);
			const responseData = response.data as AgentResponseData;

			const dyslexiaAdaptation = responseData.decision.adaptations.find(
				(a: any) => a.type === "typography"
			);

			expect(dyslexiaAdaptation).toBeDefined();
			expect(dyslexiaAdaptation.modification.font).toBe("OpenDyslexic");
			expect(dyslexiaAdaptation.modification.lineSpacing).toBe(1.8);
		});
	});

	describe("Personalized Feedback", () => {
		beforeEach(async () => {
			await agent.initialize();
		});

		test("should generate encouragement for good performance", async () => {
			const context: LearningContext = {
				currentActivity: { difficulty: 5 },
				recentPerformance: {
					accuracy: 85,
					responseTime: [5, 6, 5],
					hintsUsed: 1,
					attemptsPerQuestion: [1, 1, 2],
					consecutiveCorrect: 6,
					consecutiveIncorrect: 0,
					engagementScore: 80
				},
				sessionDuration: 10,
				lastBreakTime: 0,
				focusLevel: 85,
				strugglesDetected: []
			};

			(mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
				choices: [
					{
						message: {
							content: JSON.stringify({
								action: "continue",
								reason: "Excellent progress",
								confidence: 0.9,
								details: {},
								adaptations: []
							})
						}
					}
				]
			});

			const response = await agent.processInput(context);
			const responseData = response.data as AgentResponseData;

			expect(responseData.feedback).toBeDefined();
			expect(typeof responseData.feedback).toBe("string");
			expect(responseData.feedback.length).toBeGreaterThan(0);
		});

		test("should generate supportive feedback for struggling learner", async () => {
			const context: LearningContext = {
				currentActivity: { difficulty: 5 },
				recentPerformance: {
					accuracy: 40,
					responseTime: [15, 18, 20],
					hintsUsed: 7,
					attemptsPerQuestion: [4, 5, 4],
					consecutiveCorrect: 0,
					consecutiveIncorrect: 4,
					engagementScore: 35
				},
				sessionDuration: 12,
				lastBreakTime: 2,
				focusLevel: 45,
				strugglesDetected: ["division", "remainders"]
			};

			(mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
				choices: [
					{
						message: {
							content: JSON.stringify({
								action: "provide_help",
								reason: "Needs support",
								confidence: 0.8,
								details: {
									helpType: "scaffolding"
								},
								adaptations: []
							})
						}
					}
				]
			});

			const response = await agent.processInput(context);
			const responseData = response.data as AgentResponseData;

			expect(responseData.feedback).toBeDefined();
			// Feedback should be supportive, not critical
			expect(responseData.feedback).not.toContain("wrong");
			expect(responseData.feedback).not.toContain("failed");
		});
	});

	describe("Insight Generation", () => {
		beforeEach(async () => {
			await agent.initialize();
		});

		test("should generate insights from decision history", async () => {
			// Simulate multiple decisions
			for (let i = 0; i < 10; i++) {
				const context: LearningContext = {
					currentActivity: { difficulty: 5 },
					recentPerformance: {
						accuracy: 70 + i * 2,
						responseTime: [8, 9, 10],
						hintsUsed: 2,
						attemptsPerQuestion: [2, 1, 2],
						consecutiveCorrect: i % 3,
						consecutiveIncorrect: 0,
						engagementScore: 60 + i
					},
					sessionDuration: 5 + i,
					lastBreakTime: 0,
					focusLevel: 65 + i,
					strugglesDetected: []
				};

				(mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
					choices: [
						{
							message: {
								content: JSON.stringify({
									action: "continue",
									reason: "Continue",
									confidence: 0.8,
									details: {},
									adaptations: []
								})
							}
						}
					]
				});

				await agent.processInput(context);
			}

			const insight = await agent.generateInsight();

			expect(insight).toBeDefined();
			expect(insight.learnerId).toBe("test-learner-123");
			expect(insight.patterns).toBeDefined();
			expect(insight.patterns.mostCommonAction).toBeDefined();
			expect(insight.patterns.averageConfidence).toBeGreaterThan(0);
		});
	});

	describe("Memory Management", () => {
		beforeEach(async () => {
			await agent.initialize();
		});

		test("should store decisions in short-term memory", async () => {
			const context: LearningContext = {
				currentActivity: { difficulty: 5 },
				recentPerformance: {
					accuracy: 75,
					responseTime: [7, 8, 9],
					hintsUsed: 2,
					attemptsPerQuestion: [1, 2, 1],
					consecutiveCorrect: 4,
					consecutiveIncorrect: 0,
					engagementScore: 70
				},
				sessionDuration: 10,
				lastBreakTime: 0,
				focusLevel: 75,
				strugglesDetected: []
			};

			(mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
				choices: [
					{
						message: {
							content: JSON.stringify({
								action: "continue",
								reason: "Good progress",
								confidence: 0.85,
								details: {},
								adaptations: []
							})
						}
					}
				]
			});

			await agent.processInput(context);

			const state = agent.getAgentState();
			expect(state.memory.shortTerm.length).toBeGreaterThan(0);

			const lastMemory = state.memory.shortTerm[0];
			expect(lastMemory.type).toBe("decision");
			expect(lastMemory.content).toBeDefined();
		});
	});
});
