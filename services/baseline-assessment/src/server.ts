import Fastify from 'fastify';
import { z } from 'zod';
import type { Region, SubjectCode, AssessmentItem, BaselineAssessment } from '@aivo/types';
import fetch from 'node-fetch';
import {
  initObservability,
  observabilityPlugin,
  info,
  error as logError,
  recordMetric,
  recordLLMMetrics,
  startSpan,
  endSpan,
  drainMetrics,
  getPrometheusMetrics,
} from '@aivo/observability';

// Initialize observability
initObservability({
  serviceName: 'baseline-assessment',
  serviceVersion: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
});

const fastify = Fastify({ logger: true });

// Register observability middleware
fastify.register(observabilityPlugin, {
  serviceName: 'baseline-assessment',
  enableMetrics: true,
  enableTracing: true,
});

const generateSchema = z.object({
  learnerId: z.string(),
  tenantId: z.string(),
  region: z.custom<Region>(),
  currentGrade: z.number().int().min(0).max(12),
  subjects: z.array(z.custom<SubjectCode>()),
});

fastify.post('/generate', async (request, reply) => {
  const spanId = startSpan('baseline-assessment.generate');
  const startTime = Date.now();

  try {
    const body = generateSchema.parse(request.body);

    info('Generating baseline assessment', {
      learnerId: body.learnerId,
      subjects: body.subjects,
      grade: body.currentGrade,
    });

    const prompt = `
You are an educational assessment designer for a neurodiverse-friendly AI platform.

Region: ${body.region}
Grade: ${body.currentGrade}
Subjects: ${body.subjects.join(', ')}

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

    const llmSpanId = startSpan('baseline-assessment.llm-call');
    const llmStartTime = Date.now();

    const res = await fetch('http://model-dispatch:4001/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        config: {
          primary: 'openai',
          fallbacks: ['anthropic', 'google', 'meta'],
        },
      }),
    });

    const data = (await res.json()) as {
      provider?: string;
      model?: string;
      usage?: { totalTokens?: number; promptTokens?: number; completionTokens?: number };
    };

    const llmDuration = Date.now() - llmStartTime;
    endSpan(llmSpanId);

    // Record LLM metrics
    recordLLMMetrics({
      provider: data.provider || 'openai',
      model: data.model || 'gpt-4',
      tokensUsed: data.usage?.totalTokens || 0,
      promptTokens: data.usage?.promptTokens || 0,
      completionTokens: data.usage?.completionTokens || 0,
      latencyMs: llmDuration,
      success: res.ok,
    });

    // In production, parse the model response into real items.
    // For now, stub a single example item.
    const items: AssessmentItem[] = [
      {
        id: 'item-1',
        subject: body.subjects[0] ?? 'math',
        type: 'multiple_choice',
        stem: 'What is 3 + 4?',
        options: ['5', '6', '7', '8'],
        correctAnswer: '7',
        accessibilityNotes: 'Read aloud; allow finger counting.',
        estimatedDifficulty: 1,
      },
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
      status: 'draft',
    };

    const duration = Date.now() - startTime;
    endSpan(spanId);

    recordMetric('assessment_generated', 1, {
      subjects: body.subjects.join(','),
      grade: String(body.currentGrade),
    });
    recordMetric('request_latency', duration, { endpoint: '/generate' });

    info('Baseline assessment generated', {
      assessmentId: assessment.id,
      itemCount: items.length,
      durationMs: duration,
    });

    return reply.send({ assessment, rawModelResponse: data });
  } catch (err) {
    endSpan(spanId);
    recordMetric('error_count', 1, { endpoint: '/generate', error_type: 'generation_error' });
    logError('Failed to generate baseline assessment', { error: err });
    throw err;
  }
});

// Health check endpoint
fastify.get('/health', async (_request, reply) => {
  return reply.send({ status: 'ok', service: 'baseline-assessment' });
});

// Metrics endpoints
fastify.get('/metrics', async (_request, reply) => {
  const metrics = drainMetrics();
  return reply.send(metrics);
});

fastify.get('/metrics/prometheus', async (_request, reply) => {
  const prometheusMetrics = getPrometheusMetrics();
  reply.type('text/plain; charset=utf-8');
  return reply.send(prometheusMetrics);
});

fastify
  .listen({ port: 4002, host: '0.0.0.0' })
  .then(() => {
    fastify.log.info('Baseline assessment service listening on http://0.0.0.0:4002');
  })
  .catch((err) => {
    fastify.log.error(err);
    process.exit(1);
  });
