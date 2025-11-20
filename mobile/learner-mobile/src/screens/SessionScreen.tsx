import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { NativeThemeProviderByGrade, AivoCard, AivoTitle, AivoBody, AivoButton } from "@aivo/ui/native";
import { useAuth } from "../AuthContext";
import type { LearnerSession, SessionActivity } from "@aivo/types";

const MOCK_LEARNER_ID = "demo-learner";
const MOCK_SUBJECT = "math";

export default function SessionScreen() {
  const { apiClient, logout } = useAuth();
  const [session, setSession] = useState<LearnerSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBreak, setShowBreak] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadSession();
  }, []);

  async function loadSession() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getTodaySession(MOCK_LEARNER_ID, MOCK_SUBJECT);
      setSession(res.session);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function startSession() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.startSession({
        learnerId: MOCK_LEARNER_ID,
        subject: MOCK_SUBJECT
      });
      setSession(res.session);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function updateActivity(activity: SessionActivity, status: "in_progress" | "completed") {
    if (!session) return;
    setUpdatingId(activity.id);
    setError(null);
    try {
      const res = await apiClient.updateActivityStatus({
        sessionId: session.id,
        activityId: activity.id,
        status
      });
      setSession(res.session);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUpdatingId(null);
    }
  }

  const gradeBand: any = "6_8"; // TODO: derive from learner brain profile

  return (
    <NativeThemeProviderByGrade gradeBand={gradeBand}>
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <AivoCard>
            <View style={styles.headerRow}>
              <View>
                <AivoTitle>Today&apos;s calm session</AivoTitle>
                <AivoBody>
                  We&apos;ll move in small, gentle steps. You can pause anytime and come back later.
                </AivoBody>
              </View>
              <Pressable onPress={() => setShowBreak(true)}>
                <Text style={styles.breakLink}>I need a break</Text>
              </Pressable>
            </View>
            {showBreak && (
              <View style={styles.breakBox}>
                <Text style={styles.breakText}>
                  It&apos;s okay to pause. Take a breath, stretch, or get a drink. When you&apos;re ready,
                  come back and we&apos;ll continue where you left off.
                </Text>
                <Pressable onPress={() => setShowBreak(false)}>
                  <Text style={styles.breakDismiss}>Got it</Text>
                </Pressable>
              </View>
            )}
            {error && <Text style={styles.error}>{error}</Text>}
            {loading && <Text style={styles.info}>Loading session…</Text>}
            {!loading && !session && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.info}>
                  You don&apos;t have a session yet today. We&apos;ll create a short, calm plan just for
                  you.
                </Text>
                <View style={{ marginTop: 12 }}>
                  <AivoButton label="Start session" onPress={startSession} />
                </View>
              </View>
            )}
            {session && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.info}>
                  Planned time: {session.plannedMinutes} min • Status: {session.status}
                </Text>
                {session.activities.map((activity) => {
                  const statusLabel =
                    activity.status === "pending"
                      ? "Not started"
                      : activity.status === "in_progress"
                      ? "In progress"
                      : activity.status === "completed"
                      ? "Done"
                      : "Skipped";
                  return (
                    <View key={activity.id} style={styles.activityCard}>
                      <Text style={styles.activityType}>
                        {activity.type.replace("_", " ").toUpperCase()}
                      </Text>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityBody}>{activity.instructions}</Text>
                      <View style={styles.activityFooter}>
                        <Text style={styles.activityMeta}>
                          ~{activity.estimatedMinutes} min • {statusLabel}
                        </Text>
                        <View style={styles.activityButtons}>
                          {activity.status === "pending" && (
                            <AivoButton
                              label={updatingId === activity.id ? "Starting…" : "Start"}
                              onPress={() => updateActivity(activity, "in_progress")}
                              loading={updatingId === activity.id}
                            />
                          )}
                          {activity.status === "in_progress" && (
                            <AivoButton
                              label={updatingId === activity.id ? "Saving…" : "Mark done"}
                              onPress={() => updateActivity(activity, "completed")}
                              loading={updatingId === activity.id}
                            />
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
            <View style={styles.footerRow}>
              <Pressable onPress={logout}>
                <Text style={styles.logoutText}>Sign out</Text>
              </Pressable>
            </View>
          </AivoCard>
        </ScrollView>
      </View>
    </NativeThemeProviderByGrade>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020617"
  },
  scroll: {
    padding: 24,
    justifyContent: "center"
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8
  },
  breakLink: {
    fontSize: 12,
    color: "#e5e7eb",
    textDecorationLine: "underline"
  },
  breakBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(34,197,94,0.15)"
  },
  breakText: {
    fontSize: 12,
    color: "#bbf7d0"
  },
  breakDismiss: {
    marginTop: 4,
    fontSize: 12,
    color: "#bbf7d0",
    textDecorationLine: "underline"
  },
  info: {
    marginTop: 8,
    fontSize: 12,
    color: "#cbd5f5"
  },
  error: {
    marginTop: 8,
    fontSize: 12,
    color: "#fecaca"
  },
  activityCard: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(15,23,42,0.96)"
  },
  activityType: {
    fontSize: 10,
    color: "#9ca3af"
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e5e7eb",
    marginTop: 2
  },
  activityBody: {
    fontSize: 12,
    color: "#cbd5f5",
    marginTop: 4
  },
  activityFooter: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  activityMeta: {
    fontSize: 11,
    color: "#9ca3af"
  },
  activityButtons: {
    marginLeft: 8,
    flexShrink: 0
  },
  footerRow: {
    marginTop: 18,
    alignItems: "flex-end"
  },
  logoutText: {
    fontSize: 11,
    color: "#9ca3af",
    textDecorationLine: "underline"
  }
});
