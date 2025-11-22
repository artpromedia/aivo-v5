/**
 * Agent Orchestration API Route
 * 
 * REST API for agent interactions, session management, and coordination.
 * Handles authentication, agent lifecycle, and error recovery.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { 
	PersonalizedLearningAgent, 
	AITutorAgent, 
	SpeechAnalysisAgent,
	AgentOrchestrator 
} from "@aivo/agents";
import type { AgentConfig } from "@aivo/agents";

const prisma = new PrismaClient();

// Initialize orchestrator
const orchestrator = new AgentOrchestrator();

// Agent registry
const agentRegistry = new Map<string, Map<string, any>>();

// Session tracking
interface SessionInfo {
	learnerId: string;
	startTime: Date;
	agents: Map<string, string>; // type -> agentId
	lastActivity: Date;
}

const activeSessions = new Map<string, SessionInfo>();

/**
 * POST /api/agents
 * Main entry point for agent operations
 */
export async function POST(request: NextRequest) {
	// Check authentication
	const session = await getServerSession();

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { action, learnerId, data } = body;

		// Validate required fields
		if (!action || !learnerId) {
			return NextResponse.json(
				{ error: "Missing required fields: action, learnerId" },
				{ status: 400 }
			);
		}

		// Route to appropriate handler
		switch (action) {
			case "start_session":
				return handleStartSession(learnerId, data);

			case "process_interaction":
				return handleInteraction(learnerId, data);

			case "get_recommendation":
				return handleRecommendation(learnerId, data);

			case "analyze_speech":
				return handleSpeechAnalysis(learnerId, data);

			case "get_tutor_response":
				return handleTutorInteraction(learnerId, data);

			case "end_session":
				return handleEndSession(learnerId, data);

			case "get_insights":
				return handleGetInsights(learnerId, data);

			default:
				return NextResponse.json(
					{ error: `Invalid action: ${action}` },
					{ status: 400 }
				);
		}
	} catch (error) {
		console.error("Agent API error:", error);

		return NextResponse.json(
			{
				error: "Internal server error",
				message: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

/**
 * Start a new learning session with orchestrated agent initialization
 */
async function handleStartSession(learnerId: string, data: any) {
	const sessionId = `session_${learnerId}_${Date.now()}`;

	try {
		// Create learning agent
		const learningAgent = await createAgent("learning", learnerId, {
			modelConfig: {
				provider: "openai",
				modelName: "gpt-4"
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
			}
		});

		// Create tutor agent
		const tutorAgent = await createAgent("tutor", learnerId, {
			modelConfig: {
				provider: "openai",
				modelName: "gpt-4"
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
			}
		});

		// Register agents with orchestrator
		await orchestrator.registerAgent(learningAgent);
		await orchestrator.registerAgent(tutorAgent);

		// Store agents in registry
		if (!agentRegistry.has(learnerId)) {
			agentRegistry.set(learnerId, new Map());
		}

		const learnerAgents = agentRegistry.get(learnerId)!;
		learnerAgents.set("learning", learningAgent);
		learnerAgents.set("tutor", tutorAgent);

		// Create session info
		const sessionInfo: SessionInfo = {
			learnerId,
			startTime: new Date(),
			agents: new Map([
				["learning", learningAgent.config.agentId],
				["tutor", tutorAgent.config.agentId]
			]),
			lastActivity: new Date()
		};

		activeSessions.set(sessionId, sessionInfo);

		// Create orchestration plan for parallel initialization
		const initializationPlan = {
			id: sessionId,
			steps: [
				{
					id: "init_learning",
					agentId: learningAgent.getAgentId(),
					action: "initialize_session",
					input: {
						subject: data.subject,
						gradeLevel: data.gradeLevel,
						sessionId,
						...data
					},
					retryPolicy: {
						maxRetries: 2,
						backoffMs: 1000
					}
				},
				{
					id: "init_tutor",
					agentId: tutorAgent.getAgentId(),
					action: "prepare_conversation",
					input: {
						subject: data.subject,
						gradeLevel: data.gradeLevel,
						sessionId,
						...data
					},
					dependencies: ["init_learning"],
					retryPolicy: {
						maxRetries: 2,
						backoffMs: 1000
					}
				}
			],
			parallel: true,
			timeout: 30000
		};

		// Execute orchestrated initialization
		const orchestrationResult = await orchestrator.orchestrate(initializationPlan);

		return NextResponse.json({
			sessionId,
			agents: {
				learning: learningAgent.getAgentId(),
				tutor: tutorAgent.getAgentId()
			},
			status: orchestrationResult.success ? "ready" : "error",
			orchestration: {
				success: orchestrationResult.success,
				duration: orchestrationResult.duration,
				results: Object.fromEntries(orchestrationResult.results),
				errors: orchestrationResult.errors ? Object.fromEntries(orchestrationResult.errors) : undefined
			},
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error("Failed to start session:", error);

		return NextResponse.json(
			{
				error: "Failed to start session",
				message: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

/**
 * Process learner interaction
 */
async function handleInteraction(learnerId: string, data: any) {
	try {
		const agent = getAgent(learnerId, "learning");

		if (!agent) {
			return NextResponse.json(
				{ error: "Session not found. Please start a session first." },
				{ status: 404 }
			);
		}

		// Process interaction through learning agent
		const response = await agent.processInput({
			action: "process_interaction",
			...data
		});

		// Update session activity
		updateSessionActivity(learnerId);

		return NextResponse.json({
			success: true,
			response: response.data,
			confidence: response.confidence,
			reasoning: response.reasoning,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error("Interaction processing error:", error);

		return NextResponse.json(
			{
				error: "Failed to process interaction",
				message: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

/**
 * Get learning recommendation
 */
async function handleRecommendation(learnerId: string, data: any) {
	try {
		const agent = getAgent(learnerId, "learning");

		if (!agent) {
			return NextResponse.json(
				{ error: "Session not found" },
				{ status: 404 }
			);
		}

		const response = await agent.processInput({
			action: "get_recommendation",
			...data
		});

		return NextResponse.json({
			success: true,
			recommendation: response.data,
			confidence: response.confidence,
			reasoning: response.reasoning,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error("Recommendation error:", error);

		return NextResponse.json(
			{
				error: "Failed to get recommendation",
				message: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

/**
 * Handle speech analysis
 */
async function handleSpeechAnalysis(learnerId: string, data: any) {
	try {
		// Create or get speech agent
		let agent = getAgent(learnerId, "speech");

		if (!agent) {
			agent = await createAgent("speech", learnerId);

			if (!agentRegistry.has(learnerId)) {
				agentRegistry.set(learnerId, new Map());
			}
			agentRegistry.get(learnerId)!.set("speech", agent);
		}

		// Convert base64 audio to buffer if needed
		let audioBuffer: Buffer;
		if (typeof data.audioBuffer === "string") {
			audioBuffer = Buffer.from(data.audioBuffer, "base64");
		} else {
			audioBuffer = data.audioBuffer;
		}

		const response = await agent.processInput({
			audioBuffer,
			sampleRate: data.sampleRate || 16000,
			targetText: data.targetText,
			taskType: data.taskType || "articulation",
			childAge: data.childAge
		});

		return NextResponse.json({
			success: true,
			analysis: response.data,
			confidence: response.confidence,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error("Speech analysis error:", error);

		return NextResponse.json(
			{
				error: "Failed to analyze speech",
				message: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

/**
 * Handle tutor interaction
 */
async function handleTutorInteraction(learnerId: string, data: any) {
	try {
		const agent = getAgent(learnerId, "tutor");

		if (!agent) {
			return NextResponse.json(
				{ error: "Tutor not available. Please start a session first." },
				{ status: 404 }
			);
		}

		const response = await agent.processInput({
			learnerInput: data.input,
			inputType: data.inputType || "question",
			currentActivity: data.currentActivity,
			currentQuestion: data.currentQuestion,
			previousHints: data.previousHints || [],
			sessionContext: data.sessionContext || {}
		});

		return NextResponse.json({
			success: true,
			response: response.data.response,
			inputType: response.data.inputType,
			breakSuggested: response.data.breakSuggested,
			confidence: response.confidence,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error("Tutor interaction error:", error);

		return NextResponse.json(
			{
				error: "Failed to get tutor response",
				message: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

/**
 * End learning session
 */
async function handleEndSession(learnerId: string, data: any) {
	try {
		const agents = agentRegistry.get(learnerId);

		if (agents) {
			// Shutdown all agents
			const shutdownPromises = Array.from(agents.values()).map((agent) =>
				agent.shutdown()
			);
			await Promise.all(shutdownPromises);

			// Remove from registry
			agentRegistry.delete(learnerId);
		}

		// Remove session info
		const sessionId = data.sessionId;
		if (sessionId) {
			activeSessions.delete(sessionId);
		}

		return NextResponse.json({
			success: true,
			message: "Session ended successfully",
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error("End session error:", error);

		return NextResponse.json(
			{
				error: "Failed to end session",
				message: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

/**
 * Get learning insights
 */
async function handleGetInsights(learnerId: string, data: any) {
	try {
		const agentType = data.agentType || "learning";
		const agent = getAgent(learnerId, agentType);

		if (!agent) {
			return NextResponse.json(
				{ error: "Agent not found" },
				{ status: 404 }
			);
		}

		const insights = await agent.generateInsight();

		return NextResponse.json({
			success: true,
			insights,
			agentType,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error("Get insights error:", error);

		return NextResponse.json(
			{
				error: "Failed to get insights",
				message: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

/**
 * GET /api/agents
 * Get session status and active agents
 */
export async function GET(request: NextRequest) {
	const session = await getServerSession();

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const learnerId = searchParams.get("learnerId");

	if (!learnerId) {
		return NextResponse.json(
			{ error: "Missing learnerId parameter" },
			{ status: 400 }
		);
	}

	const agents = agentRegistry.get(learnerId);
	const sessionInfo = Array.from(activeSessions.values()).find(
		(s) => s.learnerId === learnerId
	);

	return NextResponse.json({
		hasActiveSession: !!agents,
		agentTypes: agents ? Array.from(agents.keys()) : [],
		sessionInfo: sessionInfo
			? {
					startTime: sessionInfo.startTime,
					lastActivity: sessionInfo.lastActivity,
					duration: Date.now() - sessionInfo.startTime.getTime()
			  }
			: null,
		timestamp: new Date().toISOString()
	});
}

/**
 * Helper functions
 */

async function createAgent(type: string, learnerId: string, configOverrides?: Partial<AgentConfig>): Promise<any> {
	const baseConfig: AgentConfig = {
		learnerId,
		agentId: `${type}-agent-${learnerId}-${Date.now()}`,
		agentType: type,
		modelConfig: {
			provider: "openai",
			modelName: "gpt-4-turbo-preview",
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
		},
		// Apply any config overrides
		...configOverrides
	};

	let agent: any;

	switch (type) {
		case "learning":
			agent = new PersonalizedLearningAgent(baseConfig, prisma);
			break;

		case "tutor":
			agent = new AITutorAgent(baseConfig, prisma);
			break;

		case "speech":
			agent = new SpeechAnalysisAgent(baseConfig, prisma);
			break;

		default:
			throw new Error(`Unknown agent type: ${type}`);
	}

	await agent.initialize();
	return agent;
}

function getAgent(learnerId: string, type: string): any | null {
	const agents = agentRegistry.get(learnerId);
	return agents?.get(type) || null;
}

function updateSessionActivity(learnerId: string): void {
	for (const [sessionId, sessionInfo] of activeSessions.entries()) {
		if (sessionInfo.learnerId === learnerId) {
			sessionInfo.lastActivity = new Date();
		}
	}
}

// Cleanup inactive sessions (run periodically)
setInterval(() => {
	const now = Date.now();
	const TIMEOUT = 30 * 60 * 1000; // 30 minutes

	for (const [sessionId, sessionInfo] of activeSessions.entries()) {
		const inactiveTime = now - sessionInfo.lastActivity.getTime();

		if (inactiveTime > TIMEOUT) {
			console.log(`Cleaning up inactive session: ${sessionId}`);

			// Shutdown agents
			const agents = agentRegistry.get(sessionInfo.learnerId);
			if (agents) {
				agents.forEach((agent) => agent.shutdown());
				agentRegistry.delete(sessionInfo.learnerId);
			}

			activeSessions.delete(sessionId);
		}
	}
}, 5 * 60 * 1000); // Check every 5 minutes
