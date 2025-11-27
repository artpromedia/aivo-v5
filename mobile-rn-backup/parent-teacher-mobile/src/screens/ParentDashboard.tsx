import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { AivoMobileClient } from '@aivo/api-client/mobile-client';
import { useAuth } from '../../../shared/auth/AuthContext';

const { width } = Dimensions.get('window');

interface Learner {
  id: string;
  name: string;
  grade: number;
}

interface DashboardData {
  currentLevel: number;
  focusScore: number;
  lessonsCompleted: number;
  timeSpent: number;
  progressData: Array<{ date: string; score: number }>;
  domainScores: Array<{ domain: string; score: number }>;
  focusDistribution: Array<{ category: string; percentage: number }>;
  insights: Array<{ id: string; text: string; priority: string }>;
}

interface ApprovalRequest {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  proposedChange: any;
}

interface ParentDashboardProps {
  apiClient: AivoMobileClient;
}

export function ParentDashboard({ apiClient }: ParentDashboardProps) {
  const { user } = useAuth();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [approvalQueue, setApprovalQueue] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [selectedLearner]);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);

      // Mock learners - in production, fetch from API
      const mockLearners: Learner[] = [
        { id: '1', name: 'Emma Johnson', grade: 3 },
        { id: '2', name: 'Noah Smith', grade: 5 },
      ];
      setLearners(mockLearners);

      if (!selectedLearner && mockLearners.length > 0) {
        setSelectedLearner(mockLearners[0]);
      }

      if (selectedLearner) {
        // Fetch real dashboard data
        const overview = await apiClient.getCaregiverLearnerOverview(selectedLearner.id);
        setDashboardData(overview as any);

        // Fetch approval requests
        const notifications = await apiClient.listNotifications();
        const approvals = notifications.filter((n: any) => n.type === 'approval_request');
        setApprovalQueue(approvals as any);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboard();
    setIsRefreshing(false);
  };

  const handleApproval = async (requestId: string, approve: boolean) => {
    try {
      await apiClient.respondToDifficultyProposal(requestId, approve ? 'approve' : 'reject');
      
      // Remove from queue
      setApprovalQueue((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error) {
      console.error('Error handling approval:', error);
    }
  };

  const renderMetricCard = (title: string, value: string | number, icon: string) => (
    <View style={styles.metricCard}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
  );

  const renderProgressChart = () => {
    if (!dashboardData?.progressData) return null;

    const maxScore = Math.max(...dashboardData.progressData.map((d) => d.score));
    
    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Weekly Progress</Text>
        <View style={styles.chartContainer}>
          {dashboardData.progressData.map((data, index) => {
            const height = (data.score / maxScore) * 120;
            return (
              <View key={index} style={styles.barContainer}>
                <View style={[styles.bar, { height }]} />
                <Text style={styles.barLabel}>
                  {new Date(data.date).toLocaleDateString('en', { weekday: 'short' })}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderDomainScores = () => {
    if (!dashboardData?.domainScores) return null;

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Subject Performance</Text>
        <View style={styles.domainContainer}>
          {dashboardData.domainScores.map((domain, index) => (
            <View key={index} style={styles.domainRow}>
              <Text style={styles.domainLabel}>{domain.domain}</Text>
              <View style={styles.domainBarBackground}>
                <View
                  style={[
                    styles.domainBar,
                    { width: `${domain.score}%`, backgroundColor: getDomainColor(index) },
                  ]}
                />
              </View>
              <Text style={styles.domainScore}>{domain.score}%</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderApprovalQueue = () => {
    if (approvalQueue.length === 0) return null;

    return (
      <View style={styles.approvalCard}>
        <Text style={styles.approvalTitle}>Pending Approvals ({approvalQueue.length})</Text>
        {approvalQueue.map((request) => (
          <View key={request.id} style={styles.approvalItem}>
            <View style={styles.approvalInfo}>
              <Text style={styles.approvalType}>{request.type}</Text>
              <Text style={styles.approvalDescription}>{request.description}</Text>
              <Text style={styles.approvalTime}>
                {new Date(request.timestamp).toLocaleString()}
              </Text>
            </View>
            <View style={styles.approvalActions}>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleApproval(request.id, false)}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => handleApproval(request.id, true)}
              >
                <Text style={styles.approveButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderInsights = () => {
    if (!dashboardData?.insights || dashboardData.insights.length === 0) return null;

    return (
      <View style={styles.insightsCard}>
        <Text style={styles.insightsTitle}>AI Insights</Text>
        {dashboardData.insights.map((insight) => (
          <View key={insight.id} style={styles.insightItem}>
            <Text style={styles.insightIcon}>
              {insight.priority === 'high' ? '🔴' : insight.priority === 'medium' ? '🟡' : '🟢'}
            </Text>
            <Text style={styles.insightText}>{insight.text}</Text>
          </View>
        ))}
      </View>
    );
  };

  const getDomainColor = (index: number) => {
    const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
    >
      {/* Learner Selector */}
      <View style={styles.learnerSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {learners.map((learner) => (
            <TouchableOpacity
              key={learner.id}
              style={[
                styles.learnerChip,
                selectedLearner?.id === learner.id && styles.learnerChipActive,
              ]}
              onPress={() => setSelectedLearner(learner)}
            >
              <Text
                style={[
                  styles.learnerChipText,
                  selectedLearner?.id === learner.id && styles.learnerChipTextActive,
                ]}
              >
                {learner.name} (Grade {learner.grade})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {dashboardData && (
        <>
          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            {renderMetricCard('Current Level', dashboardData.currentLevel, '📊')}
            {renderMetricCard('Focus Score', `${dashboardData.focusScore}%`, '🎯')}
            {renderMetricCard('Lessons', dashboardData.lessonsCompleted, '📚')}
            {renderMetricCard('Time Spent', `${dashboardData.timeSpent}m`, '⏱️')}
          </View>

          {/* Progress Chart */}
          {renderProgressChart()}

          {/* Domain Scores */}
          {renderDomainScores()}

          {/* Approval Queue */}
          {renderApprovalQueue()}

          {/* AI Insights */}
          {renderInsights()}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  learnerSelector: {
    marginBottom: 16,
  },
  learnerChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  learnerChipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  learnerChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  learnerChipTextActive: {
    color: '#ffffff',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  metricCard: {
    width: (width - 48) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 32,
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  domainContainer: {
    gap: 12,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  domainLabel: {
    width: 80,
    fontSize: 14,
    color: '#1f2937',
  },
  domainBarBackground: {
    flex: 1,
    height: 24,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  domainBar: {
    height: '100%',
    borderRadius: 4,
  },
  domainScore: {
    width: 40,
    fontSize: 14,
    color: '#1f2937',
    textAlign: 'right',
  },
  approvalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  approvalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  approvalItem: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    marginTop: 12,
  },
  approvalInfo: {
    marginBottom: 12,
  },
  approvalType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  approvalDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  approvalTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#10b981',
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  insightsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  insightIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
});
