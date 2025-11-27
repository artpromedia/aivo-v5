import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import Sound from 'react-native-sound';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import aivoApi from '../../services/api/aivoApi';

interface SpeechTherapyScreenProps {
  route: any;
  navigation: any;
}

const SpeechTherapyScreen: React.FC<SpeechTherapyScreenProps> = ({route, navigation}) => {
  const {learnerId} = route.params;
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [exercise, setExercise] = useState<any>(null);

  useEffect(() => {
    loadExercise();
    setupVoiceRecognition();
    
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const loadExercise = async () => {
    try {
      // Mock exercise data for now
      setExercise({
        id: 'ex1',
        title: 'Practice /r/ sounds',
        target_phrase: 'The red rabbit runs rapidly.',
        target_audio: null,
      });
    } catch (error) {
      console.error('Failed to load exercise:', error);
    }
  };

  const setupVoiceRecognition = () => {
    Voice.onSpeechStart = () => console.log('Speech started');
    Voice.onSpeechEnd = () => setIsRecording(false);
    Voice.onSpeechResults = async (e: any) => {
      const text = e.value[0];
      setTranscript(text);
      await analyzeSpeech(text);
    };
    Voice.onSpeechError = (e: any) => {
      console.error('Speech error:', e);
      Alert.alert('Error', 'Failed to recognize speech');
    };
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setTranscript('');
      await Voice.start('en-US');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await Voice.stop();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const analyzeSpeech = async (text: string) => {
    try {
      // Mock analysis for now
      setAnalysis({
        articulation: {score: 85},
        fluency: {score: 78},
        pronunciation: {score: 90},
        feedback: [
          {type: 'success', message: 'Great pronunciation of /r/ sounds!'},
          {type: 'improvement', message: 'Try to speak a bit slower for better clarity.'},
        ],
      });
    } catch (error) {
      console.error('Speech analysis failed:', error);
    }
  };

  const playTargetSound = () => {
    Alert.alert('Info', 'Audio playback feature coming soon');
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {exercise && (
          <View style={styles.exerciseCard}>
            <Text style={styles.exerciseTitle}>{exercise.title}</Text>
            <Text style={styles.targetText}>{exercise.target_phrase}</Text>
            
            <TouchableOpacity style={styles.playButton} onPress={playTargetSound}>
              <Icon name="volume-high" size={24} color="#8B5CF6" />
              <Text style={styles.playButtonText}>Listen to Example</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.recordingSection}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={isRecording ? stopRecording : startRecording}>
            <Icon name={isRecording ? 'stop' : 'microphone'} size={32} color="#FFFFFF" />
          </TouchableOpacity>
          
          {isRecording && (
            <Text style={styles.recordingText}>Recording...</Text>
          )}
        </View>

        {transcript !== '' && (
          <View style={styles.transcriptCard}>
            <Text style={styles.transcriptLabel}>What we heard:</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        )}

        {analysis && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>Speech Analysis</Text>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Articulation:</Text>
              <Text style={styles.metricValue}>{analysis.articulation?.score}%</Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Fluency:</Text>
              <Text style={styles.metricValue}>{analysis.fluency?.score}%</Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Pronunciation:</Text>
              <Text style={styles.metricValue}>{analysis.pronunciation?.score}%</Text>
            </View>
            
            <View style={styles.feedbackSection}>
              <Text style={styles.feedbackTitle}>Feedback:</Text>
              {analysis.feedback?.map((item: any, index: number) => (
                <View key={index} style={styles.feedbackItem}>
                  <Icon 
                    name={item.type === 'success' ? 'check-circle' : 'alert-circle'} 
                    size={20} 
                    color={item.type === 'success' ? '#10B981' : '#F59E0B'} 
                  />
                  <Text style={styles.feedbackText}>{item.message}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  targetText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 26,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  playButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  recordingSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  recordButtonActive: {
    backgroundColor: '#EF4444',
  },
  recordingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  transcriptCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transcriptLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  analysisCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  metricLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  feedbackSection: {
    marginTop: 20,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  feedbackText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default SpeechTherapyScreen;
