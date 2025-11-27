import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final AivoApiClient _client = AivoApiClient();

  bool _loading = true;
  String? _error;
  CaregiverLearnerOverview? _overview;
  List<NotificationSummary> _notifications = [];
  String _role = 'parent'; // 'parent' or 'teacher'
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
        
        final overviewResponse = await _client.getCaregiverLearnerOverview(_learnerId!);
        final notificationsResponse = await _client.listNotifications();

        setState(() {
          _overview = overviewResponse.overview;
          _notifications = notificationsResponse.items;
          _loading = false;
        });
      } else {
        setState(() {
          _error = 'No learner found';
          _loading = false;
          // Use demo data
          _overview = null;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to load dashboard';
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
          child: _loading
              ? _buildLoadingState()
              : _buildContent(),
        ),
      ),
      bottomNavigationBar: _buildBottomNav(),
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
            'Loading your dashboard...',
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
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            _buildHeader(),
            const SizedBox(height: 24),

            // Role toggle
            _buildRoleToggle(),
            const SizedBox(height: 24),

            // Error state
            if (_error != null) _buildErrorCard(),

            // Learner overview card
            _buildLearnerCard(),
            const SizedBox(height: 20),

            // Stats row
            _buildStatsRow(),
            const SizedBox(height: 24),

            // Quick actions
            _buildQuickActions(),
            const SizedBox(height: 24),

            // Pending approvals
            _buildPendingApprovals(),
            const SizedBox(height: 24),

            // Notifications
            _buildNotifications(),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
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
                _role == 'parent' ? 'Parent Dashboard' : 'Teacher Dashboard',
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: AivoTheme.textPrimary,
                ),
              ),
            ],
          ),
        ),
        // Avatar
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            gradient: AivoTheme.primaryGradient,
            borderRadius: BorderRadius.circular(16),
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
              _role == 'parent' ? '👨‍👩‍👧' : '👨‍🏫',
              style: const TextStyle(fontSize: 24),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRoleToggle() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _role = 'parent'),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  gradient: _role == 'parent' ? AivoTheme.primaryGradient : null,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: _role == 'parent' ? [
                    BoxShadow(
                      color: AivoTheme.primary.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ] : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('👨‍👩‍👧', style: const TextStyle(fontSize: 16)),
                    const SizedBox(width: 8),
                    Text(
                      'Parent',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: _role == 'parent' ? Colors.white : AivoTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _role = 'teacher'),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  gradient: _role == 'teacher' ? AivoTheme.primaryGradient : null,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: _role == 'teacher' ? [
                    BoxShadow(
                      color: AivoTheme.primary.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ] : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('👨‍🏫', style: const TextStyle(fontSize: 16)),
                    const SizedBox(width: 8),
                    Text(
                      'Teacher',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: _role == 'teacher' ? Colors.white : AivoTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
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
              style: TextStyle(
                fontSize: 13,
                color: AivoTheme.coral,
              ),
            ),
          ),
          GestureDetector(
            onTap: _loadData,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(Icons.refresh, color: AivoTheme.coral, size: 18),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLearnerCard() {
    final learnerName = _overview?.learner?.displayName ?? 'Alex';
    final grade = _overview?.learner?.currentGrade ?? 5;
    final isOnTrack = _overview?.pendingDifficultyProposals.isEmpty ?? true;

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
        children: [
          Row(
            children: [
              // Learner avatar
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AivoTheme.sky, AivoTheme.mint],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Center(
                  child: Text(
                    learnerName.isNotEmpty ? learnerName[0].toUpperCase() : '?',
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      learnerName,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AivoTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AivoTheme.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            'Grade $grade',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AivoTheme.primary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: isOnTrack 
                                ? AivoTheme.mint.withValues(alpha: 0.2)
                                : AivoTheme.sunshine.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                isOnTrack ? Icons.check_circle : Icons.pending,
                                size: 12,
                                color: isOnTrack ? const Color(0xFF059669) : Colors.orange.shade700,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                isOnTrack ? 'On Track' : 'Review Needed',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: isOnTrack ? const Color(0xFF059669) : Colors.orange.shade700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Progress summary
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AivoTheme.surfaceBackground,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Text('📈', style: TextStyle(fontSize: 20)),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _role == 'parent' 
                        ? 'Your learner completed 4 activities this week!'
                        : 'This student is making great progress.',
                    style: TextStyle(
                      fontSize: 13,
                      color: AivoTheme.textMuted,
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

  Widget _buildStatsRow() {
    final sessionCount = _overview?.recentSessionDates.length ?? 12;
    final subjectCount = _overview?.subjects.length ?? 3;
    final pendingCount = _overview?.pendingDifficultyProposals.length ?? 0;

    return Row(
      children: [
        Expanded(child: _buildStatCard('📚', 'Sessions', '$sessionCount', AivoTheme.primary)),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCard('🎯', 'Subjects', '$subjectCount', AivoTheme.sky)),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCard('⏳', 'Pending', '$pendingCount', AivoTheme.sunshine)),
      ],
    );
  }

  Widget _buildStatCard(String emoji, String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 24)),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AivoTheme.textPrimary,
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

  Widget _buildQuickActions() {
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
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                '👤',
                'View Learner',
                'See progress details',
                AivoTheme.primary,
                () => Navigator.pushNamed(context, '/learner'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                '⚙️',
                'Settings',
                'Manage difficulty',
                AivoTheme.sky,
                () => Navigator.pushNamed(context, '/difficulty'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionCard(String emoji, String title, String subtitle, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
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
            const SizedBox(height: 14),
            Text(
              title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AivoTheme.textPrimary,
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

  Widget _buildPendingApprovals() {
    final pendingCount = _overview?.pendingDifficultyProposals.length ?? 0;

    if (pendingCount == 0) return const SizedBox.shrink();

    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/difficulty'),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AivoTheme.sunshine.withValues(alpha: 0.2),
              AivoTheme.coral.withValues(alpha: 0.15),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AivoTheme.sunshine.withValues(alpha: 0.4)),
        ),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Center(
                child: Text('⚡', style: TextStyle(fontSize: 26)),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$pendingCount Pending Approval${pendingCount > 1 ? 's' : ''}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AivoTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'AIVO has difficulty change suggestions',
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
      ),
    );
  }

  Widget _buildNotifications() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Recent Updates',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AivoTheme.textPrimary,
              ),
            ),
            if (_notifications.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AivoTheme.coral.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${_notifications.length} new',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AivoTheme.coral,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 14),
        if (_notifications.isEmpty)
          _buildEmptyNotifications()
        else
          ...(_notifications.take(4).map((n) => _buildNotificationItem(n))),
      ],
    );
  }

  Widget _buildEmptyNotifications() {
    return Container(
      padding: const EdgeInsets.all(28),
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
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: AivoTheme.mint.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(30),
            ),
            child: const Center(
              child: Text('✨', style: TextStyle(fontSize: 28)),
            ),
          ),
          const SizedBox(height: 14),
          const Text(
            'All caught up!',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AivoTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'No new notifications',
            style: TextStyle(
              fontSize: 13,
              color: AivoTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationItem(NotificationSummary notification) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: AivoTheme.primary,
              borderRadius: BorderRadius.circular(5),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  notification.title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  notification.body,
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
              _buildNavItem(Icons.dashboard_rounded, 'Dashboard', true),
              _buildNavItem(Icons.person_rounded, 'Learner', false, 
                  onTap: () => Navigator.pushNamed(context, '/learner')),
              _buildNavItem(Icons.tune_rounded, 'Settings', false,
                  onTap: () => Navigator.pushNamed(context, '/difficulty')),
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
