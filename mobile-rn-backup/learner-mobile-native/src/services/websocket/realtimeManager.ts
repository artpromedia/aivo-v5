import EventEmitter from 'eventemitter3';
import {MMKV} from 'react-native-mmkv';

const storage = new MMKV();
const __DEV__ = process.env.NODE_ENV === 'development';

class RealtimeManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isConnected = false;
  private messageQueue: string[] = [];

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = storage.getString('authToken');
      if (!token) {
        reject(new Error('No authentication token'));
        return;
      }

      const wsUrl = __DEV__
        ? `ws://localhost:8000/ws?token=${token}`
        : `wss://api.aivolearning.com/ws?token=${token}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.isConnected = true;
        this.startHeartbeat();
        this.flushMessageQueue();
        this.emit('connected');
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.emit('error', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.isConnected = false;
        this.stopHeartbeat();
        this.emit('disconnected');
        this.scheduleReconnect();
      };
    });
  }

  private handleMessage(data: any) {
    const {type, payload} = data;

    switch (type) {
      // Virtual Brain Events
      case 'virtual_brain_response':
        this.emit('virtualBrainResponse', payload);
        break;
      case 'state_update':
        this.emit('stateUpdate', payload);
        break;
      case 'cognitive_state_change':
        this.emit('cognitiveStateChange', payload);
        break;
      case 'adaptation_triggered':
        this.emit('adaptationTriggered', payload);
        break;

      // Learning Events
      case 'lesson_completed':
        this.emit('lessonCompleted', payload);
        break;
      case 'skill_mastered':
        this.emit('skillMastered', payload);
        break;
      case 'achievement_unlocked':
        this.emit('achievementUnlocked', payload);
        break;

      // Assessment Events
      case 'assessment_progress':
        this.emit('assessmentProgress', payload);
        break;
      case 'assessment_complete':
        this.emit('assessmentComplete', payload);
        break;

      // Speech Events
      case 'speech_analysis_result':
        this.emit('speechAnalysisResult', payload);
        break;
      case 'pronunciation_feedback':
        this.emit('pronunciationFeedback', payload);
        break;

      // Parent Notifications
      case 'learner_activity':
        this.emit('learnerActivity', payload);
        break;
      case 'daily_summary':
        this.emit('dailySummary', payload);
        break;
      case 'goal_progress':
        this.emit('goalProgress', payload);
        break;

      // System Events
      case 'pong':
        // Heartbeat response
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  send(type: string, payload: any) {
    const message = JSON.stringify({type, payload, timestamp: Date.now()});

    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      // Queue message for later
      this.messageQueue.push(message);
    }
  }

  subscribeLearner(learnerId: string) {
    this.send('subscribe_learner', {learner_id: learnerId});
  }

  unsubscribeLearner(learnerId: string) {
    this.send('unsubscribe_learner', {learner_id: learnerId});
  }

  interactWithVirtualBrain(data: any) {
    this.send('virtual_brain_interaction', data);
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send('ping', {});
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connect().catch(console.error);
      this.reconnectTimer = null;
    }, 5000);
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(message);
      }
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export default new RealtimeManager();
