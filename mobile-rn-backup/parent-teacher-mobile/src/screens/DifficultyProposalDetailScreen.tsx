import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { NativeThemeProviderByGrade, AivoCard, AivoTitle, AivoBody, AivoButton } from "@aivo/ui/native";
import { useAuth } from "../AuthContext";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "DifficultyProposalDetail">;

type ProposalData = {
  id: string;
  subject: string;
  fromAssessedGradeLevel: number;
  toAssessedGradeLevel: number;
  direction: "easier" | "harder";
  rationale: string;
  createdBy: "system" | "teacher" | "parent";
  createdAt: string;
  status: "pending" | "approved" | "rejected";
};

export default function DifficultyProposalDetailScreen({ route, navigation }: Props) {
  const { proposalId, learnerId } = route.params;
  const { apiClient } = useAuth();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadProposal();
  }, [proposalId]);

  async function loadProposal() {
    setLoadingData(true);
    setError(null);
    try {
      const res = await apiClient.listDifficultyProposals(learnerId);
      const found = res.proposals.find((p: any) => p.id === proposalId);
      if (!found) {
        throw new Error("Proposal not found");
      }
      setProposal(found as ProposalData);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingData(false);
    }
  }

  async function handleDecision(decision: "approve" | "reject") {
    setLoading(true);
    setError(null);
    try {
      await apiClient.respondToDifficultyProposal({ proposalId, decision });
      navigation.goBack();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (loadingData || !proposal) {
    return (
      <NativeThemeProviderByGrade gradeBand="9_12">
        <View style={styles.root}>
          <View style={[styles.scroll, { justifyContent: "center", alignItems: "center" }]}>
            <Text style={{ color: "#cbd5f5", fontSize: 14 }}>Loading proposal details...</Text>
          </View>
        </View>
      </NativeThemeProviderByGrade>
    );
  }

  const isHarder = proposal.direction === "harder";
  const directionColor = isHarder ? "#10b981" : "#f59e0b";
  const directionLabel = isHarder ? "Increase Difficulty" : "Decrease Difficulty";

  return (
    <NativeThemeProviderByGrade gradeBand="9_12">
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <AivoCard>
            <View style={styles.header}>
              <Pressable onPress={() => navigation.goBack()}>
                <Text style={styles.backButton}>← Back</Text>
              </Pressable>
            </View>

            <View style={styles.badge}>
              <Text style={[styles.badgeText, { color: directionColor }]}>
                {proposal.subject.toUpperCase()}
              </Text>
            </View>

            <AivoTitle>{directionLabel}</AivoTitle>

            <View style={styles.changeCard}>
              <View style={styles.changeRow}>
                <View style={styles.changeItem}>
                  <Text style={styles.changeLabel}>Current Level</Text>
                  <Text style={styles.changeValue}>Grade {proposal.fromAssessedGradeLevel}</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
                <View style={styles.changeItem}>
                  <Text style={styles.changeLabel}>Proposed Level</Text>
                  <Text style={styles.changeValue}>Grade {proposal.toAssessedGradeLevel}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Why this change?</Text>
              <AivoBody>{proposal.rationale}</AivoBody>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What this means</Text>
              {isHarder ? (
                <AivoBody>
                  Your learner has demonstrated strong mastery at their current level. This
                  adjustment will introduce slightly more challenging material while maintaining
                  appropriate scaffolding and support. AIVO will continue to monitor progress and
                  ensure the pace remains comfortable.
                </AivoBody>
              ) : (
                <AivoBody>
                  AIVO has noticed your learner might benefit from working with gentler material for
                  now. This adjustment will provide more time to build confidence and mastery before
                  progressing. The content will remain aligned with their enrolled grade, just
                  presented at a more accessible difficulty level.
                </AivoBody>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Created by</Text>
              <Text style={styles.metaText}>
                {proposal.createdBy === "system"
                  ? "AIVO's adaptive learning system"
                  : proposal.createdBy === "teacher"
                  ? "Teacher recommendation"
                  : "Parent request"}
              </Text>
              <Text style={styles.metaText}>
                {new Date(proposal.createdAt).toLocaleDateString()} at{" "}
                {new Date(proposal.createdAt).toLocaleTimeString()}
              </Text>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.actions}>
              <AivoButton
                label={loading ? "Approving..." : "Approve Change"}
                onPress={() => handleDecision("approve")}
                loading={loading}
              />
              <View style={{ height: 12 }} />
              <AivoButton
                label={loading ? "Rejecting..." : "Not Right Now"}
                onPress={() => handleDecision("reject")}
                loading={loading}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                You can always adjust difficulty settings later or discuss this with your learner's
                teacher.
              </Text>
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
  header: {
    marginBottom: 16
  },
  backButton: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "600"
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(15,23,42,0.96)",
    marginBottom: 12
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5
  },
  changeCard: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(15,23,42,0.96)",
    borderWidth: 1,
    borderColor: "#1f2937"
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around"
  },
  changeItem: {
    flex: 1,
    alignItems: "center"
  },
  changeLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  changeValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e5e7eb"
  },
  arrow: {
    fontSize: 24,
    color: "#9ca3af",
    marginHorizontal: 12
  },
  section: {
    marginTop: 20,
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 8
  },
  metaText: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2
  },
  error: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 12,
    color: "#fecaca",
    textAlign: "center"
  },
  actions: {
    marginTop: 24,
    marginBottom: 16
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#1f2937"
  },
  footerText: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 16
  }
});
