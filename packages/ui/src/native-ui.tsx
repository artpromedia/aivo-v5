import React from "react";
import { Text, View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import type { GradeBand } from "@aivo/types";

type NativeThemeTokens = {
  background: string;
  card: string;
  accent: string;
  text: string;
  buttonBg: string;
  buttonText: string;
};

const nativeThemes: Record<GradeBand, NativeThemeTokens> = {
  k_5: {
    background: "#FF7B5C",
    card: "rgba(255,255,255,0.96)",
    accent: "#FF636F",
    text: "#111827",
    buttonBg: "#FF7B5C",
    buttonText: "#FFFFFF"
  },
  "6_8": {
    background: "#020617",
    card: "rgba(15,23,42,0.96)",
    accent: "#FF636F",
    text: "#E5E7EB",
    buttonBg: "#FF7B5C",
    buttonText: "#FFFFFF"
  },
  "9_12": {
    background: "#020617",
    card: "rgba(15,23,42,0.96)",
    accent: "#8B5CF6",
    text: "#E5E7EB",
    buttonBg: "#FF7B5C",
    buttonText: "#FFFFFF"
  }
};

const NativeThemeContext = React.createContext<NativeThemeTokens>(nativeThemes["k_5"]);

export const NativeThemeProviderByGrade: React.FC<{
  gradeBand: GradeBand;
  children: React.ReactNode;
}> = ({ gradeBand, children }) => {
  return (
    <NativeThemeContext.Provider value={nativeThemes[gradeBand]}>
      {children}
    </NativeThemeContext.Provider>
  );
};

export function useNativeAivoTheme() {
  return React.useContext(NativeThemeContext);
}

export const AivoCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useNativeAivoTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card
        }
      ]}
    >
      {children}
    </View>
  );
};

export const AivoButton: React.FC<{
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}> = ({ label, onPress, disabled, loading }) => {
  const theme = useNativeAivoTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
  style={({ pressed }: { pressed: boolean }) => [
        styles.button,
        {
          backgroundColor: theme.buttonBg,
          opacity: disabled || loading ? 0.6 : pressed ? 0.8 : 1
        }
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.buttonText} />
      ) : (
        <Text style={[styles.buttonText, { color: theme.buttonText }]}>{label}</Text>
      )}
    </Pressable>
  );
};

export const AivoTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useNativeAivoTheme();
  return <Text style={[styles.title, { color: theme.accent }]}>{children}</Text>;
};

export const AivoBody: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useNativeAivoTheme();
  return <Text style={[styles.body, { color: theme.text }]}>{children}</Text>;
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6
  },
  button: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600"
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8
  },
  body: {
    fontSize: 14,
    marginBottom: 8
  }
});
