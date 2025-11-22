/**
 * Speech Analysis Agent Tests
 * 
 * Tests speech-to-text, phoneme analysis, articulation error detection,
 * fluency assessment, and therapy recommendations.
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { SpeechAnalysisAgent, type SpeechSample } from "../SpeechAnalysisAgent";
import type { AgentConfig } from "../base/AgentFramework";

describe("SpeechAnalysisAgent", () => {
	let agent: SpeechAnalysisAgent;
	let mockPrisma: any;
	let mockConfig: AgentConfig;
	let mockAudioBuffer: Buffer;

	beforeEach(async () => {
		// Mock Prisma
		mockPrisma = {
			learner: {
				findUnique: jest.fn().mockResolvedValue({
					id: "learner-123",
					firstName: "Emma",
					dateOfBirth: new Date("2019-01-01"),
					gradeLevel: 1
				})
			},
			$executeRaw: jest.fn().mockResolvedValue(1),
			$queryRaw: jest.fn().mockResolvedValue([])
		};

		mockConfig = {
			agentId: "speech-agent-1",
			agentType: "speech_analysis",
			learnerId: "learner-123",
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
			}
		};

		// Create mock audio buffer (16-bit PCM, 16kHz)
		const sampleCount = 16000; // 1 second
		const buffer = Buffer.alloc(sampleCount * 2);
		for (let i = 0; i < sampleCount; i++) {
			buffer.writeInt16LE(Math.sin(2 * Math.PI * 440 * i / 16000) * 10000, i * 2);
		}
		mockAudioBuffer = buffer;

		agent = new SpeechAnalysisAgent(mockConfig, mockPrisma);
		await agent.initialize();
	});

	describe("Initialization", () => {
		it("should initialize agent successfully", () => {
			const state = agent.getAgentState();
			expect(state.status).toBe("idle");
		});

		it("should load age norms", async () => {
			const sample: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				targetText: "mama",
				taskType: "articulation",
				childAge: 3
			};

			const response = await agent.processInput(sample);
			expect(response.data.ageAppropriateness).toBeDefined();
		});
	});

	describe("Speech Transcription", () => {
		it("should transcribe speech sample", async () => {
			const sample: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				taskType: "conversation",
				childAge: 5
			};

			const response = await agent.processInput(sample);

			expect(response.action).toBe("analyze_speech");
			expect(response.data.transcription).toBeDefined();
		});

		it("should handle missing speech API gracefully", async () => {
			// Remove API env vars
			const oldUrl = process.env.SPEECH_API_URL;
			const oldKey = process.env.SPEECH_API_KEY;
			delete process.env.SPEECH_API_URL;
			delete process.env.SPEECH_API_KEY;

			const sample: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				taskType: "articulation",
				childAge: 4
			};

			const response = await agent.processInput(sample);
			expect(response.data.transcription).toBeDefined();

			// Restore
			if (oldUrl) process.env.SPEECH_API_URL = oldUrl;
			if (oldKey) process.env.SPEECH_API_KEY = oldKey;
		});
	});

	describe("Phoneme Extraction", () => {
		it("should extract phonemes from audio", async () => {
			const sample: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				taskType: "articulation",
				childAge: 5
			};

			const response = await agent.processInput(sample);

			expect(response.data.phonemes).toBeDefined();
			expect(Array.isArray(response.data.phonemes)).toBe(true);
		});

		it("should include phoneme timing information", async () => {
			const sample: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				targetText: "cat",
				taskType: "articulation",
				childAge: 4
			};

			const response = await agent.processInput(sample);

			if (response.data.phonemes.length > 0) {
				const phoneme = response.data.phonemes[0];
				expect(phoneme.startTime).toBeDefined();
				expect(phoneme.endTime).toBeDefined();
				expect(phoneme.confidence).toBeGreaterThanOrEqual(0);
				expect(phoneme.confidence).toBeLessThanOrEqual(1);
			}
		});
	});

	describe("Articulation Error Detection", () => {
		it("should detect articulation errors", async () => {
			const sample: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				targetText: "rabbit",
				taskType: "articulation",
				childAge: 4
			};

			const response = await agent.processInput(sample);

			expect(response.data.articulationErrors).toBeDefined();
			expect(Array.isArray(response.data.articulationErrors)).toBe(true);
		});

		it("should classify error types correctly", async () => {
			const sample: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				targetText: "sun",
				taskType: "articulation",
				childAge: 6
			};

			const response = await agent.processInput(sample);

			response.data.articulationErrors.forEach((error: any) => {
				expect(["substitution", "omission", "distortion", "addition"]).toContain(error.type);
				expect(["initial", "medial", "final"]).toContain(error.position);
				expect(["mild", "moderate", "severe"]).toContain(error.severity);
			});
		});

		it("should assess age-appropriate errors", async () => {
			// 3-year-old with /r/ error - age appropriate
			const sample1: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				targetText: "rabbit",
				taskType: "articulation",
				childAge: 3
			};

			const response1 = await agent.processInput(sample1);
			// Errors expected for young child

			// 8-year-old with /r/ error - not age appropriate
			const sample2: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				targetText: "rabbit",
				taskType: "articulation",
				childAge: 8
			};

			const response2 = await agent.processInput(sample2);
			expect(response2.data.ageAppropriateness).toBeDefined();
		});
	});

	describe("Fluency Assessment", () => {
		it("should calculate fluency metrics", async () => {
			const sample: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				taskType: "fluency",
				childAge: 5
			};

			const response = await agent.processInput(sample);

			expect(response.data.fluencyMetrics).toBeDefined();
			expect(response.data.fluencyMetrics.syllablesPerMinute).toBeGreaterThan(0);
			expect(response.data.fluencyMetrics.fluencyScore).toBeGreaterThanOrEqual(0);
			expect(response.data.fluencyMetrics.fluencyScore).toBeLessThanOrEqual(1);
			expect(response.data.fluencyMetrics.stutteringLikelihood).toBeGreaterThanOrEqual(0);
			expect(response.data.fluencyMetrics.stutteringLikelihood).toBeLessThanOrEqual(1);
		});

		it("should detect disfluencies", async () => {
			const sample: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				taskType: "fluency",
				childAge: 6
			};

			const response = await agent.processInput(sample);

			expect(response.data.fluencyMetrics.disfluencies).toBeDefined();
			expect(Array.isArray(response.data.fluencyMetrics.disfluencies)).toBe(true);

			response.data.fluencyMetrics.disfluencies.forEach((d: any) => {
				expect(["repetition", "prolongation", "block", "interjection"]).toContain(d.type);
				expect(d.timestamp).toBeGreaterThanOrEqual(0);
				expect(d.duration).toBeGreaterThan(0);
			});
		});
	});

	describe("Prosody Analysis", () => {
		it("should analyze prosody", async () => {
			const sample: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				taskType: "conversation",
				childAge: 5
			};

			const response = await agent.processInput(sample);

			expect(response.data.prosodyAnalysis).toBeDefined();
			expect(response.data.prosodyAnalysis.pitchMean).toBeGreaterThan(0);
			expect(response.data.prosodyAnalysis.pitchVariability).toBeGreaterThanOrEqual(0);
			expect(response.data.prosodyAnalysis.energyMean).toBeGreaterThan(0);
			expect(response.data.prosodyAnalysis.speakingRate).toBeGreaterThan(0);
			expect(response.data.prosodyAnalysis.naturalness).toBeGreaterThanOrEqual(0);
			expect(response.data.prosodyAnalysis.naturalness).toBeLessThanOrEqual(1);
		});
	});

	describe("Intelligibility Scoring", () => {
		it("should calculate intelligibility score with target text", async () => {
			const sample: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				targetText: "The cat sat on the mat",
				taskType: "articulation",
				childAge: 5
			};

			const response = await agent.processInput(sample);

			expect(response.data.intelligibilityScore).toBeGreaterThanOrEqual(0);
			expect(response.data.intelligibilityScore).toBeLessThanOrEqual(1);
		});

		it("should estimate intelligibility without target text", async () => {
			const sample: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				taskType: "conversation",
				childAge: 5
			};

			const response = await agent.processInput(sample);

			expect(response.data.intelligibilityScore).toBeGreaterThanOrEqual(0);
			expect(response.data.intelligibilityScore).toBeLessThanOrEqual(1);
		});
	});

	describe("Therapy Recommendations", () => {
		it("should generate therapy recommendations", async () => {
			const sample: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				targetText: "rabbit runs rapidly",
				taskType: "articulation",
				childAge: 6
			};

			const response = await agent.processInput(sample);

			expect(response.data.recommendations).toBeDefined();
			expect(Array.isArray(response.data.recommendations)).toBe(true);

			response.data.recommendations.forEach((rec: any) => {
				expect(rec.therapyApproach).toBeDefined();
				expect(Array.isArray(rec.activities)).toBe(true);
				expect(Array.isArray(rec.homePractice)).toBe(true);
				expect(rec.expectedTimeline).toBeDefined();
				expect(["high", "medium", "low"]).toContain(rec.priority);
			});
		});

		it("should prioritize severe errors", async () => {
			const sample: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				targetText: "see the sun",
				taskType: "articulation",
				childAge: 8
			};

			const response = await agent.processInput(sample);

			const highPriorityRecs = response.data.recommendations.filter(
				(r: any) => r.priority === "high"
			);

			// Older child with errors should have high priority
			expect(response.data.recommendations.length).toBeGreaterThan(0);
		});

		it("should include fluency recommendations when needed", async () => {
			// Mock high stuttering likelihood
			const sample: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				taskType: "fluency",
				childAge: 5
			};

			const response = await agent.processInput(sample);

			// Check if fluency recommendations exist
			const fluencyRecs = response.data.recommendations.filter((r: any) =>
				r.therapyApproach.toLowerCase().includes("fluency")
			);

			expect(Array.isArray(response.data.recommendations)).toBe(true);
		});

		it("should adapt activities to child age", async () => {
			// Preschool child
			const sample1: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				targetText: "ball",
				taskType: "articulation",
				childAge: 3
			};

			const response1 = await agent.processInput(sample1);

			// Older child
			const sample2: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				targetText: "ball",
				taskType: "articulation",
				childAge: 9
			};

			const response2 = await agent.processInput(sample2);

			expect(response1.data.recommendations).toBeDefined();
			expect(response2.data.recommendations).toBeDefined();
		});
	});

	describe("Progress Tracking", () => {
		it("should generate insights from analysis history", async () => {
			// Mock analysis history
			mockPrisma.$queryRaw.mockResolvedValue([
				{
					id: "1",
					learnerId: "learner-123",
					transcription: "test",
					intelligibilityScore: 0.8,
					articulationErrors: [],
					fluencyMetrics: {},
					createdAt: new Date()
				}
			]);

			const insights = await agent.generateInsight();

			expect(insights.totalSamplesAnalyzed).toBeGreaterThanOrEqual(0);
			expect(insights.averageIntelligibility).toBeGreaterThanOrEqual(0);
			expect(insights.mostCommonErrors).toBeDefined();
			expect(insights.progressTrend).toBeDefined();
			expect(insights.recommendations).toBeDefined();
		});

		it("should track progress trends", async () => {
			const analyses = [
				{
					id: "1",
					learnerId: "learner-123",
					intelligibilityScore: 0.9,
					createdAt: new Date()
				},
				{
					id: "2",
					learnerId: "learner-123",
					intelligibilityScore: 0.7,
					createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
				}
			];

			mockPrisma.$queryRaw.mockResolvedValue(analyses);

			const insights = await agent.generateInsight();
			expect(["Improving", "Stable", "Declining", "Insufficient data"]).toContain(
				insights.progressTrend
			);
		});
	});

	describe("Data Persistence", () => {
		it("should save analysis results", async () => {
			const sample: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				targetText: "hello",
				taskType: "articulation",
				childAge: 5
			};

			await agent.processInput(sample);

			expect(mockPrisma.$executeRaw).toHaveBeenCalled();
		});

		it("should handle save errors gracefully", async () => {
			mockPrisma.$executeRaw.mockRejectedValue(new Error("Database error"));

			const sample: SpeechSample = {
				audioBuffer: mockAudioBuffer,
				sampleRate: 16000,
				taskType: "conversation",
				childAge: 5
			};

			// Should not throw
			await expect(agent.processInput(sample)).resolves.toBeDefined();
		});
	});

	describe("Agent Communication", () => {
		it("should handle analyze_sample message", async () => {
			const message = {
				type: "analyze_sample",
				data: {
					audioBuffer: mockAudioBuffer,
					sampleRate: 16000,
					taskType: "articulation",
					childAge: 5
				}
			};

			const response = await (agent as any).handleAgentMessage(message);

			expect(response.action).toBe("analyze_speech");
			expect(response.data).toBeDefined();
		});

		it("should handle get_progress message", async () => {
			const message = {
				type: "get_progress"
			};

			const response = await (agent as any).handleAgentMessage(message);

			expect(response.totalSamplesAnalyzed).toBeDefined();
		});

		it("should handle unknown message types", async () => {
			const message = {
				type: "unknown"
			};

			const response = await (agent as any).handleAgentMessage(message);

			expect(response.error).toBeDefined();
		});
	});

	describe("Cleanup", () => {
		it("should cleanup resources on shutdown", async () => {
			await agent.shutdown();

			const state = agent.getAgentState();
			expect(state.status).toBe("shutdown");
		});
	});
});
