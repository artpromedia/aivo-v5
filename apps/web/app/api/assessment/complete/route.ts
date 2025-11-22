import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CapabilityMapper } from "@/lib/ai/capability-mapper";
import { prisma } from "@/lib/prisma";
import type { Question, QuestionType } from "@/lib/types/assessment";
import type { LearningStyle } from "@/lib/types/models";

const DOMAINS = ["READING", "MATH", "SPEECH", "SEL", "SCIENCE"] as const;

type DomainName = (typeof DOMAINS)[number];

const QuestionSchema = z.object({
  id: z.string(),
  domain: z.enum(DOMAINS),
  content: z.string(),
  type: z.enum(["MULTIPLE_CHOICE", "OPEN_ENDED", "AUDIO_RESPONSE", "VISUAL"] as const),
  difficulty: z.number(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  rubric: z.string().optional(),
  mediaUrl: z.string().optional()
});

const PayloadSchema = z.object({
  learnerId: z.string(),
  questions: z.record(z.enum(DOMAINS), z.array(QuestionSchema)).refine((value) =>
    DOMAINS.every((domain) => Array.isArray(value[domain]))
  ),
  responses: z.record(
    z.string(),
    z.object({
      answer: z.string(),
      isCorrect: z.boolean().optional()
    })
  )
});

const mapper = new CapabilityMapper();

type ResponseMap = Record<string, { answer: string; isCorrect?: boolean }>;

function inferLearningStyle(summary: string | undefined): LearningStyle {
  if (!summary) return "MIXED";
  const text = summary.toLowerCase();
  if (text.includes("visual")) return "VISUAL";
  if (text.includes("audio") || text.includes("listening")) return "AUDITORY";
  if (text.includes("movement") || text.includes("hands-on")) return "KINESTHETIC";
  return "MIXED";
}

function buildQuestionLedger(questions: Record<DomainName, Question[]>): {
  id: string;
  domain: DomainName;
  difficulty: number;
  type: QuestionType;
}[] {
  return DOMAINS.flatMap((domain) =>
    (questions[domain] ?? []).map((question) => ({
      id: question.id,
      domain,
      difficulty: question.difficulty,
      type: question.type
    }))
  );
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const payload = PayloadSchema.parse(json);

    const typedQuestions = DOMAINS.reduce<Record<DomainName, Question[]>>((acc, domain) => {
      acc[domain] = (payload.questions[domain] ?? []).map((question) => ({
        ...question,
        type: question.type as QuestionType
      }));
      return acc;
    }, {} as Record<DomainName, Question[]>);

    const analysis = await mapper.analyze(typedQuestions, payload.responses);

    const domainLevels: Record<DomainName, number> = {
      READING: analysis.reading.gradeLevel,
      MATH: analysis.math.gradeLevel,
      SPEECH: analysis.speech.gradeLevel,
      SEL: analysis.sel.gradeLevel,
      SCIENCE: analysis.science.gradeLevel
    };

    const domainSummaries: Record<DomainName, string> = {
      READING: analysis.reading.summary,
      MATH: analysis.math.summary,
      SPEECH: analysis.speech.summary,
      SEL: analysis.sel.summary,
      SCIENCE: analysis.science.summary
    };

    const overallLevel = analysis.gradeLevel;
    const questionLedger = buildQuestionLedger(typedQuestions);

    const detailedResponses: ResponseMap = payload.responses;

    const assessment = await prisma.assessment.create({
      data: {
        learnerId: payload.learnerId,
        type: "BASELINE",
        status: "COMPLETED",
        startedAt: new Date(),
        results: {
          overallLevel,
          domainLevels,
          domainSummaries,
          strengths: analysis.strengths,
          challenges: analysis.challenges,
          recommendations: analysis.recommendations,
          learningProfile: analysis.learningProfile,
          detailedResponses,
          questionLedger
        },
        completedAt: new Date()
      }
    });

    const learner = await prisma.learner.update({
      where: { id: payload.learnerId },
      data: { actualLevel: overallLevel }
    });

    const learnerDiagnoses = await prisma.diagnosis.findMany({
      where: { learnerId: payload.learnerId }
    });

    const cloneModelUrl = new URL("/api/ai/clone-model", request.url);
    fetch(cloneModelUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        learnerId: payload.learnerId,
        gradeLevel: learner.gradeLevel,
        actualLevel: overallLevel,
        domainLevels,
        learningStyle: inferLearningStyle(analysis.learningProfile),
        strengths: analysis.strengths,
        challenges: analysis.challenges,
        diagnoses: learnerDiagnoses.map((item) => item.description)
      })
    }).catch((error) => {
      console.warn("clone-model trigger failed", error);
    });

    return NextResponse.json({
      id: assessment.id,
      results: {
        overallLevel,
        domainLevels,
        domainSummaries,
        strengths: analysis.strengths,
        challenges: analysis.challenges,
        recommendations: analysis.recommendations,
        learningProfile: analysis.learningProfile,
        detailedResponses,
        questionLedger
      }
    });
  } catch (error) {
    console.error("Failed to complete assessment", error);
    return NextResponse.json({ error: "Unable to complete assessment" }, { status: 500 });
  }
}
