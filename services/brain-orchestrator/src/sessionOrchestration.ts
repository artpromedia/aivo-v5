/**
 * Session Orchestration Service
 * 
 * Integrates PersonalizedLearningAgent with session execution flow.
 * Provides real-time learning adaptations during learner sessions.
 */

import { PersonalizedLearningAgent, type LearningContext } from "@aivo/agents";
import type { AgentConfig } from "@aivo/agents";
import { PrismaClient } from "@prisma/client";

export interface SessionActivity {
	id: string;
	type: string;
	difficulty: number;
	contentId?: string;
	estimatedMinutes: number;
}

export interface SessionState {
	sessionId: string;
	learnerId: string;
	currentActivity: SessionActivity;
	startTime: Date;
	lastBreakTime: number; // minutes since session start
	focusLevel: number; // 0-100
	strugglesDetected: string[];
	performanceHistory: {
		accuracy: number;
		responseTime: number;
		hintsUsed: number;
		attempts: number;
		timestamp: Date;
	}[];
}

export interface AdaptationDecision {
	action: "continue" | "adjust_difficulty" | "take_break" | "provide_help" | "change_activity";
	reasoning: string;
	confidence: number;
	details: any;
	feedback: string;
}

export class SessionOrchestrationService {
	private agents: Map<string, PersonalizedLearningAgent> = new Map();
	private prisma: PrismaClient;

	constructor() {
		this.prisma = new PrismaClient();
	}

	/**
	 * Get or create PersonalizedLearningAgent for a learner
	 */
	private async getAgentForLearner(learnerId: string): Promise<PersonalizedLearningAgent> {
		// Check if agent already exists
		if (this.agents.has(learnerId)) {
			return this.agents.get(learnerId)!;
		}

		// Create new agent
		const config: AgentConfig = {
			learnerId,
			agentId: `learning-agent-${learnerId}`,
			modelConfig: {
				provider: "openai",
				modelName: "gpt-4-turbo-preview",
				temperature: 0.7,
				maxTokens: 1500
			},
			memoryConfig: {
				maxShortTermItems: 20,
				maxLongTermItems: 100,
				consolidationThreshold: 5
			},
			coordinationConfig: {
				allowInterAgentComm: false,
				broadcastEvents: true,
				coordinationStrategy: "centralized"
			}
		};

		const agent = new PersonalizedLearningAgent(config, this.prisma);
		await agent.initialize();

		this.agents.set(learnerId, agent);
		return agent;
	}

	/**
	 * Build learning context from session state
	 */
	private buildLearningContext(sessionState: SessionState): LearningContext {
		const now = Date.now();
		const sessionDuration = (now - sessionState.startTime.getTime()) / 1000 / 60; // minutes

		// Calculate recent performance metrics
		const recentResponses = sessionState.performanceHistory.slice(-10);

		const accuracy =
			recentResponses.length > 0
				? (recentResponses.filter((r) => r.accuracy > 0.8).length /
						recentResponses.length) *
					100
				: 0;

		const responseTimes = recentResponses.map((r) => r.responseTime);
		const hintsUsed = recentResponses.reduce((sum, r) => sum + r.hintsUsed, 0);
		const attemptsPerQuestion = recentResponses.map((r) => r.attempts);

		// Calculate consecutive streaks
		let consecutiveCorrect = 0;
		let consecutiveIncorrect = 0;
		for (let i = recentResponses.length - 1; i >= 0; i--) {
			if (recentResponses[i].accuracy > 0.8) {
				if (consecutiveIncorrect === 0) consecutiveCorrect++;
				else break;
			} else {
				if (consecutiveCorrect === 0) consecutiveIncorrect++;
				else break;
			}
		}

		// Estimate engagement score from response times and focus level
		const avgResponseTime =
			responseTimes.length > 0
				? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
				: 0;
		const engagementScore = Math.min(
			100,
			sessionState.focusLevel * 0.6 + (100 - Math.min(avgResponseTime / 30, 100)) * 0.4
		);

		return {
			currentActivity: sessionState.currentActivity,
			recentPerformance: {
				accuracy,
				responseTime: responseTimes,
				hintsUsed,
				attemptsPerQuestion,
				consecutiveCorrect,
				consecutiveIncorrect,
				engagementScore
			},
			sessionDuration,
			lastBreakTime: sessionState.lastBreakTime,
			focusLevel: sessionState.focusLevel,
			strugglesDetected: sessionState.strugglesDetected
		};
	}

	/**
	 * Make real-time adaptation decision
	 */
	async makeAdaptationDecision(
		sessionState: SessionState
	): Promise<AdaptationDecision> {
		const agent = await this.getAgentForLearner(sessionState.learnerId);
		const context = this.buildLearningContext(sessionState);

		const response = await agent.processInput(context);

		// Extract decision from response data
		const data = response.data as any;

		return {
			action: response.action as any,
			reasoning: response.reasoning,
			confidence: response.confidence,
			details: data.decision.details,
			feedback: data.feedback
		};
	}

	/**
	 * Record performance data point
	 */
	recordPerformance(
		sessionState: SessionState,
		performance: {
			accuracy: number;
			responseTime: number;
			hintsUsed: number;
			attempts: number;
		}
	): void {
		sessionState.performanceHistory.push({
			...performance,
			timestamp: new Date()
		});

		// Keep last 50 data points
		if (sessionState.performanceHistory.length > 50) {
			sessionState.performanceHistory.shift();
		}
	}

	/**
	 * Update focus level based on activity
	 */
	updateFocusLevel(sessionState: SessionState, newFocusLevel: number): void {
		sessionState.focusLevel = Math.max(0, Math.min(100, newFocusLevel));
	}

	/**
	 * Record that learner took a break
	 */
	recordBreak(sessionState: SessionState): void {
		const now = Date.now();
		const sessionDuration = (now - sessionState.startTime.getTime()) / 1000 / 60; // minutes
		sessionState.lastBreakTime = sessionDuration;
	}

	/**
	 * Get insights about learner's progress
	 */
	async generateSessionInsights(learnerId: string): Promise<any> {
		const agent = await this.getAgentForLearner(learnerId);
		return agent.generateInsight();
	}

	/**
	 * Cleanup agent when session ends
	 */
	async endSession(learnerId: string): Promise<void> {
		const agent = this.agents.get(learnerId);
		if (agent) {
			await agent.shutdown();
			this.agents.delete(learnerId);
		}
	}

	/**
	 * Shutdown all agents
	 */
	async shutdown(): Promise<void> {
		const shutdownPromises = Array.from(this.agents.values()).map((agent) =>
			agent.shutdown()
		);
		await Promise.all(shutdownPromises);
		this.agents.clear();
		await this.prisma.$disconnect();
	}
}

// Singleton instance
let orchestrationService: SessionOrchestrationService | null = null;

export function getSessionOrchestrationService(): SessionOrchestrationService {
	if (!orchestrationService) {
		orchestrationService = new SessionOrchestrationService();
	}
	return orchestrationService;
}
