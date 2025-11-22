import { NextResponse } from "next/server";
import { z } from "zod";
import { AIVOModelCloner } from "@/lib/ai/model-cloner";
import type { LearnerProfile } from "@/lib/types/models";

const payloadSchema = z.object({
  learnerId: z.string(),
  gradeLevel: z.number(),
  actualLevel: z.number(),
  domainLevels: z.record(z.number()),
  learningStyle: z.enum(["VISUAL", "AUDITORY", "KINESTHETIC", "MIXED"]).default("MIXED"),
  strengths: z.array(z.string()).default([]),
  challenges: z.array(z.string()).default([]),
  diagnoses: z.array(z.string()).default([])
});

export async function POST(request: Request) {
  try {
    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const cloner = new AIVOModelCloner();
    const profile: LearnerProfile = {
      learnerId: parsed.data.learnerId,
      gradeLevel: parsed.data.gradeLevel,
      actualLevel: parsed.data.actualLevel,
      domainLevels: parsed.data.domainLevels,
      learningStyle: parsed.data.learningStyle,
      diagnoses: parsed.data.diagnoses,
      strengths: parsed.data.strengths,
      challenges: parsed.data.challenges
    };

    const modelConfigId = await cloner.cloneModel(profile);

    return NextResponse.json({ status: "QUEUED", modelConfigId });
  } catch (error) {
    console.error("Failed to queue clone", error);
    return NextResponse.json({ error: "Unable to clone model" }, { status: 500 });
  }
}
