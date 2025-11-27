import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ProgressBar} from 'react-native-paper';
import Voice from '@react-native-voice/voice';

import {useAssessment} from '../../hooks/useAssessment';
import {useVirtualBrain} from '../../hooks/useVirtualBrain';
import AssessmentQuestion from '../../components/assessment/AssessmentQuestion';
import DiagnosisSelector from '../../components/assessment/DiagnosisSelector';
import SkillLevelIndicator from '../../components/assessment/SkillLevelIndicator';
import {assessmentApi} from '../../services/api/assessmentApi';

interface BaselineAssessmentProps {
  route: {
    params: {
      learnerId: string;
      isInitial?: boolean;
    };
  };
  navigation: any;
}

const BaselineAssessmentScreen: React.FC<BaselineAssessmentProps> = ({
  route,
  navigation,
}) => {
  const {learnerId, isInitial = false} = route.params;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Assessment state
  const [currentPhase, setCurrentPhase] = useState<
    'profile' | 'cognitive' | 'academic' | 'adaptive' | 'complete'
  >('profile');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Voice recognition for accessibility
  const [isListening, setIsListening] = useState(false);
  const [voiceResponse, setVoiceResponse] = useState('');
  
  // Virtual Brain integration
  const {initializeVirtualBrain, cloneModel} = useVirtualBrain(learnerId);
  
  // Assessment phases configuration
  const assessmentPhases = {
    profile: {
      title: 'Learning Profile',
      questions: [
        {
          id: 'learning_style',
          type: 'multiple_choice',
          question: 'How do you learn best?',
          options: [
            {value: 'visual', label: 'By seeing pictures and diagrams', icon: 'eye'},
            {value: 'auditory', label: 'By listening and discussing', icon: 'ear'},
            {value: 'kinesthetic', label: 'By doing and practicing', icon: 'hand-right'},
            {value: 'reading', label: 'By reading and writing', icon: 'book-open'},
          ],
        },
        {
          id: 'diagnoses',
          type: 'multi_select',
          question: 'Do any of these apply to you?',
          options: [
            {value: 'adhd', label: 'ADHD', description: 'Attention challenges'},
            {value: 'autism', label: 'Autism', description: 'Social & sensory differences'},
            {value: 'dyslexia', label: 'Dyslexia', description: 'Reading challenges'},
            {value: 'anxiety', label: 'Anxiety', description: 'Worry or stress'},
            {value: 'none', label: 'None of these', description: 'Typical learning'},
          ],
        },
        {
          id: 'interests',
          type: 'tag_selection',
          question: 'What are you interested in?',
          options: [
            'Science', 'Math', 'Reading', 'Art', 'Music', 'Sports',
            'Video Games', 'Animals', 'Space', 'Coding', 'History',
          ],
        },
      ],
    },
    cognitive: {
      title: 'Cognitive Skills',
      questions: [
        {
          id: 'working_memory',
          type: 'interactive',
          question: 'Remember this sequence',
          task: 'memory_sequence',
          difficulty_adaptive: true,
        },
        {
          id: 'processing_speed',
          type: 'timed',
          question: 'Match the patterns quickly',
          task: 'pattern_matching',
          time_limit: 60,
        },
        {
          id: 'attention_span',
          type: 'sustained',
          question: 'Focus on the moving target',
          task: 'attention_tracking',
          duration: 120,
        },
      ],
    },
    academic: {
      title: 'Academic Skills',
      questions: [
        {
          id: 'reading_level',
          type: 'passage',
          question: 'Read this story and answer questions',
          adaptive: true,
          starting_level: 'grade_appropriate',
        },
        {
          id: 'math_level',
          type: 'problem_solving',
          question: 'Solve these math problems',
          adaptive: true,
          domains: ['arithmetic', 'algebra', 'geometry'],
        },
        {
          id: 'writing_ability',
          type: 'composition',
          question: 'Write a short paragraph about your favorite activity',
          voice_input_allowed: true,
        },
      ],
    },
    adaptive: {
      title: 'Adaptive Testing',
      dynamic: true,
      questions: [],
    },
  };

  useEffect(() => {
    // Initialize voice recognition
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Load assessment configuration
    loadAssessmentConfiguration();
    
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const loadAssessmentConfiguration = async () => {
    try {
      setIsProcessing(true);
      const config = await assessmentApi.getBaselineConfiguration(learnerId);
      setAssessmentData(config);
      setIsProcessing(false);
    } catch (error) {
      console.error('Failed to load assessment configuration:', error);
      setIsProcessing(false);
    }
  };

  const onSpeechResults = (e: any) => {
    setVoiceResponse(e.value[0]);
    setIsListening(false);
  };

  const onSpeechError = (e: any) => {
    console.error('Voice recognition error:', e);
    setIsListening(false);
  };

  const startListening = async () => {
    try {
      setIsListening(true);
      await Voice.start('en-US');
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      setIsListening(false);
    }
  };

  const handleQuestionResponse = async (response: any) => {
    const newResponses = [...responses, {
      phase: currentPhase,
      questionId: assessmentPhases[currentPhase].questions[currentQuestionIndex].id,
      response,
      timestamp: new Date().toISOString(),
    }];
    setResponses(newResponses);

    if (assessmentPhases[currentPhase].questions[currentQuestionIndex].difficulty_adaptive) {
      await adjustDifficulty(response);
    }

    const currentPhaseQuestions = assessmentPhases[currentPhase].questions;
    if (currentQuestionIndex < currentPhaseQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      await completePhase();
    }
  };

  const adjustDifficulty = async (response: any) => {
    try {
      await assessmentApi.calculateDifficultyAdjustment({
        learnerId,
        currentPhase,
        response,
      });
    } catch (error) {
      console.error('Failed to adjust difficulty:', error);
    }
  };

  const completePhase = async () => {
    setIsProcessing(true);

    try {
      await assessmentApi.completePhase({
        learnerId,
        phase: currentPhase,
        responses: responses.filter(r => r.phase === currentPhase),
      });

      if (currentPhase === 'profile') {
        setCurrentPhase('cognitive');
      } else if (currentPhase === 'cognitive') {
        setCurrentPhase('academic');
      } else if (currentPhase === 'academic') {
        await generateAdaptiveQuestions();
        setCurrentPhase('adaptive');
      } else if (currentPhase === 'adaptive') {
        await completeAssessment();
      }

      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error('Failed to complete phase:', error);
      Alert.alert('Error', 'Failed to save progress. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAdaptiveQuestions = async () => {
    const adaptiveQuestions = await assessmentApi.generateAdaptiveQuestions({
      learnerId,
      previousResponses: responses,
      targetSkills: identifyWeakAreas(responses),
    });

    assessmentPhases.adaptive = {
      ...assessmentPhases.adaptive,
      questions: adaptiveQuestions,
    };
  };

  const identifyWeakAreas = (responses: any[]) => {
    return [];
  };

  const completeAssessment = async () => {
    setIsProcessing(true);

    try {
      const result = await assessmentApi.submitBaselineAssessment({
        learnerId,
        responses,
        duration: calculateDuration(),
      });

      await initializeVirtualBrainWithResults(result);

      navigation.navigate('AssessmentResults', {
        learnerId,
        assessmentId: result.id,
        results: result,
      });
    } catch (error) {
      console.error('Failed to complete assessment:', error);
      Alert.alert('Error', 'Failed to complete assessment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const initializeVirtualBrainWithResults = async (assessmentResult: any) => {
    await initializeVirtualBrain({
      profile: {
        learningStyle: assessmentResult.learning_style,
        diagnoses: assessmentResult.diagnoses,
        interests: assessmentResult.interests,
        cognitiveProfile: assessmentResult.cognitive_profile,
        academicLevels: assessmentResult.academic_levels,
      },
      adaptations: assessmentResult.recommended_adaptations,
      initialDifficulty: assessmentResult.starting_difficulty,
    });

    if (assessmentResult.similar_profiles_exist) {
      await handleModelCloning(assessmentResult);
    }
  };

  const handleModelCloning = async (assessmentResult: any) => {
    const similarProfile = assessmentResult.similar_profile;
    
    if (similarProfile && similarProfile.can_clone) {
      Alert.alert(
        'Similar Learner Found',
        'We found a similar learner profile. Would you like to use it as a starting point?',
        [
          {text: 'No, Start Fresh', style: 'cancel'},
          {
            text: 'Yes, Use Similar Profile',
            onPress: async () => {
              await cloneModel(similarProfile.source_learner_id);
            },
          },
        ]
      );
    }
  };

  const calculateDuration = () => {
    if (responses.length > 0) {
      const start = new Date(responses[0].timestamp);
      const end = new Date(responses[responses.length - 1].timestamp);
      return Math.round((end.getTime() - start.getTime()) / 1000 / 60);
    }
    return 0;
  };

  const getCurrentQuestion = () => {
    if (assessmentPhases[currentPhase]?.questions) {
      return assessmentPhases[currentPhase].questions[currentQuestionIndex];
    }
    return null;
  };

  const getProgress = () => {
    const totalPhases = 4;
    const phaseIndex = ['profile', 'cognitive', 'academic', 'adaptive'].indexOf(currentPhase);
    const phaseProgress = currentQuestionIndex / (assessmentPhases[currentPhase]?.questions?.length || 1);
    return (phaseIndex + phaseProgress) / totalPhases;
  };

  return (
    <LinearGradient
      colors={['#F3E8FF', '#FDF4FF', '#FFFFFF']}
      style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#6B7280" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {isInitial ? 'Welcome Assessment' : 'Progress Check'}
        </Text>
        
        <TouchableOpacity onPress={() => {
          Alert.alert(
            'Exit Assessment?',
            'Your progress will be saved.',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Exit', onPress: () => navigation.goBack()},
            ]
          );
        }}>
          <Icon name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.phaseTitle}>
          {assessmentPhases[currentPhase]?.title}
        </Text>
        <ProgressBar
          progress={getProgress()}
          color="#8B5CF6"
          style={styles.progressBar}
        />
        <Text style={styles.progressText}>
          {Math.round(getProgress() * 100)}% Complete
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <Animated.View style={{opacity: fadeAnim}}>
          {isProcessing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loadingText}>
                Processing your responses...
              </Text>
            </View>
          ) : (
            <>
              {getCurrentQuestion() && (
                <AssessmentQuestion
                  question={getCurrentQuestion()}
                  onResponse={handleQuestionResponse}
                  voiceEnabled={true}
                  onVoiceStart={startListening}
                  isListening={isListening}
                  voiceResponse={voiceResponse}
                />
              )}

              {currentPhase === 'profile' && getCurrentQuestion()?.id === 'diagnoses' && (
                <DiagnosisSelector
                  onSelect={(diagnoses) => handleQuestionResponse(diagnoses)}
                />
              )}

              {currentPhase === 'cognitive' && (
                <View style={styles.instructionBox}>
                  <Icon name="information" size={20} color="#8B5CF6" />
                  <Text style={styles.instructionText}>
                    These activities help us understand how you think and learn best.
                    Take your time and do your best!
                  </Text>
                </View>
              )}

              {currentPhase === 'academic' && (
                <SkillLevelIndicator
                  currentSkill={getCurrentQuestion()?.id}
                  estimatedLevel={assessmentData?.estimated_levels?.[getCurrentQuestion()?.id]}
                />
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>

      {!isProcessing && (
        <View style={styles.navigationButtons}>
          {currentQuestionIndex > 0 && (
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}>
              <Icon name="chevron-left" size={20} color="#6B7280" />
              <Text style={styles.prevButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.navButton, styles.skipButton]}
            onPress={() => handleQuestionResponse(null)}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {fontSize: 18, fontWeight: '600', color: '#1F2937'},
  progressContainer: {paddingHorizontal: 20, paddingBottom: 20},
  phaseTitle: {fontSize: 16, fontWeight: '600', color: '#8B5CF6', marginBottom: 8},
  progressBar: {height: 8, borderRadius: 4, marginBottom: 8},
  progressText: {fontSize: 12, color: '#6B7280'},
  content: {flex: 1, paddingHorizontal: 20},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {marginTop: 16, fontSize: 16, color: '#6B7280'},
  instructionBox: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
  },
  instructionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  prevButton: {backgroundColor: '#F3F4F6'},
  prevButtonText: {marginLeft: 4, fontSize: 16, color: '#6B7280'},
  skipButton: {backgroundColor: '#FEE2E2'},
  skipButtonText: {fontSize: 16, color: '#EF4444'},
});

export default BaselineAssessmentScreen;
