import { OpenAI } from "openai";
import type { PersonalizedModelAdapter, PersonalizedModelConfig } from "@/lib/types/models";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

interface AdapterOptions {
  learnerId: string;
  modelId?: string | null;
  systemPrompt?: string | null;
  configuration: PersonalizedModelConfig;
  summary?: string | null;
  strengths?: string[];
  challenges?: string[];
}

export function createPersonalizedAdapter(options: AdapterOptions): PersonalizedModelAdapter {
  const normalizedConfig = normalizeConfig(options.configuration);
  const prompt = buildPrompt(normalizedConfig, options);

  return {
    id: options.modelId ?? `local-model-${options.learnerId}`,
    learnerId: options.learnerId,
    systemPrompt: prompt,
    gradeLevel: normalizedConfig.gradeLevel,
    actualLevel: normalizedConfig.actualLevel,
    configuration: normalizedConfig,
    async complete(message: string): Promise<string> {
      if (!openai) {
        return fallbackResponse(message, normalizedConfig, options.summary);
      }

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.4,
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: message }
          ]
        });

        const content = completion.choices?.[0]?.message?.content?.trim();
        if (!content) {
          return fallbackResponse(message, normalizedConfig, options.summary);
        }
        return content;
      } catch (error) {
        console.warn("Personalized adapter falling back to local response", error);
        return fallbackResponse(message, normalizedConfig, options.summary);
      }
    }
  };
}

function normalizeConfig(config: PersonalizedModelConfig): PersonalizedModelConfig {
  return {
    gradeLevel: config.gradeLevel ?? 6,
    actualLevel: config.actualLevel ?? config.gradeLevel ?? 6,
    domainLevels: config.domainLevels ?? { overall: config.actualLevel ?? config.gradeLevel ?? 6 },
    learningStyle: config.learningStyle ?? "MIXED",
    adaptationRules: config.adaptationRules ?? {}
  };
}

function buildPrompt(config: PersonalizedModelConfig, options: AdapterOptions): string {
  const strengths = options.strengths?.length ? options.strengths.join(", ") : "Curiosity";
  const challenges = options.challenges?.length ? options.challenges.join(", ") : "Sensory regulation";
  const summary = options.summary ?? "Deliver short, concrete explanations with positive tone.";

  return `You are AIVO, a calm neurodiversity-aware tutor for learner ${options.learnerId}.
Overall grade target: ${config.gradeLevel}
Presentation level: ${config.actualLevel}
Learning style: ${config.learningStyle}
Strength cues: ${strengths}
Support cues: ${challenges}
${summary}
Use short paragraphs, sensory-friendly metaphors, and frequent encouragement.`;
}

function fallbackResponse(prompt: string, config: PersonalizedModelConfig, summary?: string | null) {
  const sanitized = prompt.replace(/\s+/g, " ").trim();
  const tone = summary ?? "Keep everything calm, concrete, and encouraging.";
  return `${tone}\nFocus: ${sanitized}\nTip: Connect it to grade ${config.actualLevel} language and add a quick celebration at the end.`;
}
