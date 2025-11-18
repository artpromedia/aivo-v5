import FastifyFactory, { type FastifyReply, type FastifyRequest } from "fastify";
import { z } from "zod";
import { generateLessonPlanMock } from "./brainOrchestrator";

const generateLessonSchema = z.object({
  learnerId: z.string(),
  tenantId: z.string(),
  subject: z.string(),
  region: z.string(),
  domain: z.string().optional()
});

const fastify = FastifyFactory({ logger: true });
fastify.post("/lessons/generate", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = generateLessonSchema.parse(request.body);

  const { plan } = await generateLessonPlanMock({
    learnerId: parsed.learnerId,
    tenantId: parsed.tenantId,
    subject: parsed.subject as any,
    region: parsed.region as any,
    domain: parsed.domain as any
  });

  return reply.send({ plan });
});

fastify
  .listen({ port: 4003, host: "0.0.0.0" })
  .then(() => {
    fastify.log.info("Brain Orchestrator listening on http://0.0.0.0:4003");
  })
  .catch((err: unknown) => {
    fastify.log.error(err);
    process.exit(1);
  });
