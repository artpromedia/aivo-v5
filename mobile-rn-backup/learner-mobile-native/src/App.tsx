import React, {useEffect} from 'react';
import {StatusBar, LogBox} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider as PaperProvider} from 'react-native-paper';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import RootNavigator from './navigation/RootNavigator';
import {AuthProvider} from './contexts/AuthContext';
import {VirtualBrainProvider} from './contexts/VirtualBrainContext';
import {ThemeProvider} from './contexts/ThemeContext';
import {setupWebSocket} from './services/websocket/socketManager';
import {aivoTheme} from './theme/aivoTheme';

// Ignore specific warnings
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  useEffect(() => {
    // Initialize services
    setupWebSocket();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <PaperProvider theme={aivoTheme}>
            <ThemeProvider>
              <AuthProvider>
                <VirtualBrainProvider>
                  <NavigationContainer>
                    <StatusBar
                      barStyle="dark-content"
                      backgroundColor="#FFFFFF"
                    />
                    <RootNavigator />
                  </NavigationContainer>
                </VirtualBrainProvider>
              </AuthProvider>
            </ThemeProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
};

export default App;
