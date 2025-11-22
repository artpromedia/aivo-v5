/**
 * Agent Provider - React Context for Agent Communication
 * 
 * Provides WebSocket-based real-time communication with agents.
 * Handles connection management, event subscriptions, and error recovery.
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface AgentContextType {
	connected: boolean;
	connecting: boolean;
	error: string | null;
	sendMessage: (agentType: string, message: any) => Promise<any>;
	subscribe: (event: string, handler: (data: any) => void) => void;
	unsubscribe: (event: string, handler: (data: any) => void) => void;
	reconnect: () => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

interface AgentProviderProps {
	children: React.ReactNode;
	learnerId?: string;
	autoConnect?: boolean;
}

export function AgentProvider({ 
	children, 
	learnerId,
	autoConnect = true 
}: AgentProviderProps) {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [connected, setConnected] = useState(false);
	const [connecting, setConnecting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttemptsRef = useRef(0);

	const MAX_RECONNECT_ATTEMPTS = 5;
	const RECONNECT_DELAY = 2000;

	const connect = useCallback(() => {
		if (connecting || connected) return;

		setConnecting(true);
		setError(null);

		const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
		const authToken = typeof window !== "undefined" 
			? sessionStorage.getItem("auth_token") 
			: null;

		const newSocket = io(socketUrl, {
			transports: ["websocket", "polling"],
			auth: {
				token: authToken,
				learnerId: learnerId
			},
			reconnection: true,
			reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
			reconnectionDelay: RECONNECT_DELAY,
			timeout: 10000
		});

		newSocket.on("connect", () => {
			console.log("Connected to agent server:", newSocket.id);
			setConnected(true);
			setConnecting(false);
			setError(null);
			reconnectAttemptsRef.current = 0;
		});

		newSocket.on("disconnect", (reason) => {
			console.log("Disconnected from agent server:", reason);
			setConnected(false);

			if (reason === "io server disconnect") {
				// Server disconnected us, try to reconnect
				scheduleReconnect();
			}
		});

		newSocket.on("connect_error", (err) => {
			console.error("Connection error:", err.message);
			setConnecting(false);
			setError(`Connection failed: ${err.message}`);

			if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
				scheduleReconnect();
			} else {
				setError("Max reconnection attempts reached");
			}
		});

		newSocket.on("error", (err) => {
			console.error("Socket error:", err);
			setError(err.message || "Unknown error");
		});

		// Agent-specific events
		newSocket.on("activity:change", (data) => {
			console.log("Activity changed:", data);
		});

		newSocket.on("content:adapted", (data) => {
			console.log("Content adapted:", data);
		});

		newSocket.on("tutor:message", (data) => {
			console.log("Tutor message:", data);
		});

		newSocket.on("break:suggested", (data) => {
			console.log("Break suggested:", data);
		});

		setSocket(newSocket);

		return () => {
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
			newSocket.close();
		};
	}, [connecting, connected, learnerId]);

	const scheduleReconnect = useCallback(() => {
		if (reconnectTimeoutRef.current) return;

		reconnectAttemptsRef.current++;
		const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current - 1);

		console.log(`Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`);

		reconnectTimeoutRef.current = setTimeout(() => {
			reconnectTimeoutRef.current = null;
			connect();
		}, delay);
	}, [connect]);

	const reconnect = useCallback(() => {
		if (socket) {
			socket.close();
		}
		reconnectAttemptsRef.current = 0;
		setConnecting(false);
		setConnected(false);
		connect();
	}, [socket, connect]);

	useEffect(() => {
		if (autoConnect) {
			connect();
		}

		return () => {
			if (socket) {
				socket.close();
			}
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
		};
	}, [autoConnect, connect]);

	const sendMessage = useCallback(
		async (agentType: string, message: any): Promise<any> => {
			if (!socket) {
				throw new Error("Not connected to agent server");
			}

			if (!connected) {
				throw new Error("Socket not connected");
			}

			return new Promise((resolve, reject) => {
				const timeout = setTimeout(() => {
					reject(new Error("Agent response timeout"));
				}, 30000); // 30 second timeout

				socket.emit(`agent:${agentType}`, message, (response: any) => {
					clearTimeout(timeout);

					if (response.error) {
						reject(new Error(response.error));
					} else {
						resolve(response);
					}
				});
			});
		},
		[socket, connected]
	);

	const subscribe = useCallback(
		(event: string, handler: (data: any) => void) => {
			if (socket) {
				socket.on(event, handler);
			}
		},
		[socket]
	);

	const unsubscribe = useCallback(
		(event: string, handler: (data: any) => void) => {
			if (socket) {
				socket.off(event, handler);
			}
		},
		[socket]
	);

	const value: AgentContextType = {
		connected,
		connecting,
		error,
		sendMessage,
		subscribe,
		unsubscribe,
		reconnect
	};

	return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgents() {
	const context = useContext(AgentContext);

	if (context === undefined) {
		throw new Error("useAgents must be used within an AgentProvider");
	}

	return context;
}

/**
 * Hook for learning agent interactions
 */
export function useLearningAgent() {
	const { sendMessage } = useAgents();

	const startSession = useCallback(
		async (data: { subject: string; gradeLevel?: number }) => {
			return sendMessage("learning", {
				action: "start_session",
				...data
			});
		},
		[sendMessage]
	);

	const processAnswer = useCallback(
		async (data: { answer: any; questionId: string; activityId: string }) => {
			return sendMessage("learning", {
				action: "process_answer",
				...data
			});
		},
		[sendMessage]
	);

	const getRecommendation = useCallback(
		async (data: { context: any }) => {
			return sendMessage("learning", {
				action: "get_recommendation",
				...data
			});
		},
		[sendMessage]
	);

	return {
		startSession,
		processAnswer,
		getRecommendation
	};
}

/**
 * Hook for tutor agent interactions
 */
export function useTutorAgent() {
	const { sendMessage } = useAgents();

	const sendInput = useCallback(
		async (data: {
			input: string;
			inputType?: "question" | "answer" | "frustration" | "confusion";
			currentActivity?: any;
			currentQuestion?: any;
		}) => {
			return sendMessage("tutor", {
				...data
			});
		},
		[sendMessage]
	);

	const requestHint = useCallback(
		async (data: { questionId: string; hintLevel?: number }) => {
			return sendMessage("tutor", {
				action: "request_hint",
				...data
			});
		},
		[sendMessage]
	);

	return {
		sendInput,
		requestHint
	};
}

/**
 * Hook for speech analysis
 */
export function useSpeechAgent() {
	const { sendMessage } = useAgents();

	const analyzeSpeech = useCallback(
		async (data: {
			audioBuffer: ArrayBuffer;
			targetText?: string;
			taskType?: "articulation" | "fluency" | "language" | "conversation";
			childAge: number;
		}) => {
			// Convert ArrayBuffer to base64
			const buffer = Buffer.from(data.audioBuffer);
			const base64Audio = buffer.toString("base64");

			return sendMessage("speech", {
				audioBuffer: base64Audio,
				targetText: data.targetText,
				taskType: data.taskType,
				childAge: data.childAge,
				sampleRate: 16000
			});
		},
		[sendMessage]
	);

	return {
		analyzeSpeech
	};
}
