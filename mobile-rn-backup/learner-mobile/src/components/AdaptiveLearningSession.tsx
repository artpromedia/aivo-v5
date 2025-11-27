import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { AivoMobileClient } from '@aivo/api-client/mobile-client';
import { useAuth } from '../../../shared/auth/AuthContext';

interface Activity {
  id: string;
  type: string;
  content: any;
  difficulty: number;
  status: 'pending' | 'active' | 'completed';
}

interface TutorMessage {
  id: string;
  text: string;
  mood: 'encouraging' | 'excited' | 'supportive' | 'celebrating';
  timestamp: number;
}

interface AdaptiveLearningSessionProps {
  learnerId: string;
  subject: string;
  apiClient: AivoMobileClient;
  onComplete?: () => void;
}

export function AdaptiveLearningSession({
  learnerId,
  subject,
  apiClient,
  onComplete,
}: AdaptiveLearningSessionProps) {
  const [session, setSession] = useState<any>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [tutorMessages, setTutorMessages] = useState<TutorMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [engagement, setEngagement] = useState(100);
  const [problemsSolved, setProblemsSolved] = useState(0);
  const [accuracy, setAccuracy] = useState(0);

  // Animation
  const tutorScale = new Animated.Value(1);
  const messageOpacity = new Animated.Value(0);

  useEffect(() => {
    initializeSession();
  }, []);

  useEffect(() => {
    // Animate tutor when messages change
    if (tutorMessages.length > 0) {
      Animated.sequence([
        Animated.timing(tutorScale, { toValue: 1.1, duration: 200, useNativeDriver: true }),
        Animated.timing(tutorScale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [tutorMessages.length]);

  const initializeSession = async () => {
    try {
      setIsLoading(true);

      // Try to get today's session
      const todaySession = await apiClient.getTodaySession(learnerId, subject);

      if (todaySession) {
        setSession(todaySession);
        setActivities(todaySession.activities || []);
        setCurrentActivity(todaySession.activities?.[0] || null);
      } else {
        // Start new session
        const newSession = await apiClient.startSession({
          learnerId,
          subject,
          plannedDuration: 30,
        });

        setSession(newSession);
        setActivities(newSession.activities || []);
        setCurrentActivity(newSession.activities?.[0] || null);
      }

      addTutorMessage(
        "Hi! I'm so excited to learn with you today! Let's get started! 🎉",
        'excited'
      );
    } catch (error) {
      console.error('Error initializing session:', error);
      Alert.alert('Error', 'Failed to start learning session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addTutorMessage = (
    text: string,
    mood: 'encouraging' | 'excited' | 'supportive' | 'celebrating'
  ) => {
    const message: TutorMessage = {
      id: `${Date.now()}_${Math.random()}`,
      text,
      mood,
      timestamp: Date.now(),
    };

    setTutorMessages((prev) => [...prev.slice(-2), message]); // Keep last 3 messages
    messageOpacity.setValue(0);
  };

  const handleActivityComplete = async (isCorrect: boolean) => {
    if (!currentActivity || !session) return;

    try {
      // Update activity status
      await apiClient.updateActivityStatus(
        session.id,
        currentActivity.id,
        'completed'
      );

      // Update local stats
      setProblemsSolved((prev) => prev + 1);
      setAccuracy((prev) => {
        const total = problemsSolved + 1;
        const correct = prev * problemsSolved + (isCorrect ? 1 : 0);
        return correct / total;
      });

      // Process with agent
      const agentResponse = await apiClient.processAgentInteraction({
        learnerId,
        agentType: 'PERSONALIZED_LEARNING',
        action: 'analyze_interaction',
        input: {
          activityId: currentActivity.id,
          isCorrect,
          subject,
          difficulty: currentActivity.difficulty,
        },
      });

      // Handle agent recommendations
      if (agentResponse.recommendations) {
        if (agentResponse.recommendations.suggestBreak) {
          setEngagement(60);
          addTutorMessage(
            "You're doing great! Let's take a quick brain break. 🧠",
            'supportive'
          );
        } else if (agentResponse.recommendations.increaseDifficulty) {
          addTutorMessage(
            "Wow! You're on fire! 🔥 Let's try something a bit more challenging!",
            'celebrating'
          );
        } else if (agentResponse.recommendations.decreaseDifficulty) {
          addTutorMessage(
            "Let's try a different approach. You've got this! 💪",
            'encouraging'
          );
        }
      }

      // Move to next activity
      const nextIndex = activities.findIndex((a) => a.id === currentActivity.id) + 1;
      if (nextIndex < activities.length) {
        setCurrentActivity(activities[nextIndex]);
        if (isCorrect) {
          addTutorMessage('Great job! Keep up the excellent work! ⭐', 'celebrating');
        } else {
          addTutorMessage("That's okay! Learning happens through practice. 😊", 'supportive');
        }
      } else {
        // Session complete
        addTutorMessage(
          'Amazing work today! You completed all activities! 🎉',
          'celebrating'
        );
        onComplete?.();
      }
    } catch (error) {
      console.error('Error completing activity:', error);
      Alert.alert('Error', 'Failed to process activity. Please try again.');
    }
  };

  const requestHint = async () => {
    if (!currentActivity) return;

    try {
      const agentResponse = await apiClient.processAgentInteraction({
        learnerId,
        agentType: 'AI_TUTOR',
        action: 'provide_feedback',
        input: {
          activityId: currentActivity.id,
          requestType: 'hint',
        },
      });

      if (agentResponse.hint) {
        addTutorMessage(agentResponse.hint, 'supportive');
      }
    } catch (error) {
      console.error('Error requesting hint:', error);
      addTutorMessage(
        'Think about what we learned before. You can do this! 💭',
        'encouraging'
      );
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'encouraging':
        return '💪';
      case 'excited':
        return '🎉';
      case 'celebrating':
        return '✨';
      case 'supportive':
        return '🤗';
      default:
        return '😊';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Preparing your learning session...</Text>
      </View>
    );
  }

  if (!currentActivity) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No activities available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Virtual Tutor */}
      <View style={styles.tutorContainer}>
        <Animated.View
          style={[
            styles.tutorAvatar,
            { transform: [{ scale: tutorScale }] },
          ]}
        >
          <Text style={styles.tutorEmoji}>🤖</Text>
        </Animated.View>

        <View style={styles.tutorInfo}>
          <Text style={styles.tutorName}>Your AI Tutor</Text>
          <View style={styles.engagementBar}>
            <View style={[styles.engagementFill, { width: `${engagement}%` }]} />
          </View>
          <Text style={styles.engagementText}>Energy: {engagement}%</Text>
        </View>
      </View>

      {/* Tutor Messages */}
      {tutorMessages.length > 0 && (
        <Animated.View style={[styles.messageContainer, { opacity: messageOpacity }]}>
          {tutorMessages.slice(-1).map((message) => (
            <View key={message.id} style={styles.messageBubble}>
              <Text style={styles.messageEmoji}>{getMoodEmoji(message.mood)}</Text>
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          ))}
        </Animated.View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{problemsSolved}</Text>
          <Text style={styles.statLabel}>Solved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round(accuracy * 100)}%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {activities.findIndex((a) => a.id === currentActivity.id) + 1}/{activities.length}
          </Text>
          <Text style={styles.statLabel}>Progress</Text>
        </View>
      </View>

      {/* Current Activity */}
      <View style={styles.activityCard}>
        <Text style={styles.activityType}>{currentActivity.type}</Text>
        <Text style={styles.activityContent}>
          {JSON.stringify(currentActivity.content)}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.hintButton} onPress={requestHint}>
            <Text style={styles.hintButtonText}>💡 Hint</Text>
          </TouchableOpacity>

          <View style={styles.answerButtons}>
            <TouchableOpacity
              style={styles.incorrectButton}
              onPress={() => handleActivityComplete(false)}
            >
              <Text style={styles.answerButtonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.correctButton}
              onPress={() => handleActivityComplete(true)}
            >
              <Text style={styles.answerButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  tutorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tutorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tutorEmoji: {
    fontSize: 32,
  },
  tutorInfo: {
    flex: 1,
  },
  tutorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  engagementBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  engagementFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  engagementText: {
    fontSize: 12,
    color: '#6b7280',
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  messageEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityType: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
    marginBottom: 12,
  },
  activityContent: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
    marginBottom: 24,
  },
  actionButtons: {
    gap: 12,
  },
  hintButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  hintButtonText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  answerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  incorrectButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    alignItems: 'center',
  },
  correctButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#10b981',
    borderRadius: 8,
    alignItems: 'center',
  },
  answerButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});
