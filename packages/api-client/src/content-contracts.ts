import type { CurriculumTopic, ContentItem } from "@aivo/types";

export interface ListCurriculumTopicsResponse {
  topics: CurriculumTopic[];
}

export interface CreateCurriculumTopicRequest {
  subject: string;
  grade: number;
  region: string;
  standard: string;
  code?: string;
  title: string;
  description?: string;
}

export interface CreateCurriculumTopicResponse {
  topic: CurriculumTopic;
}

export interface UpdateCurriculumTopicRequest {
  topicId: string;
  title?: string;
  description?: string;
  code?: string | null;
}

export interface UpdateCurriculumTopicResponse {
  topic: CurriculumTopic;
}

export interface ListContentItemsResponse {
  items: ContentItem[];
}

export interface CreateContentItemRequest {
  topicId: string;
  subject: string;
  grade: number;
  type: string;
  title: string;
  body: string;
  questionFormat?: string;
  options?: string[];
  correctAnswer?: string;
  accessibilityNotes?: string;
  status?: string;
}

export interface CreateContentItemResponse {
  item: ContentItem;
}

export interface UpdateContentItemRequest {
  itemId: string;
  title?: string;
  body?: string;
  status?: string;
  questionFormat?: string | null;
  options?: string[];
  correctAnswer?: string | null;
  accessibilityNotes?: string | null;
}

export interface UpdateContentItemResponse {
  item: ContentItem;
}

// AI-assisted content generation

export interface GenerateDraftContentRequest {
  topicId: string;
  subject: string;
  grade: number;
  type: string;
}

export interface GenerateDraftContentResponse {
  item: ContentItem;
}
