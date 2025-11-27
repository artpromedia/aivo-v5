import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';

class LearnerOverviewScreen extends StatefulWidget {
  const LearnerOverviewScreen({super.key});

  @override
  State<LearnerOverviewScreen> createState() => _LearnerOverviewScreenState();
}

class _LearnerOverviewScreenState extends State<LearnerOverviewScreen> {
  final AivoApiClient _client = AivoApiClient();

  bool _loading = true;
  String? _error;
  CaregiverLearnerOverview? _overview;
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
      final me = await _client.me();
      if (me.learner != null) {
        _learnerId = me.learner!.id;
        final response = await _client.getCaregiverLearnerOverview(_learnerId!);
        setState(() {
          _overview = response.overview;
          _loading = false;
        });
      } else {
        setState(() {
          _error = 'No learner found';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to load learner overview';
        _loading = false;
      });
    }
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
          const Expanded(
            child: Text(
              'Learner Profile',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AivoTheme.textPrimary,
              ),
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
            'Loading profile...',
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
            // Error card
            if (_error != null) _buildErrorCard(),

            // Profile header
            _buildProfileHeader(),
            const SizedBox(height: 24),

            // Brain profile card
            _buildBrainProfileCard(),
            const SizedBox(height: 24),

            // Subject progress
            _buildSubjectProgress(),
            const SizedBox(height: 24),

            // Recent activity
            _buildRecentActivity(),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: AivoTheme.coral.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AivoTheme.coral.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Text('😅', style: TextStyle(fontSize: 24)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Using demo data. Connect to see real information.',
              style: TextStyle(fontSize: 13, color: AivoTheme.coral),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileHeader() {
    final learnerName = _overview?.learner?.displayName ?? 'Alex';
    final grade = _overview?.learner?.currentGrade ?? 5;
    
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AivoTheme.primaryGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AivoTheme.primary.withValues(alpha: 0.4),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Center(
              child: Text(
                learnerName.isNotEmpty ? learnerName[0].toUpperCase() : '?',
                style: const TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  learnerName,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '📚 Grade $grade',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBrainProfileCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
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
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AivoTheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Center(
                  child: Text('🧠', style: TextStyle(fontSize: 24)),
                ),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Brain Profile',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AivoTheme.textPrimary,
                      ),
                    ),
                    Text(
                      'Personalized learning strengths',
                      style: TextStyle(
                        fontSize: 13,
                        color: AivoTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          
          // Trait bars
          if (_overview != null && _overview!.subjects.isNotEmpty)
            ..._overview!.subjects.map((subject) => _buildTraitBar(
              subject.subject,
              subject.masteryScore,
              _getSubjectEmoji(subject.subject),
            ))
          else ...[
            _buildTraitBar('Math', 0.75, '🔢'),
            _buildTraitBar('Reading', 0.82, '📖'),
            _buildTraitBar('Science', 0.68, '🔬'),
          ],
        ],
      ),
    );
  }

  Widget _buildTraitBar(String label, double value, String emoji) {
    final color = _getProgressColor(value);
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AivoTheme.textPrimary,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${(value * 100).round()}%',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: value,
              backgroundColor: AivoTheme.surfaceBackground,
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 10,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubjectProgress() {
    final subjects = _overview?.subjects ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Subject Progress',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AivoTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 16),
        if (subjects.isEmpty)
          _buildDemoSubjects()
        else
          ...subjects.map((subject) => _buildSubjectCard(subject)),
      ],
    );
  }

  Widget _buildDemoSubjects() {
    return Column(
      children: [
        _buildDemoSubjectCard('Math', 5, 4, 0.75, '🔢'),
        _buildDemoSubjectCard('Reading', 5, 5, 0.82, '📖'),
        _buildDemoSubjectCard('Science', 5, 4, 0.68, '🔬'),
      ],
    );
  }

  Widget _buildDemoSubjectCard(String name, int enrolled, int assessed, double mastery, String emoji) {
    final color = _getProgressColor(mastery);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(
              child: Text(emoji, style: const TextStyle(fontSize: 26)),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Level $assessed • Enrolled Grade $enrolled',
                  style: TextStyle(
                    fontSize: 12,
                    color: AivoTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${(mastery * 100).round()}%',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(
                'Mastery',
                style: TextStyle(
                  fontSize: 11,
                  color: AivoTheme.textMuted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSubjectCard(SubjectLevel subject) {
    final color = _getProgressColor(subject.masteryScore);
    final emoji = _getSubjectEmoji(subject.subject);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(
              child: Text(emoji, style: const TextStyle(fontSize: 26)),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  subject.subject,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Level ${subject.assessedGradeLevel} • Enrolled Grade ${subject.enrolledGrade}',
                  style: TextStyle(
                    fontSize: 12,
                    color: AivoTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${(subject.masteryScore * 100).round()}%',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(
                'Mastery',
                style: TextStyle(
                  fontSize: 11,
                  color: AivoTheme.textMuted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRecentActivity() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Recent Activity',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AivoTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              _buildActivityItem('Completed Math activity', '2 hours ago', '✅', AivoTheme.mint),
              const Divider(height: 24),
              _buildActivityItem('Started Reading session', 'Today', '📖', AivoTheme.primary),
              const Divider(height: 24),
              _buildActivityItem('Took a mindful break', 'Today', '🧘', AivoTheme.sunshine),
              const Divider(height: 24),
              _buildActivityItem('Earned a gold star!', 'Yesterday', '⭐', AivoTheme.coral),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActivityItem(String title, String time, String emoji, Color color) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(emoji, style: const TextStyle(fontSize: 18)),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AivoTheme.textPrimary,
            ),
          ),
        ),
        Text(
          time,
          style: TextStyle(
            fontSize: 12,
            color: AivoTheme.textMuted,
          ),
        ),
      ],
    );
  }

  Color _getProgressColor(double value) {
    if (value >= 0.7) return const Color(0xFF059669);
    if (value >= 0.5) return AivoTheme.sunshine;
    return AivoTheme.coral;
  }

  String _getSubjectEmoji(String subject) {
    final lower = subject.toLowerCase();
    if (lower.contains('math')) return '🔢';
    if (lower.contains('read')) return '📖';
    if (lower.contains('science')) return '🔬';
    if (lower.contains('writ')) return '✏️';
    if (lower.contains('history')) return '🏛️';
    if (lower.contains('art')) return '🎨';
    if (lower.contains('music')) return '🎵';
    return '📚';
  }
}
