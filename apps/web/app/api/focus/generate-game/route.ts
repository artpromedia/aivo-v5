import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { generateGameDefinition } from "@/lib/ai/game-generator";
import type { GameConfig, GameType } from "@/lib/ai/game-types";

const payloadSchema = z.object({
  learnerId: z.string().optional(),
  subject: z.string().default("general"),
  difficulty: z.number().min(1).max(10).default(5),
  gameType: z
    .enum(["PUZZLE", "MEMORY", "QUIZ", "MOVEMENT", "CREATIVE"])
    .default("PUZZLE")
    .transform((value) => value as GameType),
  duration: z.number().min(1).max(10).default(2),
  educationalGoal: z.string().default("refocus")
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const config: GameConfig = {
    learnerId: parsed.data.learnerId ?? session.user.id,
    subject: parsed.data.subject,
    difficulty: parsed.data.difficulty,
    gameType: parsed.data.gameType,
    duration: parsed.data.duration,
    educationalGoal: parsed.data.educationalGoal
  };

  const definition = await generateGameDefinition(config);
  return NextResponse.json(definition);
}
