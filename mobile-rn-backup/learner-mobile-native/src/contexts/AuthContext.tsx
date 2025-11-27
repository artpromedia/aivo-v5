import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {MMKV} from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {User} from '../types';
import AivoAPI from '../services/api/aivoApi';

const storage = new MMKV();

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const storedToken = storage.getString('authToken');
      const storedUser = await AsyncStorage.getItem('user');
      const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }

      if (onboardingComplete === 'true') {
        setHasCompletedOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await AivoAPI.login(email, password);
      setUser(response.user);
      setToken(response.access_token);
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const signUp = async (data: any) => {
    try {
      await AivoAPI.signup(data);
      // Auto sign in after signup
      await signIn(data.email, data.password);
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      storage.delete('authToken');
      storage.delete('refreshToken');
      await AsyncStorage.removeItem('user');
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboardingComplete', 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        hasCompletedOnboarding,
        isLoading,
        signIn,
        signUp,
        signOut,
        completeOnboarding,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
