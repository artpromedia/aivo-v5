import type { Question } from "@/lib/types/assessment";

type StoredQuestion = Question & { createdAt: number };

type ResultRecord = {
  questionId: string;
  isCorrect: boolean;
  answeredAt: number;
};

class AssessmentStore {
  private questions = new Map<string, StoredQuestion>();
  private domainResults = new Map<string, ResultRecord[]>();

  saveQuestion(question: Question) {
    this.questions.set(question.id, { ...question, createdAt: Date.now() });
    const domainList = this.domainResults.get(question.domain) ?? [];
    this.domainResults.set(question.domain, domainList);
  }

  getQuestion(id: string) {
    return this.questions.get(id);
  }

  recordResult(domain: string, result: ResultRecord) {
    const existing = this.domainResults.get(domain) ?? [];
    this.domainResults.set(domain, [...existing, result]);
  }

  getRecentResult(domain: string) {
    const list = this.domainResults.get(domain);
    if (!list?.length) return null;
    return list[list.length - 1];
  }

  prune(ttlMs = 1000 * 60 * 60) {
    const cutoff = Date.now() - ttlMs;
    for (const [id, question] of this.questions.entries()) {
      if (question.createdAt < cutoff) {
        this.questions.delete(id);
      }
    }
    for (const [domain, results] of this.domainResults.entries()) {
      const filtered = results.filter((result) => result.answeredAt >= cutoff);
      if (filtered.length) {
        this.domainResults.set(domain, filtered);
      } else {
        this.domainResults.delete(domain);
      }
    }
  }
}

export const assessmentStore = new AssessmentStore();
