import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';

class SessionScreen extends StatefulWidget {
  const SessionScreen({super.key});

  @override
  State<SessionScreen> createState() => _SessionScreenState();
}

class _SessionScreenState extends State<SessionScreen> {
  final AivoApiClient _client = AivoApiClient();

  LearnerSession? _session;
  SessionPlanRun? _sessionPlan;
  MeResponse? _me;
  String? _learnerId;
  String? _region;

  bool _loading = true;
  bool _starting = false;
  bool _planLoading = false;
  String? _error;
  String? _planError;
  bool _showBreakMessage = false;
  String? _updatingActivityId;

  @override
  void initState() {
    super.initState();
    _loadSession();
  }

  String get _primarySubject {
    final subjects = _me?.learner?.subjects;
    if (subjects == null || subjects.isEmpty) return 'math';
    final allowed = ['math', 'ela'];
    return allowed.contains(subjects[0]) ? subjects[0] : 'math';
  }

  Future<void> _loadSession() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final meRes = await _client.me();
      _me = meRes;

      if (meRes.learner == null) {
        if (mounted) {
          Navigator.pushReplacementNamed(context, '/baseline');
        }
        return;
      }

      final learnerRes = await _client.getLearner(meRes.learner!.id);
      if (learnerRes.brainProfile == null) {
        if (mounted) {
          Navigator.pushReplacementNamed(context, '/baseline');
        }
        return;
      }

      _learnerId = learnerRes.learner.id;
      _region = learnerRes.learner.region;

      final todayRes = await _client.getTodaySession(_learnerId!, _primarySubject);
      
      if (mounted) {
        setState(() {
          _session = todayRes.session;
          _loading = false;
        });
      }

      await _loadSessionPlan();
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  Future<void> _loadSessionPlan() async {
    if (_learnerId == null || _region == null) return;

    setState(() {
      _planLoading = true;
      _planError = null;
    });

    try {
      final planRes = await _client.planSession(
        learnerId: _learnerId!,
        subject: _primarySubject,
        region: _region!,
      );

      if (mounted) {
        setState(() {
          _sessionPlan = planRes.run;
          _planLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _planError = e.toString();
          _planLoading = false;
        });
      }
    }
  }

  Future<void> _startSession() async {
    if (_learnerId == null) return;

    setState(() {
      _starting = true;
      _error = null;
    });

    try {
      final res = await _client.startSession(
        learnerId: _learnerId!,
        subject: _primarySubject,
      );

      if (mounted) {
        setState(() {
          _session = res.session;
          _starting = false;
        });
      }

      await _loadSessionPlan();
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _starting = false;
        });
      }
    }
  }

  Future<void> _updateActivityStatus(SessionActivity activity, String status) async {
    if (_session == null) return;

    setState(() {
      _updatingActivityId = activity.id;
      _error = null;
    });

    try {
      final res = await _client.updateActivityStatus(
        sessionId: _session!.id,
        activityId: activity.id,
        status: status,
      );

      if (mounted) {
        setState(() {
          _session = res.session;
          _updatingActivityId = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _updatingActivityId = null;
        });
      }
    }
  }

  Future<void> _recordFeedback(String planId, int rating, String label) async {
    try {
      await _client.recordFeedback(
        targetType: 'session_plan',
        targetId: planId,
        rating: rating,
        label: label,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Thanks for your feedback! 💜'),
            backgroundColor: AivoTheme.mint,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } catch (e) {
      // Silent fail for feedback
    }
  }

  String get _todayLabel {
    final now = DateTime.now();
    final weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    final months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return '${weekdays[now.weekday - 1]}, ${months[now.month - 1]} ${now.day}';
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
              // Custom App Bar
              _buildAppBar(),
              // Content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Break message
                      if (_showBreakMessage) ...[
                        _buildBreakCard(),
                        const SizedBox(height: 16),
                      ],

                      // Loading state
                      if (_loading)
                        _buildLoadingCard(),
                      
                      // Error state
                      if (_error != null)
                        _buildErrorCard(),

                      // No session - start button
                      if (!_loading && _session == null)
                        _buildStartSessionCard(),

                      // Session in progress
                      if (_session != null) ...[
                        _buildProgressHeader(),
                        const SizedBox(height: 20),
                        _buildActivitiesList(),
                      ],

                      // Session plan preview
                      if (_session != null && (_planLoading || _sessionPlan != null || _planError != null)) ...[
                        const SizedBox(height: 24),
                        _buildSessionPlanCard(),
                      ],

                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Today's Learning Session",
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                Text(
                  _todayLabel,
                  style: TextStyle(
                    fontSize: 13,
                    color: AivoTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          // Break button
          GestureDetector(
            onTap: () => setState(() => _showBreakMessage = true),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: AivoTheme.sky.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  const Text('☕', style: TextStyle(fontSize: 14)),
                  const SizedBox(width: 6),
                  Text(
                    'Break',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AivoTheme.sky,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBreakCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AivoTheme.sky.withValues(alpha: 0.2),
            AivoTheme.mint.withValues(alpha: 0.15),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AivoTheme.sky.withValues(alpha: 0.3)),
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
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Center(
                  child: Text('🌿', style: TextStyle(fontSize: 24)),
                ),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Text(
                  "It's okay to take a break!",
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: AivoTheme.textPrimary,
                  ),
                ),
              ),
              GestureDetector(
                onTap: () => setState(() => _showBreakMessage = false),
                child: Icon(Icons.close, color: AivoTheme.textMuted, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            'Taking breaks helps your brain process what you\'ve learned. Try some deep breaths, stretch, or get a glass of water. We\'ll be here when you\'re ready! 💜',
            style: TextStyle(
              fontSize: 14,
              color: AivoTheme.textMuted,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildBreakOption('🧘', '2 min breathing'),
              const SizedBox(width: 10),
              _buildBreakOption('💧', 'Get water'),
              const SizedBox(width: 10),
              _buildBreakOption('🚶', 'Quick stretch'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBreakOption(String emoji, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: AivoTheme.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingCard() {
    return Container(
      padding: const EdgeInsets.all(40),
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
          SizedBox(
            width: 60,
            height: 60,
            child: CircularProgressIndicator(
              strokeWidth: 4,
              valueColor: AlwaysStoppedAnimation<Color>(AivoTheme.primary),
              backgroundColor: AivoTheme.primary.withValues(alpha: 0.2),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Preparing your session...',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AivoTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Getting everything ready for you ✨',
            style: TextStyle(
              fontSize: 14,
              color: AivoTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AivoTheme.coral.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AivoTheme.coral.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Center(
              child: Text('😅', style: TextStyle(fontSize: 22)),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Oops! Something went wrong',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Tap to try again',
                  style: TextStyle(
                    fontSize: 13,
                    color: AivoTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: _loadSession,
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(Icons.refresh_rounded, color: AivoTheme.coral),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStartSessionCard() {
    return Container(
      padding: const EdgeInsets.all(28),
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
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: AivoTheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(30),
            ),
            child: const Center(
              child: Text('🎯', style: TextStyle(fontSize: 50)),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            "Ready to Start?",
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: AivoTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            "We'll create a personalized, calm learning session just for you. Take your time - there's no rush! 🌟",
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 15,
              color: AivoTheme.textMuted,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 28),
          GestureDetector(
            onTap: _starting ? null : _startSession,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 18),
              decoration: BoxDecoration(
                gradient: AivoTheme.primaryGradient,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AivoTheme.primary.withValues(alpha: 0.4),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Center(
                child: _starting
                    ? Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Text(
                            'Preparing...',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      )
                    : const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            "Let's Begin",
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                          SizedBox(width: 10),
                          Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 20),
                        ],
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressHeader() {
    final completed = _session!.activities.where((a) => a.status == 'completed').length;
    final total = _session!.activities.length;
    final progress = total > 0 ? completed / total : 0.0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AivoTheme.primary.withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          // Progress ring
          SizedBox(
            width: 70,
            height: 70,
            child: Stack(
              children: [
                Center(
                  child: SizedBox(
                    width: 60,
                    height: 60,
                    child: CircularProgressIndicator(
                      value: progress,
                      strokeWidth: 7,
                      backgroundColor: AivoTheme.surfaceBackground,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        progress == 1.0 ? AivoTheme.mint : AivoTheme.primary,
                      ),
                      strokeCap: StrokeCap.round,
                    ),
                  ),
                ),
                Center(
                  child: Text(
                    progress == 1.0 ? '🎉' : '${(progress * 100).toInt()}%',
                    style: TextStyle(
                      fontSize: progress == 1.0 ? 24 : 14,
                      fontWeight: FontWeight.bold,
                      color: AivoTheme.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  progress == 1.0 ? 'All done! Great job! 🌟' : 'Keep going, you\'re doing great!',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '$completed of $total activities completed',
                  style: TextStyle(
                    fontSize: 13,
                    color: AivoTheme.textMuted,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '~${_session!.plannedMinutes} minutes planned',
                  style: TextStyle(
                    fontSize: 12,
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

  Widget _buildActivitiesList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Your Activities',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AivoTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 14),
        ..._session!.activities.asMap().entries.map((entry) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _buildActivityCard(entry.key + 1, entry.value),
          );
        }),
      ],
    );
  }

  Widget _buildActivityCard(int number, SessionActivity activity) {
    final isCompleted = activity.status == 'completed';
    final isInProgress = activity.status == 'in_progress';
    final isPending = activity.status == 'pending';

    Color cardColor = Colors.white;
    Color borderColor = Colors.transparent;
    
    if (isCompleted) {
      borderColor = AivoTheme.mint.withValues(alpha: 0.5);
    } else if (isInProgress) {
      borderColor = AivoTheme.primary.withValues(alpha: 0.5);
    }

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor, width: 2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Number badge
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: isCompleted 
                      ? AivoTheme.mint.withValues(alpha: 0.2)
                      : isInProgress 
                          ? AivoTheme.primary.withValues(alpha: 0.15)
                          : AivoTheme.surfaceBackground,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: isCompleted 
                      ? Icon(Icons.check_rounded, color: AivoTheme.mint, size: 20)
                      : Text(
                          '$number',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: isInProgress ? AivoTheme.primary : AivoTheme.textMuted,
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      activity.title,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: AivoTheme.textPrimary,
                        decoration: isCompleted ? TextDecoration.lineThrough : null,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${activity.type.replaceAll('_', ' ')} • ~${activity.estimatedMinutes} min',
                      style: TextStyle(
                        fontSize: 12,
                        color: AivoTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              // Status badge
              _buildStatusBadge(activity.status),
            ],
          ),
          if (!isCompleted) ...[
            const SizedBox(height: 14),
            Text(
              activity.instructions,
              style: TextStyle(
                fontSize: 13,
                color: AivoTheme.textMuted,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 16),
            // Action buttons
            Row(
              children: [
                if (isPending)
                  Expanded(
                    child: GestureDetector(
                      onTap: _updatingActivityId == activity.id
                          ? null
                          : () => _updateActivityStatus(activity, 'in_progress'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: AivoTheme.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(
                            _updatingActivityId == activity.id ? 'Starting...' : 'Start Activity',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AivoTheme.primary,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                if (isInProgress) ...[
                  Expanded(
                    child: GestureDetector(
                      onTap: _updatingActivityId == activity.id
                          ? null
                          : () => _updateActivityStatus(activity, 'completed'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          gradient: AivoTheme.primaryGradient,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: AivoTheme.primary.withValues(alpha: 0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _updatingActivityId == activity.id ? 'Saving...' : 'Mark Complete',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                              if (_updatingActivityId != activity.id) ...[
                                const SizedBox(width: 8),
                                const Icon(Icons.check_rounded, color: Colors.white, size: 18),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;
    String label;

    switch (status) {
      case 'completed':
        bgColor = AivoTheme.mint.withValues(alpha: 0.2);
        textColor = const Color(0xFF059669);
        label = 'Done ✓';
        break;
      case 'in_progress':
        bgColor = AivoTheme.primary.withValues(alpha: 0.15);
        textColor = AivoTheme.primary;
        label = 'In Progress';
        break;
      default:
        bgColor = AivoTheme.surfaceBackground;
        textColor = AivoTheme.textMuted;
        label = 'Not Started';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  Widget _buildSessionPlanCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AivoTheme.primary.withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AivoTheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: Text('🤖', style: TextStyle(fontSize: 20)),
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'AIVO\'s Learning Plan',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AivoTheme.textPrimary,
                      ),
                    ),
                    Text(
                      'Personalized just for you',
                      style: TextStyle(
                        fontSize: 12,
                        color: AivoTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          if (_planLoading) ...[
            const SizedBox(height: 20),
            Center(
              child: Column(
                children: [
                  SizedBox(
                    width: 30,
                    height: 30,
                    child: CircularProgressIndicator(
                      strokeWidth: 3,
                      valueColor: AlwaysStoppedAnimation<Color>(AivoTheme.primary),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Creating your personalized plan...',
                    style: TextStyle(
                      fontSize: 13,
                      color: AivoTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          ],

          if (_planError != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AivoTheme.coral.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'Could not load plan preview',
                style: TextStyle(
                  fontSize: 13,
                  color: AivoTheme.coral,
                ),
              ),
            ),
          ],

          if (_sessionPlan != null) ...[
            const SizedBox(height: 16),
            // Feedback buttons
            Row(
              children: [
                _buildFeedbackButton('👍', 'Helpful', true),
                const SizedBox(width: 10),
                _buildFeedbackButton('👎', 'Not quite', false),
              ],
            ),
            const SizedBox(height: 20),
            // Insights
            _buildInsightRow('🎯', 'Goal', _sessionPlan!.insights.objective),
            _buildInsightRow('💬', 'Tone', _sessionPlan!.insights.tone),
            _buildInsightRow('📊', 'Level', _sessionPlan!.insights.difficultySummary),
            
            if (_sessionPlan!.insights.calmingStrategies.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Text(
                'Calming Strategies 🌿',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AivoTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _sessionPlan!.insights.calmingStrategies.map((s) => 
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AivoTheme.mint.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      s,
                      style: TextStyle(
                        fontSize: 12,
                        color: const Color(0xFF059669),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ).toList(),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildFeedbackButton(String emoji, String label, bool isPositive) {
    return GestureDetector(
      onTap: () => _recordFeedback(
        _sessionPlan!.plan.id,
        isPositive ? 5 : 2,
        isPositive ? 'helpful_plan' : 'needs_improvement',
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isPositive 
              ? AivoTheme.mint.withValues(alpha: 0.15)
              : AivoTheme.coral.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 14)),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: isPositive ? const Color(0xFF059669) : AivoTheme.coral,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInsightRow(String emoji, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 10),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: TextStyle(fontSize: 13, color: AivoTheme.textMuted),
                children: [
                  TextSpan(
                    text: '$label: ',
                    style: const TextStyle(fontWeight: FontWeight.w600, color: AivoTheme.textPrimary),
                  ),
                  TextSpan(text: value),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
