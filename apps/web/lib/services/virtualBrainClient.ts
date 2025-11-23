/**
 * Virtual Brain Client Service
 * Author: artpromedia
 * Date: 2025-11-23
 */

export interface CognitiveState {
  cognitive_load: number;
  engagement_level: number;
  frustration_level: number;
  fatigue_level: number;
  confidence_level: number;
  motivation_level: number;
}

export interface PerformanceMetrics {
  accuracy: number;
  response_time: number;
  consistency: number;
  improvement_rate: number;
}

export interface VirtualBrainInteraction {
  learner_id: string;
  type: 'question_response' | 'content_view' | 'hint_request' | 'assessment' | 'practice';
  content: string;
  response?: string;
  context?: {
    difficulty?: number;
    subject?: string;
    skill?: string;
    correct?: boolean;
    time_taken?: number;
    [key: string]: any;
  };
}

export interface VirtualBrainResponse {
  learner_id: string;
  result: any;
  adapted_content?: string;
  ai_response?: string;
  feedback?: string;
  state?: CognitiveState;
  performance?: PerformanceMetrics;
  recommendations?: string[];
  timestamp: string;
}

export interface AdaptationRequest {
  learner_id: string;
  content: string;
  content_type: 'text' | 'question' | 'instruction' | 'example' | 'exercise';
  target_difficulty?: number;
  focus_areas?: string[];
}

export interface AdaptationResponse {
  learner_id: string;
  original_content: string;
  adapted_content: string;
  timestamp: string;
}

export interface StateUpdateMessage {
  type: 'state_update';
  learner_id: string;
  state: CognitiveState;
  timestamp: string;
}

export class VirtualBrainClient {
  private stateListeners: Map<string, Set<(state: CognitiveState) => void>>;
  private responseListeners: Map<string, Set<(response: VirtualBrainResponse) => void>>;
  private adaptationListeners: Map<string, Set<(adaptation: AdaptationResponse) => void>>;

  constructor() {
    this.stateListeners = new Map();
    this.responseListeners = new Map();
    this.adaptationListeners = new Map();
  }

  /**
   * Subscribe to cognitive state updates for a learner
   */
  onStateUpdate(learnerId: string, callback: (state: CognitiveState) => void): () => void {
    if (!this.stateListeners.has(learnerId)) {
      this.stateListeners.set(learnerId, new Set());
    }
    
    this.stateListeners.get(learnerId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.stateListeners.get(learnerId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.stateListeners.delete(learnerId);
        }
      }
    };
  }

  /**
   * Subscribe to Virtual Brain responses for a learner
   */
  onResponse(learnerId: string, callback: (response: VirtualBrainResponse) => void): () => void {
    if (!this.responseListeners.has(learnerId)) {
      this.responseListeners.set(learnerId, new Set());
    }
    
    this.responseListeners.get(learnerId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.responseListeners.get(learnerId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.responseListeners.delete(learnerId);
        }
      }
    };
  }

  /**
   * Subscribe to content adaptation responses for a learner
   */
  onAdaptation(learnerId: string, callback: (adaptation: AdaptationResponse) => void): () => void {
    if (!this.adaptationListeners.has(learnerId)) {
      this.adaptationListeners.set(learnerId, new Set());
    }
    
    this.adaptationListeners.get(learnerId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.adaptationListeners.get(learnerId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.adaptationListeners.delete(learnerId);
        }
      }
    };
  }

  /**
   * Handle incoming state update message
   */
  handleStateUpdate(message: StateUpdateMessage): void {
    const listeners = this.stateListeners.get(message.learner_id);
    if (listeners) {
      listeners.forEach((callback) => callback(message.state));
    }
  }

  /**
   * Handle incoming Virtual Brain response
   */
  handleVirtualBrainResponse(message: VirtualBrainResponse): void {
    const listeners = this.responseListeners.get(message.learner_id);
    if (listeners) {
      listeners.forEach((callback) => callback(message));
    }
  }

  /**
   * Handle incoming adaptation response
   */
  handleAdaptationResponse(message: AdaptationResponse): void {
    const listeners = this.adaptationListeners.get(message.learner_id);
    if (listeners) {
      listeners.forEach((callback) => callback(message));
    }
  }

  /**
   * Build interaction data for sending to backend
   */
  buildInteraction(interaction: VirtualBrainInteraction): any {
    return {
      learner_id: interaction.learner_id,
      type: interaction.type,
      content: interaction.content,
      response: interaction.response,
      context: interaction.context,
    };
  }

  /**
   * Build adaptation request for sending to backend
   */
  buildAdaptationRequest(request: AdaptationRequest): any {
    return {
      learner_id: request.learner_id,
      content: request.content,
      content_type: request.content_type,
      target_difficulty: request.target_difficulty,
      focus_areas: request.focus_areas,
    };
  }

  /**
   * Clear all listeners
   */
  clearAllListeners(): void {
    this.stateListeners.clear();
    this.responseListeners.clear();
    this.adaptationListeners.clear();
  }

  /**
   * Clear listeners for specific learner
   */
  clearLearnerListeners(learnerId: string): void {
    this.stateListeners.delete(learnerId);
    this.responseListeners.delete(learnerId);
    this.adaptationListeners.delete(learnerId);
  }

  /**
   * Get number of active listeners for a learner
   */
  getListenerCount(learnerId: string): number {
    const stateCount = this.stateListeners.get(learnerId)?.size || 0;
    const responseCount = this.responseListeners.get(learnerId)?.size || 0;
    const adaptationCount = this.adaptationListeners.get(learnerId)?.size || 0;
    return stateCount + responseCount + adaptationCount;
  }
}

// Create singleton instance
export const virtualBrainClient = new VirtualBrainClient();
