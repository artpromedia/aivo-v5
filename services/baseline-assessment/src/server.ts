import Fastify from "fastify";
import { z } from "zod";
import type { Region, SubjectCode, AssessmentItem, BaselineAssessment } from "@aivo/types";
import fetch from "node-fetch";

const fastify = Fastify({ logger: true });

const generateSchema = z.object({
  learnerId: z.string(),
  tenantId: z.string(),
  region: z.custom<Region>(),
  currentGrade: z.number().int().min(0).max(12),
  subjects: z.array(z.custom<SubjectCode>())
});

fastify.post("/generate", async (request, reply) => {
  const body = generateSchema.parse(request.body);

  const prompt = `
You are an educational assessment designer for a neurodiverse-friendly AI platform.

Region: ${body.region}
Grade: ${body.currentGrade}
Subjects: ${body.subjects.join(", ")}

Design short baseline assessment questions to estimate each subject's functional grade level,
focusing on low-anxiety, clear, concrete prompts, with optional visual supports.

Return JSON with an array "items", each having:
  - id
  - subject
  - stem
  - type ("multiple_choice" | "short_answer" | "open_ended")
  - options (if multiple choice)
  - correctAnswer (if applicable)
  - accessibilityNotes
  - estimatedDifficulty (1-5)
`;

  const res = await fetch("http://model-dispatch:4001/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      config: {
        primary: "openai",
        fallbacks: ["anthropic", "google", "meta"]
      }
    })
  });

  const data = await res.json();

  // In production, parse the model response into real items.
  // For now, stub a single example item.
  const items: AssessmentItem[] = [
    {
      id: "item-1",
      subject: body.subjects[0] ?? "math",
      type: "multiple_choice",
      stem: "What is 3 + 4?",
      options: ["5", "6", "7", "8"],
      correctAnswer: "7",
      accessibilityNotes: "Read aloud; allow finger counting.",
      estimatedDifficulty: 1
    }
  ];

  const assessment: BaselineAssessment = {
    id: `baseline-${Date.now()}`,
    learnerId: body.learnerId,
    tenantId: body.tenantId,
    region: body.region,
    grade: body.currentGrade,
    subjects: body.subjects,
    items,
    createdAt: new Date().toISOString(),
    status: "draft"
  };

  return reply.send({ assessment, rawModelResponse: data });
});

fastify
  .listen({ port: 4002, host: "0.0.0.0" })
  .then(() => {
    fastify.log.info("Baseline assessment service listening on http://0.0.0.0:4002");
  })
  .catch((err) => {
    fastify.log.error(err);
    process.exit(1);
  });
