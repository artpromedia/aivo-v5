export type GameType = "PUZZLE" | "MEMORY" | "QUIZ" | "MOVEMENT" | "CREATIVE";

export interface GameConfig {
  learnerId: string;
  subject: string;
  difficulty: number;
  gameType: GameType;
  duration: number;
  educationalGoal: string;
}

export type GameElement =
  | { kind: "puzzle"; id: string; clue: string; options: string[]; answer: string }
  | { kind: "memoryPair"; id: string; content: string; match: string }
  | { kind: "quizQuestion"; id: string; prompt: string; choices: string[]; answer: string }
  | { kind: "movementStep"; id: string; action: string; description: string }
  | { kind: "creativePrompt"; id: string; prompt: string; cues: string[] };

export interface GameDefinition {
  title: string;
  instructions: string;
  gameType: GameType;
  theme: string;
  duration: number;
  educationalGoal: string;
  gameElements: GameElement[];
  rewards: string[];
  transitions: string[];
}
