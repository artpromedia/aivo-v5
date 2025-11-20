import { NextResponse } from "next/server";
import { z } from "zod";
import { assessmentStore } from "@/lib/assessment-store";
import { CapabilityMapper } from "@/lib/ai/capability-mapper";

const mapper = new CapabilityMapper();

const PayloadSchema = z.object({
  questionId: z.string(),
  answer: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = PayloadSchema.parse(body);

    const question = assessmentStore.getQuestion(payload.questionId);
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const result = await mapper.scoreResponse(question, payload.answer);

    assessmentStore.recordResult(question.domain, {
      questionId: question.id,
      isCorrect: result.isCorrect,
      answeredAt: Date.now()
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to validate answer", error);
    return NextResponse.json({ error: "Unable to validate answer" }, { status: 500 });
  }
}
