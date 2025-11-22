/**
 * Tutor Orchestration Service
 * 
 * Integrates AITutorAgent with real-time learning sessions.
 * Provides conversational support, progressive hints, and emotional guidance.
 */

import { AITutorAgent, type TutorInteraction } from "@aivo/agents";
import type { AgentConfig } from "@aivo/agents";
import { PrismaClient } from "@prisma/client";

export interface CurrentQuestion {
	id: string;
	text: string;
	type: "multiple_choice" | "short_answer" | "numeric" | "open_ended";
	correctAnswer?: string | number | string[];
	options?: string[];
	hints?: string[];
}

export interface CurrentActivity {
	id: string;
	subject: string;
	topic?: string;
	difficulty?: number;
	lessonBlockId?: string;
}

export interface TutorSessionContext {
	sessionId: string;
	learnerId: string;
	currentActivity: CurrentActivity;
	currentQuestion?: CurrentQuestion;
	previousHints: string[];
	interactionCount: number;
	startTime: Date;
	conversationHistory: {
		learnerInput: string;
		tutorResponse: string;
		timestamp: Date;
		inputType: string;
	}[];
}

export interface TutorResponse {
	message: string;
	type: "hint" | "encouragement" | "correction" | "explanation" | "redirect" | "general";
	shouldSpeak: boolean;
	emotion?: "excited" | "encouraging" | "sympathetic" | "neutral" | "calm";
	visualAids?: string[];
	nextPrompt?: string;
	breakSuggested?: boolean;
	confidence: number;
	reasoning: string;
}

export interface ConversationInsights {
	totalInteractions: number;
	conversationQuality: number; // 0-1
	emotionalSupport: number; // 0-1
	hintEffectiveness: number; // 0-1
	engagementLevel: number; // 0-1
	recommendations: string[];
}

export class TutorOrchestrationService {
	private agents: Map<string, AITutorAgent> = new Map();
	private sessionContexts: Map<string, TutorSessionContext> = new Map();
	private prisma: PrismaClient;

	constructor() {
		this.prisma = new PrismaClient();
	}

	/**
	 * Get or create AITutorAgent for a learner
	 */
	private async getAgentForLearner(learnerId: string): Promise<AITutorAgent> {
		// Check if agent already exists
		if (this.agents.has(learnerId)) {
			return this.agents.get(learnerId)!;
		}

		// Create new agent
		const config: AgentConfig = {
			learnerId,
			agentId: `tutor-agent-${learnerId}`,
			agentType: "tutor",
			modelConfig: {
				provider: "openai",
				modelName: "gpt-4-turbo-preview",
				temperature: 0.8, // More creative for conversational responses
				maxTokens: 1000
			},
			memoryConfig: {
				maxShortTermItems: 50, // More history for conversation context
				maxLongTermItems: 100,
				consolidationThreshold: 10
			},
			coordinationConfig: {
				allowInterAgentComm: true, // Coordinate with PersonalizedLearningAgent
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
		};

		const agent = new AITutorAgent(config, this.prisma);
		await agent.initialize();

		this.agents.set(learnerId, agent);
		return agent;
	}

	/**
	 * Start a new tutoring session
	 */
	async startSession(
		sessionId: string,
		learnerId: string,
		activity: CurrentActivity
	): Promise<void> {
		const context: TutorSessionContext = {
			sessionId,
			learnerId,
			currentActivity: activity,
			previousHints: [],
			interactionCount: 0,
			startTime: new Date(),
			conversationHistory: []
		};

		this.sessionContexts.set(sessionId, context);
	}

	/**
	 * Process learner input and generate tutor response
	 */
	async processLearnerInput(
		sessionId: string,
		learnerInput: string,
		inputType: "question" | "answer" | "frustration" | "confusion" | "off_topic" = "question"
	): Promise<TutorResponse> {
		const context = this.sessionContexts.get(sessionId);
		if (!context) {
			throw new Error(`Session ${sessionId} not found`);
		}

		const agent = await this.getAgentForLearner(context.learnerId);

		// Build tutor interaction
		const interaction: TutorInteraction = {
			learnerInput,
			inputType,
			currentActivity: context.currentActivity,
			currentQuestion: context.currentQuestion,
			previousHints: context.previousHints,
			sessionContext: {
				sessionId,
				interactionCount: context.interactionCount,
				sessionDuration: (Date.now() - context.startTime.getTime()) / 1000 / 60 // minutes
			}
		};

		// Process through agent
		const response = await agent.processInput(interaction);

		// Update context
		context.interactionCount++;
		context.conversationHistory.push({
			learnerInput,
			tutorResponse: response.data.response.message,
			timestamp: new Date(),
			inputType: response.data.inputType
		});

		// Update hints if provided
		if (response.data.response.type === "hint" && response.data.response.message) {
			context.previousHints.push(response.data.response.message);
		}

		// Keep last 100 conversation entries
		if (context.conversationHistory.length > 100) {
			context.conversationHistory = context.conversationHistory.slice(-100);
		}

		return {
			message: response.data.response.message,
			type: response.data.response.type,
			shouldSpeak: response.data.response.shouldSpeak,
			emotion: response.data.response.emotion,
			visualAids: response.data.response.visualAids,
			nextPrompt: response.data.response.nextPrompt,
			breakSuggested: response.data.breakSuggested,
			confidence: response.confidence,
			reasoning: response.reasoning
		};
	}

	/**
	 * Update the current question
	 */
	setCurrentQuestion(sessionId: string, question: CurrentQuestion): void {
		const context = this.sessionContexts.get(sessionId);
		if (context) {
			context.currentQuestion = question;
			// Reset hints for new question
			context.previousHints = [];
		}
	}

	/**
	 * Update the current activity
	 */
	updateCurrentActivity(sessionId: string, activity: CurrentActivity): void {
		const context = this.sessionContexts.get(sessionId);
		if (context) {
			context.currentActivity = activity;
			// Reset hints for new activity
			context.previousHints = [];
		}
	}

	/**
	 * Record that learner answered correctly (resets hint progression)
	 */
	recordCorrectAnswer(sessionId: string): void {
		const context = this.sessionContexts.get(sessionId);
		if (context) {
			context.previousHints = [];
		}
	}

	/**
	 * Get conversation history for a session
	 */
	getConversationHistory(sessionId: string): TutorSessionContext["conversationHistory"] {
		const context = this.sessionContexts.get(sessionId);
		return context?.conversationHistory || [];
	}

	/**
	 * Get conversation insights for a learner
	 */
	async getConversationInsights(learnerId: string): Promise<ConversationInsights> {
		const agent = await this.getAgentForLearner(learnerId);
		const insights = await agent.generateInsight();

		return {
			totalInteractions: insights.totalInteractions,
			conversationQuality: insights.conversationQuality,
			emotionalSupport: insights.emotionalSupport,
			hintEffectiveness: insights.hintEffectiveness,
			engagementLevel: insights.engagementLevel,
			recommendations: insights.recommendations
		};
	}

	/**
	 * Provide a quick hint without full conversation processing
	 */
	async provideQuickHint(
		sessionId: string,
		hintLevel: 0 | 1 | 2 | 3 = 0
	): Promise<string> {
		const context = this.sessionContexts.get(sessionId);
		if (!context || !context.currentQuestion) {
			return "I'm not sure what you need help with. Can you ask me a specific question?";
		}

		const agent = await this.getAgentForLearner(context.learnerId);

		// Get hint from agent
		const interaction: TutorInteraction = {
			learnerInput: "Can you help me?",
			inputType: "question",
			currentActivity: context.currentActivity,
			currentQuestion: context.currentQuestion,
			previousHints: context.previousHints.slice(0, hintLevel),
			sessionContext: {}
		};

		const response = await agent.processInput(interaction);

		// Add to hints
		if (response.data.response.message) {
			context.previousHints.push(response.data.response.message);
		}

		return response.data.response.message;
	}

	/**
	 * Handle learner frustration event
	 */
	async handleFrustration(
		sessionId: string,
		frustrationReason?: string
	): Promise<TutorResponse> {
		const input = frustrationReason
			? `I'm frustrated because ${frustrationReason}`
			: "This is too hard!";

		return this.processLearnerInput(sessionId, input, "frustration");
	}

	/**
	 * Handle learner confusion event
	 */
	async handleConfusion(
		sessionId: string,
		confusionTopic?: string
	): Promise<TutorResponse> {
		const input = confusionTopic
			? `I don't understand ${confusionTopic}`
			: "I'm confused";

		return this.processLearnerInput(sessionId, input, "confusion");
	}

	/**
	 * Check if learner should take a break
	 */
	shouldSuggestBreak(sessionId: string): boolean {
		const context = this.sessionContexts.get(sessionId);
		if (!context) return false;

		const recentHistory = context.conversationHistory.slice(-10);

		// Count frustration and confusion in recent history
		const frustrationCount = recentHistory.filter(
			(entry) => entry.inputType === "frustration"
		).length;

		const confusionCount = recentHistory.filter(
			(entry) => entry.inputType === "confusion"
		).length;

		// Suggest break if:
		// - 2+ frustrations in last 10 interactions
		// - 3+ confusions in last 10 interactions
		// - Every 20 interactions
		return (
			frustrationCount >= 2 ||
			confusionCount >= 3 ||
			context.interactionCount % 20 === 0
		);
	}

	/**
	 * Get session context summary
	 */
	getSessionSummary(sessionId: string): {
		interactionCount: number;
		hintCount: number;
		frustrationCount: number;
		confusionCount: number;
		sessionDuration: number; // minutes
	} | null {
		const context = this.sessionContexts.get(sessionId);
		if (!context) return null;

		const frustrationCount = context.conversationHistory.filter(
			(entry) => entry.inputType === "frustration"
		).length;

		const confusionCount = context.conversationHistory.filter(
			(entry) => entry.inputType === "confusion"
		).length;

		return {
			interactionCount: context.interactionCount,
			hintCount: context.previousHints.length,
			frustrationCount,
			confusionCount,
			sessionDuration: (Date.now() - context.startTime.getTime()) / 1000 / 60
		};
	}

	/**
	 * End tutoring session and cleanup
	 */
	async endSession(sessionId: string): Promise<void> {
		const context = this.sessionContexts.get(sessionId);
		if (context) {
			// Save conversation to database or analytics
			// TODO: Persist conversation history for analysis

			this.sessionContexts.delete(sessionId);
		}
	}

	/**
	 * End all sessions for a learner
	 */
	async endLearnerSessions(learnerId: string): Promise<void> {
		// End all sessions for this learner
		for (const [sessionId, context] of this.sessionContexts.entries()) {
			if (context.learnerId === learnerId) {
				await this.endSession(sessionId);
			}
		}

		// Shutdown agent
		const agent = this.agents.get(learnerId);
		if (agent) {
			await agent.shutdown();
			this.agents.delete(learnerId);
		}
	}

	/**
	 * Shutdown all agents and cleanup
	 */
	async shutdown(): Promise<void> {
		// Shutdown all agents
		const shutdownPromises = Array.from(this.agents.values()).map((agent) =>
			agent.shutdown()
		);
		await Promise.all(shutdownPromises);

		this.agents.clear();
		this.sessionContexts.clear();
		await this.prisma.$disconnect();
	}
}

// Singleton instance
let tutorService: TutorOrchestrationService | null = null;

export function getTutorOrchestrationService(): TutorOrchestrationService {
	if (!tutorService) {
		tutorService = new TutorOrchestrationService();
	}
	return tutorService;
}
