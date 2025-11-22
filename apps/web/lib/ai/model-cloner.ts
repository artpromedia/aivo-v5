import { Buffer } from "node:buffer";
import { OpenAI } from "openai";
import { toFile } from "openai/uploads";
import { Pinecone } from "@pinecone-database/pinecone";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { LearnerProfile, PersonalizedModelConfig } from "@/lib/types/models";
import path from "path";

// Import federated learning components
import { ModelCloner } from "@aivo/agents/ml/ModelCloner";
import { FederatedLearningManager } from "@aivo/agents/ml/FederatedLearning";
import { AssessmentDataProcessor } from "@aivo/agents/ml/AssessmentDataProcessor";
import type { BaselineAssessmentData } from "@aivo/agents/ml/AssessmentDataProcessor";

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
  private baseModelId = "aivo-main-v1"; // Updated to reference actual main model
  private mainModelPath: string;
  private modelCloner: ModelCloner;
  private federatedLearning: FederatedLearningManager;
  private assessmentProcessor: AssessmentDataProcessor;
  private useFederatedLearning: boolean;

  constructor() {
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
    this.pinecone = process.env.PINECONE_API_KEY ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY }) : null;
    
    // Path to main AIVO model
    this.mainModelPath = process.env.AIVO_MAIN_MODEL_PATH || path.join(process.cwd(), "models", "main-aivo");
    
    // Initialize model cloner for federated learning
    this.modelCloner = new ModelCloner();
    
    // Initialize federated learning manager for personalization training
    this.federatedLearning = new FederatedLearningManager({
      enableDifferentialPrivacy: process.env.ENABLE_DIFFERENTIAL_PRIVACY === "true",
      noiseMultiplier: parseFloat(process.env.NOISE_MULTIPLIER || "0.1"),
      clipNorm: parseFloat(process.env.CLIP_NORM || "1.0")
    });
    
    // Initialize assessment processor
    this.assessmentProcessor = new AssessmentDataProcessor();
    
    // Use federated learning if main model exists, otherwise fall back to fine-tuning
    this.useFederatedLearning = process.env.USE_FEDERATED_LEARNING === "true";
  }

  async cloneModel(profile: LearnerProfile): Promise<string> {
    console.log(`Cloning model for learner: ${profile.learnerId}`);
    console.log(`Using federated learning: ${this.useFederatedLearning}`);

    if (this.useFederatedLearning) {
      // Use true neural network weight cloning (federated learning approach)
      return this.cloneWithWeights(profile);
    } else {
      // Fall back to fine-tuning approach if main model not available
      return this.cloneWithFineTuning(profile);
    }
  }

  /**
   * Clone model using neural network weight copying (federated learning)
   * with baseline assessment personalization
   */
  private async cloneWithWeights(profile: LearnerProfile): Promise<string> {
    const systemPrompt = this.generateSystemPrompt(profile);
    const vectorStore = await this.createPersonalizedVectorStore(profile);

    // Path for learner's cloned model
    const learnerModelPath = path.join(
      process.cwd(),
      "models",
      "learners",
      profile.learnerId
    );

    try {
      // Step 1: Fetch baseline assessment data
      console.log(`Fetching baseline assessment for learner ${profile.learnerId}...`);
      const assessmentData = await this.fetchBaselineAssessment(profile.learnerId);
      
      let recommendedLevels: Record<string, any> = {};
      let personalizationMetadata: any = {};

      // Step 2: Clone weights from main model
      console.log("Cloning weights from main model...");
      const cloneInfo = await this.modelCloner.cloneModel({
        mainModelPath: this.mainModelPath,
        learnerModelPath,
        learnerId: profile.learnerId,
        // Freeze early layers (feature extraction), allow later layers to adapt
        freezeLayers: [
          "shared_dense_1",
          "shared_bn_1",
          "shared_dense_2",
          "shared_bn_2"
        ]
      });

      console.log(`Cloned model successfully for learner ${profile.learnerId}`);
      console.log(`Total params: ${cloneInfo.architecture.totalParams}`);
      console.log(`Trainable params: ${cloneInfo.architecture.trainableParams}`);

      // Step 3: Personalize model with baseline assessment data
      if (assessmentData && assessmentData.domainResults.length > 0) {
        console.log("Personalizing model with baseline assessment data...");
        
        try {
          const personalizationResult = await this.personalizeWithAssessment(
            learnerModelPath,
            assessmentData,
            profile.learnerId
          );
          
          recommendedLevels = personalizationResult.recommendedLevels;
          personalizationMetadata = personalizationResult.metadata;
          
          console.log("Model personalization complete");
          console.log("Recommended starting levels:", recommendedLevels);
        } catch (personalizationError) {
          console.error("Personalization failed, using generic clone:", personalizationError);
          // Continue with generic clone if personalization fails
        }
      } else {
        console.log("No baseline assessment found, using generic clone");
      }

      // Step 4: Create configuration for learner
      const configuration: PersonalizedModelConfig = {
        gradeLevel: profile.gradeLevel,
        actualLevel: profile.actualLevel,
        domainLevels: profile.domainLevels,
        learningStyle: profile.learningStyle,
        adaptationRules: this.generateAdaptationRules(profile),
        recommendedLevels // Add recommended levels from assessment
      };

      const configurationJson = configuration as unknown as Prisma.JsonObject;

      // Store model metadata in database
      const modelRecord = await prisma.personalizedModel.upsert({
        where: { learnerId: profile.learnerId },
        update: {
          modelId: cloneInfo.sourceModelVersion,
          systemPrompt,
          vectorStoreId: vectorStore.id,
          configuration: configurationJson,
          status: "ACTIVE", // Immediately active since weights are cloned and personalized
          summary: `Personalized federated learning model cloned from ${this.baseModelId}`,
          metadata: {
            clonedModelPath: cloneInfo.clonedModelPath,
            cloneDate: cloneInfo.cloneDate.toISOString(),
            architecture: cloneInfo.architecture,
            federatedLearning: true,
            personalized: assessmentData ? true : false,
            assessmentBased: assessmentData ? true : false,
            recommendedLevels,
            personalizationMetadata
          } as any
        },
        create: {
          learnerId: profile.learnerId,
          modelId: cloneInfo.sourceModelVersion,
          systemPrompt,
          vectorStoreId: vectorStore.id,
          configuration: configurationJson,
          status: "ACTIVE",
          summary: `Personalized federated learning model cloned from ${this.baseModelId}`,
          metadata: {
            clonedModelPath: cloneInfo.clonedModelPath,
            cloneDate: cloneInfo.cloneDate.toISOString(),
            architecture: cloneInfo.architecture,
            federatedLearning: true,
            personalized: assessmentData ? true : false,
            assessmentBased: assessmentData ? true : false,
            recommendedLevels,
            personalizationMetadata
          } as any
        }
      });

      return modelRecord.id;
    } catch (error) {
      console.error("Weight cloning failed, falling back to fine-tuning:", error);
      // Fall back to fine-tuning if weight cloning fails
      return this.cloneWithFineTuning(profile);
    }
  }

  /**
   * Legacy fine-tuning approach (fallback when main model unavailable)
   */
  private async cloneWithFineTuning(profile: LearnerProfile): Promise<string> {
    console.log("Using fine-tuning approach (legacy fallback)");
    
    const systemPrompt = this.generateSystemPrompt(profile);
    const fineTuningArtifacts = await this.prepareFineTuningData(profile);

  /**
   * Legacy fine-tuning approach (fallback when main model unavailable)
   */
  private async cloneWithFineTuning(profile: LearnerProfile): Promise<string> {
    console.log("Using fine-tuning approach (legacy fallback)");
    
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
        summary: `Custom AIVO model derived from ${this.baseModelId} (fine-tuning)`,
        metadata: {
          federatedLearning: false,
          fineTuningJob: fineTuningJob.id
        } as any
      },
      create: {
        learnerId: profile.learnerId,
        modelId: fineTuningJob.id,
        systemPrompt,
        vectorStoreId: vectorStore.id,
        configuration: configurationJson,
        status: "TRAINING",
        summary: `Custom AIVO model derived from ${this.baseModelId} (fine-tuning)`,
        metadata: {
          federatedLearning: false,
          fineTuningJob: fineTuningJob.id
        } as any
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

  /**
   * Fetch baseline assessment data for a learner
   */
  private async fetchBaselineAssessment(learnerId: string): Promise<BaselineAssessmentData | null> {
    try {
      const assessment = await prisma.baselineAssessmentSession.findFirst({
        where: {
          learnerId,
          status: "COMPLETED"
        },
        include: {
          domainResults: true,
          speechSamples: true
        },
        orderBy: {
          completedAt: "desc"
        }
      });

      if (!assessment) {
        console.log(`No completed baseline assessment found for learner ${learnerId}`);
        return null;
      }

      return {
        sessionId: assessment.id,
        learnerId: assessment.learnerId,
        status: assessment.status as "IN_PROGRESS" | "COMPLETED" | "ABANDONED",
        domainResults: assessment.domainResults.map(result => ({
          domain: result.domain,
          component: result.component,
          modality: result.modality,
          responses: result.responses,
          score: result.score || undefined,
          confidence: result.confidence || undefined,
          aiNotes: result.aiNotes || undefined
        })),
        speechSamples: assessment.speechSamples?.map(sample => ({
          taskType: sample.taskType,
          component: sample.component || undefined,
          articulation: sample.articulation || undefined,
          fluency: sample.fluency || undefined,
          intelligibility: sample.intelligibility || undefined,
          analysis: sample.analysis || undefined
        })),
        completedAt: assessment.completedAt || undefined
      };
    } catch (error) {
      console.error("Error fetching baseline assessment:", error);
      return null;
    }
  }

  /**
   * Personalize cloned model using baseline assessment data
   */
  private async personalizeWithAssessment(
    learnerModelPath: string,
    assessmentData: BaselineAssessmentData,
    learnerId: string
  ): Promise<{
    recommendedLevels: Record<string, any>;
    metadata: any;
  }> {
    // Process assessment into training data
    const trainingData = await this.assessmentProcessor.processAssessment(assessmentData);

    console.log(`Generated ${trainingData.metadata.totalSamples} training samples from assessment`);
    console.log(`Domain breakdown:`, trainingData.metadata.domainBreakdown);
    console.log(`Average score: ${(trainingData.metadata.averageScore * 100).toFixed(1)}%`);

    // Load the cloned model
    const { model } = await this.modelCloner.loadClonedModel(learnerModelPath);

    try {
      // Perform initial personalization training
      await this.federatedLearning.trainLocalModel(
        model,
        {
          features: trainingData.features,
          labels: trainingData.labels
        },
        {
          learnerId,
          epochs: 5, // Quick personalization, not full training
          batchSize: 16,
          learningRate: 0.01 // Higher rate for initial personalization
        }
      );

      console.log("Initial personalization training complete");

      // Save the personalized model
      await model.save(`file://${learnerModelPath}`);

      // Get recommended levels
      const recommendedLevels = this.assessmentProcessor.getRecommendedLevels(
        trainingData.metadata
      );

      // Clean up
      this.assessmentProcessor.dispose(trainingData);
      model.dispose();

      return {
        recommendedLevels,
        metadata: {
          trainingSamples: trainingData.metadata.totalSamples,
          domainBreakdown: trainingData.metadata.domainBreakdown,
          averageScore: trainingData.metadata.averageScore,
          confidenceLevel: trainingData.metadata.confidenceLevel,
          personalizedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      // Clean up on error
      this.assessmentProcessor.dispose(trainingData);
      model.dispose();
      throw error;
    }
  }
}
