import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from '../shared/auth/AuthContext';
import { AivoMobileClient } from '@aivo/api-client/mobile-client';
import { ArticulationPractice } from './src/components/ArticulationPractice';
import { AdaptiveLearningSession } from './src/components/AdaptiveLearningSession';

const Stack = createNativeStackNavigator();

// API client configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function App() {
  const [apiClient, setApiClient] = React.useState<AivoMobileClient | null>(null);

  // Initialize API client with auth context
  const initializeApiClient = (getToken: () => Promise<string | null>) => {
    const client = new AivoMobileClient({
      baseUrl: API_BASE_URL,
      getToken,
      onTokenExpired: () => {
        // Handle token expiration (navigate to login, etc.)
        console.log('Token expired');
      },
    });
    setApiClient(client);
  };

  return (
    <AuthProvider apiBaseUrl={API_BASE_URL}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#8b5cf6',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'AIVO Learning' }}
          />
          <Stack.Screen
            name="SpeechPractice"
            options={{ title: 'Speech Practice' }}
          >
            {(props) =>
              apiClient ? (
                <ArticulationPractice
                  {...props}
                  learnerId="learner-123"
                  targetSound="s"
                  level="word"
                  apiClient={apiClient}
                />
              ) : null
            }
          </Stack.Screen>
          <Stack.Screen
            name="LearningSession"
            options={{ title: 'Learning Session' }}
          >
            {(props) =>
              apiClient ? (
                <AdaptiveLearningSession
                  {...props}
                  learnerId="learner-123"
                  subject="math"
                  apiClient={apiClient}
                />
              ) : null
            }
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

// Home screen with navigation options
function HomeScreen({ navigation }: any) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 32 }}>
        Welcome to AIVO Learning
      </Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('SpeechPractice')}
      >
        <Text style={styles.buttonText}>Speech Practice</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('LearningSession')}
      >
        <Text style={styles.buttonText}>Learning Session</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  button: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
};
