import axios, {AxiosInstance} from 'axios';
import {MMKV} from 'react-native-mmkv';

const storage = new MMKV();
const __DEV__ = process.env.NODE_ENV === 'development';

class CompleteAPIService {
  private api: AxiosInstance;
  private baseURL = __DEV__ 
    ? 'http://localhost:8000/api/v1'
    : 'https://api.aivolearning.com/api/v1';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {'Content-Type': 'application/json'},
    });

    // Request interceptor
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

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== ASSESSMENT ENDPOINTS ====================
  async getBaselineConfiguration(learnerId: string) {
    const response = await this.api.get(`/assessment/baseline/config/${learnerId}`);
    return response.data;
  }

  async submitBaselineAssessment(data: any) {
    const response = await this.api.post('/assessment/baseline/submit', data);
    return response.data;
  }

  async completePhase(data: any) {
    const response = await this.api.post('/assessment/phase/complete', data);
    return response.data;
  }

  async generateAdaptiveQuestions(data: any) {
    const response = await this.api.post('/assessment/adaptive/generate', data);
    return response.data;
  }

  async calculateDifficultyAdjustment(data: any) {
    const response = await this.api.post('/assessment/difficulty/adjust', data);
    return response.data;
  }

  // ==================== SPEECH ANALYSIS ENDPOINTS ====================
  async getSpeechExercise(learnerId: string) {
    const response = await this.api.get(`/speech/exercise/${learnerId}`);
    return response.data;
  }

  async analyzeSpeech(formData: FormData) {
    const response = await this.api.post('/speech/analyze', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    });
    return response.data;
  }

  async getSpeechProgress(learnerId: string) {
    const response = await this.api.get(`/speech/progress/${learnerId}`);
    return response.data;
  }

  // ==================== PARENT DASHBOARD ENDPOINTS ====================
  async getParentLearners() {
    const response = await this.api.get('/parent/learners');
    return response.data;
  }

  async getParentDashboard() {
    const response = await this.api.get('/parent/dashboard');
    return response.data;
  }

  async addLearner(data: any) {
    const response = await this.api.post('/parent/learners/add', data);
    return response.data;
  }

  async getLearnerSchedule(learnerId: string) {
    const response = await this.api.get(`/parent/schedule/${learnerId}`);
    return response.data;
  }

  async updateLearnerSchedule(learnerId: string, schedule: any) {
    const response = await this.api.put(`/parent/schedule/${learnerId}`, schedule);
    return response.data;
  }

  async getParentReports(learnerId: string, options: any) {
    const response = await this.api.get(`/parent/reports/${learnerId}`, {params: options});
    return response.data;
  }

  // ==================== IEP/504 ENDPOINTS ====================
  async getIEPGoals(learnerId: string) {
    const response = await this.api.get(`/iep/goals/${learnerId}`);
    return response.data;
  }

  async addIEPGoal(data: any) {
    const response = await this.api.post('/iep/goals/add', data);
    return response.data;
  }

  async updateIEPGoalProgress(data: any) {
    const response = await this.api.post('/iep/goals/progress', data);
    return response.data;
  }

  async get504Accommodations(learnerId: string) {
    const response = await this.api.get(`/accommodations/504/${learnerId}`);
    return response.data;
  }

  // ==================== CONTENT MANAGEMENT ENDPOINTS ====================
  async getAdaptiveContent(learnerId: string, subject: string) {
    const response = await this.api.get(`/content/adaptive/${learnerId}/${subject}`);
    return response.data;
  }

  async getContentLibrary(filters: any) {
    const response = await this.api.get('/content/library', {params: filters});
    return response.data;
  }

  async getContentRecommendations(learnerId: string) {
    const response = await this.api.get(`/content/recommendations/${learnerId}`);
    return response.data;
  }

  // ==================== GAMIFICATION ENDPOINTS ====================
  async getAchievements(learnerId: string) {
    const response = await this.api.get(`/gamification/achievements/${learnerId}`);
    return response.data;
  }

  async getLeaderboard(scope: string) {
    const response = await this.api.get(`/gamification/leaderboard/${scope}`);
    return response.data;
  }

  async getRewards(learnerId: string) {
    const response = await this.api.get(`/gamification/rewards/${learnerId}`);
    return response.data;
  }

  // ==================== REPORTING ENDPOINTS ====================
  async generateReport(learnerId: string, options: any) {
    const response = await this.api.post(`/reports/generate/${learnerId}`, options);
    return response.data;
  }

  async getReportHistory(learnerId: string) {
    const response = await this.api.get(`/reports/history/${learnerId}`);
    return response.data;
  }

  async downloadReport(reportId: string) {
    const response = await this.api.get(`/reports/download/${reportId}`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export default new CompleteAPIService();
