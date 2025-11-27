import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { NativeThemeProviderByGrade, AivoCard, AivoTitle, AivoBody } from "@aivo/ui/native";
import { useAuth } from "../AuthContext";
import type { CaregiverLearnerOverview, CaregiverSubjectView } from "@aivo/types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "LearnerProgress">;

export default function LearnerProgressScreen({ route, navigation }: Props) {
  const { learnerId } = route.params;
  const { apiClient } = useAuth();
  const [overview, setOverview] = useState<CaregiverLearnerOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadOverview();
  }, [learnerId]);

  async function loadOverview() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getCaregiverLearnerOverview(learnerId);
      setOverview(res.overview);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function getRecommendationColor(rec?: "easier" | "maintain" | "harder"): string {
    if (rec === "easier") return "#f59e0b";
    if (rec === "harder") return "#10b981";
    return "#64748b";
  }

  function getRecommendationLabel(rec?: "easier" | "maintain" | "harder"): string {
    if (rec === "easier") return "Consider easier material";
    if (rec === "harder") return "Ready for more challenge";
    return "Maintaining current pace";
  }

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

            <AivoTitle>Progress Overview</AivoTitle>
            {overview && (
              <AivoBody>
                Detailed insights for {overview.learner.displayName}
              </AivoBody>
            )}

            {error && <Text style={styles.error}>{error}</Text>}
            {loading && <Text style={styles.info}>Loading progress data…</Text>}

            {overview && (
              <>
                {/* Subject Performance */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Subject Performance</Text>
                  {overview.subjects.map((subject: CaregiverSubjectView) => (
                    <View key={subject.subject} style={styles.subjectCard}>
                      <View style={styles.subjectHeader}>
                        <Text style={styles.subjectName}>{subject.subject.toUpperCase()}</Text>
                        <View
                          style={[
                            styles.recommendationBadge,
                            {
                              backgroundColor: `${getRecommendationColor(
                                subject.difficultyRecommendation
                              )}20`
                            }
                          ]}
                        >
                          <Text
                            style={[
                              styles.recommendationText,
                              { color: getRecommendationColor(subject.difficultyRecommendation) }
                            ]}
                          >
                            {getRecommendationLabel(subject.difficultyRecommendation)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.subjectStats}>
                        <View style={styles.stat}>
                          <Text style={styles.statLabel}>Enrolled Grade</Text>
                          <Text style={styles.statValue}>{subject.enrolledGrade}</Text>
                        </View>
                        <View style={styles.stat}>
                          <Text style={styles.statLabel}>Working Level</Text>
                          <Text style={styles.statValue}>{subject.assessedGradeLevel}</Text>
                        </View>
                        <View style={styles.stat}>
                          <Text style={styles.statLabel}>Mastery</Text>
                          <Text style={styles.statValue}>
                            {Math.round(subject.masteryScore * 100)}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Baseline Summary */}
                {overview.lastBaselineSummary && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Baseline Assessment</Text>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoText}>{overview.lastBaselineSummary.notes}</Text>
                      <View style={styles.baselineList}>
                        {overview.lastBaselineSummary.subjectLevels.map((lvl) => (
                          <View key={lvl.subject} style={styles.baselineItem}>
                            <Text style={styles.baselineSubject}>
                              {lvl.subject.toUpperCase()}:
                            </Text>
                            <Text style={styles.baselineDetail}>
                              Enrolled Grade {lvl.enrolledGrade}, Working at Grade{" "}
                              {lvl.assessedGradeLevel}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                )}

                {/* Recent Activity */}
                {overview.recentSessionDates.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoText}>
                        Practice sessions in the last week:
                      </Text>
                      <View style={styles.dateList}>
                        {overview.recentSessionDates.map((date) => (
                          <Text key={date} style={styles.dateItem}>
                            • {new Date(date).toLocaleDateString()}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </View>
                )}

                {/* Brain Profile */}
                {overview.brainProfile && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Learning Profile</Text>
                    <View style={styles.infoCard}>
                      {overview.brainProfile.neurodiversity?.adhd && (
                        <Text style={styles.infoText}>
                          • Prefers low-stimulus, focused interface
                        </Text>
                      )}
                      {overview.brainProfile.preferences?.prefersStepByStep && (
                        <Text style={styles.infoText}>
                          • Benefits from step-by-step guidance
                        </Text>
                      )}
                      {overview.brainProfile.preferences?.prefersVisual && (
                        <Text style={styles.infoText}>
                          • Responds well to visual explanations
                        </Text>
                      )}
                      {!overview.brainProfile.neurodiversity?.adhd &&
                        !overview.brainProfile.preferences?.prefersStepByStep && (
                          <Text style={styles.infoText}>
                            Learning preferences are being established through ongoing sessions.
                          </Text>
                        )}
                    </View>
                  </View>
                )}
              </>
            )}
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
    padding: 24
  },
  header: {
    marginBottom: 16
  },
  backButton: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "600"
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
  section: {
    marginTop: 24
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 12
  },
  subjectCard: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(15,23,42,0.96)",
    borderWidth: 1,
    borderColor: "#1f2937"
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  subjectName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#e5e7eb",
    letterSpacing: 0.5
  },
  recommendationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  recommendationText: {
    fontSize: 10,
    fontWeight: "600"
  },
  subjectStats: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  stat: {
    flex: 1,
    alignItems: "center"
  },
  statLabel: {
    fontSize: 10,
    color: "#9ca3af",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e5e7eb"
  },
  infoCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(15,23,42,0.96)",
    borderWidth: 1,
    borderColor: "#1f2937"
  },
  infoText: {
    fontSize: 12,
    color: "#cbd5f5",
    lineHeight: 18,
    marginBottom: 4
  },
  baselineList: {
    marginTop: 12
  },
  baselineItem: {
    marginBottom: 6
  },
  baselineSubject: {
    fontSize: 11,
    fontWeight: "700",
    color: "#e5e7eb",
    marginBottom: 2
  },
  baselineDetail: {
    fontSize: 11,
    color: "#9ca3af"
  },
  dateList: {
    marginTop: 8
  },
  dateItem: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 3
  }
});
