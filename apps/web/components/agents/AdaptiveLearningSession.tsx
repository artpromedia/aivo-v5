/**
 * Adaptive Learning Session Component
 * 
 * Manages real-time agent interactions during a learning session.
 * Handles activity changes, content adaptations, tutor messages, and break suggestions.
 */

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAgents, useLearningAgent, useTutorAgent, useSpeechAgent } from "./AgentProvider";

interface Activity {
	id: string;
	type: string;
	content: any;
	difficulty: number;
}

interface AdaptiveLearningSessionProps {
	learnerId: string;
	subject: string;
	gradeLevel?: number;
	onActivityChange?: (activity: Activity) => void;
	onBreakSuggested?: (reason: string, duration: number) => void;
	onError?: (error: string) => void;
}

export function AdaptiveLearningSession({
	learnerId,
	subject,
	gradeLevel,
	onActivityChange,
	onBreakSuggested,
	onError
}: AdaptiveLearningSessionProps) {
	const { connected, subscribe, unsubscribe, error: connectionError } = useAgents();
	const { startSession, processAnswer, getRecommendation } = useLearningAgent();
	const { sendInput: sendTutorInput } = useTutorAgent();

	const [sessionActive, setSessionActive] = useState(false);
	const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
	const [loading, setLoading] = useState(false);
	const [tutorMessage, setTutorMessage] = useState<string | null>(null);
	const [showBreakSuggestion, setShowBreakSuggestion] = useState(false);
	const [breakReason, setBreakReason] = useState("");

	// Initialize session when connected
	useEffect(() => {
		if (connected && !sessionActive) {
			initializeSession();
		}
	}, [connected]);

	// Subscribe to real-time events
	useEffect(() => {
		if (!connected) return;

		const handleContentAdapted = (data: any) => {
			console.log("Content adapted:", data);
			if (data.recommendation) {
				loadNextActivity(data.recommendation);
			}
		};

		const handleTutorMessage = (data: any) => {
			console.log("Tutor message:", data);
			setTutorMessage(data.response);
		};

		const handleBreakSuggestion = (data: any) => {
			console.log("Break suggested:", data);
			setShowBreakSuggestion(true);
			setBreakReason(data.reason);
			onBreakSuggested?.(data.reason, data.recommendedBreakDuration);
		};

		subscribe("content:adapted", handleContentAdapted);
		subscribe("tutor:message", handleTutorMessage);
		subscribe("break:suggested", handleBreakSuggestion);

		return () => {
			unsubscribe("content:adapted", handleContentAdapted);
			unsubscribe("tutor:message", handleTutorMessage);
			unsubscribe("break:suggested", handleBreakSuggestion);
		};
	}, [connected, subscribe, unsubscribe, onBreakSuggested]);

	// Handle connection errors
	useEffect(() => {
		if (connectionError) {
			onError?.(connectionError);
		}
	}, [connectionError, onError]);

	const initializeSession = async () => {
		try {
			setLoading(true);
			
			const result = await startSession({
				subject,
				gradeLevel
			});

			console.log("Session started:", result);
			setSessionActive(true);

			// Load initial activity
			const recommendation = await getRecommendation({
				context: {
					subject,
					gradeLevel,
					isFirstActivity: true
				}
			});

			if (recommendation) {
				loadNextActivity(recommendation);
			}
		} catch (error: any) {
			console.error("Failed to initialize session:", error);
			onError?.(error.message);
		} finally {
			setLoading(false);
		}
	};

	const loadNextActivity = useCallback(
		(recommendation: any) => {
			const activity: Activity = {
				id: recommendation.activityId || `activity-${Date.now()}`,
				type: recommendation.type || "question",
				content: recommendation.content,
				difficulty: recommendation.difficulty || 5
			};

			setCurrentActivity(activity);
			onActivityChange?.(activity);
		},
		[onActivityChange]
	);

	const handleAnswer = useCallback(
		async (answer: any) => {
			if (!currentActivity) return;

			try {
				setLoading(true);

				const result = await processAnswer({
					answer,
					questionId: currentActivity.id,
					activityId: currentActivity.id
				});

				console.log("Answer processed:", result);

				// Content adaptation happens via WebSocket event
				// No need to manually load next activity here
			} catch (error: any) {
				console.error("Failed to process answer:", error);
				onError?.(error.message);
			} finally {
				setLoading(false);
			}
		},
		[currentActivity, processAnswer, onError]
	);

	const askTutor = useCallback(
		async (question: string) => {
			try {
				setLoading(true);
				setTutorMessage(null);

				await sendTutorInput({
					input: question,
					inputType: "question",
					currentActivity: currentActivity ? {
						id: currentActivity.id,
						type: currentActivity.type,
						content: currentActivity.content
					} : undefined
				});

				// Tutor response comes via WebSocket event
			} catch (error: any) {
				console.error("Failed to ask tutor:", error);
				onError?.(error.message);
			} finally {
				setLoading(false);
			}
		},
		[currentActivity, sendTutorInput, onError]
	);

	const dismissBreakSuggestion = useCallback(() => {
		setShowBreakSuggestion(false);
		setBreakReason("");
	}, []);

	const takeBreak = useCallback(() => {
		setShowBreakSuggestion(false);
		setBreakReason("");
		// Implement break logic here
		// e.g., pause session, show break screen, set timer
	}, []);

	if (!connected) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p className="text-gray-600">Connecting to learning agents...</p>
				</div>
			</div>
		);
	}

	if (connectionError) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
					<h3 className="text-red-800 font-semibold mb-2">Connection Error</h3>
					<p className="text-red-600">{connectionError}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-6">
			{/* Header */}
			<div className="mb-6">
				<h2 className="text-2xl font-bold text-gray-900">
					{subject} Learning Session
				</h2>
				<p className="text-gray-600">
					Grade Level: {gradeLevel || "Adaptive"}
				</p>
			</div>

			{/* Current Activity */}
			{currentActivity && (
				<div className="bg-white rounded-lg shadow-md p-6 mb-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-gray-900">
							Current Activity
						</h3>
						<div className="flex items-center space-x-2">
							<span className="text-sm text-gray-500">Difficulty:</span>
							<div className="flex space-x-1">
								{[...Array(10)].map((_, i) => (
									<div
										key={i}
										className={`h-2 w-2 rounded-full ${
											i < currentActivity.difficulty
												? "bg-blue-500"
												: "bg-gray-300"
										}`}
									/>
								))}
							</div>
						</div>
					</div>

					<div className="prose max-w-none">
						{/* Render activity content based on type */}
						{typeof currentActivity.content === "string" ? (
							<p>{currentActivity.content}</p>
						) : (
							<pre className="bg-gray-50 p-4 rounded">
								{JSON.stringify(currentActivity.content, null, 2)}
							</pre>
						)}
					</div>

					{/* Answer Input */}
					<div className="mt-6">
						<textarea
							className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="Type your answer here..."
							rows={4}
							disabled={loading}
							onKeyDown={(e) => {
								if (e.key === "Enter" && e.ctrlKey) {
									handleAnswer(e.currentTarget.value);
								}
							}}
						/>
						<div className="flex justify-between items-center mt-2">
							<button
								onClick={() => {
									const textarea = document.querySelector("textarea");
									if (textarea && textarea.value) {
										askTutor(textarea.value);
									}
								}}
								disabled={loading}
								className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
							>
								Ask Tutor for Help
							</button>
							<button
								onClick={() => {
									const textarea = document.querySelector("textarea");
									if (textarea && textarea.value) {
										handleAnswer(textarea.value);
										textarea.value = "";
									}
								}}
								disabled={loading}
								className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{loading ? "Processing..." : "Submit Answer"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Tutor Message */}
			{tutorMessage && (
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
					<div className="flex items-start space-x-3">
						<div className="flex-shrink-0">
							<svg
								className="h-6 w-6 text-blue-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
								/>
							</svg>
						</div>
						<div className="flex-1">
							<h4 className="text-blue-900 font-medium mb-1">AI Tutor</h4>
							<p className="text-blue-800">{tutorMessage}</p>
						</div>
						<button
							onClick={() => setTutorMessage(null)}
							className="flex-shrink-0 text-blue-400 hover:text-blue-600"
						>
							<svg
								className="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				</div>
			)}

			{/* Break Suggestion */}
			{showBreakSuggestion && (
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
					<h3 className="text-yellow-900 font-semibold mb-2">
						Time for a Break?
					</h3>
					<p className="text-yellow-800 mb-4">{breakReason}</p>
					<div className="flex space-x-3">
						<button
							onClick={takeBreak}
							className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
						>
							Take a Break
						</button>
						<button
							onClick={dismissBreakSuggestion}
							className="bg-white text-yellow-700 border border-yellow-300 px-4 py-2 rounded-lg hover:bg-yellow-50"
						>
							Continue Learning
						</button>
					</div>
				</div>
			)}

			{/* Loading State */}
			{loading && !currentActivity && (
				<div className="flex items-center justify-center p-12">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
						<p className="text-gray-600">Loading your next activity...</p>
					</div>
				</div>
			)}
		</div>
	);
}
