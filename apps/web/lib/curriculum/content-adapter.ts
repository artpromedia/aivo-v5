import { OpenAI } from "openai";

export interface LearnerPersona {
  id?: string;
  gradeLevel?: number;
  actualLevel?: number;
  learningStyle?: string;
  strengths?: string[];
  challenges?: string[];
  sensoryNeeds?: string[];
}

export interface AdaptationAudience {
  modality: "TEXT" | "AUDIO" | "VIDEO" | "HAPTIC" | "MULTIMODAL";
  tone?: "CALM" | "EXCITED" | "FORMAL" | "CASUAL";
  scaffolding?: "NONE" | "LIGHT" | "FULL";
  language?: string;
}

export interface AdaptationRequest {
  baseContent: string;
  instructions?: string;
  objective?: string;
  learner?: LearnerPersona;
  audience?: AdaptationAudience;
  vocabularyHints?: string[];
  examplesToGround?: string[];
  maxTokens?: number;
}

export interface AdaptationResult {
  content: string;
  summary: string;
  modality: AdaptationAudience["modality"];
  highlights: string[];
  confidence: number;
  metadata: Record<string, unknown>;
}

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export class ContentAdapter {
  private readonly model: string;
  private readonly temperature: number;

  constructor(options?: { model?: string; temperature?: number }) {
    this.model = options?.model ?? process.env.AI_ADAPTATION_MODEL ?? "gpt-4o-mini";
    this.temperature = options?.temperature ?? 0.35;
  }

  async adapt(request: AdaptationRequest): Promise<AdaptationResult> {
    const prompt = this.buildPrompt(request);

    if (!openai) {
      return this.buildFallbackResponse(request, prompt);
    }

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        temperature: this.temperature,
        max_tokens: request.maxTokens ?? 800,
        messages: [
          { role: "system", content: "You are AIVO's curriculum adapter. Return JSON as specified." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const raw = response.choices?.[0]?.message?.content;
      if (!raw) {
        return this.buildFallbackResponse(request, prompt);
      }

      const parsed = JSON.parse(raw) as Partial<AdaptationResult>;
      return {
        content: parsed.content ?? this.deriveContent(request),
        summary: parsed.summary ?? this.deriveSummary(request),
        modality: parsed.modality ?? request.audience?.modality ?? "TEXT",
        highlights: parsed.highlights ?? this.deriveHighlights(parsed.content ?? request.baseContent),
        confidence: parsed.confidence ?? 0.65,
        metadata: parsed.metadata ?? { source: "openai" }
      };
    } catch (error) {
      console.warn("ContentAdapter fell back to deterministic result", error);
      return this.buildFallbackResponse(request, prompt);
    }
  }

  private buildPrompt(request: AdaptationRequest) {
    const learner = request.learner;
    const tone = request.audience?.tone ?? "CALM";
    const scaffolding = request.audience?.scaffolding ?? "LIGHT";
    const modality = request.audience?.modality ?? "TEXT";
    const vocabulary = request.vocabularyHints?.join(", ") ?? "grade-appropriate";
    const examples = request.examplesToGround?.map((ex) => `- ${ex}`).join("\n") ?? "- Keep examples concrete";

    return JSON.stringify(
      {
        instructions: request.instructions ?? "Adapt the content for neurodiverse learners.",
        objective: request.objective ?? "Reinforce skill mastery",
        modality,
        tone,
        scaffolding,
        vocabulary,
        learner: learner
          ? {
              id: learner.id,
              gradeLevel: learner.gradeLevel,
              actualLevel: learner.actualLevel,
              learningStyle: learner.learningStyle,
              strengths: learner.strengths,
              challenges: learner.challenges,
              sensoryNeeds: learner.sensoryNeeds
            }
          : undefined,
        baseContent: request.baseContent,
        examples,
        responseShape: {
          content: "string",
          summary: "string",
          highlights: "string[]",
          modality: "TEXT|AUDIO|VIDEO|HAPTIC|MULTIMODAL",
          confidence: "0-1",
          metadata: { includesStandards: true }
        }
      },
      null,
      2
    );
  }

  private buildFallbackResponse(request: AdaptationRequest, prompt: string): AdaptationResult {
    return {
      content: this.deriveContent(request),
      summary: this.deriveSummary(request),
      modality: request.audience?.modality ?? "TEXT",
      highlights: this.deriveHighlights(request.baseContent),
      confidence: 0.4,
      metadata: { source: "fallback", prompt: prompt.slice(0, 500) }
    };
  }

  private deriveContent(request: AdaptationRequest) {
    const tone = request.audience?.tone ?? "CALM";
    const scaffolding = request.audience?.scaffolding ?? "LIGHT";
    const learnerName = request.learner?.id ? `Learner ${request.learner.id}` : "the learner";
    return [
      `${tone} tone | ${scaffolding} scaffolding`,
      `Reframed for ${learnerName}:`,
      request.baseContent.trim(),
      "Prompt the learner with a sensory-friendly check for understanding."
    ].join("\n\n");
  }

  private deriveSummary(request: AdaptationRequest) {
    return request.objective
      ? `${request.objective} with ${request.audience?.modality ?? "TEXT"} modality`
      : "Adapted content summary";
  }

  private deriveHighlights(content: string) {
    return content
      .split(/\n+/)
      .filter((line) => line.trim().length)
      .slice(0, 3)
      .map((line) => line.trim().slice(0, 160));
  }
}
