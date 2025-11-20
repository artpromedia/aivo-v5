import { randomUUID } from "crypto";
import { OpenAI } from "openai";
import type { AssessmentDomainName, Question } from "@/lib/types/assessment";

const DOMAINS: AssessmentDomainName[] = ["READING", "MATH", "SPEECH", "SEL", "SCIENCE"];

type DomainSummary = {
  gradeLevel: number;
  summary: string;
};

type ResponseMap = Record<string, { answer: string; isCorrect?: boolean }>;

type QuestionMap = Record<string, Question[]>;

type CapabilityAnalysis = {
  id: string;
  gradeLevel: number;
  reading: DomainSummary;
  math: DomainSummary;
  speech: DomainSummary;
  sel: DomainSummary;
  science: DomainSummary;
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  learningProfile: string;
};

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export class CapabilityMapper {
  async analyze(questions: QuestionMap, responses: ResponseMap): Promise<CapabilityAnalysis> {
    const summaries = DOMAINS.reduce<Record<AssessmentDomainName, DomainSummary>>((acc, domain) => {
      acc[domain] = this.computeDomainSummary(domain, questions[domain] ?? [], responses);
      return acc;
    }, {} as Record<AssessmentDomainName, DomainSummary>);

    const overall = Math.round(
      DOMAINS.reduce((total, domain) => total + summaries[domain].gradeLevel, 0) / DOMAINS.length
    );

    const narrative = await this.buildNarrative(summaries);

    return {
      id: randomUUID(),
      gradeLevel: overall,
      reading: summaries.READING,
      math: summaries.MATH,
      speech: summaries.SPEECH,
      sel: summaries.SEL,
      science: summaries.SCIENCE,
      strengths: narrative.strengths,
      challenges: narrative.challenges,
      recommendations: narrative.recommendations,
      learningProfile: narrative.learningProfile
    };
  }

  async scoreResponse(question: Question, answer: string) {
    if (question.correctAnswer) {
      const isCorrect = this.compareAnswers(question.correctAnswer, answer);
      return {
        isCorrect,
        updatedDifficulty: this.adjustDifficulty(question.difficulty, isCorrect),
        feedback: isCorrect ? "Great reasoning!" : "Let's review the rubric and try again."
      };
    }

    if (!openai) {
      const isCorrect = answer.trim().length > Math.max(5, question.content.length * 0.1);
      return {
        isCorrect,
        updatedDifficulty: this.adjustDifficulty(question.difficulty, isCorrect),
        feedback: isCorrect
          ? "Thoughtful answer!"
          : "Add more detail or connect to the scenario."
      };
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Score the learner response as true/false and include short feedback."
        },
        {
          role: "user",
          content: `Question: ${question.content}\nLearner response: ${answer}\nRubric: ${question.rubric ?? "n/a"}\nReturn JSON { "isCorrect": boolean, "feedback": string }`
        }
      ],
      response_format: { type: "json_object" }
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { isCorrect?: boolean; feedback?: string };
    const isCorrect = Boolean(parsed.isCorrect);
    return {
      isCorrect,
      updatedDifficulty: this.adjustDifficulty(question.difficulty, isCorrect),
      feedback: parsed.feedback ?? "Thanks for sharing your thinking!"
    };
  }

  private computeDomainSummary(
    domain: AssessmentDomainName,
    questions: Question[],
    responses: ResponseMap
  ): DomainSummary {
    if (!questions.length) {
      return { gradeLevel: 1, summary: "No responses yet" };
    }

    let total = 0;
    let correct = 0;
    for (const question of questions) {
      const response = responses[question.id];
      total += question.difficulty;
      if (response?.isCorrect) {
        correct += question.difficulty;
      }
    }

    const baseline = Math.max(1, Math.round(total / questions.length));
    const masteryRatio = questions.length ? correct / total || 0 : 0;
    const gradeLevel = Math.max(1, Math.min(12, Math.round(baseline * (0.8 + masteryRatio))));

    const summary = masteryRatio > 0.6
      ? `${domain} strength emerging at grade ${gradeLevel}`
      : `Needs scaffolding—confidence at grade ${gradeLevel}`;

    return { gradeLevel, summary };
  }

  private async buildNarrative(summaries: Record<AssessmentDomainName, DomainSummary>) {
    const sorted = DOMAINS.sort((a, b) => summaries[b].gradeLevel - summaries[a].gradeLevel);
    const strengths = sorted.slice(0, 2).map((domain) => `${domain} (G${summaries[domain].gradeLevel})`);
    const challenges = sorted
      .slice(-2)
      .map((domain) => `${domain} (G${summaries[domain].gradeLevel})`)
      .reverse();

    if (!openai) {
      return {
        strengths,
        challenges,
        recommendations: [
          "Blend visual + verbal supports for new concepts",
          "Offer short reflection breaks between domains"
        ],
        learningProfile: "Prefers concrete examples with calm pacing"
      };
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Summarize strengths/challenges/recommendations for a learner based on domain grade levels."
        },
        {
          role: "user",
          content: `Domain levels: ${JSON.stringify(summaries)}. Return JSON {"strengths": string[], "challenges": string[], "recommendations": string[], "learningProfile": string }`
        }
      ],
      response_format: { type: "json_object" }
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      strengths?: string[];
      challenges?: string[];
      recommendations?: string[];
      learningProfile?: string;
    };

    return {
      strengths: parsed.strengths?.length ? parsed.strengths : strengths,
      challenges: parsed.challenges?.length ? parsed.challenges : challenges,
      recommendations:
        parsed.recommendations?.length
          ? parsed.recommendations
          : ["Chunk instructions", "Front-load vocabulary"],
      learningProfile: parsed.learningProfile ?? "Dynamic, benefit from multi-sensory cues"
    };
  }

  private compareAnswers(correct: string, answer: string) {
    return correct.trim().toLowerCase() === answer.trim().toLowerCase();
  }

  private adjustDifficulty(current: number, isCorrect: boolean) {
    return isCorrect ? Math.min(12, current + 1) : Math.max(1, current - 1);
  }
}
