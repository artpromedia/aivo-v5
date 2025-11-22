import { randomUUID } from "crypto";
import type { PersonalizedModelAdapter, LearningPerformanceSummary } from "@/lib/types/models";

const SUBJECT_DOMAIN_MAP: Record<string, string> = {
  math: "MATH",
  reading: "READING",
  ela: "READING",
  literacy: "READING",
  science: "SCIENCE",
  stem: "SCIENCE",
  sel: "SEL",
  speech: "SPEECH"
};

interface GradeContentPayload {
  topic: string;
  subject: string;
  text: string;
  subjectGrade: number;
  objectives: string[];
}

export class LearningSession {
  private model: PersonalizedModelAdapter;
  private sessionId: string;
  private interactionHistory: Array<{ role: string; content: string }> = [];

  constructor(model: PersonalizedModelAdapter) {
    this.model = model;
    this.sessionId = randomUUID();
  }

  get id() {
    return this.sessionId;
  }

  async generateLesson(topic: string, subject: string) {
    const gradeContent = await this.fetchGradeLevelContent(topic, subject);
    const adaptedContent = await this.adaptContent(gradeContent);

    return {
      topic,
      subject,
      originalGradeLevel: gradeContent.subjectGrade,
      presentationLevel: adaptedContent.difficulty,
      capabilityLevel: adaptedContent.difficulty,
      content: adaptedContent,
      exercises: await this.generateExercises(topic, adaptedContent.difficulty)
    };
  }

  async checkComprehension(lessonId: string) {
    const questions = await this.generateComprehensionQuestions();
    return {
      lessonId,
      questions,
      adaptiveFeedback: true,
      allowRetries: true
    };
  }

  async recommendDifficultyAdjustment(performance: LearningPerformanceSummary) {
    if (performance.successRate > 0.8 && performance.sessionCount > 5) {
      return {
        recommendation: "INCREASE_DIFFICULTY" as const,
        newLevel: Math.min(this.model.actualLevel + 0.5, this.model.gradeLevel),
        reasoning: "Student showing consistent mastery",
        requiresApproval: true
      };
    }

    if (performance.successRate < 0.5 && performance.sessionCount > 3) {
      return {
        recommendation: "DECREASE_DIFFICULTY" as const,
        newLevel: Math.max(this.model.actualLevel - 0.5, 1),
        reasoning: "Student struggling with current level",
        requiresApproval: true
      };
    }

    return {
      recommendation: "MAINTAIN" as const,
      reasoning: "Student progressing appropriately"
    };
  }

  private async fetchGradeLevelContent(topic: string, subject: string): Promise<GradeContentPayload> {
    // Placeholder for curriculum service or content bank lookup
    const objectives = [
      `Explain the core idea of ${topic} using grade ${this.model.gradeLevel} standards`,
      `Provide an example or mini activity connected to ${topic}`
    ];

    return {
      topic,
      subject,
      subjectGrade: this.model.gradeLevel,
      text: `${subject} lesson on ${topic} for grade ${this.model.gradeLevel}.`,
      objectives
    };
  }

  private async adaptContent(content: GradeContentPayload) {
    const capabilityLevel = this.getDomainCapabilityLevel(content.subject);
    const teachingDirectives = this.buildTeachingDirectives(content.subject, capabilityLevel);

    const prompt = `System prompt: ${this.model.systemPrompt}

Content to adapt (Grade ${content.subjectGrade} ${content.subject}):
"${content.text}"

Learning objectives: ${content.objectives.join("; ")}

Adapt this content for a learner who currently performs at grade ${capabilityLevel}.
${teachingDirectives.join("\n")}

Return the adapted explanation in no more than 6 sentences, include encouragement, and end with a self-check question.`;

    const adapted = await this.model.complete(prompt);
    this.recordInteraction("system", prompt);
    this.recordInteraction("assistant", adapted);

    return {
      original: content.text,
      adapted,
      difficulty: capabilityLevel,
      visualAids: await this.generateVisualAids(content.topic),
      audioNarration: await this.generateAudioNarration(adapted)
    };
  }

  private async generateExercises(topic: string, level: number) {
    const prompt = `Create three scaffolded practice exercises for ${topic} at grade ${level} level.
Each exercise should include: instruction, hint, and how it maps back to the goal.`;
    const response = await this.model.complete(prompt);
    this.recordInteraction("assistant", response);
    return response
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3);
  }

  private async generateComprehensionQuestions() {
    const capabilityLevel = this.model.actualLevel;
    const prompt = `Generate two comprehension questions at grade ${capabilityLevel} level based on the last lesson summary below.
${this.interactionHistory.slice(-1)[0]?.content ?? "Focus on concrete understanding"}`;
    const response = await this.model.complete(prompt);
    return response
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 2);
  }

  private async generateVisualAids(topic: string) {
    const prompt = `Describe a concrete visual scene (no more than 60 words) that would help a student understand ${topic}.`;
    const response = await this.model.complete(prompt);
    return { description: response };
  }

  private async generateAudioNarration(adaptedText: string) {
    const prompt = `Summarize this explanation in a friendly spoken narration: "${adaptedText}"`;
    const response = await this.model.complete(prompt);
    return { transcript: response };
  }

  private getDomainCapabilityLevel(subject: string) {
    const domainKey = SUBJECT_DOMAIN_MAP[subject.toLowerCase()] ?? subject.toUpperCase();
    return this.model.configuration.domainLevels?.[domainKey] ?? this.model.actualLevel;
  }

  private buildTeachingDirectives(subject: string, capabilityLevel: number) {
    const learningStyle = this.model.configuration.learningStyle ?? "MIXED";
    const directives = [
      `Keep the tone encouraging and regulate to the learner's pace.`,
      `Use language suitable for grade ${capabilityLevel}.`,
      `Connect the ${subject} concept to real-life moments.`
    ];

    switch (learningStyle) {
      case "VISUAL":
        directives.push("Narrate imagery, charts, or color cues.");
        break;
      case "AUDITORY":
        directives.push("Guide with spoken-style steps and rhythm cues.");
        break;
      case "KINESTHETIC":
        directives.push("Include movement or manipulatives in the description.");
        break;
      default:
        directives.push("Blend visual, verbal, and movement prompts.");
    }

    return directives;
  }

  private recordInteraction(role: string, content: string) {
    this.interactionHistory.push({ role, content });
    if (this.interactionHistory.length > 20) {
      this.interactionHistory.splice(0, this.interactionHistory.length - 20);
    }
  }
}
