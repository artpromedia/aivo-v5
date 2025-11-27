import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from '../shared/auth/AuthContext';
import { AivoMobileClient } from '@aivo/api-client/mobile-client';
import { ParentDashboard } from './src/screens/ParentDashboard';

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
            options={{ title: 'AIVO Parent Portal' }}
          />
          <Stack.Screen
            name="Dashboard"
            options={{ title: 'Dashboard' }}
          >
            {(props) =>
              apiClient ? <ParentDashboard {...props} apiClient={apiClient} /> : null
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
        Welcome to AIVO Parent Portal
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Dashboard')}
      >
        <Text style={styles.buttonText}>View Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%' as const,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
});
