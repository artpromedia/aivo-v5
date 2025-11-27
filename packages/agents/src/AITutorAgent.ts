/**
 * AI Tutor Conversation Agent
 * 
 * Provides real-time conversational support, answers questions, and guides
 * learners through activities with personalized, empathetic interactions.
 */

import { BaseAgent, AgentResponse, AgentConfig, AgentState } from "./lib/agents/base/AgentFramework";
import type { OpenAI } from "openai";
import type { PrismaClient } from "@prisma/client";

export interface TutorInteraction {
	learnerInput: string;
	inputType: "question" | "answer" | "confusion" | "frustration" | "off_topic";
	currentActivity: any;
	currentQuestion?: any;
	previousHints: string[];
	sessionContext: any;
}

export interface TutorResponse {
	message: string;
	type: "hint" | "explanation" | "encouragement" | "correction" | "redirect";
	shouldSpeak: boolean;
	emotion: "friendly" | "encouraging" | "sympathetic" | "excited";
	visualAids?: any[];
	nextPrompt?: string;
}

interface ConversationEntry {
	timestamp: Date;
	learnerInput: string;
	tutorResponse: string;
	inputType: string;
	responseType: string;
	activity?: string;
}

interface InputClassification {
	type: "help_request" | "answer_attempt" | "confusion" | "frustration" | "off_topic" | "general";
	confidence: number;
	indicators: string[];
}

interface LearnerData {
	id: string;
	firstName: string;
	age: number;
	gradeLevel: number;
	diagnoses?: Array<{ type: string }>;
	learningStyle?: string;
	currentSubjects?: string[];
	preferences?: any;
}

export class AITutorAgent extends BaseAgent {
	private prisma: PrismaClient;
	private conversationHistory: ConversationEntry[] = [];
	private currentActivity: any = null;
	private hintsGiven: Map<string, number> = new Map();
	private interactionCount: number = 0;
	private tutorPersona: string = "";

	constructor(config: AgentConfig, prisma: PrismaClient) {
		super(config);
		this.prisma = prisma;
	}

	/**
	 * Initialize tutor-specific components
	 */
	protected async initializeSpecificComponents(): Promise<void> {
		// Load learner preferences
		const learner = await this.fetchLearnerFromDB();

		// Create personalized tutor persona
		this.tutorPersona = this.createTutorPersona(learner);

		// Load conversation history if exists
		await this.loadConversationHistory();

		// Initialize subject expertise modules
		await this.initializeSubjectModules(learner.currentSubjects || []);

		console.log(`AI Tutor initialized for ${learner.firstName}`);
	}

	/**
	 * Create personalized tutor persona
	 */
	private createTutorPersona(learner: LearnerData): string {
		let persona = `You are a warm, patient, and encouraging AI tutor for ${learner.firstName}, a ${learner.age}-year-old student.`;

		// Add grade-appropriate language
		persona += ` Use language appropriate for grade ${learner.gradeLevel}.`;

		// Add diagnosis-specific guidance
		if (learner.diagnoses && learner.diagnoses.length > 0) {
			persona += " Special considerations:";

			if (learner.diagnoses.some((d) => d.type === "ADHD")) {
				persona += " Keep responses short and engaging. Use excitement and variety.";
			}

			if (learner.diagnoses.some((d) => d.type === "Autism" || d.type === "ASD")) {
				persona += " Be very clear and literal. Avoid idioms and metaphors.";
			}

			if (learner.diagnoses.some((d) => d.type === "Dyslexia")) {
				persona += " Use simple sentence structures. Emphasize phonics when appropriate.";
			}
		}

		// Add learning style preferences
		if (learner.learningStyle === "visual") {
			persona += " Include visual descriptions and imagery in explanations.";
		} else if (learner.learningStyle === "auditory") {
			persona += " Use sound-based examples and rhythm when helpful.";
		} else if (learner.learningStyle === "kinesthetic") {
			persona += " Suggest movement and hands-on approaches.";
		}

		persona += ` Always:
- Be positive and encouraging
- Celebrate effort, not just correct answers
- Never make the child feel bad about mistakes
- Use their name occasionally for personal connection
- Guide them to answers rather than giving answers directly
- Use age-appropriate examples they can relate to`;

		return persona;
	}

	/**
	 * Process learner input and generate response
	 */
	async processInput(input: TutorInteraction): Promise<AgentResponse> {
		this.state.status = "processing";
		this.interactionCount++;

		try {
			// Classify input type
			const inputClassification = await this.classifyInput(input.learnerInput);

			// Generate appropriate response
			let tutorResponse: TutorResponse;

			switch (inputClassification.type) {
				case "help_request":
					tutorResponse = await this.provideHelp(input);
					break;

				case "answer_attempt":
					tutorResponse = await this.evaluateAnswer(input);
					break;

				case "confusion":
					tutorResponse = await this.clarifyConfusion(input);
					break;

				case "frustration":
					tutorResponse = await this.handleFrustration(input);
					break;

				case "off_topic":
					tutorResponse = await this.redirectGently(input);
					break;

				default:
					tutorResponse = await this.generalResponse(input);
			}

			// Apply safety check
			tutorResponse = await this.applySafetyFilters(tutorResponse);

			// Update conversation history
			this.updateConversationHistory(input, tutorResponse);

			// Check if we should suggest a break
			const breakNeeded = this.checkBreakNeeded();

			return {
				action: "respond",
				confidence: inputClassification.confidence,
				reasoning: `Classified as ${inputClassification.type}`,
				data: {
					response: tutorResponse,
					inputType: inputClassification.type,
					breakSuggested: breakNeeded,
					interactionCount: this.interactionCount
				}
			};
		} finally {
			this.state.status = "idle";
		}
	}

	/**
	 * Classify learner input
	 */
	private async classifyInput(text: string): Promise<InputClassification> {
		const prompt = `
Classify this student message into one category:
- help_request: asking for help, hints, or clarification
- answer_attempt: trying to answer a question
- confusion: expressing confusion or not understanding
- frustration: showing frustration, giving up, or negative emotion
- off_topic: talking about unrelated things
- general: other learning-related communication

Student message: "${text}"

Respond with JSON: { "type": "category", "confidence": 0.0-1.0, "indicators": [] }
		`;

		const response = await this.openai.chat.completions.create({
			model: "gpt-4-turbo-preview",
			messages: [
				{
					role: "system",
					content: "You are an expert at understanding children's communication patterns."
				},
				{ role: "user", content: prompt }
			],
			response_format: { type: "json_object" },
			temperature: 0.2
		});

		return JSON.parse(response.choices[0].message.content || "{}");
	}

	/**
	 * Provide progressive help
	 */
	private async provideHelp(input: TutorInteraction): Promise<TutorResponse> {
		const questionId = input.currentQuestion?.id || "general";
		const hintCount = this.hintsGiven.get(questionId) || 0;

		// Progressive hint levels
		let hintLevel: string;
		let hintPrompt: string;

		if (hintCount === 0) {
			hintLevel = "gentle_nudge";
			hintPrompt = "Provide a very gentle hint without revealing the answer. Guide their thinking.";
		} else if (hintCount === 1) {
			hintLevel = "strategy_hint";
			hintPrompt = "Give a strategy or approach they can use to solve this.";
		} else if (hintCount === 2) {
			hintLevel = "partial_walkthrough";
			hintPrompt = "Walk through the first part of solving this problem.";
		} else {
			hintLevel = "worked_example";
			hintPrompt = "Provide a similar worked example (not the exact answer).";
		}

		const prompt = `
${this.tutorPersona}

The student needs help with: ${JSON.stringify(input.currentQuestion)}
They said: "${input.learnerInput}"

${hintPrompt}
Previous hints given: ${hintCount}

Keep it encouraging and age-appropriate.
		`;

		const response = await this.openai.chat.completions.create({
			model: "gpt-4-turbo-preview",
			messages: [
				{ role: "system", content: this.tutorPersona },
				{ role: "user", content: prompt }
			],
			temperature: 0.7
		});

		// Update hint count
		this.hintsGiven.set(questionId, hintCount + 1);

		return {
			message: response.choices[0].message.content || "",
			type: "hint",
			shouldSpeak: true,
			emotion: "encouraging",
			nextPrompt: hintCount < 2 ? "Try it now! I know you can do it!" : undefined
		};
	}

	/**
	 * Evaluate answer attempt
	 */
	private async evaluateAnswer(input: TutorInteraction): Promise<TutorResponse> {
		const isCorrect = this.checkAnswer(
			input.learnerInput,
			input.currentQuestion?.correctAnswer
		);

		let prompt: string;
		let emotion: TutorResponse["emotion"];
		let type: TutorResponse["type"];

		if (isCorrect) {
			emotion = "excited";
			type = "encouragement";
			prompt = `
The student got the answer correct! They answered: "${input.learnerInput}"

Celebrate their success enthusiastically but age-appropriately.
Be specific about what they did well.
Keep it brief (1-2 sentences) and fun!
Maybe use an emoji or exclamation.
			`;
		} else {
			emotion = "encouraging";
			type = "correction";
			prompt = `
The student's answer "${input.learnerInput}" is not quite right.
Correct answer: ${input.currentQuestion?.correctAnswer}

Respond positively about their effort.
Guide them toward the right answer without directly saying it.
Offer to work through it together.
Keep it encouraging and supportive.
			`;
		}

		const response = await this.openai.chat.completions.create({
			model: "gpt-4-turbo-preview",
			messages: [
				{ role: "system", content: this.tutorPersona },
				{ role: "user", content: prompt }
			],
			temperature: 0.6
		});

		// Reset hint count if correct
		if (isCorrect) {
			const questionId = input.currentQuestion?.id || "general";
			this.hintsGiven.delete(questionId);
		}

		return {
			message: response.choices[0].message.content || "",
			type,
			shouldSpeak: true,
			emotion,
			nextPrompt: isCorrect ? undefined : "Let's try again together!"
		};
	}

	/**
	 * Handle frustration with empathy
	 */
	private async handleFrustration(input: TutorInteraction): Promise<TutorResponse> {
		const prompt = `
${this.tutorPersona}

The student is showing frustration. They said: "${input.learnerInput}"

Respond with:
1. Acknowledge and validate their feelings
2. Normalize that learning can be hard sometimes
3. Offer a break or easier option
4. Remind them of their strengths
5. Keep it short and comforting

Be warm and understanding.
		`;

		const response = await this.openai.chat.completions.create({
			model: "gpt-4-turbo-preview",
			messages: [
				{ role: "system", content: this.tutorPersona },
				{ role: "user", content: prompt }
			],
			temperature: 0.8
		});

		// Notify learning agent about emotional state
		await this.coordinateWith("learning_agent", {
			type: "emotion_update",
			data: {
				emotion: "frustrated",
				timestamp: new Date(),
				context: input.learnerInput
			}
		});

		return {
			message: response.choices[0].message.content || "",
			type: "encouragement",
			shouldSpeak: true,
			emotion: "sympathetic",
			visualAids: [{ type: "calming_animation", duration: 5 }]
		};
	}

	/**
	 * Clarify confusion
	 */
	private async clarifyConfusion(input: TutorInteraction): Promise<TutorResponse> {
		const prompt = `
${this.tutorPersona}

The student is confused. They said: "${input.learnerInput}"
About this topic: ${JSON.stringify(input.currentActivity?.topic)}

Provide a clear, simple explanation.
Use an analogy or example they can relate to.
Break it down into small steps.
Check if they understand with a simple question.
		`;

		const response = await this.openai.chat.completions.create({
			model: "gpt-4-turbo-preview",
			messages: [
				{ role: "system", content: this.tutorPersona },
				{ role: "user", content: prompt }
			],
			temperature: 0.5
		});

		return {
			message: response.choices[0].message.content || "",
			type: "explanation",
			shouldSpeak: true,
			emotion: "friendly",
			nextPrompt: "Does that make more sense now?"
		};
	}

	/**
	 * Gently redirect off-topic input
	 */
	private async redirectGently(input: TutorInteraction): Promise<TutorResponse> {
		const prompt = `
${this.tutorPersona}

The student is talking about something off-topic: "${input.learnerInput}"
Current learning activity: ${JSON.stringify(input.currentActivity)}

Gently acknowledge what they said, then redirect to the learning activity.
Be warm and understanding, not dismissive.
Make the transition fun and engaging.
		`;

		const response = await this.openai.chat.completions.create({
			model: "gpt-4-turbo-preview",
			messages: [
				{ role: "system", content: this.tutorPersona },
				{ role: "user", content: prompt }
			],
			temperature: 0.7
		});

		return {
			message: response.choices[0].message.content || "",
			type: "redirect",
			shouldSpeak: true,
			emotion: "friendly",
			nextPrompt: "Ready to keep learning?"
		};
	}

	/**
	 * General response for other input types
	 */
	private async generalResponse(input: TutorInteraction): Promise<TutorResponse> {
		const prompt = `
${this.tutorPersona}

The student said: "${input.learnerInput}"
Context: ${JSON.stringify(input.sessionContext)}

Respond naturally and helpfully.
Stay positive and encouraging.
Keep the conversation flowing toward learning.
		`;

		const response = await this.openai.chat.completions.create({
			model: "gpt-4-turbo-preview",
			messages: [
				{ role: "system", content: this.tutorPersona },
				{ role: "user", content: prompt }
			],
			temperature: 0.7
		});

		return {
			message: response.choices[0].message.content || "",
			type: "explanation",
			shouldSpeak: true,
			emotion: "friendly"
		};
	}

	/**
	 * Generate insight about tutoring session
	 */
	async generateInsight(): Promise<any> {
		const insights = {
			totalInteractions: this.interactionCount,
			conversationQuality: this.assessConversationQuality(),
			emotionalSupport: this.calculateEmotionalSupportScore(),
			hintEffectiveness: this.analyzeHintEffectiveness(),
			engagementLevel: this.assessEngagementLevel(),
			recommendations: [] as string[]
		};

		// Add recommendations
		if (insights.emotionalSupport < 0.6) {
			insights.recommendations.push("Increase emotional support and encouragement");
		}

		if (insights.hintEffectiveness < 0.5) {
			insights.recommendations.push("Adjust hint difficulty or provide more scaffolding");
		}

		if (insights.engagementLevel < 0.7) {
			insights.recommendations.push("Try more interactive or personalized responses");
		}

		return insights;
	}

	/**
	 * Check if answer is correct
	 */
	private checkAnswer(studentAnswer: string, correctAnswer: any): boolean {
		if (!correctAnswer) return false;

		// Normalize answers for comparison
		const normalized = studentAnswer.toLowerCase().trim();

		if (typeof correctAnswer === "string") {
			return normalized === correctAnswer.toLowerCase().trim();
		}

		if (Array.isArray(correctAnswer)) {
			return correctAnswer.some((ans) => normalized === ans.toLowerCase().trim());
		}

		// For numeric answers
		if (typeof correctAnswer === "number") {
			const studentNum = parseFloat(normalized);
			return !isNaN(studentNum) && Math.abs(studentNum - correctAnswer) < 0.01;
		}

		return false;
	}

	/**
	 * Apply safety filters
	 */
	private async applySafetyFilters(response: TutorResponse): Promise<TutorResponse> {
		// Filter out any inappropriate content
		const filtered = { ...response };

		// Check for personal information requests
		if (filtered.message.match(/\b(address|phone|email|password)\b/i)) {
			filtered.message =
				"I can't ask for or share personal information. Let's focus on learning!";
		}

		// Ensure positive tone
		if (filtered.message.match(/\b(stupid|dumb|idiot|hate)\b/i)) {
			filtered.message = filtered.message
				.replace(/stupid|dumb|idiot/gi, "challenging")
				.replace(/hate/gi, "find difficult");
		}

		// Remove any external links
		filtered.message = filtered.message.replace(/https?:\/\/[^\s]+/gi, "[link removed]");

		return filtered;
	}

	/**
	 * Update conversation history
	 */
	private updateConversationHistory(
		input: TutorInteraction,
		response: TutorResponse
	): void {
		const entry: ConversationEntry = {
			timestamp: new Date(),
			learnerInput: input.learnerInput,
			tutorResponse: response.message,
			inputType: input.inputType,
			responseType: response.type,
			activity: input.currentActivity?.id
		};

		this.conversationHistory.push(entry);

		// Keep only last 50 interactions in memory
		if (this.conversationHistory.length > 50) {
			this.conversationHistory = this.conversationHistory.slice(-50);
		}

		// Add to agent memory
		this.addToShortTermMemory({
			type: "observation",
			content: entry,
			importance: response.type === "correction" ? 0.7 : 0.5,
			associations: [input.inputType, response.type]
		});
	}

	/**
	 * Check if break is needed
	 */
	private checkBreakNeeded(): boolean {
		// Check interaction patterns
		const recentFrustrations = this.conversationHistory
			.slice(-10)
			.filter((c) => c.inputType === "frustration").length;

		const recentConfusions = this.conversationHistory
			.slice(-10)
			.filter((c) => c.inputType === "confusion").length;

		return (
			recentFrustrations >= 2 || recentConfusions >= 3 || this.interactionCount % 20 === 0
		);
	}

	/**
	 * Load conversation history from storage
	 */
	private async loadConversationHistory(): Promise<void> {
		try {
			const historyKey = `conversation:${this.learnerId}`;
			const saved = await this.redis.get(historyKey);

			if (saved) {
				this.conversationHistory = JSON.parse(saved);
			}
		} catch (error) {
			console.error("Failed to load conversation history:", error);
		}
	}

	/**
	 * Initialize subject expertise modules
	 */
	private async initializeSubjectModules(subjects: string[]): Promise<void> {
		// Load subject-specific knowledge bases
		const expertise: Record<string, { initialized: boolean; lastUpdated: Date }> = {};

		for (const subject of subjects) {
			expertise[subject] = {
				initialized: true,
				lastUpdated: new Date()
			};
		}
		
		this.state.context.subjectExpertise = expertise;
	}

	/**
	 * Assess conversation quality
	 */
	private assessConversationQuality(): number {
		if (this.conversationHistory.length === 0) return 0;

		// Calculate metrics
		const responseVariety = new Set(this.conversationHistory.map((c) => c.responseType))
			.size;
		const averageResponseLength =
			this.conversationHistory.reduce((sum, c) => sum + c.tutorResponse.length, 0) /
			this.conversationHistory.length;

		// Score based on variety and appropriate length
		const varietyScore = Math.min(responseVariety / 5, 1);
		const lengthScore = Math.min(averageResponseLength / 100, 1);

		return (varietyScore + lengthScore) / 2;
	}

	/**
	 * Calculate emotional support score
	 */
	private calculateEmotionalSupportScore(): number {
		const supportiveResponses = this.conversationHistory.filter(
			(c) => c.responseType === "encouragement" || c.responseType === "explanation"
		).length;

		const totalResponses = this.conversationHistory.length;

		return totalResponses > 0 ? supportiveResponses / totalResponses : 0;
	}

	/**
	 * Analyze hint effectiveness
	 */
	private analyzeHintEffectiveness(): number {
		// Track if hints led to correct answers
		let effectiveHints = 0;
		let totalHints = 0;

		for (let i = 0; i < this.conversationHistory.length - 1; i++) {
			if (this.conversationHistory[i].responseType === "hint") {
				totalHints++;
				// Check if next interaction was a correct answer
				if (this.conversationHistory[i + 1].inputType === "answer_attempt") {
					effectiveHints++;
				}
			}
		}

		return totalHints > 0 ? effectiveHints / totalHints : 0.5;
	}

	/**
	 * Assess engagement level
	 */
	private assessEngagementLevel(): number {
		const recentInteractions = this.conversationHistory.slice(-10);

		// Calculate based on interaction types
		const engagedTypes = ["answer_attempt", "help_request"];
		const engagedCount = recentInteractions.filter((c) =>
			engagedTypes.includes(c.inputType)
		).length;

		return recentInteractions.length > 0 ? engagedCount / recentInteractions.length : 0;
	}

	/**
	 * Fetch learner from database
	 */
	protected async fetchLearnerFromDB(): Promise<LearnerData> {
		const learner = await this.prisma.learner.findUnique({
			where: { id: this.learnerId },
			include: {
				diagnoses: true
			}
		});

		if (!learner) {
			throw new Error(`Learner not found: ${this.learnerId}`);
		}

		// Calculate age from dateOfBirth
		const age = Math.floor(
			(Date.now() - learner.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
		);

		return {
			id: learner.id,
			firstName: learner.firstName,
			age,
			gradeLevel: learner.gradeLevel,
			diagnoses: learner.diagnoses,
			learningStyle: (learner.accommodations as any)?.learningStyle,
			currentSubjects: [],
			preferences: learner.accommodations
		};
	}

	/**
	 * Handle agent messages
	 */
	protected async handleAgentMessage(message: any): Promise<any> {
		switch (message.type) {
			case "activity_change":
				this.currentActivity = message.data;
				this.hintsGiven.clear();
				return { acknowledged: true };

			case "request_conversation_summary":
				return {
					summary: this.conversationHistory.slice(-10),
					insights: await this.generateInsight()
				};

			default:
				return { error: "Unknown message type" };
		}
	}

	/**
	 * Handle broadcast events
	 */
	protected async handleBroadcastEvent(event: any): Promise<void> {
		if (event.event === "session_ended" && event.data.learnerId === this.learnerId) {
			// Save conversation history
			const historyKey = `conversation:${this.learnerId}`;
			await this.redis.set(
				historyKey,
				JSON.stringify(this.conversationHistory),
				"EX",
				86400 // 24 hour expiry
			);
		}
	}
}
