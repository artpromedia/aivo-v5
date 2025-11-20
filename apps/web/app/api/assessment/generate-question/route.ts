import { NextResponse } from "next/server";
import { z } from "zod";
import { QuestionGenerator } from "@/lib/ai/question-generator";
import { assessmentStore } from "@/lib/assessment-store";
import type { AssessmentDomainName } from "@/lib/types/assessment";

const generator = new QuestionGenerator();

const PayloadSchema = z.object({
  domain: z.enum(["READING", "MATH", "SPEECH", "SEL", "SCIENCE"] as const),
  questionNumber: z.number().int().min(0).max(5).optional(),
  previousResult: z.boolean().optional(),
  gradeLevel: z.number().int().min(1).max(12).default(6)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = PayloadSchema.parse(body);
    const domain = payload.domain as AssessmentDomainName;

    const question = await generator.generateQuestion(domain, payload.gradeLevel, payload.previousResult);

    assessmentStore.saveQuestion(question);

    return NextResponse.json(question);
  } catch (error) {
    console.error("Failed to generate question", error);
    return NextResponse.json({ error: "Unable to generate question" }, { status: 500 });
  }
}
