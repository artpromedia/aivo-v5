import { randomUUID } from "crypto";
import { OpenAI } from "openai";
import { z } from "zod";
import type { AssessmentDomainName, Question, QuestionType } from "@/lib/types/assessment";

const QUESTION_TYPES = [
  "MULTIPLE_CHOICE",
  "OPEN_ENDED",
  "AUDIO_RESPONSE",
  "VISUAL"
] as const satisfies QuestionType[];

const QuestionSchema = z.object({
  content: z.string(),
  type: z.enum(QUESTION_TYPES),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  rubric: z.string().optional(),
  mediaUrl: z.string().url().optional()
});

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export class QuestionGenerator {
  async generateQuestion(
    domain: AssessmentDomainName,
    gradeLevel: number,
    previousResponse?: boolean
  ): Promise<Question> {
    const adjustedLevel = this.adjustDifficulty(gradeLevel, previousResponse);
    if (openai) {
      return this.generateViaOpenAI(domain, adjustedLevel);
    }

    return this.generateFallback(domain, adjustedLevel);
  }

  private adjustDifficulty(level: number, previous?: boolean) {
    if (previous === false) return Math.max(1, level - 1);
    if (previous === true) return Math.min(12, level + 1);
    return level;
  }

  private async generateViaOpenAI(domain: AssessmentDomainName, level: number) {
    const prompt = this.buildPrompt(domain, level);

    const completion = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert assessment designer creating neurodiverse-friendly prompts."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("Model returned empty response");
    }

    const parsed = QuestionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      throw parsed.error;
    }

    return {
      id: randomUUID(),
      domain,
      difficulty: level,
      ...parsed.data,
      type: parsed.data.type as QuestionType
    } satisfies Question;
  }

  private generateFallback(domain: AssessmentDomainName, level: number): Question {
    const type = domain === "MATH" ? "MULTIPLE_CHOICE" : "OPEN_ENDED";
    const contentMap: Record<AssessmentDomainName, string> = {
      READING: `Read this short passage: "A river winds through a quiet forest." What mood does the author create?`,
      MATH: `Solve: ${(level + 2) * 3} ÷ 3. Show how you know it is correct.`,
      SPEECH: `Describe how you would greet a new classmate who uses a communication device.`,
      SEL: `Imagine a friend feels overwhelmed during group work. What calming strategy could you suggest?`,
      SCIENCE: `Observe a plant near a window. Predict what would happen if it received no sunlight for a week.`
    };

    const options =
      type === "MULTIPLE_CHOICE"
        ? ["6", "7", "8", "9"].map((answer, index) => `${answer} (choice ${index + 1})`)
        : undefined;

    return {
      id: randomUUID(),
      domain,
      difficulty: level,
      type,
      content: contentMap[domain],
      options,
      correctAnswer: type === "MULTIPLE_CHOICE" ? options?.[1] : undefined,
      rubric: "Credit responses that show clear reasoning or support."
    } satisfies Question;
  }

  private buildPrompt(domain: AssessmentDomainName, gradeLevel: number) {
    const prompts: Record<AssessmentDomainName, string> = {
      READING: `Generate a short, sensory-friendly reading comprehension passage for grade ${gradeLevel}. Include one question that checks understanding.`,
      MATH: `Generate an applied math problem suitable for grade ${gradeLevel} that can be visualized. Provide 4 answer choices.`,
      SPEECH: `Generate a speech/language task for grade ${gradeLevel} focusing on expressive language or pragmatic skills.`,
      SEL: `Generate a social-emotional scenario for grade ${gradeLevel} asking how the learner might recognize feelings and respond.`,
      SCIENCE: `Generate an inquiry-based science prompt for grade ${gradeLevel} connected to real-world observations.`
    };

    return `${prompts[domain]}
Return JSON with the keys: content, type (MULTIPLE_CHOICE | OPEN_ENDED | AUDIO_RESPONSE | VISUAL), options (if applicable), correctAnswer (when scorable), rubric, mediaUrl (optional).`;
  }
}
