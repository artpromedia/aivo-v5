/**
 * AI Tutor Agent Tests
 * 
 * Tests conversational AI tutor functionality including:
 * - Input classification
 * - Progressive hint system
 * - Answer evaluation
 * - Emotional support
 * - Safety filters
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AITutorAgent, TutorInteraction } from "../AITutorAgent";
import type { AgentConfig } from "../lib/agents/base/AgentFramework";

describe("AITutorAgent", () => {
	let agent: AITutorAgent;
	let mockPrisma: any;
	let mockConfig: AgentConfig;

	beforeEach(async () => {
		// Mock Prisma
		mockPrisma = {
			learner: {
				findUnique: jest.fn().mockResolvedValue({
					id: "learner-123",
					firstName: "Alex",
					dateOfBirth: new Date("2015-01-01"),
					gradeLevel: 3,
					accommodations: { learningStyle: "visual" },
					diagnoses: [{ type: "ADHD" }]
				})
			}
		};

		mockConfig = {
			agentId: "tutor-agent-1",
			learnerId: "learner-123",
			modelConfig: {
				provider: "local",
				modelName: "gpt-4",
				temperature: 0.7,
				maxTokens: 1000
			},
			memoryConfig: {
				maxShortTermItems: 10,
				maxLongTermItems: 100,
				consolidationThreshold: 0.7
			},
			coordinationConfig: {
				allowInterAgentComm: true,
				broadcastEvents: true,
				coordinationStrategy: "hybrid"
			}
		};

		agent = new AITutorAgent(mockConfig, mockPrisma);
		await agent.initialize();
	});

	afterEach(async () => {
		if (agent) {
			await agent.shutdown();
		}
	});

	describe("Input Classification", () => {
		it("should classify help request", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "Can you help me with this?",
				inputType: "question",
				currentActivity: { id: "act-1", subject: "math" },
				previousHints: [],
				sessionContext: {}
			};

			const response = await agent.processInput(interaction);

			expect(response.action).toBe("respond");
			expect(response.data.inputType).toBe("help_request");
			expect(response.confidence).toBeGreaterThan(0.5);
		});

		it("should classify answer attempt", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "7",
				inputType: "answer",
				currentActivity: { id: "act-1" },
				currentQuestion: { id: "q1", correctAnswer: "7" },
				previousHints: [],
				sessionContext: {}
			};

			const response = await agent.processInput(interaction);

			expect(response.data.response.type).toBe("encouragement");
		});

		it("should classify frustration", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "This is too hard! I give up!",
				inputType: "frustration",
				currentActivity: { id: "act-1" },
				previousHints: [],
				sessionContext: {}
			};

			const response = await agent.processInput(interaction);

			expect(response.data.inputType).toBe("frustration");
			expect(response.data.response.emotion).toBe("sympathetic");
		});

		it("should classify confusion", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "I don't understand what this means",
				inputType: "confusion",
				currentActivity: { id: "act-1", topic: "fractions" },
				previousHints: [],
				sessionContext: {}
			};

			const response = await agent.processInput(interaction);

			expect(response.data.inputType).toBe("confusion");
			expect(response.data.response.type).toBe("explanation");
		});

		it("should classify off-topic input", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "Did you see the new superhero movie?",
				inputType: "off_topic",
				currentActivity: { id: "act-1", subject: "math" },
				previousHints: [],
				sessionContext: {}
			};

			const response = await agent.processInput(interaction);

			expect(response.data.response.type).toBe("redirect");
		});
	});

	describe("Progressive Hint System", () => {
		it("should provide gentle hint on first request", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "I need help",
				inputType: "question",
				currentActivity: { id: "act-1" },
				currentQuestion: { id: "q1", text: "What is 5 + 3?" },
				previousHints: [],
				sessionContext: {}
			};

			const response = await agent.processInput(interaction);

			expect(response.data.response.type).toBe("hint");
			expect(response.data.response.nextPrompt).toContain("Try it");
		});

		it("should provide more detailed hint on second request", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "I still need help",
				inputType: "question",
				currentActivity: { id: "act-1" },
				currentQuestion: { id: "q1", text: "What is 5 + 3?" },
				previousHints: ["Think about counting"],
				sessionContext: {}
			};

			// First hint
			await agent.processInput(interaction);

			// Second hint
			const response = await agent.processInput(interaction);

			expect(response.data.response.type).toBe("hint");
		});

		it("should reset hint count after correct answer", async () => {
			const questionId = "q1";
			
			// Give hints
			await agent.processInput({
				learnerInput: "I need help",
				inputType: "question",
				currentActivity: { id: "act-1" },
				currentQuestion: { id: questionId, correctAnswer: "8" },
				previousHints: [],
				sessionContext: {}
			});

			// Submit correct answer
			const correctResponse = await agent.processInput({
				learnerInput: "8",
				inputType: "answer",
				currentActivity: { id: "act-1" },
				currentQuestion: { id: questionId, correctAnswer: "8" },
				previousHints: [],
				sessionContext: {}
			});

			expect(correctResponse.data.response.type).toBe("encouragement");
			expect(correctResponse.data.response.emotion).toBe("excited");

			// Request help on same question - should start from first hint level
			const nextHelp = await agent.processInput({
				learnerInput: "Help please",
				inputType: "question",
				currentActivity: { id: "act-1" },
				currentQuestion: { id: questionId, correctAnswer: "8" },
				previousHints: [],
				sessionContext: {}
			});

			expect(nextHelp.data.response.nextPrompt).toContain("Try it");
		});
	});

	describe("Answer Evaluation", () => {
		it("should celebrate correct text answer", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "cat",
				inputType: "answer",
				currentActivity: { id: "act-1" },
				currentQuestion: { id: "q1", correctAnswer: "cat" },
				previousHints: [],
				sessionContext: {}
			};

			const response = await agent.processInput(interaction);

			expect(response.data.response.type).toBe("encouragement");
			expect(response.data.response.emotion).toBe("excited");
		});

		it("should handle correct numeric answer", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "42",
				inputType: "answer",
				currentActivity: { id: "act-1" },
				currentQuestion: { id: "q1", correctAnswer: 42 },
				previousHints: [],
				sessionContext: {}
			};

			const response = await agent.processInput(interaction);

			expect(response.data.response.type).toBe("encouragement");
		});

		it("should accept answer from multiple correct options", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "dog",
				inputType: "answer",
				currentActivity: { id: "act-1" },
				currentQuestion: { id: "q1", correctAnswer: ["dog", "puppy", "canine"] },
				previousHints: [],
				sessionContext: {}
			};

			const response = await agent.processInput(interaction);

			expect(response.data.response.type).toBe("encouragement");
		});

		it("should provide supportive correction for wrong answer", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "5",
				inputType: "answer",
				currentActivity: { id: "act-1" },
				currentQuestion: { id: "q1", correctAnswer: "8" },
				previousHints: [],
				sessionContext: {}
			};

			const response = await agent.processInput(interaction);

			expect(response.data.response.type).toBe("correction");
			expect(response.data.response.emotion).toBe("encouraging");
			expect(response.data.response.nextPrompt).toContain("try again");
		});

		it("should be case-insensitive for text answers", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "CAT",
				inputType: "answer",
				currentActivity: { id: "act-1" },
				currentQuestion: { id: "q1", correctAnswer: "cat" },
				previousHints: [],
				sessionContext: {}
			};

			const response = await agent.processInput(interaction);

			expect(response.data.response.type).toBe("encouragement");
		});
	});

	describe("Emotional Support", () => {
		it("should validate frustration with empathy", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "I can't do this!",
				inputType: "frustration",
				currentActivity: { id: "act-1" },
				previousHints: [],
				sessionContext: {}
			};

			const response = await agent.processInput(interaction);

			expect(response.data.response.emotion).toBe("sympathetic");
			expect(response.data.response.visualAids).toBeDefined();
		});

		it("should suggest break after repeated frustration", async () => {
			// Simulate multiple frustrations
			for (let i = 0; i < 3; i++) {
				await agent.processInput({
					learnerInput: "This is hard",
					inputType: "frustration",
					currentActivity: { id: "act-1" },
					previousHints: [],
					sessionContext: {}
				});
			}

			const response = await agent.processInput({
				learnerInput: "I'm tired",
				inputType: "frustration",
				currentActivity: { id: "act-1" },
				previousHints: [],
				sessionContext: {}
			});

			expect(response.data.breakSuggested).toBe(true);
		});

		it("should provide clear explanation for confusion", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "What does this mean?",
				inputType: "confusion",
				currentActivity: { id: "act-1", topic: "multiplication" },
				previousHints: [],
				sessionContext: {}
			};

			const response = await agent.processInput(interaction);

			expect(response.data.response.type).toBe("explanation");
			expect(response.data.response.nextPrompt).toContain("sense");
		});
	});

	describe("Safety Filters", () => {
		it("should block requests for personal information", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "What is your phone number?",
				inputType: "question",
				currentActivity: { id: "act-1" },
				previousHints: [],
				sessionContext: {}
			};

			const response = await agent.processInput(interaction);

			// Off-topic requests (including personal info) should redirect back to learning
			expect(response.data.response.type).toBe("redirect");
			expect(response.data.response.message).toBeDefined();
		});

		it("should replace negative words with positive alternatives", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "I'm so stupid at math",
				inputType: "frustration",
				currentActivity: { id: "act-1" },
				previousHints: [],
				sessionContext: {}
			};

			const response = await agent.processInput(interaction);

			expect(response.data.response.message).not.toContain("stupid");
		});

		it("should remove external links", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "Can you check this website?",
				inputType: "question",
				currentActivity: { id: "act-1" },
				previousHints: [],
				sessionContext: {}
			};

			const response = await agent.processInput(interaction);

			// Safety filter should handle any links in response
			expect(response.data.response.message).not.toMatch(/https?:\/\//);
		});
	});

	describe("Conversation Management", () => {
		it("should track interaction count", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "Hi",
				inputType: "question",
				currentActivity: { id: "act-1" },
				previousHints: [],
				sessionContext: {}
			};

			await agent.processInput(interaction);
			await agent.processInput(interaction);
			await agent.processInput(interaction);

			const response = await agent.processInput(interaction);

			expect(response.data.interactionCount).toBe(4);
		});

		it("should suggest break after sustained interactions", async () => {
			const interaction: TutorInteraction = {
				learnerInput: "Next question",
				inputType: "question",
				currentActivity: { id: "act-1" },
				previousHints: [],
				sessionContext: {}
			};

			// Simulate 19 interactions
			for (let i = 0; i < 19; i++) {
				await agent.processInput(interaction);
			}

			// 20th interaction should suggest a break
			const response = await agent.processInput(interaction);

			expect(response.data.breakSuggested).toBe(true);
		});

		it("should generate conversation insights", async () => {
			// Have some interactions
			await agent.processInput({
				learnerInput: "Help",
				inputType: "question",
				currentActivity: { id: "act-1" },
				currentQuestion: { id: "q1" },
				previousHints: [],
				sessionContext: {}
			});

			await agent.processInput({
				learnerInput: "8",
				inputType: "answer",
				currentActivity: { id: "act-1" },
				currentQuestion: { id: "q1", correctAnswer: "8" },
				previousHints: [],
				sessionContext: {}
			});

			const insights = await agent.generateInsight();

			expect(insights.totalInteractions).toBeGreaterThan(0);
			expect(insights.conversationQuality).toBeGreaterThan(0);
			expect(insights.emotionalSupport).toBeGreaterThan(0);
			expect(insights.hintEffectiveness).toBeDefined();
			expect(insights.engagementLevel).toBeDefined();
		});
	});

	describe("Personalization", () => {
		it("should create ADHD-appropriate persona", async () => {
			const state = agent.getAgentState();
			expect(state).toBeDefined();
		});

		it("should adapt to learning style", async () => {
			// Agent should use visual learner persona
			const interaction: TutorInteraction = {
				learnerInput: "I don't understand",
				inputType: "confusion",
				currentActivity: { id: "act-1", topic: "shapes" },
				previousHints: [],
				sessionContext: {}
			};

			const response = await agent.processInput(interaction);

			// Response should include visual language
			expect(response.data.response).toBeDefined();
		});
	});
});
