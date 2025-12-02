/**
 * WebSocket Server for Real-Time Agent Communication
 * 
 * Provides Socket.IO server for bidirectional communication between
 * frontend and agent system. Handles authentication, routing, and
 * real-time event broadcasting.
 */

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { PersonalizedLearningAgent } from "@aivo/agents";
import { AITutorAgent } from "@aivo/agents";
import { SpeechAnalysisAgent } from "@aivo/agents";
import { Registry, Counter, Gauge, Histogram } from "prom-client";

const prisma = new PrismaClient();

// Prometheus metrics registry
const metricsRegistry = new Registry();

// WebSocket Metrics
const wsConnections = new Gauge({
	name: "websocket_connections_total",
	help: "Total number of active WebSocket connections",
	registers: [metricsRegistry]
});

const wsConnectionsTotal = new Counter({
	name: "websocket_connections_count",
	help: "Total count of WebSocket connections established",
	registers: [metricsRegistry]
});

const wsDisconnectionsTotal = new Counter({
	name: "websocket_disconnections_total",
	help: "Total count of WebSocket disconnections",
	labelNames: ["reason"],
	registers: [metricsRegistry]
});

const wsMessagesSent = new Counter({
	name: "websocket_messages_sent_total",
	help: "Total number of messages sent via WebSocket",
	labelNames: ["event"],
	registers: [metricsRegistry]
});

const wsMessagesReceived = new Counter({
	name: "websocket_messages_received_total",
	help: "Total number of messages received via WebSocket",
	labelNames: ["event"],
	registers: [metricsRegistry]
});

const wsMessageLatency = new Histogram({
	name: "websocket_message_latency_ms",
	help: "WebSocket message processing latency in milliseconds",
	labelNames: ["event"],
	buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
	registers: [metricsRegistry]
});

const wsErrors = new Counter({
	name: "websocket_errors_total",
	help: "Total number of WebSocket errors",
	labelNames: ["type"],
	registers: [metricsRegistry]
});

const wsActiveSessions = new Gauge({
	name: "websocket_active_sessions",
	help: "Number of active agent sessions",
	registers: [metricsRegistry]
});

export { metricsRegistry };

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

// Rate limiting: connection ID -> message timestamps
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_MESSAGES = 100; // Max 100 messages per minute

/**
 * Check if connection has exceeded rate limit
 */
function checkRateLimit(socketId: string): boolean {
	const now = Date.now();
	const timestamps = rateLimitStore.get(socketId) || [];
	
	// Remove old timestamps outside the window
	const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
	
	if (validTimestamps.length >= RATE_LIMIT_MAX_MESSAGES) {
		return false; // Rate limit exceeded
	}
	
	validTimestamps.push(now);
	rateLimitStore.set(socketId, validTimestamps);
	return true;
}

/**
 * Clear rate limit data for a socket
 */
function clearRateLimit(socketId: string): void {
	rateLimitStore.delete(socketId);
}

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

	// Setup Redis adapter for horizontal scaling
	if (process.env.REDIS_HOST) {
		const redisOptions = {
			host: process.env.REDIS_HOST,
			port: parseInt(process.env.REDIS_PORT || "6379", 10),
			password: process.env.REDIS_PASSWORD
		};
		const pubClient = new Redis(redisOptions);
		const subClient = pubClient.duplicate();

		io.adapter(createAdapter(pubClient as any, subClient as any));
		console.log("✅ Redis adapter connected for horizontal scaling");
	} else {
		console.log("ℹ️  Running without Redis adapter (single instance mode)");
	}

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
			const decoded = jwt.verify(token, jwtSecret) as any;

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
		
		// Update metrics
		wsConnections.inc();
		wsConnectionsTotal.inc();
		wsActiveSessions.set(activeSessions.size);

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

		// Emit connection quality info
		socket.emit("connection:quality", {
			latency: socket.handshake.query.latency || 0,
			quality: "good",
			timestamp: new Date().toISOString()
		});

		// Learning Agent handlers
		socket.on("agent:learning", async (data, callback) => {
			const startTime = Date.now();
			
			// Check rate limit
			if (!checkRateLimit(socket.id)) {
				wsErrors.inc({ type: "rate_limit" });
				return callback({ 
					error: "Rate limit exceeded. Please slow down.",
					rateLimited: true
				});
			}
			
			// Update metrics
			wsMessagesReceived.inc({ event: "agent:learning" });
			
			try {
				const session = activeSessions.get(socket.id);
				if (!session) {
					wsErrors.inc({ type: "no_session" });
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
						wsMessagesSent.inc({ event: "session:started" });
						callback({
							success: true,
							sessionId: socket.id,
							agentId: "learning-" + session.learnerId
						});
						
						// Record latency
						wsMessageLatency.observe({ event: "agent:learning" }, Date.now() - startTime);
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
							wsMessagesSent.inc({ event: "content:adapted" });
						}

						// Record latency
						wsMessageLatency.observe({ event: "agent:learning" }, Date.now() - startTime);
						
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

						// Record latency
						wsMessageLatency.observe({ event: "agent:learning" }, Date.now() - startTime);
						
						callback({
							success: true,
							recommendation
						});
						break;
					}

					default:
						wsErrors.inc({ type: "unknown_action" });
						callback({ error: "Unknown action" });
				}
			} catch (error: any) {
				console.error("Learning agent error:", error);
				wsErrors.inc({ type: "agent_error" });
				wsMessageLatency.observe({ event: "agent:learning" }, Date.now() - startTime);
				callback({ error: error.message });
			}
		});

		// Tutor Agent handlers
		socket.on("agent:tutor", async (data, callback) => {
			const startTime = Date.now();
			
			// Check rate limit
			if (!checkRateLimit(socket.id)) {
				wsErrors.inc({ type: "rate_limit" });
				return callback({ 
					error: "Rate limit exceeded. Please slow down.",
					rateLimited: true
				});
			}
			
			wsMessagesReceived.inc({ event: "agent:tutor" });
			
			try {
				const session = activeSessions.get(socket.id);
				if (!session) {
					wsErrors.inc({ type: "no_session" });
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
				wsMessagesSent.inc({ event: "tutor:message" });

				// Emit break suggestion if needed
				if (result.breakSuggested) {
					socket.emit("break:suggested", {
						reason: "Frustration or fatigue detected",
						recommendedBreakDuration: 5
					});
					wsMessagesSent.inc({ event: "break:suggested" });
				}

				wsMessageLatency.observe({ event: "agent:tutor" }, Date.now() - startTime);
				
				callback({
					success: true,
					result
				});
			} catch (error: any) {
				console.error("Tutor agent error:", error);
				wsErrors.inc({ type: "agent_error" });
				wsMessageLatency.observe({ event: "agent:tutor" }, Date.now() - startTime);
				callback({ error: error.message });
			}
		});

		// Speech Analysis Agent handlers
		socket.on("agent:speech", async (data, callback) => {
			const startTime = Date.now();
			
			// Check rate limit
			if (!checkRateLimit(socket.id)) {
				wsErrors.inc({ type: "rate_limit" });
				return callback({ 
					error: "Rate limit exceeded. Please slow down.",
					rateLimited: true
				});
			}
			
			wsMessagesReceived.inc({ event: "agent:speech" });
			
			try {
				const session = activeSessions.get(socket.id);
				if (!session) {
					wsErrors.inc({ type: "no_session" });
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

				wsMessageLatency.observe({ event: "agent:speech" }, Date.now() - startTime);
				
				callback({
					success: true,
					result
				});
			} catch (error: any) {
				console.error("Speech agent error:", error);
				wsErrors.inc({ type: "agent_error" });
				wsMessageLatency.observe({ event: "agent:speech" }, Date.now() - startTime);
				callback({ error: error.message });
			}
		});

		// Disconnect handler
		socket.on("disconnect", async (reason) => {
			console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
			
			// Update metrics
			wsConnections.dec();
			wsDisconnectionsTotal.inc({ reason });
			wsActiveSessions.set(activeSessions.size - 1);
			
			// Clear rate limit
			clearRateLimit(socket.id);

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
			wsErrors.inc({ type: "socket_error" });
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
