export type LessonSegmentStatus = "READY" | "IN_PROGRESS" | "COMPLETE";

export interface LessonSegment {
  id: string;
  title: string;
  content: string;
  status: LessonSegmentStatus;
}

export interface LessonEntity {
  id: string;
  subject: string;
  currentTopic: string;
  summary: string;
  segments: LessonSegment[];
  insights?: {
    comprehensionQuestions?: string[];
    recommendedLevel?: number;
  };
}
