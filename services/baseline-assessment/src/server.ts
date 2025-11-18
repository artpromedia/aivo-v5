import Fastify from "fastify";
import { z } from "zod";
import type { Region, Subject } from "@aivo/types";
import fetch from "node-fetch";

const fastify = Fastify({ logger: true });

const generateSchema = z.object({
  learnerId: z.string(),
  tenantId: z.string(),
  region: z.custom<Region>(),
  currentGrade: z.number().int().min(0).max(12),
  subjects: z.array(z.custom<Subject>())
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

  return reply.send({
    rawModelResponse: data,
    // TODO: parse/validate JSON when wired to a real model
    note: "In production, parse the model response into a structured assessment schema."
  });
});

fastify.listen({ port: 4002, host: "0.0.0.0" }).catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
