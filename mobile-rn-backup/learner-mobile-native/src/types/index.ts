// Core Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  tenant_id: string;
}

export interface Learner {
  id: string;
  user_id: string;
  grade_level?: string;
  learning_preferences?: any;
  cognitive_profile?: any;
  virtual_brain_enabled: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  full_name: string;
  role: string;
}

// Virtual Brain Types
export interface VirtualBrainInteraction {
  type: string;
  content: any;
  response?: string;
  context?: any;
}

export interface VirtualBrainState {
  cognitive_state: {
    attention_level: number;
    engagement_score: number;
    difficulty_preference: string;
    learning_pace: string;
  };
  performance_metrics: {
    accuracy: number;
    speed: number;
    consistency: number;
  };
  adaptations: any[];
}

export interface VirtualBrainMessage {
  text: string;
  sender: 'user' | 'brain';
  timestamp: Date;
  adaptations?: any[];
}

// Learning Session Types
export interface LearningSession {
  id: string;
  learner_id: string;
  subject: string;
  start_time: Date;
  end_time?: Date;
  activities: Activity[];
  performance: any;
}

export interface Activity {
  id: string;
  type: string;
  content: any;
  completed: boolean;
  score?: number;
}

// Progress Types
export interface SkillProgress {
  skill_id: string;
  skill_name: string;
  current_level: number;
  target_level: number;
  mastery_percentage: number;
  recent_activities: Activity[];
}
