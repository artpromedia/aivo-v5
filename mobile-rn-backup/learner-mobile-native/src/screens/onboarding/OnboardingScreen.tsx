import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../contexts/AuthContext';

const OnboardingScreen: React.FC = () => {
  const {completeOnboarding} = useAuth();
  const navigation = useNavigation();

  const handleComplete = async () => {
    await completeOnboarding();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to AIVO Learning</Text>
      <Text style={styles.subtitle}>
        Your personalized AI-powered learning companion
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleComplete}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
