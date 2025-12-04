import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:aivo_shared/aivo_shared.dart';
import '../widgets/difficulty_recommendations_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final AivoApiClient _client = AivoApiClient();

  bool _loading = true;
  Learner? _learner;
  String? _error;
  bool _showBreakReminder = false;
  DateTime? _lastEmotionCheckIn;
  int _selectedNavIndex = 0;
  List<SubjectDifficultyRecommendation> _difficultyRecommendations = [];

  @override
  void initState() {
    super.initState();
    _loadData();
    _checkBreakReminder();
    // Show emotion check-in after frame is built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _maybeShowEmotionCheckIn();
    });
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);

    try {
      final response = await _client.me();
      setState(() {
        _learner = response.learner;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load profile';
        _loading = false;
        // Use demo data for now
        _learner = Learner(
          id: 'demo',
          displayName: 'Alex',
          currentGrade: 5,
          region: 'US',
          subjects: ['Math', 'Reading', 'Science'],
        );
        // Demo difficulty recommendations
        _difficultyRecommendations = [
          SubjectDifficultyRecommendation(
            subject: 'Math',
            enrolledGrade: 5,
            assessedGradeLevel: 5,
            masteryScore: 0.82,
            difficultyRecommendation: 'harder',
          ),
          SubjectDifficultyRecommendation(
            subject: 'Reading',
            enrolledGrade: 5,
            assessedGradeLevel: 4,
            masteryScore: 0.65,
            difficultyRecommendation: null, // maintain
          ),
          SubjectDifficultyRecommendation(
            subject: 'Science',
            enrolledGrade: 5,
            assessedGradeLevel: 5,
            masteryScore: 0.48,
            difficultyRecommendation: 'easier',
          ),
        ];
      });
    }
  }

  Future<void> _checkBreakReminder() async {
    final prefs = await SharedPreferences.getInstance();
    final lastBreak = prefs.getInt('lastBreakTimestamp') ?? 0;
    final now = DateTime.now().millisecondsSinceEpoch;
    final sensory = SensoryProvider.maybeOf(context);
    
    // Default 45 minutes between breaks
    final breakIntervalMinutes = sensory?.profile.timing.breakFrequencyMinutes ?? 45;
    final breakIntervalMs = breakIntervalMinutes * 60 * 1000;
    
    if (now - lastBreak > breakIntervalMs) {
      setState(() => _showBreakReminder = true);
    }
  }

  Future<void> _maybeShowEmotionCheckIn() async {
    final prefs = await SharedPreferences.getInstance();
    final lastCheckIn = prefs.getInt('lastEmotionCheckInTimestamp') ?? 0;
    final now = DateTime.now().millisecondsSinceEpoch;
    
    // Show check-in if more than 4 hours since last one
    final fourHoursMs = 4 * 60 * 60 * 1000;
    if (now - lastCheckIn > fourHoursMs && mounted) {
      _showEmotionCheckInDialog();
    }
  }

  void _showEmotionCheckInDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _EmotionQuickCheckIn(
        onComplete: (emotion, level) async {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setInt(
            'lastEmotionCheckInTimestamp',
            DateTime.now().millisecondsSinceEpoch,
          );
          // Log to API
          try {
            await _client.logEmotionCheckIn(
              learnerId: _learner?.id ?? 'demo',
              emotion: emotion,
              level: level,
              context: 'home_launch',
            );
          } catch (_) {}
          if (mounted) Navigator.pop(context);
        },
        onSkip: () => Navigator.pop(context),
      ),
    );
  }

  Future<void> _dismissBreakReminder() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(
      'lastBreakTimestamp',
      DateTime.now().millisecondsSinceEpoch,
    );
    setState(() => _showBreakReminder = false);
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
              // Break reminder banner
              if (_showBreakReminder) _buildBreakReminderBanner(),
              // Main content
              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : _buildContent(),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: _buildCalmCornerFab(),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildBreakReminderBanner() {
    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AivoTheme.mint.withValues(alpha: 0.9),
            AivoTheme.sky.withValues(alpha: 0.9),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AivoTheme.mint.withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          const Text('🧘', style: TextStyle(fontSize: 24)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Time for a break?',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    fontSize: 14,
                  ),
                ),
                Text(
                  'A quick brain break can help you focus better!',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withValues(alpha: 0.9),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () {
              _dismissBreakReminder();
              Navigator.pushNamed(context, '/focus-break');
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'Take Break',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AivoTheme.primary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: _dismissBreakReminder,
            child: Icon(
              Icons.close,
              size: 20,
              color: Colors.white.withValues(alpha: 0.8),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCalmCornerFab() {
    return FloatingActionButton.extended(
      onPressed: () => Navigator.pushNamed(context, '/regulation'),
      backgroundColor: AivoTheme.mint,
      foregroundColor: AivoTheme.textPrimary,
      icon: const Text('🧘', style: TextStyle(fontSize: 20)),
      label: const Text(
        'Calm Corner',
        style: TextStyle(fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _buildContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with greeting and avatar
          _buildHeader(),
          const SizedBox(height: 28),

          // Today's Progress Card
          _buildProgressCard(),
          const SizedBox(height: 24),

          // Quick Stats Row
          _buildStatsRow(),
          const SizedBox(height: 24),

          // Quick Actions Row
          _buildQuickActionsRow(),
          const SizedBox(height: 24),

          // Calm Corner Card
          _buildCalmCornerCard(),
          const SizedBox(height: 24),

          // Start Session Button
          _buildStartSessionCard(),
          const SizedBox(height: 24),

          // Subject Cards
          _buildSubjectsSection(),
          const SizedBox(height: 24),

          // Difficulty Recommendations Card
          DifficultyRecommendationsCard(
            recommendations: _difficultyRecommendations,
            onViewDetails: () {
              // TODO: Navigate to detailed analytics page
            },
          ),
          const SizedBox(height: 24),

          // Achievements Preview
          _buildAchievementsSection(),
          const SizedBox(height: 100), // Space for bottom nav
        ],
      ),
    );
  }

  Widget _buildQuickActionsRow() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AivoTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _QuickActionCard(
                emoji: '📚',
                title: 'Homework Helper',
                subtitle: 'Get help with problems',
                color: AivoTheme.sky,
                onTap: () => Navigator.pushNamed(context, '/homework'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickActionCard(
                emoji: '🧘',
                title: 'Calm Corner',
                subtitle: 'Relax & recharge',
                color: AivoTheme.mint,
                onTap: () => Navigator.pushNamed(context, '/regulation'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _QuickActionCard(
                emoji: '🎮',
                title: 'Brain Break',
                subtitle: 'Fun focus games',
                color: AivoTheme.coral,
                onTap: () => Navigator.pushNamed(context, '/focus-break'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickActionCard(
                emoji: '⚙️',
                title: 'Settings',
                subtitle: 'Customize your experience',
                color: AivoTheme.lavender,
                onTap: () => Navigator.pushNamed(context, '/settings'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildHeader() {
    final name = _learner?.displayName ?? 'Learner';
    final hour = DateTime.now().hour;
    String greeting;
    String emoji;
    
    if (hour < 12) {
      greeting = 'Good morning';
      emoji = '🌅';
    } else if (hour < 17) {
      greeting = 'Good afternoon';
      emoji = '☀️';
    } else {
      greeting = 'Good evening';
      emoji = '🌙';
    }

    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$greeting $emoji',
                style: TextStyle(
                  fontSize: 14,
                  color: AivoTheme.textMuted,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Hello, $name!',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        // Avatar
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            gradient: AivoTheme.primaryGradient,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: AivoTheme.primary.withValues(alpha: 0.3),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Center(
            child: Text(
              name.isNotEmpty ? name[0].toUpperCase() : '?',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Settings button
        GestureDetector(
          onTap: () => Navigator.pushNamed(context, '/settings'),
          child: Container(
            width: 48,
            height: 48,
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
            child: const Center(
              child: Icon(Icons.settings_accessibility, color: AivoTheme.primary),
            ),
          ),
        ),
        const SizedBox(width: 8),
        // Notification bell
        Container(
          width: 48,
          height: 48,
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
          child: Stack(
            children: [
              const Center(
                child: Icon(Icons.notifications_outlined, color: AivoTheme.textMuted),
              ),
              Positioned(
                top: 10,
                right: 12,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: AivoTheme.coral,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildProgressCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AivoTheme.primary.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Your Progress Today',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AivoTheme.textPrimary,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AivoTheme.mint.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    Icon(Icons.local_fire_department, 
                         size: 16, color: Colors.orange.shade600),
                    const SizedBox(width: 4),
                    Text(
                      '3 day streak!',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.orange.shade700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              // Progress Ring
              SizedBox(
                width: 100,
                height: 100,
                child: Stack(
                  children: [
                    Center(
                      child: SizedBox(
                        width: 90,
                        height: 90,
                        child: CircularProgressIndicator(
                          value: 0.65,
                          strokeWidth: 10,
                          backgroundColor: AivoTheme.surfaceBackground,
                          valueColor: const AlwaysStoppedAnimation<Color>(AivoTheme.primary),
                          strokeCap: StrokeCap.round,
                        ),
                      ),
                    ),
                    Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            '65%',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: AivoTheme.textPrimary,
                            ),
                          ),
                          Text(
                            'complete',
                            style: TextStyle(
                              fontSize: 11,
                              color: AivoTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 24),
              // Stats
              Expanded(
                child: Column(
                  children: [
                    _buildProgressRow('Activities Done', '4/6', AivoTheme.primary),
                    const SizedBox(height: 12),
                    _buildProgressRow('Focus Time', '25 min', AivoTheme.mint),
                    const SizedBox(height: 12),
                    _buildProgressRow('Points Earned', '+120', AivoTheme.sunshine),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProgressRow(String label, String value, Color color) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 10),
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: AivoTheme.textMuted,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AivoTheme.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildStatsRow() {
    return Row(
      children: [
        Expanded(child: _buildStatCard('🎯', 'Score', '200', AivoTheme.primary)),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCard('📚', 'Lessons', '12', AivoTheme.sky)),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCard('⭐', 'Stars', '45', AivoTheme.sunshine)),
      ],
    );
  }

  Widget _buildStatCard(String emoji, String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 24)),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: color.withValues(alpha: 1.0),
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: AivoTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCalmCornerCard() {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/calm-corner'),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AivoTheme.mint.withValues(alpha: 0.3),
              AivoTheme.sky.withValues(alpha: 0.2),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: AivoTheme.mint.withValues(alpha: 0.3),
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AivoTheme.mint.withValues(alpha: 0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Center(
                child: Text('🧘', style: TextStyle(fontSize: 28)),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Calm Corner',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AivoTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Need a break? Try breathing or calming activities',
                    style: TextStyle(
                      fontSize: 13,
                      color: AivoTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AivoTheme.mint,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.arrow_forward_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStartSessionCard() {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/session'),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF8B5CF6), Color(0xFFA78BFA), Color(0xFFC4B5FD)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: AivoTheme.primary.withValues(alpha: 0.4),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Ready to Learn? 🚀',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "Start today's session and continue your learning journey!",
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.white.withValues(alpha: 0.9),
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(50),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Start Session',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AivoTheme.primary,
                          ),
                        ),
                        SizedBox(width: 8),
                        Icon(Icons.arrow_forward_rounded, 
                             size: 18, color: AivoTheme.primary),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            // Illustration placeholder
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Center(
                child: Text('📖', style: TextStyle(fontSize: 40)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubjectsSection() {
    final subjectData = [
      {'name': 'Math', 'emoji': '🔢', 'color': AivoTheme.primary, 'progress': 0.75},
      {'name': 'Reading', 'emoji': '📖', 'color': AivoTheme.mint, 'progress': 0.60},
      {'name': 'Science', 'emoji': '🔬', 'color': AivoTheme.sky, 'progress': 0.45},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'Your Subjects',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AivoTheme.textPrimary,
              ),
            ),
            const Spacer(),
            TextButton(
              onPressed: () {},
              child: Text(
                'See all',
                style: TextStyle(
                  color: AivoTheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 140,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: subjectData.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final subject = subjectData[index];
              return _buildSubjectCard(
                subject['name'] as String,
                subject['emoji'] as String,
                subject['color'] as Color,
                subject['progress'] as double,
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSubjectCard(String name, String emoji, Color color, double progress) {
    return Container(
      width: 130,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(emoji, style: const TextStyle(fontSize: 22)),
            ),
          ),
          const Spacer(),
          Text(
            name,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AivoTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: color.withValues(alpha: 0.2),
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 6,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAchievementsSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AivoTheme.sunshine.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AivoTheme.sunshine,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Center(
              child: Text('🏆', style: TextStyle(fontSize: 28)),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'New Achievement!',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'You completed 3 days in a row! Keep it up!',
                  style: TextStyle(
                    fontSize: 13,
                    color: AivoTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: AivoTheme.textMuted),
        ],
      ),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(
                icon: Icons.home_rounded,
                emoji: '🏠',
                label: 'Home',
                index: 0,
              ),
              _buildNavItem(
                icon: Icons.menu_book_rounded,
                emoji: '📚',
                label: 'Learn',
                index: 1,
                onTap: () => Navigator.pushNamed(context, '/session'),
              ),
              _buildCalmNavItem(),
              _buildNavItem(
                icon: Icons.chat_bubble_rounded,
                emoji: '💬',
                label: 'Chat',
                index: 3,
                onTap: () => Navigator.pushNamed(context, '/tutor'),
              ),
              _buildNavItem(
                icon: Icons.person_rounded,
                emoji: '👤',
                label: 'Profile',
                index: 4,
                onTap: () => Navigator.pushNamed(context, '/settings'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCalmNavItem() {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/regulation'),
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AivoTheme.mint,
              AivoTheme.mint.withValues(alpha: 0.8),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: AivoTheme.mint.withValues(alpha: 0.4),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('🧘', style: TextStyle(fontSize: 22)),
            Text(
              'Calm',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String emoji,
    required String label,
    required int index,
    VoidCallback? onTap,
  }) {
    final isActive = _selectedNavIndex == index;
    return GestureDetector(
      onTap: () {
        setState(() => _selectedNavIndex = index);
        onTap?.call();
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isActive ? AivoTheme.primary.withValues(alpha: 0.1) : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              emoji,
              style: TextStyle(
                fontSize: 22,
                color: isActive ? null : AivoTheme.textMuted,
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
              color: isActive ? AivoTheme.primary : AivoTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

/// Quick action card for home screen
class _QuickActionCard extends StatelessWidget {
  final String emoji;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.emoji,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  emoji,
                  style: const TextStyle(fontSize: 22),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 12,
                color: AivoTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Emotion quick check-in bottom sheet
class _EmotionQuickCheckIn extends StatefulWidget {
  final Function(String emotion, int level) onComplete;
  final VoidCallback onSkip;

  const _EmotionQuickCheckIn({
    required this.onComplete,
    required this.onSkip,
  });

  @override
  State<_EmotionQuickCheckIn> createState() => _EmotionQuickCheckInState();
}

class _EmotionQuickCheckInState extends State<_EmotionQuickCheckIn> {
  String? _selectedEmotion;
  int _level = 3;

  final _emotions = [
    {'emoji': '😊', 'label': 'Happy', 'color': AivoTheme.sunshine},
    {'emoji': '😌', 'label': 'Calm', 'color': AivoTheme.mint},
    {'emoji': '🤔', 'label': 'Focused', 'color': AivoTheme.sky},
    {'emoji': '😔', 'label': 'Sad', 'color': AivoTheme.lavender},
    {'emoji': '😤', 'label': 'Frustrated', 'color': AivoTheme.coral},
    {'emoji': '😴', 'label': 'Tired', 'color': const Color(0xFF9E9E9E)},
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          
          // Title
          const Text(
            'How are you feeling?',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: AivoTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'This helps us personalize your learning experience',
            style: TextStyle(
              fontSize: 14,
              color: AivoTheme.textMuted,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),

          // Emotion grid
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: _emotions.map((e) {
              final isSelected = _selectedEmotion == e['label'];
              return GestureDetector(
                onTap: () => setState(() => _selectedEmotion = e['label'] as String),
                child: Container(
                  width: 90,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: isSelected 
                        ? (e['color'] as Color).withValues(alpha: 0.2)
                        : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(16),
                    border: isSelected 
                        ? Border.all(color: e['color'] as Color, width: 2)
                        : null,
                  ),
                  child: Column(
                    children: [
                      Text(
                        e['emoji'] as String,
                        style: const TextStyle(fontSize: 32),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        e['label'] as String,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                          color: isSelected 
                              ? AivoTheme.textPrimary 
                              : AivoTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),

          // Intensity slider (only show if emotion selected)
          if (_selectedEmotion != null) ...[
            Text(
              'How strong is this feeling?',
              style: TextStyle(
                fontSize: 14,
                color: AivoTheme.textMuted,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Text('A little', style: TextStyle(fontSize: 12)),
                Expanded(
                  child: Slider(
                    value: _level.toDouble(),
                    min: 1,
                    max: 5,
                    divisions: 4,
                    activeColor: AivoTheme.primary,
                    onChanged: (v) => setState(() => _level = v.round()),
                  ),
                ),
                const Text('A lot', style: TextStyle(fontSize: 12)),
              ],
            ),
            const SizedBox(height: 16),
          ],

          // Action buttons
          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: widget.onSkip,
                  child: Text(
                    'Skip for now',
                    style: TextStyle(color: AivoTheme.textMuted),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: _selectedEmotion == null 
                      ? null 
                      : () => widget.onComplete(_selectedEmotion!, _level),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AivoTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('Continue'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
