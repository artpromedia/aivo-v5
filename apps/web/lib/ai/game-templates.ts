import type { GameConfig, GameDefinition, GameElement, GameType } from "@/lib/ai/game-types";

const buildElementSet: Record<GameType, (config: GameConfig) => GameElement[]> = {
  PUZZLE: (config) =>
    [1, 2, 3].map((index) => ({
      kind: "puzzle" as const,
      id: `pz-${index}`,
      clue: `Arrange the calm steps to solve ${config.subject} clue ${index}. What should the learner do first?`,
      options: ["Start with known facts", "Check your strategy", "Share your answer"],
      answer: "Start with known facts"
    })),
  MEMORY: (config) =>
    [1, 2, 3, 4].map((index) => ({
      kind: "memoryPair" as const,
      id: `mp-${index}`,
      content: `${config.subject} idea ${index}`,
      match: `${config.subject} match ${index}`
    })),
  QUIZ: (config) =>
    [1, 2, 3, 4].map((index) => ({
      kind: "quizQuestion" as const,
      id: `qq-${index}`,
      prompt: `Quick ${config.subject} check ${index}`,
      choices: ["Option A", "Option B", "Option C"],
      answer: "Option A"
    })),
  MOVEMENT: (config) =>
    [1, 2, 3].map((index) => ({
      kind: "movementStep" as const,
      id: `mv-${index}`,
      action: `Pose ${index}`,
      description: `Hold a ${config.subject}-inspired pose for 5 seconds`
    })),
  CREATIVE: (config) =>
    [1, 2].map((index) => ({
      kind: "creativePrompt" as const,
      id: `cr-${index}`,
      prompt: `Create a mini story about ${config.subject} concept ${index}`,
      cues: ["Who is involved?", "What happens?", "How does it end?"]
    }))
};

export function buildFallbackGame(config: GameConfig): GameDefinition {
  return {
    title: `Focus Boost: ${config.subject} ${config.gameType.toLowerCase()} quest`,
    instructions:
      "Follow the playful prompts below. When you finish the activity, tap 'Return to Learning' to continue with a refreshed brain.",
    gameType: config.gameType,
    theme: `${config.subject} universe`,
    duration: config.duration,
    educationalGoal: config.educationalGoal,
    gameElements: buildElementSet[config.gameType](config),
    rewards: ["Spark badge", "Brain stretch", "Mindful cheer"],
    transitions: ["Take three calming breaths", "Celebrate the win", "Tap the button to jump back into the lesson"]
  };
}
