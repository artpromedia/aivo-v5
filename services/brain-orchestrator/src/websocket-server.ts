/**
 * WebSocket Server for Real-Time Agent Communication
 * 
 * Provides Socket.IO server for bidirectional communication between
 * frontend and agent system. Handles authentication, routing, and
 * real-time event broadcasting.
 */

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { verify } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { PersonalizedLearningAgent } from "@aivo/agents";
import { AITutorAgent } from "@aivo/agents";
import { SpeechAnalysisAgent } from "@aivo/agents";

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
	userId?: string;
	learnerId?: string;
}

interface AgentSession {
	learnerId: string;
	learningAgent?: PersonalizedLearningAgent;
	tutorAgent?: AITutorAgent;
	speechAgent?: SpeechAnalysisAgent;
	startTime: Date;
	lastActivity: Date;
}

// Active agent sessions by socket ID
const activeSessions = new Map<string, AgentSession>();

// Learner ID to socket mapping (for broadcasting to specific learners)
const learnerSockets = new Map<string, Set<string>>();

export function initializeWebSocketServer(httpServer: HTTPServer) {
	const io = new SocketIOServer(httpServer, {
		cors: {
			origin: process.env.CORS_ORIGIN || "http://localhost:3000",
			methods: ["GET", "POST"],
			credentials: true
		},
		transports: ["websocket", "polling"],
		pingTimeout: 60000,
		pingInterval: 25000
	});

	// Authentication middleware
	io.use(async (socket: AuthenticatedSocket, next) => {
		const token = socket.handshake.auth.token;
		const learnerId = socket.handshake.auth.learnerId;

		if (!token) {
			return next(new Error("Authentication token required"));
		}

		try {
			// Verify JWT token
			const jwtSecret = process.env.NEXTAUTH_SECRET || "development-secret";
			const decoded = verify(token, jwtSecret) as any;

			socket.userId = decoded.userId || decoded.sub;
			socket.learnerId = learnerId || socket.userId;

			console.log(`Socket authenticated: ${socket.id} for learner ${socket.learnerId}`);
			next();
		} catch (error) {
			console.error("Socket authentication failed:", error);
			next(new Error("Invalid authentication token"));
		}
	});

	// Connection handler
	io.on("connection", async (socket: AuthenticatedSocket) => {
		console.log(`Client connected: ${socket.id}, learner: ${socket.learnerId}`);

		// Track learner socket
		if (socket.learnerId) {
			if (!learnerSockets.has(socket.learnerId)) {
				learnerSockets.set(socket.learnerId, new Set());
			}
			learnerSockets.get(socket.learnerId)!.add(socket.id);
		}

		// Initialize agent session
		const session: AgentSession = {
			learnerId: socket.learnerId!,
			startTime: new Date(),
			lastActivity: new Date()
		};
		activeSessions.set(socket.id, session);

		// Learning Agent handlers
		socket.on("agent:learning", async (data, callback) => {
			try {
				const session = activeSessions.get(socket.id);
				if (!session) {
					return callback({ error: "No active session" });
				}

				session.lastActivity = new Date();

				// Initialize learning agent if needed
				if (!session.learningAgent) {
					session.learningAgent = new PersonalizedLearningAgent({
						learnerId: session.learnerId,
						openaiApiKey: process.env.OPENAI_API_KEY!,
						model: "gpt-4",
						temperature: 0.7,
						maxTokens: 1500,
						redisHost: process.env.REDIS_HOST || "localhost",
						redisPort: parseInt(process.env.REDIS_PORT || "6379"),
						prisma: prisma
					});

					await session.learningAgent.initialize();
				}

				const agent = session.learningAgent;

				// Route to appropriate method
				switch (data.action) {
					case "start_session": {
						// Already initialized above
						callback({
							success: true,
							sessionId: socket.id,
							agentId: "learning-" + session.learnerId
						});
						break;
					}

					case "process_answer": {
						const result = await agent.processLearnerInteraction({
							learnerId: session.learnerId,
							activityId: data.activityId,
							response: data.answer,
							timestamp: new Date()
						});

						// Emit real-time events
						if (result.shouldAdaptContent) {
							socket.emit("content:adapted", {
								recommendation: result.recommendation,
								reasoning: result.reasoning,
								confidence: result.confidence
							});
						}

						callback({
							success: true,
							result
						});
						break;
					}

					case "get_recommendation": {
						const recommendation = await agent.recommendNextActivity(
							session.learnerId,
							data.context
						);

						callback({
							success: true,
							recommendation
						});
						break;
					}

					default:
						callback({ error: "Unknown action" });
				}
			} catch (error: any) {
				console.error("Learning agent error:", error);
				callback({ error: error.message });
			}
		});

		// Tutor Agent handlers
		socket.on("agent:tutor", async (data, callback) => {
			try {
				const session = activeSessions.get(socket.id);
				if (!session) {
					return callback({ error: "No active session" });
				}

				session.lastActivity = new Date();

				// Initialize tutor agent if needed
				if (!session.tutorAgent) {
					session.tutorAgent = new AITutorAgent({
						learnerId: session.learnerId,
						openaiApiKey: process.env.OPENAI_API_KEY!,
						model: "gpt-4",
						temperature: 0.7,
						maxTokens: 1000,
						redisHost: process.env.REDIS_HOST || "localhost",
						redisPort: parseInt(process.env.REDIS_PORT || "6379")
					});

					await session.tutorAgent.initialize();
				}

				const agent = session.tutorAgent;

				const result = await agent.processInput(
					data.input,
					data.currentActivity,
					data.currentQuestion
				);

				// Emit tutor message event
				socket.emit("tutor:message", {
					response: result.response,
					inputType: result.inputType,
					breakSuggested: result.breakSuggested
				});

				// Emit break suggestion if needed
				if (result.breakSuggested) {
					socket.emit("break:suggested", {
						reason: "Frustration or fatigue detected",
						recommendedBreakDuration: 5
					});
				}

				callback({
					success: true,
					result
				});
			} catch (error: any) {
				console.error("Tutor agent error:", error);
				callback({ error: error.message });
			}
		});

		// Speech Analysis Agent handlers
		socket.on("agent:speech", async (data, callback) => {
			try {
				const session = activeSessions.get(socket.id);
				if (!session) {
					return callback({ error: "No active session" });
				}

				session.lastActivity = new Date();

				// Initialize speech agent if needed
				if (!session.speechAgent) {
					session.speechAgent = new SpeechAnalysisAgent({
						learnerId: session.learnerId,
						openaiApiKey: process.env.OPENAI_API_KEY!,
						model: "gpt-4",
						temperature: 0.3,
						maxTokens: 2000,
						prisma: prisma
					});

					await session.speechAgent.initialize();
				}

				const agent = session.speechAgent;

				// Convert base64 audio to buffer
				const audioBuffer = Buffer.from(data.audioBuffer, "base64");

				const result = await agent.processInput(
					audioBuffer,
					data.targetText,
					data.taskType,
					data.childAge,
					data.sampleRate
				);

				callback({
					success: true,
					result
				});
			} catch (error: any) {
				console.error("Speech agent error:", error);
				callback({ error: error.message });
			}
		});

		// Disconnect handler
		socket.on("disconnect", async (reason) => {
			console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);

			// Cleanup session
			const session = activeSessions.get(socket.id);
			if (session) {
				// Shut down agents
				if (session.learningAgent) {
					await session.learningAgent.shutdown();
				}
				if (session.tutorAgent) {
					await session.tutorAgent.shutdown();
				}
				if (session.speechAgent) {
					await session.speechAgent.shutdown();
				}

				activeSessions.delete(socket.id);
			}

			// Remove from learner sockets
			if (socket.learnerId) {
				const sockets = learnerSockets.get(socket.learnerId);
				if (sockets) {
					sockets.delete(socket.id);
					if (sockets.size === 0) {
						learnerSockets.delete(socket.learnerId);
					}
				}
			}
		});

		// Error handler
		socket.on("error", (error) => {
			console.error(`Socket error for ${socket.id}:`, error);
		});
	});

	// Periodic cleanup of inactive sessions
	setInterval(() => {
		const now = new Date();
		const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

		activeSessions.forEach(async (session, socketId) => {
			const inactiveDuration = now.getTime() - session.lastActivity.getTime();

			if (inactiveDuration > inactiveThreshold) {
				console.log(`Cleaning up inactive session: ${socketId}`);

				// Shut down agents
				if (session.learningAgent) {
					await session.learningAgent.shutdown();
				}
				if (session.tutorAgent) {
					await session.tutorAgent.shutdown();
				}
				if (session.speechAgent) {
					await session.speechAgent.shutdown();
				}

				activeSessions.delete(socketId);

				// Disconnect socket
				const socket = io.sockets.sockets.get(socketId);
				if (socket) {
					socket.disconnect(true);
				}
			}
		});
	}, 5 * 60 * 1000); // Check every 5 minutes

	console.log("WebSocket server initialized");

	return io;
}

/**
 * Broadcast event to all sockets for a specific learner
 */
export function broadcastToLearner(
	io: SocketIOServer,
	learnerId: string,
	event: string,
	data: any
) {
	const sockets = learnerSockets.get(learnerId);
	if (sockets) {
		sockets.forEach((socketId) => {
			const socket = io.sockets.sockets.get(socketId);
			if (socket) {
				socket.emit(event, data);
			}
		});
	}
}

/**
 * Get active session count
 */
export function getActiveSessionCount(): number {
	return activeSessions.size;
}

/**
 * Get session info for a learner
 */
export function getSessionInfo(learnerId: string): AgentSession | undefined {
	for (const [, session] of activeSessions) {
		if (session.learnerId === learnerId) {
			return session;
		}
	}
	return undefined;
}
