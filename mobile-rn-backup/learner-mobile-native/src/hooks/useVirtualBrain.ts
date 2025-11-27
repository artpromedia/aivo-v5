import {useState, useEffect, useCallback} from 'react';
import {useVirtualBrainContext} from '../contexts/VirtualBrainContext';
import {socketManager} from '../services/websocket/socketManager';
import AivoAPI from '../services/api/aivoApi';
import {VirtualBrainInteraction, VirtualBrainMessage, VirtualBrainState} from '../types';
import modelCloningService from '../services/virtualBrain/modelCloning';

export const useVirtualBrain = (learnerId?: string) => {
  const {currentState, updateState} = useVirtualBrainContext();
  const [messages, setMessages] = useState<VirtualBrainMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [virtualBrain, setVirtualBrain] = useState<any>(null);

  useEffect(() => {
    if (!learnerId) return;

    // Subscribe to learner events
    socketManager.subscribeTo(learnerId);

    // Listen for Virtual Brain responses
    const handleResponse = (data: any) => {
      setMessages((prev) => [
        ...prev,
        {
          text: data.content || data.message,
          sender: 'brain',
          timestamp: new Date(),
          adaptations: data.adaptations,
        },
      ]);
      setIsProcessing(false);

      // Update state if provided
      if (data.state) {
        updateState(data.state);
      }
    };

    const handleStateUpdate = (data: VirtualBrainState) => {
      updateState(data);
    };

    socketManager.on('virtualBrainResponse', handleResponse);
    socketManager.on('stateUpdate', handleStateUpdate);

    // Load initial state
    loadVirtualBrainState();

    return () => {
      socketManager.off('virtualBrainResponse', handleResponse);
      socketManager.off('stateUpdate', handleStateUpdate);
      socketManager.unsubscribeFrom(learnerId);
    };
  }, [learnerId]);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(socketManager.isConnected());
    };

    socketManager.on('connected', checkConnection);
    socketManager.on('disconnected', checkConnection);
    checkConnection();

    return () => {
      socketManager.off('connected', checkConnection);
      socketManager.off('disconnected', checkConnection);
    };
  }, []);

  const loadVirtualBrainState = async () => {
    if (!learnerId) return;

    try {
      const state = await AivoAPI.getVirtualBrainState(learnerId);
      updateState(state);
      setVirtualBrain({name: 'Your Virtual Brain', id: learnerId});
    } catch (error) {
      console.error('Failed to load Virtual Brain state:', error);
    }
  };

  const sendInteraction = useCallback(
    async (interaction: VirtualBrainInteraction) => {
      if (!learnerId) return;

      setIsProcessing(true);

      // Add user message
      if (interaction.response) {
        setMessages((prev) => [
          ...prev,
          {
            text: interaction.response,
            sender: 'user',
            timestamp: new Date(),
          },
        ]);
      }

      try {
        // Send via WebSocket for real-time response
        socketManager.interactWithVirtualBrain({
          learner_id: learnerId,
          ...interaction,
        });

        // Also send via API for persistence
        await AivoAPI.interactWithVirtualBrain(learnerId, interaction);
      } catch (error) {
        console.error('Failed to send interaction:', error);
        setIsProcessing(false);
      }
    },
    [learnerId]
  );

  const initializeVirtualBrain = useCallback(
    async (assessmentResults: any) => {
      if (!learnerId) return;
      try {
        // TODO: API call to initialize Virtual Brain with assessment data
        await AivoAPI.interactWithVirtualBrain(learnerId, {
          action: 'initialize',
          payload: assessmentResults,
        });
        await loadVirtualBrainState();
      } catch (error) {
        console.error('Failed to initialize Virtual Brain:', error);
      }
    },
    [learnerId]
  );

  const cloneModel = useCallback(
    async (options: {sourceLearner: string; cloneType: 'full' | 'partial' | 'sibling'}) => {
      if (!learnerId) return false;
      try {
        return await modelCloningService.cloneModel({
          sourceLearner: options.sourceLearner,
          targetLearner: learnerId,
          cloneType: options.cloneType,
        });
      } catch (error) {
        console.error('Failed to clone model:', error);
        return false;
      }
    },
    [learnerId]
  );

  return {
    virtualBrain,
    isConnected,
    isProcessing,
    currentState,
    messages,
    sendInteraction,
    initializeVirtualBrain,
    cloneModel,
  };
};
