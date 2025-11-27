import axios, {AxiosInstance} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {MMKV} from 'react-native-mmkv';
import {
  SignupData,
  VirtualBrainInteraction,
  VirtualBrainState,
} from '../../types';

const storage = new MMKV();

const __DEV__ = process.env.NODE_ENV === 'development';

class AivoAPI {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: __DEV__
        ? 'http://localhost:8000/api/v1'
        : 'https://api.aivolearning.com/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth
    this.api.interceptors.request.use(
      async (config) => {
        const token = storage.getString('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh
          await this.refreshToken();
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', {
      username: email,
      password,
    });

    const {access_token, refresh_token, user} = response.data;
    storage.set('authToken', access_token);
    storage.set('refreshToken', refresh_token);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    return response.data;
  }

  async signup(data: SignupData) {
    const response = await this.api.post('/auth/signup', data);
    return response.data;
  }

  async refreshToken() {
    const refreshToken = storage.getString('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await this.api.post('/auth/refresh', {
      refresh_token: refreshToken,
    });

    storage.set('authToken', response.data.access_token);
    return response.data;
  }

  // Virtual Brain Interactions
  async interactWithVirtualBrain(
    learnerId: string,
    interaction: VirtualBrainInteraction
  ) {
    const response = await this.api.post('/agents/interact', {
      learner_id: learnerId,
      ...interaction,
    });
    return response.data;
  }

  async getVirtualBrainState(learnerId: string): Promise<VirtualBrainState> {
    const response = await this.api.get(`/agents/state/${learnerId}`);
    return response.data;
  }

  async adaptContent(learnerId: string, content: any) {
    const response = await this.api.post('/agents/adapt-content', {
      learner_id: learnerId,
      content,
    });
    return response.data;
  }

  // Learning Sessions
  async startLearningSession(learnerId: string, subject: string) {
    const response = await this.api.post('/learning/sessions/start', {
      learner_id: learnerId,
      subject,
    });
    return response.data;
  }

  async endLearningSession(sessionId: string) {
    const response = await this.api.post(`/learning/sessions/${sessionId}/end`);
    return response.data;
  }

  // Progress & Analytics
  async getLearnerProgress(learnerId: string) {
    const response = await this.api.get(`/progress/learner/${learnerId}`);
    return response.data;
  }

  async getSkillProgress(learnerId: string, skillId: string) {
    const response = await this.api.get(`/progress/skill/${skillId}`, {
      params: {learner_id: learnerId},
    });
    return response.data;
  }

  // Model Cloning
  async getMemoryBank(learnerId: string) {
    const response = await this.api.get(`/agents/memory/${learnerId}`);
    return response.data;
  }

  async getAdaptationHistory(learnerId: string) {
    const response = await this.api.get(`/agents/adaptations/${learnerId}`);
    return response.data;
  }

  async applyModelClone(learnerId: string, cloneData: any) {
    const response = await this.api.post(`/agents/clone/${learnerId}`, cloneData);
    return response.data;
  }

  async logCloneHistory(learnerId: string, cloneRecord: any) {
    const response = await this.api.post(`/agents/clone-history/${learnerId}`, cloneRecord);
    return response.data;
  }

  async getLearnerProfile(learnerId: string) {
    const response = await this.api.get(`/learners/profile/${learnerId}`);
    return response.data;
  }

  async findSimilarProfiles(learnerId: string) {
    const response = await this.api.get(`/learners/similar/${learnerId}`);
    return response.data;
  }
}

export default new AivoAPI();
