import { randomUUID } from "crypto";
import type { Assessment, Learner, Progress } from "@prisma/client";

interface ContextualInsightInput {
  message: string;
  learnerId?: string;
  context: string;
}

interface FocusSample {
  focusScore?: number;
}

interface ComprehensiveInsightInput {
  learner: (Learner & {
    progress: Progress[];
    assessments: Assessment[];
    focusData: FocusSample[];
  }) | null;
  topic: string;
  requesterId?: string;
}

interface InsightRecommendation {
  summary: string;
  recommendations: string[];
  priority: "LOW" | "MEDIUM" | "HIGH";
  id: string;
}

export class AIInsightGenerator {
  async generateContextualInsight(input: ContextualInsightInput): Promise<InsightRecommendation> {
    const sentiment = this.estimateSentiment(input.message);
    return {
      id: randomUUID(),
      summary: this.composeSummary(sentiment, input.context),
      recommendations: this.buildRecommendations(sentiment, input.context),
      priority: sentiment === "negative" ? "HIGH" : sentiment === "neutral" ? "MEDIUM" : "LOW"
    };
  }

  async generateComprehensiveInsight(input: ComprehensiveInsightInput): Promise<InsightRecommendation> {
    if (!input.learner) {
      return {
        id: randomUUID(),
        summary: "Unable to locate learner context for this insight request.",
        recommendations: ["Verify the learner selection and try again."],
        priority: "LOW"
      };
    }

    const trend = this.calculateTrend(input.learner.progress ?? []);
    const focusScore = this.estimateFocus(input.learner.focusData ?? []);

    const summary = `Learner ${input.learner.firstName} ${input.learner.lastName} shows ${trend.label} progress with a focus score of ${focusScore}. Topic: ${input.topic}.`;
    const recommendations = [
      this.progressRecommendation(trend),
      `Schedule a check-in with guardians to review ${input.topic}.`,
      focusScore < 60 ? "Consider shorter learning bursts to improve focus." : "Maintain the current learning cadence."
    ];

    return {
      id: randomUUID(),
      summary,
      recommendations,
      priority: trend.direction === "declining" || focusScore < 50 ? "HIGH" : "MEDIUM"
    };
  }

  private estimateSentiment(message: string): "positive" | "neutral" | "negative" {
    const lower = message.toLowerCase();
    if (/(concern|urgent|worried|issue|problem)/.test(lower)) return "negative";
    if (/(thanks|great|progress|happy)/.test(lower)) return "positive";
    return "neutral";
  }

  private composeSummary(sentiment: string, context: string) {
    if (sentiment === "negative") {
      return `An immediate follow-up is recommended based on the current ${context} conversation.`;
    }
    if (sentiment === "positive") {
      return `Conversation indicates positive collaboration within ${context}.`;
    }
    return `Conversation highlights an opportunity for clarification in ${context}.`;
  }

  private buildRecommendations(sentiment: string, context: string) {
    if (sentiment === "negative") {
      return [
        "Acknowledge the concern within 24 hours.",
        "Review recent learning data to provide evidence-based follow-up.",
        `Escalate to program lead if no response within 48 hours in the ${context} channel.`
      ];
    }
    if (sentiment === "positive") {
      return [
        "Encourage the guardian to share additional wins for documentation.",
        `Capture this insight inside the ${context} log for future reference.`
      ];
    }
    return [
      "Clarify the request and confirm next steps.",
      "Log the conversation with a target follow-up date.",
      `Offer optional AI-generated strategies linked to the ${context} topic.`
    ];
  }

  private calculateTrend(progress: Progress[]) {
    if (progress.length < 2) {
      return { direction: "steady", label: "limited", delta: 0 } as const;
    }
    const sorted = [...progress].sort((a, b) => a.date.getTime() - b.date.getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const delta = last.level - first.level;
    if (delta > 3) return { direction: "improving", label: "strong", delta } as const;
    if (delta < -1) return { direction: "declining", label: "needs attention", delta } as const;
    return { direction: "steady", label: "steady", delta } as const;
  }

  private estimateFocus(focusData: FocusSample[]) {
    if (!focusData.length) return 55;
    const recent = focusData.slice(-10);
    const avg =
      recent.reduce((total, sample) => total + (sample.focusScore ?? 50), 0) / recent.length;
    return Math.round(avg);
  }

  private progressRecommendation(trend: { direction: string }) {
    if (trend.direction === "improving") {
      return "Continue reinforcing what is working and set a stretch target for next week.";
    }
    if (trend.direction === "declining") {
      return "Schedule an instructional review to address the regression immediately.";
    }
    return "Maintain current plan but add weekly check-ins to catch early changes.";
  }
}
