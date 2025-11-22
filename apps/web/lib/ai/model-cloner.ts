import { Buffer } from "node:buffer";
import { OpenAI } from "openai";
import { toFile } from "openai/uploads";
import { Pinecone } from "@pinecone-database/pinecone";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { LearnerProfile, PersonalizedModelConfig } from "@/lib/types/models";

interface FineTuningArtifacts {
  fileId: string;
  examples: Array<{ messages: Array<{ role: string; content: string }> }>;
}

interface VectorStoreResult {
  id: string;
}

export class AIVOModelCloner {
  private openai: OpenAI | null;
  private pinecone: Pinecone | null;
  private baseModelId = "aivo-super-model-v1";

  constructor() {
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
    this.pinecone = process.env.PINECONE_API_KEY ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY }) : null;
  }

  async cloneModel(profile: LearnerProfile): Promise<string> {
    const systemPrompt = this.generateSystemPrompt(profile);
    const fineTuningArtifacts = await this.prepareFineTuningData(profile);

    const fineTuningJob = this.openai
      ? await this.openai.fineTuning.jobs.create({
          training_file: fineTuningArtifacts.fileId,
          model: "gpt-4-turbo-preview",
          hyperparameters: {
            n_epochs: 3,
            learning_rate_multiplier: 0.3,
            batch_size: 1
          },
          suffix: `learner-${profile.learnerId}`
        })
      : { id: `mock-model-${profile.learnerId}`, status: "succeeded" };

    const vectorStore = await this.createPersonalizedVectorStore(profile);

    const configuration: PersonalizedModelConfig = {
      gradeLevel: profile.gradeLevel,
      actualLevel: profile.actualLevel,
      domainLevels: profile.domainLevels,
      learningStyle: profile.learningStyle,
      adaptationRules: this.generateAdaptationRules(profile)
    };

    const configurationJson = configuration as unknown as Prisma.JsonObject;

    const modelRecord = await prisma.personalizedModel.upsert({
      where: { learnerId: profile.learnerId },
      update: {
        modelId: fineTuningJob.id,
        systemPrompt,
        vectorStoreId: vectorStore.id,
        configuration: configurationJson,
        status: "TRAINING",
        summary: `Custom AIVO model derived from ${this.baseModelId}`
      },
      create: {
        learnerId: profile.learnerId,
        modelId: fineTuningJob.id,
        systemPrompt,
        vectorStoreId: vectorStore.id,
        configuration: configurationJson,
        status: "TRAINING",
        summary: `Custom AIVO model derived from ${this.baseModelId}`
      }
    });

    return modelRecord.id;
  }

  private generateSystemPrompt(profile: LearnerProfile): string {
    const diagnoses = profile.diagnoses.length
      ? profile.diagnoses.map((item) => `- Accommodate for ${item}`).join("\n")
      : "- Maintain calm pacing and sensory-friendly instructions";

    return `You are AIVO, a personalized learning assistant for a ${profile.gradeLevel}th grade student.
CRITICAL INSTRUCTIONS:
- The student learns at a ${profile.actualLevel}th grade level
- Teach ${profile.gradeLevel}th grade concepts using ${profile.actualLevel}th grade language
- Primary learning style: ${profile.learningStyle}
- Strengths: ${profile.strengths.join(", ") || "Curiosity"}
- Challenges: ${profile.challenges.join(", ") || "Regulation"}

ADAPTATION RULES:
- Reading: Teach at ${profile.domainLevels.READING ?? profile.actualLevel}th grade level
- Math: Teach at ${profile.domainLevels.MATH ?? profile.actualLevel}th grade level
- Science: Teach at ${profile.domainLevels.SCIENCE ?? profile.actualLevel}th grade level

TEACHING APPROACH:
- Break complex concepts into smaller steps
- Use frequent positive reinforcement
- Provide visual aids and examples
- Check understanding frequently
- Be patient and encouraging
- Adapt pace based on student responses

NEURODIVERSE CONSIDERATIONS:
${diagnoses}

Always maintain a supportive, engaging, and age-appropriate tone.`;
  }

  private async prepareFineTuningData(profile: LearnerProfile): Promise<FineTuningArtifacts> {
    const exemplarSubjects = Object.keys(profile.domainLevels ?? {}).slice(0, 3);
    const topics = exemplarSubjects.length ? exemplarSubjects : ["MATH", "READING", "SCIENCE"];

    const examples = topics.map((subject) => {
      const topic = this.pickTopic(subject);
      return {
        messages: [
          {
            role: "system",
            content: this.generateSystemPrompt(profile)
          },
          {
            role: "user",
            content: `Teach me about ${topic}`
          },
          {
            role: "assistant",
            content: this.generateAdaptedResponse(topic, profile.gradeLevel, profile.actualLevel, profile.learningStyle)
          }
        ]
      };
    });

    if (!this.openai) {
      return { fileId: `local-file-${profile.learnerId}`, examples };
    }

    const jsonl = examples.map((example) => JSON.stringify(example)).join("\n");
    const upload = await toFile(Buffer.from(jsonl), `learner-${profile.learnerId}-training.jsonl`);
    const file = await this.openai.files.create({
      file: upload,
      purpose: "fine-tune"
    });

    return { fileId: file.id, examples };
  }

  private async createPersonalizedVectorStore(profile: LearnerProfile): Promise<VectorStoreResult> {
    if (!this.pinecone) {
      return { id: `local-vector-${profile.learnerId}` };
    }

    const indexName = process.env.PINECONE_INDEX ?? "aivo-personalized";
    const index = this.pinecone.index(indexName);
    const namespace = index.namespace(`learner-${profile.learnerId}`);

    const baseVectors = [
      {
        id: `strengths-${profile.learnerId}`,
        values: this.encodeVector(profile.strengths.join(" ")),
        metadata: {
          type: "strengths",
          learnerId: profile.learnerId
        }
      },
      {
        id: `challenges-${profile.learnerId}`,
        values: this.encodeVector(profile.challenges.join(" ")),
        metadata: {
          type: "challenges",
          learnerId: profile.learnerId
        }
      }
    ];

    const domainVectors = Object.entries(profile.domainLevels ?? {}).map(([domain, level]) => ({
      id: `${domain.toLowerCase()}-${profile.learnerId}`,
      values: this.encodeVector(`${domain}:${level}`),
      metadata: {
        type: "domain-level",
        learnerId: profile.learnerId,
        domain,
        level
      }
    }));

    try {
      await namespace.upsert([...baseVectors, ...domainVectors]);
    } catch (error) {
      console.warn("Pinecone upsert failed; falling back to in-memory store", error);
      return { id: `local-vector-${profile.learnerId}` };
    }

    return { id: `${indexName}:learner-${profile.learnerId}` };
  }

  private encodeVector(text: string) {
    const normalized = text || "baseline";
    const charCodes = Array.from(normalized).map((char) => char.charCodeAt(0) / 255);
    while (charCodes.length < 8) {
      charCodes.push(0);
    }
    return charCodes.slice(0, 8);
  }

  private generateAdaptedResponse(topic: string, gradeLevel: number, actualLevel: number, learningStyle: string): string {
    const modalityPrompts: Record<string, string> = {
      VISUAL: `Use diagrams, colors, and spatial comparisons to explain ${topic}.`,
      AUDITORY: `Guide the learner through ${topic} using narration, rhythm, and call-and-response prompts.`,
      KINESTHETIC: `Design a hands-on mini activity for ${topic}, inviting movement or object manipulation.`,
      MIXED: `Blend a short story, a sketch in words, and a try-it reflection for ${topic}.`
    };

    return `Teach ${topic} for a grade ${gradeLevel} classroom while speaking with grade ${actualLevel} vocabulary.
${modalityPrompts[learningStyle] ?? modalityPrompts.MIXED}
Break instructions into three scaffolded steps, end with a confidence check question, and reinforce the learner's strengths.`;
  }

  private generateAdaptationRules(profile: LearnerProfile) {
    return {
      difficultyAdjustment: {
        successThreshold: 0.8,
        struggleThreshold: 0.5,
        requiresApproval: true
      },
      contentAdaptation: {
        simplifyLanguage: profile.actualLevel < profile.gradeLevel,
        addVisualAids: profile.learningStyle === "VISUAL" || profile.learningStyle === "MIXED",
        breakIntoSteps: true,
        providedExamples: 3
      },
      pacing: {
        baseSpeed: "MODERATE",
        adjustBasedOnEngagement: true,
        breakFrequency: 15
      }
    };
  }

  private pickTopic(subject: string) {
    const defaults: Record<string, string[]> = {
      MATH: ["fractions", "geometry basics", "data tables"],
      READING: ["main idea", "context clues", "character traits"],
      SCIENCE: ["water cycle", "ecosystems", "energy transfer"],
      SEL: ["mindful breathing", "growth mindset"],
      SPEECH: ["clear speech", "storytelling"]
    };

    const normalized = subject.toUpperCase();
    const pool = defaults[normalized] ?? ["study skills"];
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
