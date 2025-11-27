import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';

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

  @override
  void initState() {
    super.initState();
    _loadData();
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
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _buildContent(),
        ),
      ),
      bottomNavigationBar: _buildBottomNav(),
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

          // Start Session Button
          _buildStartSessionCard(),
          const SizedBox(height: 24),

          // Subject Cards
          _buildSubjectsSection(),
          const SizedBox(height: 24),

          // Achievements Preview
          _buildAchievementsSection(),
          const SizedBox(height: 100), // Space for bottom nav
        ],
      ),
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
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(Icons.home_rounded, 'Home', true),
              _buildNavItem(Icons.menu_book_rounded, 'Learn', false, 
                  onTap: () => Navigator.pushNamed(context, '/session')),
              _buildNavItem(Icons.chat_bubble_rounded, 'Chat', false,
                  onTap: () => Navigator.pushNamed(context, '/tutor')),
              _buildNavItem(Icons.person_rounded, 'Profile', false),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, bool isActive, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isActive ? AivoTheme.primary.withValues(alpha: 0.1) : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: isActive ? AivoTheme.primary : AivoTheme.textMuted,
              size: 24,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
              color: isActive ? AivoTheme.primary : AivoTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}
