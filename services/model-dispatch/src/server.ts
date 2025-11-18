import Fastify from "fastify";
import { z } from "zod";
import { callWithFailover } from "./index";
import type { ModelDispatchConfig } from "@aivo/types";

const fastify = Fastify({ logger: true });

const bodySchema = z.object({
  prompt: z.string(),
  system: z.string().optional(),
  config: z
    .object({
      primary: z.enum(["openai", "anthropic", "google", "meta"]),
      fallbacks: z.array(z.enum(["openai", "anthropic", "google", "meta"]))
    })
    .optional()
});

fastify.post("/dispatch", async (request, reply) => {
  const parsed = bodySchema.parse(request.body);
  const config: ModelDispatchConfig = parsed.config ?? {
    primary: "openai",
    fallbacks: ["anthropic", "google", "meta"]
  };

  const result = await callWithFailover(config, {
    prompt: parsed.prompt,
    system: parsed.system
  });

  return reply.send(result);
});

fastify.listen({ port: 4001, host: "0.0.0.0" }).catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
