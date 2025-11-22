"use server";

import { OpenAI } from "openai";
import type { GameConfig, GameDefinition, GameElement, GameType } from "@/lib/ai/game-types";
import { buildFallbackGame } from "@/lib/ai/game-templates";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function generateGameDefinition(config: GameConfig): Promise<GameDefinition> {
  if (!openai) {
    return buildFallbackGame(config);
  }

  try {
    const prompt = buildGamePrompt(config);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a creative educational game designer for neurodiverse learners. Create sensory-friendly, efficient games that reinforce the target subject while providing a short attention reset."
        },
        { role: "user", content: prompt }
      ]
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      return buildFallbackGame(config);
    }

    const parsed = JSON.parse(content) as Partial<GameDefinition>;
    return normalizeDefinition(parsed, config);
  } catch (error) {
    console.warn("GameGenerator falling back to offline template", error);
    return buildFallbackGame(config);
  }
}

function buildGamePrompt(config: GameConfig): string {
  const shared = `Learner ID: ${config.learnerId}
Subject: ${config.subject}
Difficulty (1-10): ${config.difficulty}
Game type: ${config.gameType}
Duration: ${config.duration} minutes
Educational goal: ${config.educationalGoal}
Return JSON with keys: title, instructions, theme, gameType, duration, educationalGoal, gameElements, rewards, transitions.`;

  const prompts: Record<GameType, string> = {
    PUZZLE: `Create a visual puzzle break that uses ${config.subject} clues. Provide 3 short puzzles with answer keys.`,
    MEMORY: `Design a memory matching experience using ${config.subject} vocabulary. Include at least 4 pairs.`,
    QUIZ: `Create a rapid-fire quiz with encouraging feedback. Provide 4 questions and 3 answer choices each.`,
    MOVEMENT: `Provide a movement-based break that still references ${config.subject}. Think "math stretches" or "science poses".`,
    CREATIVE: `Design a creative expression mini-game (drawing, storytelling, building) tied to ${config.subject}.`
  };

  return `${prompts[config.gameType]}
${shared}`;
}

function normalizeDefinition(definition: Partial<GameDefinition>, config: GameConfig): GameDefinition {
  const fallback = buildFallbackGame(config);
  return {
    title: definition.title || fallback.title,
    instructions: definition.instructions || fallback.instructions,
    gameType: definition.gameType || config.gameType,
    theme: definition.theme || fallback.theme,
    duration: definition.duration || config.duration,
    educationalGoal: definition.educationalGoal || config.educationalGoal,
    gameElements:
      Array.isArray(definition.gameElements) && definition.gameElements.length > 0
        ? (definition.gameElements as GameElement[])
        : fallback.gameElements,
    rewards:
      Array.isArray(definition.rewards) && definition.rewards.length
        ? (definition.rewards as string[])
        : fallback.rewards,
    transitions:
      Array.isArray(definition.transitions) && definition.transitions.length
        ? (definition.transitions as string[])
        : fallback.transitions
  };
}
