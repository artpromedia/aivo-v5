import type { Feedback } from "@aivo/types";

export interface RecordFeedbackRequest {
  targetType: Feedback["targetType"];
  targetId: string;
  rating: number;
  label?: string;
  comment?: string;
}

export interface RecordFeedbackResponse {
  feedback: Feedback;
}

export interface AggregateFeedbackResponse {
  count: number;
  avgRating: number;
}
