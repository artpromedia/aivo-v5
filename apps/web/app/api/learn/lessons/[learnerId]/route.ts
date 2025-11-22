import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { PersonalizedModelConfig } from "@/lib/types/models";
import type { LessonEntity, LessonSegment } from "@/lib/types/lesson";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGuardianRole } from "@/lib/roles";
import { LearningSession } from "@/lib/ai/learning-session";
import { createPersonalizedAdapter } from "@/lib/ai/personalized-adapter";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  subject: z.string().optional(),
  topic: z.string().optional()
});

export async function GET(request: NextRequest, { params }: { params: { learnerId: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const learner = await prisma.learner.findUnique({
    where: { id: params.learnerId },
    include: {
      learningModel: true,
      diagnoses: true
    }
  });

  if (!learner) {
    return NextResponse.json({ error: "Learner not found" }, { status: 404 });
  }

  if (!canAccessLesson(session.user.id, session.user.role as Role, learner)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  const subjectInput = query.success && query.data.subject ? query.data.subject : "Math";
  const topicInput = query.success && query.data.topic ? query.data.topic : undefined;

  const subject = formatSubject(subjectInput);
  const topic = topicInput ?? `${subject} confidence boost`;

  const config = resolveConfig(learner.learningModel?.configuration, learner);
  const challenges = learner.diagnoses
    .map((item) => item.description?.trim())
    .filter((description): description is string => Boolean(description));
  const adapter = createPersonalizedAdapter({
    learnerId: learner.id,
    modelId: learner.learningModel?.modelId ?? learner.learningModel?.id,
    systemPrompt: learner.learningModel?.systemPrompt ?? null,
    summary: learner.learningModel?.summary ?? null,
    configuration: config,
    strengths: [`${learner.firstName} enjoys ${subject.toLowerCase()} when it feels concrete.`],
    challenges: challenges.length ? challenges : ["Benefits from clear scaffolding and calm reinforcement."]
  });

  try {
    const sessionEngine = new LearningSession(adapter);
    const lessonPlan = await sessionEngine.generateLesson(topic, subject);
    const comprehension = await sessionEngine.checkComprehension(sessionEngine.id);

    const lessonPayload: LessonEntity = {
      id: `${sessionEngine.id}-${Date.now()}`,
      subject,
      currentTopic: lessonPlan.topic,
      summary: summarize(lessonPlan.content.adapted ?? lessonPlan.content.original),
      segments: buildSegments(lessonPlan.content.adapted, lessonPlan.content.visualAids?.description, lessonPlan.exercises, comprehension.questions),
      insights: {
        comprehensionQuestions: comprehension.questions,
        recommendedLevel: lessonPlan.presentationLevel
      }
    };

    return NextResponse.json(lessonPayload);
  } catch (error) {
    console.error("Lesson generation failed", error);
    return NextResponse.json({ error: "Unable to personalize lesson" }, { status: 500 });
  }
}

function canAccessLesson(userId: string, role: Role, learner: { id: string; userId: string; guardianId: string }): boolean {
  if (role === "ADMIN") return true;
  if (learner.userId === userId) return true;
  if (isGuardianRole(role) && learner.guardianId === userId) return true;
  return false;
}

function resolveConfig(configuration: unknown, learner: { gradeLevel: number; actualLevel: number | null }): PersonalizedModelConfig {
  const parsed = (configuration ?? {}) as Partial<PersonalizedModelConfig>;
  const fallbackActual = learner.actualLevel ?? Math.max(1, learner.gradeLevel - 1);

  return {
    gradeLevel: parsed.gradeLevel ?? learner.gradeLevel,
    actualLevel: parsed.actualLevel ?? fallbackActual,
    domainLevels: parsed.domainLevels ?? { overall: fallbackActual },
    learningStyle: parsed.learningStyle ?? "MIXED",
    adaptationRules: parsed.adaptationRules ?? {}
  };
}

function formatSubject(subject: string) {
  const trimmed = subject.trim();
  if (!trimmed) return "Math";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function summarize(content: string) {
  if (!content) {
    return "We adapted this lesson with calm pacing and concrete anchors.";
  }
  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return sentences.join(" ") || content.slice(0, 160);
}

function buildSegments(
  adaptedText?: string,
  visualAid?: string,
  exercises: string[] = [],
  reflectionPrompts: string[] = []
): LessonSegment[] {
  const segments: LessonSegment[] = [];

  if (adaptedText) {
    segments.push({
      id: "intro",
      title: "Calm launch",
      content: adaptedText,
      status: "IN_PROGRESS"
    });
  }

  if (visualAid) {
    segments.push({
      id: "visual",
      title: "Visual anchor",
      content: visualAid,
      status: segments.length === 0 ? "IN_PROGRESS" : "READY"
    });
  }

  exercises.forEach((exercise, index) => {
    segments.push({
      id: `exercise-${index}`,
      title: index === 0 ? "Guided practice" : `Stretch ${index + 1}`,
      content: exercise,
      status: "READY"
    });
  });

  const reflection = reflectionPrompts[0] ?? "Share one strategy that kept things calm.";
  segments.push({
    id: "reflection",
    title: "Reflection pulse",
    content: reflection,
    status: "READY"
  });

  return segments;
}
