import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { useAuth } from '../../../shared/auth/AuthContext';
import { AivoMobileClient } from '@aivo/api-client/mobile-client';

interface ArticulationPracticeProps {
  learnerId: string;
  targetSound: string;
  level: 'isolation' | 'syllable' | 'word' | 'phrase' | 'sentence';
  apiClient: AivoMobileClient;
}

interface Feedback {
  accuracy: number;
  suggestions: string[];
}

const WORD_LISTS = {
  s: ['sun', 'see', 'sock', 'sand', 'sit', 'soup'],
  r: ['red', 'run', 'rock', 'rain', 'road', 'rose'],
  l: ['light', 'like', 'look', 'laugh', 'love', 'lion'],
  th: ['think', 'thank', 'thumb', 'three', 'throw', 'thief'],
};

export function ArticulationPractice({
  learnerId,
  targetSound,
  level,
  apiClient,
}: ArticulationPracticeProps) {
  const { token } = useAuth();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [progress, setProgress] = useState(0);

  const words = WORD_LISTS[targetSound as keyof typeof WORD_LISTS] || [];
  const currentWord = words[currentWordIndex];

  // Animation values
  const buttonScale = new Animated.Value(1);
  const feedbackOpacity = new Animated.Value(0);

  useEffect(() => {
    // Request audio permissions on mount
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();
  }, []);

  useEffect(() => {
    // Update progress
    setProgress((currentWordIndex / words.length) * 100);
  }, [currentWordIndex, words.length]);

  useEffect(() => {
    // Animate feedback when it changes
    if (feedback) {
      Animated.timing(feedbackOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [feedback]);

  const startRecording = async () => {
    try {
      setFeedback(null);
      feedbackOpacity.setValue(0);

      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      setRecording(recording);
      setIsRecording(true);

      // Animate button
      Animated.sequence([
        Animated.timing(buttonScale, { toValue: 1.1, duration: 200, useNativeDriver: true }),
        Animated.timing(buttonScale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        await analyzeAudio(uri);
      }

      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const analyzeAudio = async (uri: string) => {
    try {
      setIsAnalyzing(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('targetSound', targetSound);
      formData.append('targetWord', currentWord);
      formData.append('level', level);
      formData.append('learnerId', learnerId);

      const response = await apiClient.analyzeSpeech(formData);

      setFeedback({
        accuracy: response.accuracy,
        suggestions: response.suggestions || [],
      });
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Error', 'Failed to analyze speech. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const playExample = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: `https://example.com/audio/${targetSound}/${currentWord}.mp3` },
        { shouldPlay: true }
      );

      await sound.playAsync();

      // Unload sound after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Failed to play example:', error);
      // Fallback: use text-to-speech if available
      Alert.alert('Info', `Say the word: ${currentWord}`);
    }
  };

  const nextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setFeedback(null);
      feedbackOpacity.setValue(0);
    } else {
      Alert.alert('Great Job!', 'You completed all the words!', [
        { text: 'OK', onPress: () => setCurrentWordIndex(0) },
      ]);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.8) return '#10b981'; // green
    if (accuracy >= 0.6) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentWordIndex + 1} / {words.length}
        </Text>
      </View>

      {/* Target Word */}
      <View style={styles.wordCard}>
        <Text style={styles.soundLabel}>Target Sound: /{targetSound}/</Text>
        <Text style={styles.wordText}>{currentWord}</Text>
        <TouchableOpacity style={styles.playButton} onPress={playExample}>
          <Text style={styles.playButtonText}>▶ Play Example</Text>
        </TouchableOpacity>
      </View>

      {/* Record Button */}
      <View style={styles.recordSection}>
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isAnalyzing}
          >
            <Text style={styles.recordButtonText}>
              {isRecording ? '⏹ Stop Recording' : '🎤 Start Recording'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {isAnalyzing && <Text style={styles.analyzingText}>Analyzing...</Text>}
      </View>

      {/* Feedback */}
      {feedback && (
        <Animated.View style={[styles.feedbackCard, { opacity: feedbackOpacity }]}>
          <View style={styles.accuracyContainer}>
            <Text style={styles.feedbackLabel}>Accuracy</Text>
            <Text
              style={[
                styles.accuracyText,
                { color: getAccuracyColor(feedback.accuracy) },
              ]}
            >
              {Math.round(feedback.accuracy * 100)}%
            </Text>
          </View>

          {feedback.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsLabel}>Tips:</Text>
              {feedback.suggestions.map((suggestion, index) => (
                <Text key={index} style={styles.suggestionText}>
                  • {suggestion}
                </Text>
              ))}
            </View>
          )}

          {feedback.accuracy >= 0.7 && (
            <TouchableOpacity style={styles.nextButton} onPress={nextWord}>
              <Text style={styles.nextButtonText}>Next Word →</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
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
  progressContainer: {
    marginBottom: 24,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  wordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  soundLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  wordText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  playButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  recordSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  recordButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#ff636f',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  recordButtonActive: {
    backgroundColor: '#ef4444',
  },
  recordButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  analyzingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  feedbackCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  accuracyContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  feedbackLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  accuracyText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  nextButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#10b981',
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
