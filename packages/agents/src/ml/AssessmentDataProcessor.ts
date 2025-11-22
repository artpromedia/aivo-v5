/**
 * Assessment Data Processor
 * 
 * Converts baseline assessment results into training data for model personalization.
 * This enables the cloned model to start with learner-specific knowledge state.
 */

import * as tf from "@tensorflow/tfjs-node";

export interface BaselineAssessmentData {
  sessionId: string;
  learnerId: string;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  domainResults: DomainResult[];
  speechSamples?: SpeechSample[];
  completedAt?: Date;
}

export interface DomainResult {
  domain: string; // e.g., "MATH", "LITERACY", "SCIENCE"
  component: string; // e.g., "counting", "reading", "observation"
  modality: string; // e.g., "visual", "auditory", "kinesthetic"
  responses: any;
  score?: number; // 0-1 or 0-100
  confidence?: number; // 0-1
  aiNotes?: string;
}

export interface SpeechSample {
  taskType: string;
  component?: string;
  articulation?: number;
  fluency?: number;
  intelligibility?: number;
  analysis?: any;
}

export interface PersonalizationTrainingData {
  features: tf.Tensor2D; // [numSamples, 256] input features
  labels: {
    content: tf.Tensor2D; // [numSamples, 128] content preferences
    difficulty: tf.Tensor2D; // [numSamples, 10] difficulty levels
    path: tf.Tensor2D; // [numSamples, 32] learning paths
  };
  metadata: {
    totalSamples: number;
    domainBreakdown: Record<string, number>;
    averageScore: number;
    confidenceLevel: number;
    recommendedLevels: Record<string, number>;
  };
}

export class AssessmentDataProcessor {
  private domainMapping: Record<string, number>;
  private componentMapping: Record<string, number>;
  private modalityMapping: Record<string, number>;

  constructor() {
    // Map domains to feature indices
    this.domainMapping = {
      MATH: 0,
      LITERACY: 32,
      SCIENCE: 64,
      SOCIAL_STUDIES: 96,
      LANGUAGE: 128,
      EXECUTIVE_FUNCTION: 160,
      MOTOR_SKILLS: 192,
      SOCIAL_EMOTIONAL: 224
    };

    // Map components to sub-indices (example)
    this.componentMapping = {
      counting: 0,
      addition: 1,
      subtraction: 2,
      multiplication: 3,
      division: 4,
      fractions: 5,
      reading: 0,
      writing: 1,
      comprehension: 2,
      vocabulary: 3,
      phonics: 4
      // ... add more as needed
    };

    // Map modalities
    this.modalityMapping = {
      visual: 0,
      auditory: 1,
      kinesthetic: 2,
      multimodal: 3
    };
  }

  /**
   * Process baseline assessment into training data for model personalization
   */
  async processAssessment(
    assessmentData: BaselineAssessmentData
  ): Promise<PersonalizationTrainingData> {
    if (assessmentData.domainResults.length === 0) {
      throw new Error("No assessment results to process");
    }

    // Generate training samples from assessment results
    const samples = this.generateTrainingSamples(assessmentData.domainResults);

    // Convert to tensors
    const features = this.createFeatureTensor(samples);
    const labels = this.createLabelTensors(samples);

    // Calculate metadata
    const metadata = this.calculateMetadata(assessmentData, samples);

    return {
      features,
      labels,
      metadata
    };
  }

  /**
   * Generate training samples from domain results
   */
  private generateTrainingSamples(domainResults: DomainResult[]): TrainingSample[] {
    const samples: TrainingSample[] = [];

    for (const result of domainResults) {
      // Create multiple samples per domain result to ensure adequate training data
      const numSamples = Math.max(3, Math.floor((result.score || 0.5) * 10));

      for (let i = 0; i < numSamples; i++) {
        const sample = this.createSampleFromResult(result, i);
        samples.push(sample);
      }
    }

    return samples;
  }

  /**
   * Create a training sample from a domain result
   */
  private createSampleFromResult(result: DomainResult, variation: number): TrainingSample {
    const domainIdx = this.domainMapping[result.domain] || 0;
    const componentIdx = this.componentMapping[result.component] || 0;
    const modalityIdx = this.modalityMapping[result.modality] || 0;

    // Create 256-dimensional feature vector
    const features = new Array(256).fill(0);

    // Encode domain (one-hot in domain section)
    features[domainIdx + componentIdx] = 1.0;

    // Encode modality preference
    features[240 + modalityIdx] = 1.0;

    // Encode performance level
    const score = result.score || 0.5;
    const confidence = result.confidence || 0.7;
    features[244] = score;
    features[245] = confidence;
    features[246] = score * confidence; // weighted performance

    // Add variation noise for data augmentation
    const noise = (variation * 0.1) / 10;
    features[247] = noise;

    // Encode difficulty level (0-9, where score determines current level)
    const difficultyLevel = Math.floor(score * 9);
    const difficulty = new Array(10).fill(0);
    difficulty[difficultyLevel] = 1.0;

    // Encode content preference (based on domain and component)
    const content = new Array(128).fill(0);
    const contentIdx = (domainIdx % 8) * 16 + (componentIdx % 16);
    content[contentIdx] = score; // higher score = stronger preference

    // Encode learning path (adaptive based on performance)
    const path = new Array(32).fill(0);
    const pathIdx = difficultyLevel % 32;
    path[pathIdx] = 1.0;

    return {
      features,
      content,
      difficulty,
      path,
      metadata: {
        domain: result.domain,
        component: result.component,
        score,
        confidence
      }
    };
  }

  /**
   * Convert samples to feature tensor
   */
  private createFeatureTensor(samples: TrainingSample[]): tf.Tensor2D {
    const featureArray = samples.map(s => s.features);
    return tf.tensor2d(featureArray);
  }

  /**
   * Convert samples to label tensors
   */
  private createLabelTensors(samples: TrainingSample[]): {
    content: tf.Tensor2D;
    difficulty: tf.Tensor2D;
    path: tf.Tensor2D;
  } {
    const contentArray = samples.map(s => s.content);
    const difficultyArray = samples.map(s => s.difficulty);
    const pathArray = samples.map(s => s.path);

    return {
      content: tf.tensor2d(contentArray),
      difficulty: tf.tensor2d(difficultyArray),
      path: tf.tensor2d(pathArray)
    };
  }

  /**
   * Calculate metadata about assessment and training data
   */
  private calculateMetadata(
    assessmentData: BaselineAssessmentData,
    samples: TrainingSample[]
  ): PersonalizationTrainingData["metadata"] {
    // Domain breakdown
    const domainBreakdown: Record<string, number> = {};
    for (const result of assessmentData.domainResults) {
      domainBreakdown[result.domain] = (domainBreakdown[result.domain] || 0) + 1;
    }

    // Average scores
    const scores = assessmentData.domainResults
      .map(r => r.score || 0.5)
      .filter(s => s > 0);
    const averageScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0.5;

    // Confidence level
    const confidences = assessmentData.domainResults
      .map(r => r.confidence || 0.7)
      .filter(c => c > 0);
    const confidenceLevel = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0.7;

    // Recommended starting levels per domain
    const recommendedLevels: Record<string, number> = {};
    for (const result of assessmentData.domainResults) {
      const score = result.score || 0.5;
      const level = Math.floor(score * 9); // 0-9 levels
      
      if (!recommendedLevels[result.domain] || level > recommendedLevels[result.domain]) {
        recommendedLevels[result.domain] = level;
      }
    }

    return {
      totalSamples: samples.length,
      domainBreakdown,
      averageScore,
      confidenceLevel,
      recommendedLevels
    };
  }

  /**
   * Extract recommended levels for curriculum planning
   */
  getRecommendedLevels(metadata: PersonalizationTrainingData["metadata"]): Record<string, {
    level: number;
    label: string;
    confidence: number;
  }> {
    const levels: Record<string, { level: number; label: string; confidence: number }> = {};

    for (const [domain, level] of Object.entries(metadata.recommendedLevels)) {
      levels[domain] = {
        level,
        label: this.getLevelLabel(level),
        confidence: metadata.confidenceLevel
      };
    }

    return levels;
  }

  /**
   * Convert numeric level to human-readable label
   */
  private getLevelLabel(level: number): string {
    const labels = [
      "Pre-K / Early Foundation",
      "Kindergarten / Foundation",
      "Grade 1 / Basic",
      "Grade 2 / Developing",
      "Grade 3 / Intermediate",
      "Grade 4 / Proficient",
      "Grade 5 / Advanced",
      "Grade 6 / Expert",
      "Grade 7+ / Mastery",
      "Accelerated / Gifted"
    ];
    return labels[Math.min(level, labels.length - 1)];
  }

  /**
   * Clean up tensors to prevent memory leaks
   */
  dispose(trainingData: PersonalizationTrainingData): void {
    trainingData.features.dispose();
    trainingData.labels.content.dispose();
    trainingData.labels.difficulty.dispose();
    trainingData.labels.path.dispose();
  }
}

interface TrainingSample {
  features: number[]; // 256 dims
  content: number[]; // 128 dims
  difficulty: number[]; // 10 dims
  path: number[]; // 32 dims
  metadata: {
    domain: string;
    component: string;
    score: number;
    confidence: number;
  };
}

export default AssessmentDataProcessor;
