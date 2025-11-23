import AsyncStorage from '@react-native-async-storage/async-storage';

interface QueuedRequest {
  id: string;
  path: string;
  options: RequestInit;
  timestamp: number;
  retryCount: number;
}

interface MobileClientConfig {
  baseUrl: string;
  getToken: () => Promise<string | null>;
  onTokenExpired?: () => void;
  maxRetries?: number;
  offlineQueueKey?: string;
}

export class AivoMobileClient {
  private baseUrl: string;
  private getToken: () => Promise<string | null>;
  private onTokenExpired?: () => void;
  private maxRetries: number;
  private offlineQueueKey: string;
  private isOnline: boolean = true;

  constructor(config: MobileClientConfig) {
    this.baseUrl = config.baseUrl;
    this.getToken = config.getToken;
    this.onTokenExpired = config.onTokenExpired;
    this.maxRetries = config.maxRetries || 3;
    this.offlineQueueKey = config.offlineQueueKey || 'aivo_offline_queue';
  }

  setOnlineStatus(isOnline: boolean) {
    this.isOnline = isOnline;
    if (isOnline) {
      this.processOfflineQueue();
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    allowQueue: boolean = true
  ): Promise<T> {
    const token = await this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    try {
      const res = await fetch(`${this.baseUrl}${path}`, requestOptions);

      // Handle token expiration
      if (res.status === 401) {
        this.onTokenExpired?.();
        throw new Error('Authentication expired');
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
      }

      return res.json() as Promise<T>;
    } catch (error) {
      // If offline and mutation, queue the request
      if (
        !this.isOnline &&
        allowQueue &&
        options.method &&
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)
      ) {
        await this.queueRequest(path, requestOptions);
        throw new Error('Request queued for when online');
      }

      throw error;
    }
  }

  private async queueRequest(path: string, options: RequestInit) {
    try {
      const queue = await this.getOfflineQueue();
      const queuedRequest: QueuedRequest = {
        id: `${Date.now()}_${Math.random()}`,
        path,
        options,
        timestamp: Date.now(),
        retryCount: 0,
      };

      queue.push(queuedRequest);
      await AsyncStorage.setItem(this.offlineQueueKey, JSON.stringify(queue));
    } catch (error) {
      console.error('Error queueing request:', error);
    }
  }

  private async getOfflineQueue(): Promise<QueuedRequest[]> {
    try {
      const queueData = await AsyncStorage.getItem(this.offlineQueueKey);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Error reading offline queue:', error);
      return [];
    }
  }

  private async processOfflineQueue() {
    try {
      const queue = await this.getOfflineQueue();
      if (queue.length === 0) return;

      const results = await Promise.allSettled(
        queue.map(async (item) => {
          try {
            await this.request(item.path, item.options, false);
            return { id: item.id, success: true };
          } catch (error) {
            if (item.retryCount < this.maxRetries) {
              item.retryCount++;
              return { id: item.id, success: false, retry: true };
            }
            return { id: item.id, success: false, retry: false };
          }
        })
      );

      // Filter queue: keep only failed items that should retry
      const updatedQueue = queue.filter((item, index) => {
        const result = results[index];
        if (result.status === 'fulfilled' && result.value.success) {
          return false; // Remove successful
        }
        if (result.status === 'fulfilled' && !result.value.retry) {
          return false; // Remove max retries exceeded
        }
        return true; // Keep for retry
      });

      await AsyncStorage.setItem(this.offlineQueueKey, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('Error processing offline queue:', error);
    }
  }

  async clearOfflineQueue() {
    await AsyncStorage.removeItem(this.offlineQueueKey);
  }

  // Agent APIs
  async processAgentInteraction(data: {
    learnerId: string;
    agentType: string;
    action: string;
    input: any;
  }) {
    return this.request('/api/agents/interact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAgentMetrics(learnerId: string) {
    return this.request(`/api/agents/interact?learnerId=${learnerId}`, {
      method: 'GET',
    });
  }

  // Speech APIs
  async analyzeSpeech(formData: FormData) {
    const token = await this.getToken();
    
    const res = await fetch(`${this.baseUrl}/api/speech/analyze`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (res.status === 401) {
      this.onTokenExpired?.();
      throw new Error('Authentication expired');
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text}`);
    }

    return res.json();
  }

  // Learner APIs
  async getLearner(learnerId: string) {
    return this.request(`/learners/${learnerId}`, {
      method: 'GET',
    });
  }

  async createLearner(data: any) {
    return this.request('/learners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Session APIs
  async getTodaySession(learnerId: string, subject: string) {
    return this.request(`/sessions/today?learnerId=${learnerId}&subject=${subject}`, {
      method: 'GET',
    });
  }

  async startSession(data: any) {
    return this.request('/sessions/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateActivityStatus(sessionId: string, activityId: string, status: string) {
    return this.request(`/sessions/${sessionId}/activities/${activityId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Caregiver APIs
  async getCaregiverLearnerOverview(learnerId: string) {
    return this.request(`/caregiver/learners/${learnerId}/overview`, {
      method: 'GET',
    });
  }

  async listNotifications() {
    return this.request('/caregiver/notifications', {
      method: 'GET',
    });
  }

  async markNotificationRead(notificationId: string) {
    return this.request(`/caregiver/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  async respondToDifficultyProposal(proposalId: string, decision: 'approve' | 'reject') {
    return this.request(`/difficulty/proposals/${proposalId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ approve: decision === 'approve' }),
    });
  }

  // Analytics APIs
  async getLearnerAnalytics(learnerId: string) {
    return this.request(`/analytics/learners/${learnerId}`, {
      method: 'GET',
    });
  }
}
