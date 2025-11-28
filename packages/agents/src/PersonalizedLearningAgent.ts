import { BaseAgent, AgentResponse, AgentConfig, AgentState } from "./lib/agents/base/AgentFramework";
import type { OpenAI } from "openai";
import type { PrismaClient } from "@prisma/client";
import * as tf from "@tensorflow/tfjs-node";
import { ModelTrainer } from "./ml/ModelTrainer";
import * as path from "path";
import * as fs from "fs/promises";

export interface LearningContext {
	currentActivity: any;
	recentPerformance: PerformanceMetrics;
	sessionDuration: number;
	lastBreakTime: number;
	emotionalState?: EmotionalState;
	focusLevel: number;
	strugglesDetected: string[];
}

export interface PerformanceMetrics {
	accuracy: number;
	responseTime: number[];
	hintsUsed: number;
	attemptsPerQuestion: number[];
	consecutiveCorrect: number;
	consecutiveIncorrect: number;
	engagementScore: number;
}

export interface EmotionalState {
	primary: "happy" | "frustrated" | "confused" | "bored" | "confident" | "anxious";
	confidence: number;
	indicators: Record<string, number>;
}

export interface LearningDecision {
	action: "continue" | "adjust_difficulty" | "take_break" | "provide_help" | "change_activity";
	details: {
		reason: string;
		newDifficulty?: number;
		breakType?: string;
		helpType?: string;
		newActivityId?: string;
	};
	confidence: number;
	adaptations: ContentAdaptation[];
}

export interface ContentAdaptation {
	type: string;
	modification: any;
	reason: string;
}

interface LearnerProfileWithRelations {
	id: string;
	firstName: string;
	age: number;
	diagnoses: Array<{ type: string }>;
	accommodations: Array<{ type: string }>;
	learningPreferences: any;
	progressHistory: Array<{
		accuracy: number;
		engagement: number;
		difficulty?: number;
		createdAt: Date;
	}>;
	derivedMetrics?: {
		averageAccuracy: number;
		learningVelocity: number;
		optimalSessionLength: number;
		preferredDifficulty: number;
	};
}

interface SessionState {
	startTime: Date;
	decisionsMade: number;
	adaptations: any[];
	sessionId?: string;
}

interface AnalysisResult {
	performanceLevel: "struggling" | "developing" | "proficient" | "mastery";
	engagementLevel: "low" | "medium" | "high";
	cognitiveLoad: "low" | "optimal" | "high" | "overload";
	emotionalState: EmotionalState;
	needsIntervention: {
		urgent: boolean;
		reasons: string[];
	};
	modelPrediction: any;
	recommendations: string[];
}

export class PersonalizedLearningAgent extends BaseAgent {
	private prisma: PrismaClient;
	private learnerProfile: LearnerProfileWithRelations | null = null;
	private currentSession: SessionState;
	private adaptationHistory: LearningDecision[] = [];
	private mlModel: tf.LayersModel | null = null;
	private modelTrainer: ModelTrainer | null = null;
	private useMLModel: boolean = false;
	private mlConfidenceThreshold: number = 0.75;
	private useFederatedLearning: boolean = false;
	private clonedModelPath: string | null = null;

	constructor(config: AgentConfig, prisma: PrismaClient) {
		super(config);
		this.prisma = prisma;
		this.currentSession = {
			startTime: new Date(),
			decisionsMade: 0,
			adaptations: []
		};
		
		// Check if federated learning is enabled
		this.useFederatedLearning = process.env.USE_FEDERATED_LEARNING === "true";
	}

	/**
	 * Initialize agent-specific components
	 */
	protected async initializeSpecificComponents(): Promise<void> {
		// Load learner profile
		await this.loadLearnerProfile();

		// Try to load ML model
		await this.loadMLModel();

		// Initialize session
		this.currentSession = {
			startTime: new Date(),
			decisionsMade: 0,
			adaptations: []
		};

		// Set up learning parameters
		this.setupLearningParameters();
	}

	/**
	 * Load ML model if available
	 */
	private async loadMLModel(): Promise<void> {
		try {
			// First, try to load federated learning model (cloned model for this learner)
			if (this.useFederatedLearning) {
				await this.loadFederatedModel();
				if (this.mlModel) {
					console.log("✓ Federated learning model loaded successfully");
					return;
				}
			}

			// Fall back to shared model
			const modelPath = path.join(process.cwd(), "models", "personalized-learning");
			
			// Check if model exists
			try {
				await fs.access(path.join(modelPath, "model.json"));
			} catch {
				console.log("ML model not found, will use GPT-4 only");
				return;
			}

			// Initialize model trainer (for prediction utilities)
			this.modelTrainer = new ModelTrainer();
			
			// Load model
			this.mlModel = await this.modelTrainer.loadModel(modelPath);
			this.useMLModel = true;
			
			console.log("✓ Shared ML model loaded successfully");
		} catch (error) {
			console.error("Failed to load ML model:", error);
			this.useMLModel = false;
		}
	}

	/**
	 * Load federated learning model (learner-specific cloned model)
	 */
	private async loadFederatedModel(): Promise<void> {
		try {
			// Check database for cloned model path
			const personalizedModel = await this.prisma.personalizedModel.findUnique({
				where: { learnerId: this.learnerId }
			});

			if (!personalizedModel) {
				console.log("No personalized model found in database");
				return;
			}

			// Check metadata field (will be available after migration)
			const metadata = (personalizedModel as any).metadata;
			if (!metadata) {
				console.log("No metadata found for model (run migration if not done)");
				return;
			}

			if (!metadata.federatedLearning || !metadata.clonedModelPath) {
				console.log("Model is not a federated learning model");
				return;
			}

			// Load the cloned model
			const modelPath = metadata.clonedModelPath;
			this.clonedModelPath = modelPath;

			// Check if model exists
			await fs.access(path.join(modelPath, "model.json"));

			// Load model using TensorFlow
			this.mlModel = await tf.loadLayersModel(`file://${modelPath}/model.json`);
			this.useMLModel = true;

			console.log(`✓ Loaded federated model from: ${modelPath}`);
			console.log(`  Total params: ${metadata.architecture?.totalParams || "unknown"}`);
			console.log(`  Trainable params: ${metadata.architecture?.trainableParams || "unknown"}`);
		} catch (error) {
			console.log("Failed to load federated model, will fall back:", error);
			this.mlModel = null;
			this.useMLModel = false;
		}
	}

	/**
	 * Load complete learner profile
	 */
	private async loadLearnerProfile(): Promise<void> {
		const profile = await this.prisma.learner.findUnique({
			where: { id: this.learnerId },
			include: {
				diagnoses: true,
				progress: {
					orderBy: { date: "desc" },
					take: 10
				}
			}
		});

		if (!profile) {
			throw new Error(`Learner ${this.learnerId} not found`);
		}

		// Transform to expected format with derived metrics
		this.learnerProfile = {
			id: profile.id,
			firstName: profile.firstName,
			age: new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear(),
			diagnoses: profile.diagnoses.map((d: any) => ({ type: d.type || d.description })),
			accommodations: [],
			learningPreferences: (profile.accommodations as any) || {},
			progressHistory: [],
			derivedMetrics: {
				averageAccuracy: 0.75,
				learningVelocity: 0.05,
				optimalSessionLength: this.calculateOptimalSessionLength(
					new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear(),
					{}
				),
				preferredDifficulty: 5
			}
		};
	}

	/**
	 * Process input and make learning decision
	 */
	async processInput(input: LearningContext): Promise<AgentResponse> {
		this.state.status = "processing";

		// Normalize input with defaults to handle missing fields
		const normalizedInput: LearningContext = {
			...input,
			recentPerformance: {
				accuracy: input.recentPerformance?.accuracy ?? 70,
				responseTime: input.recentPerformance?.responseTime ?? [],
				hintsUsed: input.recentPerformance?.hintsUsed ?? 0,
				attemptsPerQuestion: input.recentPerformance?.attemptsPerQuestion ?? [],
				consecutiveCorrect: input.recentPerformance?.consecutiveCorrect ?? 0,
				consecutiveIncorrect: input.recentPerformance?.consecutiveIncorrect ?? 0,
				engagementScore: input.recentPerformance?.engagementScore ?? 50
			},
			focusLevel: input.focusLevel ?? 50,
			strugglesDetected: input.strugglesDetected ?? []
		};

		try {
			// Analyze current learning state
			const analysis = await this.analyzeLearningState(normalizedInput);

			// Make decision based on analysis
			const decision = await this.makeLearningDecision(analysis, normalizedInput);

			// Apply accommodations if needed
			const adaptedDecision = await this.applyAccommodations(decision);

			// Generate personalized feedback
			const feedback = await this.generatePersonalizedFeedback(normalizedInput, adaptedDecision);

			// Update memory
			this.updateLearningMemory(normalizedInput, decision);

			// Save decision for analysis
			this.adaptationHistory.push(decision);
			this.currentSession.decisionsMade++;

			return {
				action: decision.action,
				confidence: decision.confidence,
				reasoning: decision.details.reason,
				data: {
					decision: adaptedDecision,
					feedback,
					nextSteps: this.determineNextSteps(decision)
				},
				recommendations: await this.generateRecommendations(analysis)
			};
		} finally {
			this.state.status = "idle";
		}
	}

	/**
	 * Analyze current learning state
	 */
	private async analyzeLearningState(context: LearningContext): Promise<AnalysisResult> {
		// Assess different dimensions
		const performanceLevel = this.assessPerformanceLevel(context.recentPerformance);
		const engagementLevel = this.assessEngagementLevel(context);
		const cognitiveLoad = this.assessCognitiveLoad(context);
		const emotionalState =
			context.emotionalState || (await this.inferEmotionalState(context));
		const needsIntervention = this.checkInterventionNeeded(context);

		const analysis: AnalysisResult = {
			performanceLevel,
			engagementLevel,
			cognitiveLoad,
			emotionalState,
			needsIntervention,
			modelPrediction: null,
			recommendations: []
		};

		// Check for specific patterns
		if (this.detectFrustration(context)) {
			analysis.recommendations.push("reduce_difficulty");
			analysis.recommendations.push("provide_encouragement");
		}

		if (this.detectBoredom(context)) {
			analysis.recommendations.push("increase_difficulty");
			analysis.recommendations.push("introduce_variety");
		}

		if (this.needsBreak(context)) {
			analysis.recommendations.push("schedule_break");
		}

		return analysis;
	}

	/**
	 * Make learning decision based on analysis
	 */
	private async makeLearningDecision(
		analysis: AnalysisResult,
		context: LearningContext
	): Promise<LearningDecision> {
		// Decision tree logic for urgent cases
		if (analysis.needsIntervention.urgent) {
			return this.createInterventionDecision(analysis, context);
		}

		if (context.sessionDuration - context.lastBreakTime > this.getBreakInterval()) {
			return this.createBreakDecision(context);
		}

		if (analysis.performanceLevel === "struggling") {
			return this.createSupportDecision(analysis, context);
		}

		if (analysis.performanceLevel === "mastery" && analysis.engagementLevel === "high") {
			return this.createAdvancementDecision(analysis, context);
		}

		// Try ML model prediction first
		if (this.useMLModel && this.mlModel && this.modelTrainer) {
			try {
				const mlDecision = await this.predictWithMLModel(context);
				
				// Use ML prediction if confidence is high enough
				if (mlDecision.confidence >= this.mlConfidenceThreshold) {
					console.log(`Using ML prediction (confidence: ${mlDecision.confidence.toFixed(2)})`);
					return mlDecision;
				}
				
				console.log(`ML confidence too low (${mlDecision.confidence.toFixed(2)}), falling back to GPT-4`);
			} catch (error) {
				console.error("ML prediction failed:", error);
			}
		}

		// Fallback to GPT-4 for nuanced decisions
		const aiDecision = await this.getAIDecision(analysis, context);

		return aiDecision;
	}

	/**
	 * Predict learning decision using ML model
	 */
	private async predictWithMLModel(context: LearningContext): Promise<LearningDecision> {
		if (!this.mlModel || !this.modelTrainer || !this.learnerProfile) {
			throw new Error("ML model or learner profile not loaded");
		}

		// Prepare features for prediction
		const features = {
			difficulty: context.currentActivity?.difficulty || 5,
			accuracy: context.recentPerformance.accuracy,
			avgResponseTime: this.average(context.recentPerformance.responseTime),
			hintsUsed: context.recentPerformance.hintsUsed,
			avgAttemptsPerQuestion: this.average(context.recentPerformance.attemptsPerQuestion),
			consecutiveCorrect: context.recentPerformance.consecutiveCorrect,
			consecutiveIncorrect: context.recentPerformance.consecutiveIncorrect,
			engagementScore: context.recentPerformance.engagementScore,
			sessionDuration: context.sessionDuration,
			timeSinceBreak: context.sessionDuration - context.lastBreakTime,
			focusLevel: context.focusLevel,
			strugglesCount: context.strugglesDetected.length,
			age: this.learnerProfile.age,
			hasADHD: this.learnerProfile.diagnoses.some(d => d.type === "ADHD"),
			hasDyslexia: this.learnerProfile.diagnoses.some(d => d.type === "Dyslexia"),
			hasAutism: this.learnerProfile.diagnoses.some(d => d.type === "Autism"),
			gradeLevel: this.learnerProfile.age - 5
		};

		// Get prediction from model
		const prediction = this.modelTrainer.predict(this.mlModel, features);

		// Convert prediction to LearningDecision
		const decision: LearningDecision = {
			action: prediction.action as LearningDecision["action"],
			details: {
				reason: `ML Model prediction (${Object.entries(prediction.probabilities)
					.map(([action, prob]) => `${action}: ${(prob * 100).toFixed(1)}%`)
					.join(", ")})`,
				...this.getDecisionDetails(prediction.action, context)
			},
			confidence: prediction.confidence,
			adaptations: this.generateAdaptations(prediction.action, context)
		};

		return decision;
	}

	/**
	 * Get decision details based on action type
	 */
	private getDecisionDetails(
		action: string,
		context: LearningContext
	): Partial<LearningDecision["details"]> {
		const currentDifficulty = context.currentActivity?.difficulty || 5;

		switch (action) {
			case "adjust_difficulty":
				const adjustment = context.recentPerformance.accuracy > 0.8 ? 1 : -1;
				return {
					newDifficulty: Math.max(1, Math.min(10, currentDifficulty + adjustment))
				};

			case "take_break":
				return {
					breakType: this.learnerProfile?.diagnoses.some(d => d.type === "ADHD")
						? "movement"
						: "rest"
				};

			case "provide_help":
				return {
					helpType: context.recentPerformance.consecutiveIncorrect > 2
						? "worked_example"
						: "hint"
				};

			case "change_activity":
				return {
					newActivityId: "variety_activity"
				};

			default:
				return {};
		}
	}

	/**
	 * Generate content adaptations based on action
	 */
	private generateAdaptations(action: string, context: LearningContext): ContentAdaptation[] {
		const adaptations: ContentAdaptation[] = [];

		if (action === "adjust_difficulty") {
			adaptations.push({
				type: "difficulty",
				modification: { level: this.getDecisionDetails(action, context).newDifficulty },
				reason: "Performance-based adjustment"
			});
		}

		if (action === "provide_help") {
			adaptations.push({
				type: "scaffolding",
				modification: { type: this.getDecisionDetails(action, context).helpType },
				reason: "Support struggling learner"
			});
		}

		// Add accommodations if available
		if (this.learnerProfile) {
			const accommodationAdaptations = this.getAccommodationAdaptations(context);
			adaptations.push(...accommodationAdaptations);
		}

		return adaptations;
	}

	/**
	 * Get accommodation-based adaptations
	 */
	private getAccommodationAdaptations(context: LearningContext): ContentAdaptation[] {
		const adaptations: ContentAdaptation[] = [];

		if (!this.learnerProfile) {
			return adaptations;
		}

		// Check for ADHD accommodations
		if (this.learnerProfile.diagnoses.some(d => d.type === "ADHD")) {
			adaptations.push({
				type: "presentation",
				modification: { chunkSize: "small", breakFrequency: "high" },
				reason: "ADHD accommodation"
			});
		}

		// Check for dyslexia accommodations
		if (this.learnerProfile.diagnoses.some(d => d.type === "Dyslexia")) {
			adaptations.push({
				type: "text",
				modification: { font: "OpenDyslexic", spacing: "increased" },
				reason: "Dyslexia accommodation"
			});
		}

		return adaptations;
	}

	/**
	 * Helper: Calculate average of array
	 */
	private average(values: number[]): number {
		if (values.length === 0) return 0;
		return values.reduce((sum, val) => sum + val, 0) / values.length;
	}

	/**
	 * Get AI-powered decision
	 */
	private async getAIDecision(
		analysis: AnalysisResult,
		context: LearningContext
	): Promise<LearningDecision> {
		if (!this.learnerProfile) {
			throw new Error("Learner profile not loaded");
		}

		const diagnoses = this.learnerProfile.diagnoses.map((d) => d.type).join(", ");
		const avgResponseTime =
			context.recentPerformance.responseTime.length > 0
				? mean(context.recentPerformance.responseTime)
				: 0;

		const prompt = `
As a personalized learning AI for a ${this.learnerProfile.age}-year-old learner ${diagnoses ? `with ${diagnoses}` : ""}, 
analyze this learning situation and recommend the best action:

Current Performance:
- Accuracy: ${context.recentPerformance.accuracy}%
- Consecutive Correct: ${context.recentPerformance.consecutiveCorrect}
- Consecutive Incorrect: ${context.recentPerformance.consecutiveIncorrect}
- Engagement: ${context.recentPerformance.engagementScore}/100
- Focus Level: ${context.focusLevel}/100
- Average Response Time: ${avgResponseTime.toFixed(1)}s

Analysis:
- Performance Level: ${analysis.performanceLevel}
- Cognitive Load: ${analysis.cognitiveLoad}
- Emotional State: ${analysis.emotionalState.primary}

Session Info:
- Duration: ${context.sessionDuration} minutes
- Last Break: ${context.lastBreakTime} minutes ago

Possible Actions:
1. continue - Keep going with current activity
2. adjust_difficulty - Change difficulty level
3. take_break - Schedule a brain break
4. provide_help - Offer assistance
5. change_activity - Switch to different activity

Provide your decision in JSON format with:
{
  "action": "continue|adjust_difficulty|take_break|provide_help|change_activity",
  "reason": "clear explanation",
  "confidence": 0.0-1.0,
  "details": {
    "newDifficulty": optional number 1-10,
    "breakType": "movement|mindfulness|snack|rest",
    "helpType": "hint|worked_example|scaffolding|reteach",
    "newActivityId": optional string
  },
  "adaptations": []
}
`;

		const response = await this.openai.chat.completions.create({
			model: "gpt-4-turbo-preview",
			messages: [
				{
					role: "system",
					content:
						"You are an expert educational AI specializing in personalized learning for neurodiverse children."
				},
				{
					role: "user",
					content: prompt
				}
			],
			response_format: { type: "json_object" },
			temperature: 0.3
		});

		const aiResponse = JSON.parse(response.choices[0].message.content || "{}");

		return {
			action: aiResponse.action || "continue",
			details: {
				reason: aiResponse.reason || "Continue current activity",
				...aiResponse.details
			},
			confidence: aiResponse.confidence || 0.8,
			adaptations: aiResponse.adaptations || []
		};
	}

	/**
	 * Apply accommodations based on learner profile
	 */
	private async applyAccommodations(
		decision: LearningDecision
	): Promise<LearningDecision> {
		if (!this.learnerProfile) {
			return decision;
		}

		const adaptedDecision = { ...decision };
		const diagnoses = this.learnerProfile.diagnoses;

		// Diagnosis-specific adaptations
		if (diagnoses.some((d) => d.type === "ADHD")) {
			adaptedDecision.adaptations.push({
				type: "structure",
				modification: {
					chunkContent: true,
					maxChunkSize: 50,
					frequentBreaks: true
				},
				reason: "ADHD accommodation - chunked content"
			});
		}

		if (diagnoses.some((d) => d.type === "DYSLEXIA")) {
			adaptedDecision.adaptations.push({
				type: "typography",
				modification: {
					font: "OpenDyslexic",
					fontSize: "18px",
					lineSpacing: 1.8,
					backgroundColor: "#FFF9F0"
				},
				reason: "Dyslexia accommodation - typography"
			});
		}

		if (diagnoses.some((d) => d.type === "AUTISM")) {
			adaptedDecision.adaptations.push({
				type: "sensory",
				modification: {
					reducedAnimations: true,
					calmColors: true,
					clearInstructions: true
				},
				reason: "Autism accommodation - sensory considerations"
			});
		}

		return adaptedDecision;
	}

	/**
	 * Generate personalized feedback
	 */
	private async generatePersonalizedFeedback(
		context: LearningContext,
		decision: LearningDecision
	): Promise<string> {
		const templates = {
			encouragement: [
				"You're doing great! Keep up the excellent work!",
				"Wow, look at you go! You're really getting this!",
				"I'm so proud of how hard you're trying!",
				"You're making amazing progress!"
			],
			struggle_support: [
				"This is tricky, but I know you can do it! Let's try together.",
				"No worries, learning takes time. Let's break this down.",
				"You're doing your best, and that's what matters!",
				"Let's try a different approach - you've got this!"
			],
			break_suggestion: [
				"Great work! How about a quick break to recharge?",
				"You've been focusing so well! Time for a brain break!",
				"Let's take a moment to move around and then come back fresh!"
			],
			mastery: [
				"You've mastered this! Ready for a new challenge?",
				"Incredible! You really understand this now!",
				"You're a superstar! Let's level up!"
			]
		};

		// Select appropriate template based on context
		let category: keyof typeof templates = "encouragement";
		if (decision.action === "take_break") {
			category = "break_suggestion";
		} else if (context.recentPerformance.accuracy > 90) {
			category = "mastery";
		} else if (context.recentPerformance.consecutiveIncorrect > 2) {
			category = "struggle_support";
		}

		// Get random template from category
		const templateOptions = templates[category];
		const baseMessage =
			templateOptions[Math.floor(Math.random() * templateOptions.length)];

		// Personalize with learner's name
		const firstName = this.learnerProfile?.firstName || "friend";
		const personalized = baseMessage.replace("[Name]", firstName);

		return personalized;
	}

	/**
	 * Update learning memory
	 */
	private updateLearningMemory(
		context: LearningContext,
		decision: LearningDecision
	): void {
		// Add to short-term memory
		this.addToShortTermMemory({
			type: "decision",
			content: {
				context,
decision,
				timestamp: new Date()
			},
			importance: decision.action === "change_activity" ? 0.8 : 0.5,
			associations: [
				`performance_${context.recentPerformance.accuracy}`,
				`action_${decision.action}`
			]
		});

		// Update working memory
		this.state.memory.workingMemory.lastDecision = decision;
		this.state.memory.workingMemory.recentPerformance = context.recentPerformance;
		this.state.memory.workingMemory.sessionDuration = context.sessionDuration;

		// Check if episode should end
		if (decision.action === "change_activity" || decision.action === "take_break") {
			const outcome = context.recentPerformance.accuracy > 70 ? "success" : "partial";
			this.endEpisode(outcome, [
				`Average accuracy: ${context.recentPerformance.accuracy}%`,
				`Decision made: ${decision.action}`,
				`Reason: ${decision.details.reason}`
			]);

			// Start new episode
			this.startEpisode();
		}
	}

	/**
	 * Generate insight about learner's progress
	 */
	async generateInsight(): Promise<any> {
		const recentDecisions = this.adaptationHistory.slice(-20);

		// Analyze patterns
		const patterns = {
			mostCommonAction: this.findMostCommonAction(recentDecisions),
			averageConfidence: this.calculateAverageConfidence(recentDecisions),
			difficultyTrend: this.analyzeDifficultyTrend(recentDecisions),
			breakFrequency: this.analyzeBreakFrequency(recentDecisions)
		};

		// Generate insight
		const insight = {
			learnerId: this.learnerId,
			timestamp: new Date(),
			patterns,
			recommendations: [] as string[],
			alerts: [] as string[]
		};

		// Add recommendations based on patterns
		if (patterns.difficultyTrend === "decreasing") {
			insight.recommendations.push("Consider reviewing prerequisite skills");
		}

		if (patterns.breakFrequency < 0.1) {
			insight.recommendations.push("Increase break frequency for better focus");
		}

		if (patterns.averageConfidence < 0.6) {
			insight.alerts.push("Low decision confidence - may need human review");
		}

		return insight;
	}

	/**
	 * Fetch learner from database
	 */
	protected async fetchLearnerFromDB(): Promise<any> {
		return this.learnerProfile;
	}

	/**
	 * Handle message from another agent
	 */
	protected async handleAgentMessage(message: any): Promise<any> {
		switch (message.type) {
			case "request_learner_state":
				return {
					learnerProfile: this.learnerProfile,
					currentSession: this.currentSession,
					recentDecisions: this.adaptationHistory.slice(-5)
				};

			case "emotion_update":
				// Update emotional state from behavior agent
				this.state.context.currentEmotion = message.data;
				return { acknowledged: true };

			case "content_ready":
				// Content adaptation complete
				return { ready: true };

			default:
				return { error: "Unknown message type" };
		}
	}

	/**
	 * Handle broadcast event
	 */
	protected async handleBroadcastEvent(event: any): Promise<void> {
		switch (event.event) {
			case "session_started":
				if (event.data.learnerId === this.learnerId) {
					this.currentSession = {
						...this.currentSession,
						sessionId: event.data.sessionId
					};
				}
				break;

			case "emergency_stop":
				if (event.data.learnerId === this.learnerId) {
					// Stop all activities
					this.state.status = "idle";
				}
				break;
		}
	}

	// Helper methods

	private setupLearningParameters(): void {
		// Configure agent-specific parameters
		this.state.context.learningPhase = "active";
	}

	private calculateOptimalSessionLength(age: number, neurodiversity: any): number {
		let baseLength = 30; // minutes

		if (age < 8) {
			baseLength = 20;
		}

		if (neurodiversity.adhd) {
			baseLength = Math.min(baseLength, 15);
		}

		return baseLength;
	}

	private assessPerformanceLevel(
		performance: PerformanceMetrics | undefined
	): "struggling" | "developing" | "proficient" | "mastery" {
		if (!performance || performance.accuracy === undefined) return "developing";
		if (performance.accuracy < 50) return "struggling";
		if (performance.accuracy < 70) return "developing";
		if (performance.accuracy < 90) return "proficient";
		return "mastery";
	}

	private assessEngagementLevel(context: LearningContext): "low" | "medium" | "high" {
		const engagementScore = context.recentPerformance?.engagementScore;
		if (engagementScore === undefined || engagementScore < 40) return "low";
		if (engagementScore < 70) return "medium";
		return "high";
	}

	private assessCognitiveLoad(
		context: LearningContext
	): "low" | "optimal" | "high" | "overload" {
		const perf = context.recentPerformance;
		const indicators = [
			(perf?.hintsUsed ?? 0) > 5,
			(context.focusLevel ?? 50) < 40,
			mean(perf?.responseTime ?? []) > 30,
			(context.strugglesDetected?.length ?? 0) > 3
		];

		const overloadScore = indicators.filter((i) => i).length;

		if (overloadScore >= 3) return "overload";
		if (overloadScore === 2) return "high";
		if (overloadScore === 1) return "optimal";
		return "low";
	}

	private async inferEmotionalState(context: LearningContext): Promise<EmotionalState> {
		const perf = context.recentPerformance;
		// Simple heuristic-based inference
		if ((perf?.consecutiveIncorrect ?? 0) >= 3) {
			return {
				primary: "frustrated",
				confidence: 0.7,
				indicators: { consecutiveErrors: perf?.consecutiveIncorrect ?? 0 }
			};
		}

		if ((perf?.engagementScore ?? 50) < 30) {
			return {
				primary: "bored",
				confidence: 0.6,
				indicators: { engagement: context.recentPerformance.engagementScore }
			};
		}

		if (context.recentPerformance.consecutiveCorrect >= 5) {
			return {
				primary: "confident",
				confidence: 0.8,
				indicators: { consecutiveCorrect: context.recentPerformance.consecutiveCorrect }
			};
		}

		return {
			primary: "happy",
			confidence: 0.5,
			indicators: {}
		};
	}

	private checkInterventionNeeded(context: LearningContext): {
		urgent: boolean;
		reasons: string[];
	} {
		const reasons: string[] = [];

		if (context.recentPerformance.consecutiveIncorrect >= 5) {
			reasons.push("Extended struggle pattern");
		}

		if (context.focusLevel < 20) {
			reasons.push("Critical focus drop");
		}

		if (context.sessionDuration - context.lastBreakTime > this.getBreakInterval() * 2) {
			reasons.push("Overdue break");
		}

		return {
			urgent: reasons.length >= 2,
			reasons
		};
	}

	private createInterventionDecision(
		analysis: AnalysisResult,
		context: LearningContext
	): LearningDecision {
		return {
			action: "provide_help",
			details: {
				reason: `Urgent intervention needed: ${analysis.needsIntervention.reasons.join(", ")}`,
				helpType: "scaffolding"
			},
			confidence: 0.9,
			adaptations: []
		};
	}

	private createBreakDecision(context: LearningContext): LearningDecision {
		const breakType = context.focusLevel < 40 ? "movement" : "rest";

		return {
			action: "take_break",
			details: {
				reason: `Time for a ${breakType} break after ${context.sessionDuration - context.lastBreakTime} minutes`,
				breakType
			},
			confidence: 0.85,
			adaptations: []
		};
	}

	private createSupportDecision(
		analysis: AnalysisResult,
		context: LearningContext
	): LearningDecision {
		return {
			action: "adjust_difficulty",
			details: {
				reason: "Learner is struggling, reducing difficulty to build confidence",
				newDifficulty: Math.max(1, (context.currentActivity?.difficulty || 5) - 1)
			},
			confidence: 0.75,
			adaptations: [
				{
					type: "scaffolding",
					modification: { addHints: true, breakDownSteps: true },
					reason: "Additional support for struggling learner"
				}
			]
		};
	}

	private createAdvancementDecision(
		analysis: AnalysisResult,
		context: LearningContext
	): LearningDecision {
		return {
			action: "adjust_difficulty",
			details: {
				reason: "Learner has mastered current level, advancing to challenge",
				newDifficulty: Math.min(10, (context.currentActivity?.difficulty || 5) + 1)
			},
			confidence: 0.8,
			adaptations: []
		};
	}

	private determineNextSteps(decision: LearningDecision): string[] {
		const steps: string[] = [];

		switch (decision.action) {
			case "take_break":
				steps.push("Pause current activity");
				steps.push(`Start ${decision.details.breakType} break`);
				steps.push("Resume when ready");
				break;

			case "adjust_difficulty":
				steps.push(`Adjust to difficulty level ${decision.details.newDifficulty}`);
				steps.push("Continue with adapted content");
				break;

			case "provide_help":
				steps.push(`Provide ${decision.details.helpType}`);
				steps.push("Check understanding");
				steps.push("Resume activity");
				break;

			case "change_activity":
				steps.push("Complete current activity");
				steps.push("Transition to new activity");
				break;

			default:
				steps.push("Continue with current activity");
		}

		return steps;
	}

	private async generateRecommendations(analysis: AnalysisResult): Promise<string[]> {
		return analysis.recommendations;
	}

	private getBreakInterval(): number {
		if (!this.learnerProfile) return 20;

		if (this.learnerProfile.diagnoses.some((d) => d.type === "ADHD")) {
			return 10; // 10 minutes for ADHD
		}
		return 20; // Default 20 minutes
	}

	private detectFrustration(context: LearningContext): boolean {
		return (
			context.recentPerformance.consecutiveIncorrect >= 3 ||
			context.emotionalState?.primary === "frustrated" ||
			context.recentPerformance.engagementScore < 30
		);
	}

	private detectBoredom(context: LearningContext): boolean {
		return (
			context.recentPerformance.consecutiveCorrect >= 10 ||
			context.emotionalState?.primary === "bored" ||
			(context.recentPerformance.accuracy > 95 &&
				context.recentPerformance.engagementScore < 50)
		);
	}

	private needsBreak(context: LearningContext): boolean {
		const timeSinceBreak = context.sessionDuration - context.lastBreakTime;
		return timeSinceBreak >= this.getBreakInterval() || context.focusLevel < 30;
	}

	private findMostCommonAction(decisions: LearningDecision[]): string {
		const counts: Record<string, number> = {};
		decisions.forEach((d) => {
			counts[d.action] = (counts[d.action] || 0) + 1;
		});

		return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "continue";
	}

	private calculateAverageConfidence(decisions: LearningDecision[]): number {
		if (decisions.length === 0) return 0;
		const sum = decisions.reduce((acc, d) => acc + d.confidence, 0);
		return sum / decisions.length;
	}

	private analyzeDifficultyTrend(
		decisions: LearningDecision[]
	): "increasing" | "stable" | "decreasing" {
		const difficultyChanges = decisions
			.filter((d) => d.action === "adjust_difficulty" && d.details.newDifficulty)
			.map((d) => d.details.newDifficulty!);

		if (difficultyChanges.length < 2) return "stable";

		const trend =
			difficultyChanges[difficultyChanges.length - 1] - difficultyChanges[0];

		if (trend > 0) return "increasing";
		if (trend < 0) return "decreasing";
		return "stable";
	}

	private analyzeBreakFrequency(decisions: LearningDecision[]): number {
		const breakCount = decisions.filter((d) => d.action === "take_break").length;
		return decisions.length > 0 ? breakCount / decisions.length : 0;
	}

	/**
	 * Get current agent state for testing/debugging
	 */
	public getAgentState(): AgentState {
		return { ...this.state };
	}

	/**
	 * Public initialize method
	 */
	public async initialize(): Promise<void> {
		return super.initialize();
	}
}

// Helper functions
function mean(arr: number[]): number {
	if (arr.length === 0) return 0;
	return arr.reduce((a, b) => a + b, 0) / arr.length;
}
