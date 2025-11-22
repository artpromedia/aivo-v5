export * from "./lib/agents/base/AgentFramework";
export * from "./lib/agents/base/AgentOrchestrator";
export * from "./PersonalizedLearningAgent";
export * from "./AITutorAgent";
export * from "./SpeechAnalysisAgent";

// Export ML and federated learning utilities
export { MainModelTrainer, type MainModelConfig, type TrainingData as MainTrainingData, type TrainingResult as MainTrainingResult } from "./ml/MainModelTrainer";
export { ModelCloner, type CloneConfig, type ClonedModelInfo } from "./ml/ModelCloner";
export { FederatedLearningManager, type FederatedTrainingConfig, type FederatedUpdate, type AggregationResult } from "./ml/FederatedLearning";
export { ModelRegistry, type MainModelVersion, type LearnerModelInstance, type TrainingSession, type FederatedUpdateRecord } from "./ml/ModelRegistry";
export { FederatedAggregationService, type AggregationConfig, type AggregationJob } from "./ml/FederatedAggregationService";
export { AssessmentDataProcessor, type BaselineAssessmentData, type PersonalizationTrainingData } from "./ml/AssessmentDataProcessor";
export { AdaptiveLevelAdjustmentEngine, type LevelAdjustmentRecommendation, type PerformanceMetrics } from "./ml/AdaptiveLevelAdjustment";
export { ModelTrainer } from "./ml/ModelTrainer";
