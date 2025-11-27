import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { NativeThemeProviderByGrade, AivoCard, AivoTitle, AivoBody } from "@aivo/ui/native";
import { useAuth } from "../AuthContext";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import type { NotificationSummary, DifficultyChangeProposal } from "@aivo/types";

type Props = NativeStackScreenProps<RootStackParamList, "Dashboard">;

export default function DashboardScreen({ navigation }: Props) {
  const { apiClient, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);
  const [proposals, setProposals] = useState<DifficultyChangeProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const learnerId = "demo-learner";
      const [notifRes, proposalsRes] = await Promise.all([
        apiClient.listNotifications(),
        apiClient.listDifficultyProposals(learnerId)
      ]);
      setNotifications(notifRes.items);
      setProposals(proposalsRes.proposals);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleProposal(proposalId: string, decision: "approve" | "reject") {
    setUpdatingId(proposalId);
    setError(null);
    try {
      await apiClient.respondToDifficultyProposal({ proposalId, decision });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <NativeThemeProviderByGrade gradeBand="9_12">
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <AivoCard>
            <AivoTitle>Today&apos;s overview</AivoTitle>
            <AivoBody>
              Quick snapshot of notifications and difficulty approvals waiting for your guidance.
            </AivoBody>
            {error && <Text style={styles.error}>{error}</Text>}
            {loading && <Text style={styles.info}>Loading…</Text>}

            <Text style={styles.sectionTitle}>Notifications</Text>
            {notifications.length === 0 && !loading && (
              <Text style={styles.info}>No new notifications.</Text>
            )}
            {notifications.map((n) => (
              <View key={n.id} style={styles.notificationCard}>
                <Text style={styles.notificationTitle}>{n.title}</Text>
                <Text style={styles.notificationBody}>{n.body}</Text>
                <Text style={styles.notificationMeta}>{n.createdAtFriendly}</Text>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Difficulty approvals</Text>
            {proposals.length === 0 && !loading && (
              <Text style={styles.info}>No pending approvals. You&apos;re all caught up.</Text>
            )}
            {proposals.map((p) => (
              <Pressable
                key={p.id}
                style={styles.proposalCard}
                onPress={() =>
                  navigation.navigate("DifficultyProposalDetail", {
                    proposalId: p.id,
                    learnerId: p.learnerId
                  })
                }
              >
                <Text style={styles.notificationTitle}>{p.subject.toUpperCase()}</Text>
                <Text style={styles.notificationBody}>
                  {p.direction === "harder" ? "Increase" : "Ease"} difficulty from grade{" "}
                  {p.fromAssessedGradeLevel} to {p.toAssessedGradeLevel}.
                </Text>
                <Text style={styles.notificationMeta}>
                  {new Date(p.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.viewDetailText}>Tap to view details →</Text>
              </Pressable>
            ))}

            <View style={styles.footerRow}>
              <Pressable onPress={refresh}>
                <Text style={styles.link}>Refresh</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  navigation.navigate("LearnerProgress", { learnerId: "demo-learner" })
                }
              >
                <Text style={styles.link}>View Progress</Text>
              </Pressable>
              <Pressable onPress={logout}>
                <Text style={styles.link}>Sign out</Text>
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
  error: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 12,
    color: "#fecaca"
  },
  info: {
    marginTop: 8,
    fontSize: 12,
    color: "#cbd5f5"
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#e5e7eb"
  },
  notificationCard: {
    marginTop: 6,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(15,23,42,0.96)"
  },
  notificationTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#e5e7eb"
  },
  notificationBody: {
    fontSize: 12,
    color: "#cbd5f5",
    marginTop: 2
  },
  notificationMeta: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4
  },
  proposalCard: {
    marginTop: 6,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(15,23,42,0.96)"
  },
  proposalActions: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center"
  },
  footerRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  link: {
    fontSize: 11,
    color: "#9ca3af",
    textDecorationLine: "underline"
  },
  viewDetailText: {
    fontSize: 11,
    color: "#60a5fa",
    marginTop: 6,
    textAlign: "right",
    fontWeight: "600"
  }
});
