import {io, Socket} from 'socket.io-client';
import {MMKV} from 'react-native-mmkv';
import EventEmitter from 'eventemitter3';

const storage = new MMKV();
const __DEV__ = process.env.NODE_ENV === 'development';

class SocketManager extends EventEmitter {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(): Promise<void> {
    const token = storage.getString('authToken');
    if (!token) {
      throw new Error('No auth token available');
    }

    const serverUrl = __DEV__
      ? 'http://localhost:8000'
      : 'https://api.aivolearning.com';

    this.socket = io(serverUrl, {
      auth: {token},
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.emit('disconnected', reason);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });

    // Virtual Brain events
    this.socket.on('virtual_brain_response', (data) => {
      this.emit('virtualBrainResponse', data);
    });

    this.socket.on('learner_state_update', (data) => {
      this.emit('stateUpdate', data);
    });

    this.socket.on('adapted_content', (data) => {
      this.emit('contentAdapted', data);
    });

    // Learning events
    this.socket.on('session_update', (data) => {
      this.emit('sessionUpdate', data);
    });

    this.socket.on('progress_update', (data) => {
      this.emit('progressUpdate', data);
    });

    this.socket.on('achievement_unlocked', (data) => {
      this.emit('achievement', data);
    });
  }

  sendMessage(event: string, data: any): void {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit(event, data);
  }

  subscribeTo(learnerId: string): void {
    this.sendMessage('subscribe_learner', {learner_id: learnerId});
  }

  unsubscribeFrom(learnerId: string): void {
    this.sendMessage('unsubscribe_learner', {learner_id: learnerId});
  }

  interactWithVirtualBrain(data: any): void {
    this.sendMessage('virtual_brain_interact', data);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketManager = new SocketManager();

export const setupWebSocket = async () => {
  try {
    await socketManager.connect();
  } catch (error) {
    console.error('Failed to setup WebSocket:', error);
  }
};
