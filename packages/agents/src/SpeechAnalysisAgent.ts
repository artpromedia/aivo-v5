/**
 * Speech Analysis Agent
 * 
 * Evaluates articulation, fluency, and language development for speech therapy support.
 * Provides real-time phoneme analysis, error detection, and personalized recommendations.
 */

import { BaseAgent, AgentResponse, type AgentConfig } from "./lib/agents/base/AgentFramework";
import * as tf from "@tensorflow/tfjs-node";
import { PrismaClient } from "@prisma/client";

export interface SpeechSample {
	audioBuffer: Buffer;
	sampleRate: number;
	targetText?: string;
	taskType: "articulation" | "fluency" | "language" | "conversation";
	childAge: number;
	context?: any;
}

export interface ArticulationError {
	type: "substitution" | "omission" | "distortion" | "addition";
	targetSound: string;
	producedSound?: string;
	position: "initial" | "medial" | "final";
	severity: "mild" | "moderate" | "severe";
	consistency: number; // 0-1
}

export interface SpeechAnalysisResult {
	transcription: string;
	phonemes: Phoneme[];
	articulationErrors: ArticulationError[];
	fluencyMetrics: FluencyMetrics;
	prosodyAnalysis: ProsodyAnalysis;
	intelligibilityScore: number;
	ageAppropriateness: boolean;
	recommendations: TherapyRecommendation[];
}

export interface Phoneme {
	symbol: string;
	startTime: number;
	endTime: number;
	confidence: number;
	formants?: number[];
}

export interface FluencyMetrics {
	syllablesPerMinute: number;
	disfluencies: Disfluency[];
	fluencyScore: number;
	stutteringLikelihood: number;
}

export interface Disfluency {
	type: "repetition" | "prolongation" | "block" | "interjection";
	timestamp: number;
	duration: number;
	severity: number;
}

export interface ProsodyAnalysis {
	pitchMean: number;
	pitchVariability: number;
	energyMean: number;
	energyVariability: number;
	speakingRate: number;
	naturalness: number;
}

export interface TherapyRecommendation {
	targetSound?: string;
	therapyApproach: string;
	activities: string[];
	homePractice: string[];
	expectedTimeline: string;
	priority: "high" | "medium" | "low";
}

interface AudioFeatures {
	energy: number[];
	pitch: number[];
	voicing: boolean[];
	zeroCrossings: number[];
	duration: number;
}

interface SpeechAnalysis {
	id: string;
	learnerId: string;
	transcription: string;
	intelligibilityScore: number;
	articulationErrors: any;
	fluencyMetrics: any;
	createdAt: Date;
}

export class SpeechAnalysisAgent extends BaseAgent {
	private prisma: PrismaClient;
	private phoneticModel: tf.LayersModel | null = null;
	private ageNorms: Map<string, { age: number; range: [number, number] }> = new Map();

	constructor(config: AgentConfig, prisma?: PrismaClient) {
		super(config);
		this.prisma = prisma || new PrismaClient();
	}

	/**
	 * Log method for consistent logging
	 */
	protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
		const prefix = `[SpeechAnalysisAgent]`;
		switch (level) {
			case 'warn':
				console.warn(`${prefix} ${message}`);
				break;
			case 'error':
				console.error(`${prefix} ${message}`);
				break;
			default:
				console.log(`${prefix} ${message}`);
		}
	}

	/**
	 * Initialize speech analysis components
	 */
	protected async initializeSpecificComponents(): Promise<void> {
		// Load phonetic analysis model
		await this.loadPhoneticModel();

		// Load age norms database
		await this.loadAgeNorms();

		// Load learner's speech history
		await this.loadSpeechHistory();

		this.log("Speech analysis components initialized");
	}

	/**
	 * Load phonetic analysis model
	 */
	private async loadPhoneticModel(): Promise<void> {
		try {
			const modelPath = process.env.PHONETIC_MODEL_PATH || "file://models/phonetic_analysis/model.json";
			this.phoneticModel = await tf.loadLayersModel(modelPath);
			this.log("Phonetic model loaded successfully");
		} catch (error) {
			this.log("Failed to load phonetic model, creating new model", "warn");
			// Create basic model if not found
			this.phoneticModel = this.createPhoneticModel();
		}
	}

	/**
	 * Create phonetic analysis model
	 */
	private createPhoneticModel(): tf.LayersModel {
		const model = tf.sequential({
			layers: [
				tf.layers.conv1d({
					inputShape: [null, 1], // Variable length audio
					filters: 64,
					kernelSize: 3,
					activation: "relu"
				}),
				tf.layers.maxPooling1d({ poolSize: 2 }),
				tf.layers.conv1d({
					filters: 128,
					kernelSize: 3,
					activation: "relu"
				}),
				tf.layers.globalMaxPooling1d(),
				tf.layers.dense({
					units: 256,
					activation: "relu"
				}),
				tf.layers.dropout({ rate: 0.3 }),
				tf.layers.dense({
					units: 44, // Number of phonemes in English
					activation: "softmax"
				})
			]
		});

		model.compile({
			optimizer: "adam",
			loss: "categoricalCrossentropy",
			metrics: ["accuracy"]
		});

		return model;
	}

	/**
	 * Process speech sample
	 */
	async processInput(input: SpeechSample): Promise<AgentResponse> {
		this.state.status = "processing";

		try {
			// Transcribe speech
			const transcription = await this.transcribeSpeech(input.audioBuffer);

			// Extract phonemes
			const phonemes = await this.extractPhonemes(input.audioBuffer);

			// Analyze articulation
			const articulationErrors = await this.analyzeArticulation(
				phonemes,
				input.targetText,
				input.childAge
			);

			// Analyze fluency
			const fluencyMetrics = await this.analyzeFluency(input.audioBuffer);

			// Analyze prosody
			const prosodyAnalysis = await this.analyzeProsody(input.audioBuffer);

			// Calculate intelligibility
			const intelligibilityScore = this.calculateIntelligibility(
				transcription,
				input.targetText
			);

			// Check age appropriateness
			const ageAppropriateness = this.checkAgeAppropriateness(
				articulationErrors,
				input.childAge
			);

			// Generate recommendations
			const recommendations = await this.generateRecommendations(
				articulationErrors,
				fluencyMetrics,
				input.childAge
			);

			const result: SpeechAnalysisResult = {
				transcription,
				phonemes,
				articulationErrors,
				fluencyMetrics,
				prosodyAnalysis,
				intelligibilityScore,
				ageAppropriateness,
				recommendations
			};

			// Save analysis
			await this.saveAnalysis(result);

			return {
				action: "analyze_speech",
				confidence: 0.85,
				reasoning: `Speech analysis complete: ${articulationErrors.length} articulation errors detected, fluency score ${fluencyMetrics.fluencyScore.toFixed(2)}`,
				data: result
			};
		} finally {
			this.state.status = "idle";
		}
	}

	/**
	 * Transcribe speech using speech recognition
	 */
	private async transcribeSpeech(audioBuffer: Buffer): Promise<string> {
		// For production, integrate with cloud speech API (Google, Azure, AWS)
		// This is a placeholder implementation

		const speechApiUrl = process.env.SPEECH_API_URL;
		const speechApiKey = process.env.SPEECH_API_KEY;

		if (!speechApiUrl || !speechApiKey) {
			this.log("Speech API not configured, using fallback", "warn");
			return "[Speech transcription unavailable]";
		}

		try {
			const audioData = this.preprocessAudio(audioBuffer);

			const response = await fetch(speechApiUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${speechApiKey}`
				},
				body: JSON.stringify({
					audio: audioData.toString("base64"),
					config: {
						encoding: "LINEAR16",
						sampleRateHertz: 16000,
						languageCode: "en-US",
						enableWordTimeOffsets: true,
						model: "phone_call" // Best for child speech
					}
				})
			});

			if (!response.ok) {
				throw new Error(`Speech API error: ${response.statusText}`);
			}

			const result = await response.json();
			return result.transcript || "";
		} catch (error) {
			this.log(`Speech recognition failed: ${error}`, "error");
			return "";
		}
	}

	/**
	 * Extract phonemes from audio
	 */
	private async extractPhonemes(audioBuffer: Buffer): Promise<Phoneme[]> {
		if (!this.phoneticModel) {
			this.log("Phonetic model not available", "warn");
			return [];
		}

		// Preprocess audio for model
		const audioTensor = this.audioToTensor(audioBuffer);

		// Run through model
		const predictions = this.phoneticModel.predict(audioTensor) as tf.Tensor;
		const phonemeProbs = (await predictions.array()) as number[][];

		// Convert predictions to phonemes
		const phonemes: Phoneme[] = [];
		const phonemeMap = this.getPhonemeMap();

		// Process frame by frame
		for (let i = 0; i < phonemeProbs.length; i++) {
			const frame = phonemeProbs[i];
			const maxIndex = frame.indexOf(Math.max(...frame));
			const confidence = frame[maxIndex];

			if (confidence > 0.5) {
				phonemes.push({
					symbol: phonemeMap[maxIndex],
					startTime: i * 0.01, // 10ms frames
					endTime: (i + 1) * 0.01,
					confidence
				});
			}
		}

		// Clean up
		audioTensor.dispose();
		predictions.dispose();

		return this.mergePhonemes(phonemes);
	}

	/**
	 * Analyze articulation errors
	 */
	private async analyzeArticulation(
		phonemes: Phoneme[],
		targetText: string | undefined,
		childAge: number
	): Promise<ArticulationError[]> {
		const errors: ArticulationError[] = [];

		if (!targetText) {
			// Analyze for general articulation patterns
			return this.detectSpontaneousErrors(phonemes, childAge);
		}

		// Convert target text to expected phonemes
		const expectedPhonemes = await this.textToPhonemes(targetText);

		// Compare produced vs expected using dynamic programming alignment
		const aligned = this.alignPhonemes(expectedPhonemes, phonemes);

		for (let i = 0; i < aligned.length; i++) {
			const { expected, produced } = aligned[i];

			if (!produced) {
				// Omission
				errors.push({
					type: "omission",
					targetSound: expected,
					position: this.getPosition(i, aligned.length),
					severity: this.assessSeverity("omission", expected, childAge),
					consistency: 1.0
				});
			} else if (produced.symbol !== expected) {
				// Substitution or distortion
				const errorType = this.classifyError(expected, produced.symbol);
				errors.push({
					type: errorType,
					targetSound: expected,
					producedSound: produced.symbol,
					position: this.getPosition(i, aligned.length),
					severity: this.assessSeverity(errorType, expected, childAge),
					consistency: produced.confidence
				});
			}
		}

		return errors;
	}

	/**
	 * Analyze fluency
	 */
	private async analyzeFluency(audioBuffer: Buffer): Promise<FluencyMetrics> {
		// Extract audio features
		const audioFeatures = this.extractAudioFeatures(audioBuffer);

		// Detect disfluencies
		const disfluencies = this.detectDisfluencies(audioFeatures);

		// Calculate syllables per minute
		const syllableCount = this.countSyllables(audioFeatures);
		const durationSeconds = audioFeatures.duration;
		const syllablesPerMinute = (syllableCount / durationSeconds) * 60;

		// Calculate fluency score (0-1)
		const fluencyScore = this.calculateFluencyScore(disfluencies, syllableCount);

		// Assess stuttering likelihood
		const stutteringLikelihood = this.assessStutteringLikelihood(disfluencies, syllableCount);

		return {
			syllablesPerMinute,
			disfluencies,
			fluencyScore,
			stutteringLikelihood
		};
	}

	/**
	 * Analyze prosody
	 */
	private async analyzeProsody(audioBuffer: Buffer): Promise<ProsodyAnalysis> {
		const features = this.extractAudioFeatures(audioBuffer);

		// Calculate pitch statistics
		const pitchMean = this.mean(features.pitch);
		const pitchVariability = this.standardDeviation(features.pitch);

		// Calculate energy statistics
		const energyMean = this.mean(features.energy);
		const energyVariability = this.standardDeviation(features.energy);

		// Calculate speaking rate
		const syllableCount = this.countSyllables(features);
		const speakingRate = (syllableCount / features.duration) * 60; // syllables per minute

		// Assess naturalness (combination of variability and rate)
		const naturalness = this.assessNaturalness(pitchVariability, energyVariability, speakingRate);

		return {
			pitchMean,
			pitchVariability,
			energyMean,
			energyVariability,
			speakingRate,
			naturalness
		};
	}

	/**
	 * Generate therapy recommendations
	 */
	private async generateRecommendations(
		errors: ArticulationError[],
		fluency: FluencyMetrics,
		childAge: number
	): Promise<TherapyRecommendation[]> {
		const recommendations: TherapyRecommendation[] = [];

		// Group errors by sound
		const errorsBySound = new Map<string, ArticulationError[]>();
		errors.forEach((error) => {
			if (!errorsBySound.has(error.targetSound)) {
				errorsBySound.set(error.targetSound, []);
			}
			errorsBySound.get(error.targetSound)!.push(error);
		});

		// Generate recommendations for each problematic sound
		for (const [sound, soundErrors] of errorsBySound.entries()) {
			if (soundErrors.length >= 2) {
				const severity = Math.max(
					...soundErrors.map((e) =>
						e.severity === "severe" ? 3 : e.severity === "moderate" ? 2 : 1
					)
				);

				recommendations.push({
					targetSound: sound,
					therapyApproach: this.selectTherapyApproach(sound, soundErrors[0].type),
					activities: this.getTherapyActivities(sound, childAge),
					homePractice: this.getHomePracticeActivities(sound),
					expectedTimeline: this.estimateTimeline(severity, childAge),
					priority: severity === 3 ? "high" : severity === 2 ? "medium" : "low"
				});
			}
		}

		// Add fluency recommendations if needed
		if (fluency.stutteringLikelihood > 0.5) {
			recommendations.push({
				therapyApproach: "Fluency Shaping",
				activities: [
					"Easy onset practice",
					"Continuous phonation",
					"Light articulatory contacts",
					"Pausing and phrasing"
				],
				homePractice: [
					"Daily reading practice with slow rate",
					"Breathing exercises before speaking",
					"Parent modeling of slow, easy speech",
					"Reduce time pressure in conversations"
				],
				expectedTimeline: "3-6 months with consistent practice",
				priority: "high"
			});
		}

		return recommendations;
	}

	/**
	 * Load age norms
	 */
	private async loadAgeNorms(): Promise<void> {
		// Phoneme acquisition ages (in months) - based on research norms
		const norms: Record<string, { age: number; range: [number, number] }> = {
			// Early developing (by 3 years)
			m: { age: 36, range: [24, 36] },
			n: { age: 36, range: [24, 36] },
			p: { age: 36, range: [24, 36] },
			b: { age: 36, range: [24, 36] },
			w: { age: 36, range: [24, 36] },
			h: { age: 36, range: [24, 36] },

			// Mid developing (by 4-5 years)
			t: { age: 48, range: [36, 48] },
			d: { age: 48, range: [36, 48] },
			k: { age: 48, range: [36, 48] },
			g: { age: 48, range: [36, 48] },
			f: { age: 48, range: [36, 48] },
			v: { age: 60, range: [48, 60] },

			// Later developing (by 6-8 years)
			s: { age: 72, range: [48, 84] },
			z: { age: 72, range: [48, 84] },
			l: { age: 72, range: [60, 84] },
			r: { age: 84, range: [60, 96] },
			ʃ: { age: 72, range: [48, 84] }, // sh
			ʒ: { age: 84, range: [72, 96] }, // zh
			θ: { age: 84, range: [72, 96] }, // th (thin)
			ð: { age: 84, range: [72, 96] } // th (this)
		};

		Object.entries(norms).forEach(([key, value]) => {
			this.ageNorms.set(key, value);
		});
	}

	/**
	 * Check age appropriateness
	 */
	private checkAgeAppropriateness(errors: ArticulationError[], childAge: number): boolean {
		for (const error of errors) {
			const norm = this.ageNorms.get(error.targetSound);
			if (norm && childAge * 12 > norm.age && error.severity !== "mild") {
				return false;
			}
		}
		return true;
	}

	/**
	 * Assess severity based on age norms
	 */
	private assessSeverity(
		errorType: string,
		sound: string,
		childAge: number
	): "mild" | "moderate" | "severe" {
		const norm = this.ageNorms.get(sound);
		if (!norm) return "moderate";

		const ageMonths = childAge * 12;

		if (ageMonths < norm.range[0]) {
			// Not yet expected - mild
			return "mild";
		} else if (ageMonths <= norm.age) {
			// Emerging - mild to moderate
			return errorType === "omission" ? "moderate" : "mild";
		} else if (ageMonths <= norm.age + 12) {
			// Should be established - moderate
			return "moderate";
		} else {
			// Well past expected age - severe
			return "severe";
		}
	}

	/**
	 * Calculate intelligibility score
	 */
	private calculateIntelligibility(transcription: string, targetText?: string): number {
		if (!targetText) {
			// Without target, estimate based on transcription quality
			return transcription.length > 0 ? 0.7 : 0.0;
		}

		// Calculate word error rate
		const targetWords = targetText.toLowerCase().split(/\s+/);
		const transcribedWords = transcription.toLowerCase().split(/\s+/);

		let matches = 0;
		const maxLen = Math.max(targetWords.length, transcribedWords.length);

		for (let i = 0; i < Math.min(targetWords.length, transcribedWords.length); i++) {
			if (this.wordsMatch(targetWords[i], transcribedWords[i])) {
				matches++;
			}
		}

		return maxLen > 0 ? matches / maxLen : 0;
	}

	/**
	 * Generate insight
	 */
	async generateInsight(): Promise<any> {
		const recentAnalyses = await this.getRecentAnalyses();

		return {
			totalSamplesAnalyzed: recentAnalyses.length,
			averageIntelligibility: this.calculateAverageIntelligibility(recentAnalyses),
			mostCommonErrors: this.identifyCommonErrors(recentAnalyses),
			progressTrend: this.analyzeProgressTrend(recentAnalyses),
			therapyEffectiveness: this.assessTherapyEffectiveness(recentAnalyses),
			recommendations: this.generateOverallRecommendations(recentAnalyses)
		};
	}

	/**
	 * Helper methods
	 */

	private preprocessAudio(buffer: Buffer): Buffer {
		// Convert to 16kHz mono if needed
		// In production, use proper audio processing library
		return buffer;
	}

	private audioToTensor(buffer: Buffer): tf.Tensor {
		// Convert audio buffer to tensor
		const samples = new Int16Array(
			buffer.buffer,
			buffer.byteOffset,
			buffer.length / Int16Array.BYTES_PER_ELEMENT
		);
		const normalized = Array.from(samples).map((s) => s / 32768);
		return tf.tensor2d([normalized]);
	}

	private getPhonemeMap(): string[] {
		// IPA phoneme symbols
		return [
			"p",
			"b",
			"t",
			"d",
			"k",
			"g",
			"f",
			"v",
			"θ",
			"ð",
			"s",
			"z",
			"ʃ",
			"ʒ",
			"h",
			"m",
			"n",
			"ŋ",
			"l",
			"r",
			"w",
			"j",
			"i",
			"ɪ",
			"e",
			"ɛ",
			"æ",
			"ʌ",
			"ə",
			"ɜ",
			"a",
			"u",
			"ʊ",
			"o",
			"ɔ",
			"aɪ",
			"aʊ",
			"oɪ",
			"eɪ",
			"oʊ",
			"_silence_",
			"_unknown_",
			"_breath_",
			"_noise_"
		];
	}

	private mergePhonemes(phonemes: Phoneme[]): Phoneme[] {
		// Merge consecutive identical phonemes
		const merged: Phoneme[] = [];
		let current: Phoneme | null = null;

		for (const phoneme of phonemes) {
			if (current && current.symbol === phoneme.symbol) {
				current.endTime = phoneme.endTime;
				current.confidence = Math.max(current.confidence, phoneme.confidence);
			} else {
				if (current) merged.push(current);
				current = { ...phoneme };
			}
		}

		if (current) merged.push(current);
		return merged;
	}

	private getPosition(index: number, total: number): "initial" | "medial" | "final" {
		if (index === 0) return "initial";
		if (index === total - 1) return "final";
		return "medial";
	}

	private async textToPhonemes(text: string): Promise<string[]> {
		// Simple text-to-phoneme conversion
		// In production, use proper G2P (grapheme-to-phoneme) library
		const words = text.toLowerCase().split(/\s+/);
		const phonemes: string[] = [];

		for (const word of words) {
			// Basic phoneme mapping (simplified)
			for (const char of word) {
				phonemes.push(char);
			}
		}

		return phonemes;
	}

	private alignPhonemes(
		expected: string[],
		produced: Phoneme[]
	): Array<{ expected: string; produced: Phoneme | null }> {
		// Simple alignment - in production use dynamic time warping
		const aligned: Array<{ expected: string; produced: Phoneme | null }> = [];

		for (let i = 0; i < expected.length; i++) {
			aligned.push({
				expected: expected[i],
				produced: i < produced.length ? produced[i] : null
			});
		}

		return aligned;
	}

	private classifyError(expected: string, produced: string): "substitution" | "distortion" {
		// Determine if error is substitution or distortion
		// Distortion: similar phoneme (same manner/place)
		// Substitution: different phoneme

		const similarPhonemes: Record<string, string[]> = {
			s: ["z", "θ", "ʃ"],
			r: ["w", "l"],
			l: ["r", "w"]
		};

		if (similarPhonemes[expected]?.includes(produced)) {
			return "distortion";
		}

		return "substitution";
	}

	private detectSpontaneousErrors(phonemes: Phoneme[], childAge: number): ArticulationError[] {
		// Detect common error patterns in spontaneous speech
		const errors: ArticulationError[] = [];

		// Look for patterns like /w/ for /r/, /t/ for /k/, etc.
		for (let i = 0; i < phonemes.length; i++) {
			const phoneme = phonemes[i];

			// Check if this phoneme pattern indicates an error
			if (phoneme.confidence < 0.6) {
				// Low confidence might indicate distortion
				errors.push({
					type: "distortion",
					targetSound: phoneme.symbol,
					producedSound: phoneme.symbol,
					position: this.getPosition(i, phonemes.length),
					severity: this.assessSeverity("distortion", phoneme.symbol, childAge),
					consistency: phoneme.confidence
				});
			}
		}

		return errors;
	}

	private extractAudioFeatures(audioBuffer: Buffer): AudioFeatures {
		// Extract features from audio
		const samples = new Int16Array(
			audioBuffer.buffer,
			audioBuffer.byteOffset,
			audioBuffer.length / Int16Array.BYTES_PER_ELEMENT
		);

		const frameSize = 512;
		const hopSize = 256;
		const numFrames = Math.floor((samples.length - frameSize) / hopSize);

		const energy: number[] = [];
		const pitch: number[] = [];
		const voicing: boolean[] = [];
		const zeroCrossings: number[] = [];

		for (let i = 0; i < numFrames; i++) {
			const start = i * hopSize;
			const frame = samples.slice(start, start + frameSize);

			// Calculate energy
			const frameEnergy = this.calculateEnergy(frame);
			energy.push(frameEnergy);

			// Estimate pitch
			const framePitch = this.estimatePitch(frame, 16000);
			pitch.push(framePitch);

			// Detect voicing
			voicing.push(frameEnergy > 0.01 && framePitch > 50);

			// Count zero crossings
			const zc = this.countZeroCrossings(frame);
			zeroCrossings.push(zc);
		}

		return {
			energy,
			pitch,
			voicing,
			zeroCrossings,
			duration: samples.length / 16000 // Assuming 16kHz
		};
	}

	private calculateEnergy(frame: Int16Array): number {
		let sum = 0;
		for (let i = 0; i < frame.length; i++) {
			const normalized = frame[i] / 32768;
			sum += normalized * normalized;
		}
		return Math.sqrt(sum / frame.length);
	}

	private estimatePitch(frame: Int16Array, sampleRate: number): number {
		// Autocorrelation method for pitch detection
		const minPeriod = Math.floor(sampleRate / 500); // 500 Hz max
		const maxPeriod = Math.floor(sampleRate / 50); // 50 Hz min

		let maxCorr = 0;
		let bestPeriod = 0;

		for (let period = minPeriod; period < maxPeriod; period++) {
			let corr = 0;
			for (let i = 0; i < frame.length - period; i++) {
				corr += frame[i] * frame[i + period];
			}
			if (corr > maxCorr) {
				maxCorr = corr;
				bestPeriod = period;
			}
		}

		return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
	}

	private countZeroCrossings(frame: Int16Array): number {
		let count = 0;
		for (let i = 1; i < frame.length; i++) {
			if ((frame[i] >= 0 && frame[i - 1] < 0) || (frame[i] < 0 && frame[i - 1] >= 0)) {
				count++;
			}
		}
		return count;
	}

	private detectDisfluencies(features: AudioFeatures): Disfluency[] {
		const disfluencies: Disfluency[] = [];

		// Detect repetitions (rapid energy fluctuations)
		for (let i = 1; i < features.energy.length - 1; i++) {
			if (
				features.energy[i] > 0.1 &&
				features.energy[i - 1] < 0.05 &&
				features.energy[i + 1] < 0.05
			) {
				disfluencies.push({
					type: "repetition",
					timestamp: (i * 256) / 16000,
					duration: 0.1,
					severity: 0.5
				});
			}
		}

		// Detect prolongations (sustained pitch with low energy change)
		for (let i = 5; i < features.pitch.length - 5; i++) {
			const pitchWindow = features.pitch.slice(i - 5, i + 5);
			const pitchVariability = this.standardDeviation(pitchWindow);

			if (pitchVariability < 10 && features.pitch[i] > 100) {
				disfluencies.push({
					type: "prolongation",
					timestamp: (i * 256) / 16000,
					duration: 0.5,
					severity: 0.7
				});
			}
		}

		return disfluencies;
	}

	private countSyllables(features: AudioFeatures): number {
		// Count syllables based on energy peaks
		let syllables = 0;
		let inSyllable = false;

		for (let i = 0; i < features.energy.length; i++) {
			if (features.energy[i] > 0.1 && !inSyllable) {
				syllables++;
				inSyllable = true;
			} else if (features.energy[i] < 0.05) {
				inSyllable = false;
			}
		}

		return syllables;
	}

	private calculateFluencyScore(disfluencies: Disfluency[], syllableCount: number): number {
		if (syllableCount === 0) return 0;

		const disfluencyRate = disfluencies.length / syllableCount;
		const score = Math.max(0, 1 - disfluencyRate * 2);

		return score;
	}

	private assessStutteringLikelihood(
		disfluencies: Disfluency[],
		syllableCount: number
	): number {
		if (syllableCount === 0) return 0;

		const repetitions = disfluencies.filter((d) => d.type === "repetition").length;
		const prolongations = disfluencies.filter((d) => d.type === "prolongation").length;
		const blocks = disfluencies.filter((d) => d.type === "block").length;

		// Weight different types
		const weightedScore =
			(repetitions * 1.0 + prolongations * 1.5 + blocks * 2.0) / syllableCount;

		return Math.min(1, weightedScore * 10);
	}

	private assessNaturalness(
		pitchVariability: number,
		energyVariability: number,
		speakingRate: number
	): number {
		// Target ranges for natural speech
		const targetPitchVariability = 50; // Hz
		const targetEnergyVariability = 0.3;
		const targetRate = 150; // syllables per minute

		const pitchScore = 1 - Math.abs(pitchVariability - targetPitchVariability) / 100;
		const energyScore = 1 - Math.abs(energyVariability - targetEnergyVariability) / 0.5;
		const rateScore = 1 - Math.abs(speakingRate - targetRate) / 100;

		return (pitchScore + energyScore + rateScore) / 3;
	}

	private selectTherapyApproach(sound: string, errorType: string): string {
		if (errorType === "omission") {
			return "Phonological Approach - Auditory Bombardment";
		} else if (errorType === "substitution") {
			return "Traditional Articulation Therapy - Minimal Pairs";
		} else {
			return "Motor-Based Approach - PROMPT or Kaufman Method";
		}
	}

	private getTherapyActivities(sound: string, childAge: number): string[] {
		const ageGroup = childAge < 5 ? "preschool" : childAge < 8 ? "early elementary" : "older";

		const activities: Record<string, string[]> = {
			preschool: [
				`Play-based sound production with toys starting with /${sound}/`,
				"Picture cards and naming activities",
				"Songs and rhymes featuring the target sound",
				"Sensory play incorporating the sound"
			],
			"early elementary": [
				`Structured practice at word level for /${sound}/`,
				"Reading activities with target words",
				"Conversation practice with self-monitoring",
				"Game-based reinforcement activities"
			],
			older: [
				`Self-monitoring practice for /${sound}/ in conversation`,
				"Complex sentences and storytelling",
				"Presentation and public speaking practice",
				"Peer interaction activities"
			]
		};

		return activities[ageGroup] || activities["early elementary"];
	}

	private getHomePracticeActivities(sound: string): string[] {
		return [
			`Practice 10 words with /${sound}/ daily`,
			"Read aloud 5 minutes focusing on target sound",
			"Parent-child conversation with gentle reminders",
			"Keep a practice log and celebrate successes",
			"Play word games emphasizing the sound"
		];
	}

	private estimateTimeline(severity: number, childAge: number): string {
		const multiplier = childAge < 5 ? 1.5 : 1.0;

		if (severity === 3) {
			return `${Math.round(6 * multiplier)}-${Math.round(12 * multiplier)} months`;
		} else if (severity === 2) {
			return `${Math.round(3 * multiplier)}-${Math.round(6 * multiplier)} months`;
		} else {
			return `${Math.round(1 * multiplier)}-${Math.round(3 * multiplier)} months`;
		}
	}

	private mean(values: number[]): number {
		return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
	}

	private standardDeviation(values: number[]): number {
		const avg = this.mean(values);
		const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
		return Math.sqrt(this.mean(squareDiffs));
	}

	private wordsMatch(word1: string, word2: string): boolean {
		// Fuzzy match allowing for minor differences
		const similarity = this.levenshteinDistance(word1, word2);
		return similarity <= 2;
	}

	private levenshteinDistance(str1: string, str2: string): number {
		const matrix: number[][] = [];

		for (let i = 0; i <= str2.length; i++) {
			matrix[i] = [i];
		}

		for (let j = 0; j <= str1.length; j++) {
			matrix[0][j] = j;
		}

		for (let i = 1; i <= str2.length; i++) {
			for (let j = 1; j <= str1.length; j++) {
				if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1,
						matrix[i][j - 1] + 1,
						matrix[i - 1][j] + 1
					);
				}
			}
		}

		return matrix[str2.length][str1.length];
	}

	private async saveAnalysis(result: SpeechAnalysisResult): Promise<void> {
		try {
			await this.prisma.$executeRaw`
        INSERT INTO "SpeechAnalysis" 
        ("learnerId", "transcription", "intelligibilityScore", "articulationErrors", "fluencyMetrics", "createdAt")
        VALUES (${this.config.learnerId}, ${result.transcription}, ${result.intelligibilityScore}, 
                ${JSON.stringify(result.articulationErrors)}, ${JSON.stringify(result.fluencyMetrics)}, NOW())
      `;
		} catch (error) {
			this.log(`Failed to save analysis: ${error}`, "error");
		}
	}

	private async loadSpeechHistory(): Promise<void> {
		// Load previous analyses for progress tracking
		this.log("Speech history loaded");
	}

	private async getRecentAnalyses(): Promise<SpeechAnalysis[]> {
		try {
			const analyses = await this.prisma.$queryRaw<SpeechAnalysis[]>`
        SELECT * FROM "SpeechAnalysis"
        WHERE "learnerId" = ${this.config.learnerId}
        ORDER BY "createdAt" DESC
        LIMIT 50
      `;
			return analyses;
		} catch (error) {
			this.log(`Failed to fetch analyses: ${error}`, "error");
			return [];
		}
	}

	private calculateAverageIntelligibility(analyses: SpeechAnalysis[]): number {
		if (analyses.length === 0) return 0;
		const sum = analyses.reduce((acc, a) => acc + a.intelligibilityScore, 0);
		return sum / analyses.length;
	}

	private identifyCommonErrors(analyses: SpeechAnalysis[]): any[] {
		const errorCounts = new Map<string, number>();

		analyses.forEach((analysis) => {
			const errors = analysis.articulationErrors as ArticulationError[];
			errors.forEach((error) => {
				const key = `${error.targetSound}-${error.type}`;
				errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
			});
		});

		return Array.from(errorCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([key, count]) => ({ error: key, count }));
	}

	private analyzeProgressTrend(analyses: SpeechAnalysis[]): string {
		if (analyses.length < 2) return "Insufficient data";

		const recent = analyses.slice(0, 5);
		const older = analyses.slice(5, 10);

		const recentAvg = this.calculateAverageIntelligibility(recent);
		const olderAvg = this.calculateAverageIntelligibility(older);

		if (recentAvg > olderAvg + 0.1) return "Improving";
		if (recentAvg < olderAvg - 0.1) return "Declining";
		return "Stable";
	}

	private assessTherapyEffectiveness(analyses: SpeechAnalysis[]): string {
		const trend = this.analyzeProgressTrend(analyses);

		if (trend === "Improving") return "Therapy showing positive results";
		if (trend === "Declining") return "May need therapy approach adjustment";
		return "Continue current therapy plan";
	}

	private generateOverallRecommendations(analyses: SpeechAnalysis[]): string[] {
		const recommendations: string[] = [];
		const trend = this.analyzeProgressTrend(analyses);
		const avgIntelligibility = this.calculateAverageIntelligibility(analyses);

		if (avgIntelligibility < 0.7) {
			recommendations.push("Consider increasing therapy frequency");
		}

		if (trend === "Stable" && analyses.length > 20) {
			recommendations.push("Re-evaluate therapy goals and methods");
		}

		if (trend === "Improving") {
			recommendations.push("Continue current approach - showing progress");
		}

		return recommendations;
	}

	/**
	 * Fetch learner from database
	 */
	protected async fetchLearnerFromDB(): Promise<any> {
		return this.prisma.learner.findUnique({
			where: { id: this.config.learnerId }
		});
	}

	/**
	 * Handle agent messages
	 */
	protected async handleAgentMessage(message: any): Promise<any> {
		switch (message.type) {
			case "analyze_sample":
				return this.processInput(message.data);

			case "get_progress":
				return this.generateInsight();

			default:
				return { error: "Unknown message type" };
		}
	}

	/**
	 * Handle broadcast events
	 */
	protected async handleBroadcastEvent(event: any): Promise<void> {
		if (event.event === "speech_session_complete") {
			// Generate session summary
			await this.generateInsight();
		}
	}

	/**
	 * Shutdown agent
	 */
	async shutdown(): Promise<void> {
		if (this.phoneticModel) {
			this.phoneticModel.dispose();
		}
		await super.shutdown();
	}
}
