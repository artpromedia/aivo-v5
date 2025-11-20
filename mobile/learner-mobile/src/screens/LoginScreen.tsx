import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { NativeThemeProviderByGrade, AivoCard, AivoButton, AivoTitle, AivoBody } from "@aivo/ui/native";
import { useAuth } from "../AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("learner@example.com");
  const [password, setPassword] = useState("dev-password");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <NativeThemeProviderByGrade gradeBand="6_8">
      <KeyboardAvoidingView
        style={[styles.root]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <AivoCard>
          <AivoTitle>Welcome to AIVO</AivoTitle>
          <AivoBody>
            Sign in to start today&apos;s calm learning session. You can always pause and come back when
            you&apos;re ready.
          </AivoBody>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Password (dev)</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          <AivoButton label="Sign in" onPress={handleLogin} loading={loading} />
        </AivoCard>
      </KeyboardAvoidingView>
    </NativeThemeProviderByGrade>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020617"
  },
  field: {
    marginTop: 12,
    marginBottom: 4
  },
  label: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#1f2937",
    color: "#e5e7eb",
    fontSize: 13
  },
  error: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 12,
    color: "#fecaca"
  }
});
