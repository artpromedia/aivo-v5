import {DefaultTheme} from 'react-native-paper';

export const aivoTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#8B5CF6',
    secondary: '#EC4899',
    tertiary: '#10B981',
    background: '#FFFFFF',
    surface: '#F3F4F6',
    error: '#EF4444',
    text: '#1F2937',
    onSurface: '#6B7280',
    disabled: '#9CA3AF',
    placeholder: '#9CA3AF',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#EC4899',
  },
  roundness: 12,
};

export const colors = {
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  primaryLight: '#A78BFA',
  secondary: '#EC4899',
  secondaryDark: '#DB2777',
  secondaryLight: '#F9A8D4',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  background: '#FFFFFF',
  surface: '#F3F4F6',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  gradientStart: '#F3E8FF',
  gradientMid: '#FDF4FF',
  gradientEnd: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};
