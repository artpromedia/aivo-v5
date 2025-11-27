import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import DifficultyProposalDetailScreen from "./src/screens/DifficultyProposalDetailScreen";
import LearnerProgressScreen from "./src/screens/LearnerProgressScreen";
import type { DifficultyChangeProposal } from "@aivo/types";

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  DifficultyProposalDetail: {
    proposalId: string;
    learnerId: string;
  };
  LearnerProgress: {
    learnerId: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { state } = useAuth();
  const isLoggedIn = !!state.user;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="DifficultyProposalDetail" component={DifficultyProposalDetailScreen} />
            <Stack.Screen name="LearnerProgress" component={LearnerProgressScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
