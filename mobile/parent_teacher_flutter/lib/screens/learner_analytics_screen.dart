import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:aivo_shared/aivo_shared.dart';

/// Analytics screen showing learner progress and difficulty explanations
class LearnerAnalyticsScreen extends StatefulWidget {
  final String? learnerId;

  const LearnerAnalyticsScreen({super.key, this.learnerId});

  @override
  State<LearnerAnalyticsScreen> createState() => _LearnerAnalyticsScreenState();
}

class _LearnerAnalyticsScreenState extends State<LearnerAnalyticsScreen> {
  final AivoApiClient _client = AivoApiClient();

  bool _loading = true;
  String? _error;
  LearnerAnalyticsOverview? _analytics;
  String? _learnerId;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final learnerId = widget.learnerId ?? 'demo-learner';
      _learnerId = learnerId;
      
      final analytics = await _client.getLearnerAnalytics(learnerId);
      setState(() {
        _analytics = analytics;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load analytics';
        _loading = false;
        // Use demo data for offline mode
        _analytics = _getDemoAnalytics();
      });
    }
  }

  LearnerAnalyticsOverview _getDemoAnalytics() {
    return LearnerAnalyticsOverview(
      learnerId: _learnerId ?? 'demo-learner',
      subjects: [
        LearnerSubjectProgressOverview(
          subject: 'math',
          enrolledGrade: 5,
          currentAssessedGradeLevel: 4,
          timeseries: [
            LearnerProgressTimeseriesPoint(
              date: DateTime(2025, 11, 1),
              masteryScore: 0.65,
              minutesPracticed: 45,
              difficultyLevel: 3,
            ),
            LearnerProgressTimeseriesPoint(
              date: DateTime(2025, 11, 8),
              masteryScore: 0.72,
              minutesPracticed: 52,
              difficultyLevel: 4,
            ),
            LearnerProgressTimeseriesPoint(
              date: DateTime(2025, 11, 15),
              masteryScore: 0.78,
              minutesPracticed: 38,
              difficultyLevel: 4,
            ),
            LearnerProgressTimeseriesPoint(
              date: DateTime(2025, 11, 22),
              masteryScore: 0.82,
              minutesPracticed: 60,
              difficultyLevel: 4,
            ),
          ],
        ),
        LearnerSubjectProgressOverview(
          subject: 'reading',
          enrolledGrade: 5,
          currentAssessedGradeLevel: 5,
          timeseries: [
            LearnerProgressTimeseriesPoint(
              date: DateTime(2025, 11, 1),
              masteryScore: 0.75,
              minutesPracticed: 30,
              difficultyLevel: 5,
            ),
            LearnerProgressTimeseriesPoint(
              date: DateTime(2025, 11, 15),
              masteryScore: 0.80,
              minutesPracticed: 35,
              difficultyLevel: 5,
            ),
          ],
        ),
      ],
      difficultySummaries: [
        ExplainableDifficultySummary(
          subject: 'math',
          currentDifficultyLevel: 4,
          targetDifficultyLevel: 5,
          rationale: 'Strong progress in recent sessions with consistent mastery improvement',
          factors: [
            ExplainableRecommendationFactor(
              label: 'Mastery Trend',
              description: 'Mastery has improved 17% over the last month',
              weight: 0.4,
            ),
            ExplainableRecommendationFactor(
              label: 'Practice Time',
              description: 'Consistent 40+ minutes of practice per week',
              weight: 0.3,
            ),
            ExplainableRecommendationFactor(
              label: 'Error Patterns',
              description: 'Fewer calculation errors in recent work',
              weight: 0.3,
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AivoTheme.backgroundGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildAppBar(),
              Expanded(
                child: _loading
                    ? _buildLoadingState()
                    : _buildContent(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(Icons.arrow_back_rounded, color: AivoTheme.textPrimary),
            ),
          ),
          const SizedBox(width: 16),
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Center(
              child: Text('📊', style: TextStyle(fontSize: 24)),
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Progress & Insights',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                Text(
                  'Understand your learner\'s journey',
                  style: TextStyle(
                    fontSize: 13,
                    color: AivoTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: _loadData,
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(Icons.refresh_rounded, color: AivoTheme.textMuted),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 50,
            height: 50,
            child: CircularProgressIndicator(
              strokeWidth: 4,
              valueColor: AlwaysStoppedAnimation<Color>(AivoTheme.primary),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Loading analytics...',
            style: TextStyle(
              color: AivoTheme.textMuted,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return RefreshIndicator(
      onRefresh: _loadData,
      color: AivoTheme.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Error message
            if (_error != null) _buildErrorBanner(),

            // Subject progress cards
            _buildSectionHeader('📈', 'Subject Progress'),
            const SizedBox(height: 12),
            ..._buildSubjectCards(),
            const SizedBox(height: 24),

            // Difficulty explanations
            _buildSectionHeader('🎯', 'Why These Difficulty Levels?'),
            const SizedBox(height: 12),
            ..._buildDifficultyCards(),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorBanner() {
    return Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Row(
        children: [
          const Text('⚠️', style: TextStyle(fontSize: 18)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Using demo data - $_error',
              style: const TextStyle(
                color: Color(0xFF92400E),
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String emoji, String title) {
    return Row(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 22)),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AivoTheme.textPrimary,
          ),
        ),
      ],
    );
  }

  List<Widget> _buildSubjectCards() {
    if (_analytics == null || _analytics!.subjects.isEmpty) {
      return [_buildEmptyStateCard('No subject data yet. Start learning to see progress!')];
    }

    return _analytics!.subjects.map((subject) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: _SubjectProgressCard(subject: subject),
      );
    }).toList();
  }

  List<Widget> _buildDifficultyCards() {
    if (_analytics == null || _analytics!.difficultySummaries.isEmpty) {
      return [_buildEmptyStateCard('No difficulty recommendations yet.')];
    }

    return _analytics!.difficultySummaries.map((summary) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: _DifficultyExplanationCard(summary: summary),
      );
    }).toList();
  }

  Widget _buildEmptyStateCard(String message) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          const Text('🌱', style: TextStyle(fontSize: 40)),
          const SizedBox(height: 12),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AivoTheme.textMuted,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}

/// Card showing subject progress with mini chart
class _SubjectProgressCard extends StatelessWidget {
  final LearnerSubjectProgressOverview subject;

  const _SubjectProgressCard({required this.subject});

  String get _subjectEmoji {
    switch (subject.subject.toLowerCase()) {
      case 'math':
        return '🔢';
      case 'reading':
        return '📖';
      case 'ela':
        return '📝';
      case 'science':
        return '🔬';
      case 'social_studies':
        return '🌍';
      default:
        return '📚';
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasData = subject.timeseries.isNotEmpty;
    final latestMastery = hasData ? subject.timeseries.last.masteryScore : 0.0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F3FF),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFDDD6FE)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Text(_subjectEmoji, style: const TextStyle(fontSize: 28)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      subject.subject.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF6D28D9),
                        letterSpacing: 0.5,
                      ),
                    ),
                    Text(
                      'Grade ${subject.enrolledGrade} • Working at Grade ${subject.currentAssessedGradeLevel}',
                      style: TextStyle(
                        fontSize: 12,
                        color: AivoTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              // Mastery badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${(latestMastery * 100).toInt()}%',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF6D28D9),
                  ),
                ),
              ),
            ],
          ),

          if (!hasData) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Text('🌱', style: TextStyle(fontSize: 24)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'No practice data yet. AIVO will build this view as your learner engages.',
                      style: TextStyle(
                        color: AivoTheme.textMuted,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            const SizedBox(height: 16),
            // Mini chart
            SizedBox(
              height: 120,
              child: _buildChart(),
            ),
            const SizedBox(height: 12),
            // Recent data points
            ...subject.timeseries.reversed.take(3).map((pt) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _formatDate(pt.date),
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AivoTheme.textPrimary,
                      ),
                    ),
                    Row(
                      children: [
                        _buildTag('${(pt.masteryScore * 100).toInt()}%', const Color(0xFFEDE9FE), const Color(0xFF6D28D9)),
                        const SizedBox(width: 6),
                        _buildTag('${pt.minutesPracticed}m', const Color(0xFFE0F2FE), const Color(0xFF0369A1)),
                        const SizedBox(width: 6),
                        _buildTag('Lv ${pt.difficultyLevel.toInt()}', const Color(0xFFD1FAE5), const Color(0xFF047857)),
                      ],
                    ),
                  ],
                ),
              ),
            )),
          ],
        ],
      ),
    );
  }

  Widget _buildChart() {
    final spots = subject.timeseries.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), entry.value.masteryScore * 100);
    }).toList();

    return LineChart(
      LineChartData(
        gridData: const FlGridData(show: false),
        titlesData: const FlTitlesData(show: false),
        borderData: FlBorderData(show: false),
        minX: 0,
        maxX: (subject.timeseries.length - 1).toDouble().clamp(1, double.infinity),
        minY: 0,
        maxY: 100,
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            gradient: const LinearGradient(
              colors: [Color(0xFF8B5CF6), Color(0xFFA78BFA)],
            ),
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: FlDotData(
              show: true,
              getDotPainter: (spot, percent, barData, index) {
                return FlDotCirclePainter(
                  radius: 4,
                  color: Colors.white,
                  strokeWidth: 2,
                  strokeColor: const Color(0xFF8B5CF6),
                );
              },
            ),
            belowBarData: BarAreaData(
              show: true,
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF8B5CF6).withValues(alpha: 0.3),
                  const Color(0xFFA78BFA).withValues(alpha: 0.0),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTag(String text, Color bgColor, Color textColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[date.month - 1]} ${date.day}';
  }
}

/// Card explaining difficulty recommendations
class _DifficultyExplanationCard extends StatelessWidget {
  final ExplainableDifficultySummary summary;

  const _DifficultyExplanationCard({required this.summary});

  String get _directionEmoji {
    if (summary.targetDifficultyLevel > summary.currentDifficultyLevel) {
      return '📈';
    } else if (summary.targetDifficultyLevel < summary.currentDifficultyLevel) {
      return '📉';
    }
    return '➡️';
  }

  String get _directionLabel {
    if (summary.targetDifficultyLevel > summary.currentDifficultyLevel) {
      return 'Increase';
    } else if (summary.targetDifficultyLevel < summary.currentDifficultyLevel) {
      return 'Decrease';
    }
    return 'Maintain';
  }

  Color get _directionColor {
    if (summary.targetDifficultyLevel > summary.currentDifficultyLevel) {
      return const Color(0xFF059669);
    } else if (summary.targetDifficultyLevel < summary.currentDifficultyLevel) {
      return const Color(0xFF0EA5E9);
    }
    return const Color(0xFF6B7280);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Text(_directionEmoji, style: const TextStyle(fontSize: 28)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      summary.subject.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AivoTheme.textPrimary,
                      ),
                    ),
                    Text(
                      'Level ${summary.currentDifficultyLevel} → ${summary.targetDifficultyLevel}',
                      style: TextStyle(
                        fontSize: 13,
                        color: AivoTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: _directionColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _directionLabel,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: _directionColor,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Rationale
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF5F3FF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('💡', style: TextStyle(fontSize: 18)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    summary.rationale,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AivoTheme.textPrimary,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),

          if (summary.factors.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Text(
              'Contributing Factors',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AivoTheme.textMuted,
              ),
            ),
            const SizedBox(height: 10),
            ...summary.factors.map((factor) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _buildFactorRow(factor),
            )),
          ],
        ],
      ),
    );
  }

  Widget _buildFactorRow(ExplainableRecommendationFactor factor) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Weight indicator
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: const Color(0xFFEDE9FE),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(
            child: Text(
              '${(factor.weight * 100).toInt()}%',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Color(0xFF6D28D9),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                factor.label,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AivoTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                factor.description,
                style: TextStyle(
                  fontSize: 12,
                  color: AivoTheme.textMuted,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
