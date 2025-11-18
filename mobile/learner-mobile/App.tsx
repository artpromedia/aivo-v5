import React from "react";
import { SafeAreaView, Text, View, Pressable, StyleSheet } from "react-native";
import { getGradeBand } from "@aivo/brain-model";

const gradeBand = getGradeBand(3);

export default function App() {
  const theme = getNativeTheme(gradeBand);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.badge, { backgroundColor: theme.badgeBg, color: theme.badgeText }]}>
          Calm Mode • K–5
        </Text>
        <Text style={[styles.title, { color: theme.accent }]}>Hi, let&apos;s learn gently.</Text>
        <Text style={[styles.body, { color: theme.text }]}>
          We&apos;ll move in small, clear steps. You can pause anytime and come back when you&apos;re
          ready.
        </Text>
        <Pressable style={[styles.button, { backgroundColor: theme.buttonBg }]}>
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>Start practice</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function getNativeTheme(gradeBand: ReturnType<typeof getGradeBand>) {
  if (gradeBand === "k_5") {
    return {
      background: "#FF7B5C",
      card: "rgba(255,255,255,0.96)",
      accent: "#FF636F",
      text: "#111827",
      badgeBg: "#FF636F",
      badgeText: "#FFFFFF",
      buttonBg: "#FF7B5C",
      buttonText: "#FFFFFF"
    };
  }
  // For brevity, reuse above for other bands; in production, customize
  return {
    background: "#020617",
    card: "rgba(15,23,42,0.96)",
    accent: "#FF636F",
    text: "#E5E7EB",
    badgeBg: "#FF636F",
    badgeText: "#FFFFFF",
    buttonBg: "#FF7B5C",
    buttonText: "#FFFFFF"
  };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8
  },
  body: {
    fontSize: 14,
    marginBottom: 16
  },
  button: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center"
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600"
  }
});
