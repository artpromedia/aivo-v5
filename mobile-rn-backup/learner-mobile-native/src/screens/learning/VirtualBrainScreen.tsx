import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useVirtualBrain} from '../../hooks/useVirtualBrain';
import {useLearner} from '../../hooks/useLearner';
import VirtualBrainAvatar from '../../components/virtualBrain/VirtualBrainAvatar';
import CognitiveStateIndicator from '../../components/virtualBrain/CognitiveStateIndicator';
import MessageBubble from '../../components/common/MessageBubble';

const VirtualBrainScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const {currentLearner} = useLearner();
  const {
    virtualBrain,
    isConnected,
    isProcessing,
    sendInteraction,
    currentState,
    messages,
  } = useVirtualBrain(currentLearner?.id);

  const [inputText, setInputText] = useState('');
  const [showState, setShowState] = useState(false);

  useEffect(() => {
    // Pulse animation for Virtual Brain
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    await sendInteraction({
      type: 'chat',
      content: {
        message: inputText,
        timestamp: new Date().toISOString(),
      },
      response: inputText,
    });

    setInputText('');
    scrollViewRef.current?.scrollToEnd({animated: true});
  };

  return (
    <LinearGradient
      colors={['#F3E8FF', '#FDF4FF', '#FFFFFF']}
      style={styles.container}>
      {/* Header with Virtual Brain Avatar */}
      <View style={[styles.header, {paddingTop: insets.top + 10}]}>
        <Animated.View
          style={[styles.avatarContainer, {transform: [{scale: pulseAnim}]}]}>
          <VirtualBrainAvatar
            state={currentState?.cognitive_state}
            isActive={isConnected}
            size={100}
          />
        </Animated.View>

        <Text style={styles.brainName}>
          {virtualBrain?.name || 'Your Virtual Brain'}
        </Text>

        <Text style={styles.statusText}>
          {isConnected ? '🟢 Connected' : '🔴 Connecting...'}
        </Text>

        {/* Cognitive State Indicator */}
        <TouchableOpacity
          style={styles.stateButton}
          onPress={() => setShowState(!showState)}>
          <Icon name="brain" size={20} color="#8B5CF6" />
          <Text style={styles.stateButtonText}>View State</Text>
        </TouchableOpacity>

        {showState && (
          <CognitiveStateIndicator
            state={currentState?.cognitive_state}
            performance={currentState?.performance_metrics}
          />
        )}
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}>
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            message={message.text}
            isUser={message.sender === 'user'}
            timestamp={message.timestamp}
            adaptations={message.adaptations}
          />
        ))}

        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color="#8B5CF6" />
            <Text style={styles.processingText}>
              Virtual Brain is thinking...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}>
        <View
          style={[styles.inputContainer, {paddingBottom: insets.bottom + 10}]}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask your Virtual Brain anything..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isProcessing}>
            <Icon
              name="send"
              size={24}
              color={inputText.trim() ? '#FFFFFF' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    marginBottom: 10,
  },
  brainName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  stateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  stateButtonText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginTop: 10,
  },
  processingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    fontSize: 16,
    color: '#1F2937',
  },
  sendButton: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});

export default VirtualBrainScreen;
