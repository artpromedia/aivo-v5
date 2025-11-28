import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';
import 'emotion_check_in_sheet.dart';
import 'activity_card.dart';
import 'breathing_activity_screen.dart';
import 'movement_activity_screen.dart';
import 'grounding_activity_screen.dart';
import 'sensory_activity_screen.dart';
import 'regulation_history_screen.dart';

/// Main Calm Corner hub - Self-regulation center for learners
class CalmCornerScreen extends StatefulWidget {
  const CalmCornerScreen({super.key});

  @override
  State<CalmCornerScreen> createState() => _CalmCornerScreenState();
}

class _CalmCornerScreenState extends State<CalmCornerScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _breathController;
  EmotionType? _currentEmotion;
  int _emotionLevel = 3;
  RegulationActivityType? _selectedCategory;

  // Demo activities - would come from API
  final List<RegulationActivity> _activities = _getDemoActivities();

  @override
  void initState() {
    super.initState();
    _breathController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _breathController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFFF0FDF4), // green-50
              Color(0xFFECFDF5), // emerald-50
              Color(0xFFF0FDFA), // teal-50
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: CustomScrollView(
            slivers: [
              _buildAppBar(),
              SliverToBoxAdapter(child: _buildContent()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      expandedHeight: 120,
      floating: true,
      pinned: true,
      backgroundColor: Colors.transparent,
      flexibleSpace: FlexibleSpaceBar(
        titlePadding: const EdgeInsets.only(left: 20, bottom: 16),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Animated breathing circle
            AnimatedBuilder(
              animation: _breathController,
              builder: (context, child) {
                return Container(
                  width: 24 + (_breathController.value * 8),
                  height: 24 + (_breathController.value * 8),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        AivoTheme.mint.withOpacity(0.8),
                        AivoTheme.mint.withOpacity(0.3),
                      ],
                    ),
                  ),
                );
              },
            ),
            const SizedBox(width: 12),
            Text(
              'Calm Corner',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AivoTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
      actions: [
        // History button
        IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.history, color: AivoTheme.textMuted),
          ),
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const RegulationHistoryScreen(),
            ),
          ),
        ),
        const SizedBox(width: 12),
      ],
    );
  }

  Widget _buildContent() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Emotion check-in card
          _buildEmotionCard(),
          const SizedBox(height: 24),

          // Quick access section
          _buildQuickAccessSection(),
          const SizedBox(height: 24),

          // Activity categories
          _buildCategoriesSection(),
          const SizedBox(height: 24),

          // Activities grid
          if (_selectedCategory != null) ...[
            _buildActivitiesSection(),
            const SizedBox(height: 24),
          ],

          // Daily tip
          _buildDailyTip(),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildEmotionCard() {
    return GestureDetector(
      onTap: _showEmotionCheckIn,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF10B981), Color(0xFF34D399)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF10B981).withOpacity(0.3),
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
                    'How are you feeling?',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _currentEmotion != null
                        ? 'You\'re feeling ${_currentEmotion!.displayName.toLowerCase()}'
                        : 'Tap to check in with your emotions',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Center(
                child: Text(
                  _currentEmotion?.emoji ?? '🌟',
                  style: const TextStyle(fontSize: 32),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickAccessSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Calm',
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
              child: _buildQuickButton(
                '🌬️',
                'Deep Breath',
                const Color(0xFF7DD3FC),
                () => _startQuickBreathing(),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildQuickButton(
                '⏸️',
                'Pause',
                const Color(0xFFA78BFA),
                () => _startPause(),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildQuickButton(
                '🎵',
                'Calm Sounds',
                const Color(0xFFFCD34D),
                () => _showCalmSounds(),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickButton(
    String emoji,
    String label,
    Color color,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.2),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 28)),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color.withOpacity(1),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoriesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Activities',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AivoTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: RegulationActivityType.values.map((type) {
              final isSelected = _selectedCategory == type;
              return Padding(
                padding: const EdgeInsets.only(right: 12),
                child: _buildCategoryChip(type, isSelected),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryChip(RegulationActivityType type, bool isSelected) {
    return GestureDetector(
      onTap: () => setState(() {
        _selectedCategory = isSelected ? null : type;
      }),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AivoTheme.primary : Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: (isSelected ? AivoTheme.primary : Colors.black)
                  .withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(type.emoji, style: const TextStyle(fontSize: 20)),
            const SizedBox(width: 8),
            Text(
              type.displayName,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.white : AivoTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActivitiesSection() {
    final filteredActivities = _activities
        .where((a) => a.type == _selectedCategory)
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${_selectedCategory!.displayName} Activities',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AivoTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 12),
        ...filteredActivities.map((activity) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: ActivityCard(
                activity: activity,
                onTap: () => _startActivity(activity),
              ),
            )),
      ],
    );
  }

  Widget _buildDailyTip() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AivoTheme.mint.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AivoTheme.mint.withOpacity(0.2),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Center(
              child: Text('💡', style: TextStyle(fontSize: 24)),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Daily Tip',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Taking 3 deep breaths before starting a task can help you focus better!',
                  style: TextStyle(
                    fontSize: 13,
                    color: AivoTheme.textMuted,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showEmotionCheckIn() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => EmotionCheckInSheet(
        currentEmotion: _currentEmotion,
        currentLevel: _emotionLevel,
        onCheckIn: (emotion, level, trigger) {
          setState(() {
            _currentEmotion = emotion;
            _emotionLevel = level;
          });
          Navigator.pop(context);

          // If high distress emotion, suggest activities
          if (emotion.needsRegulation && level >= 3) {
            _showSuggestedActivities(emotion);
          }
        },
      ),
    );
  }

  void _showSuggestedActivities(EmotionType emotion) {
    final suggestions = _activities
        .where((a) => a.recommendedFor.contains(emotion))
        .take(3)
        .toList();

    if (suggestions.isEmpty) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'These might help you feel better ${emotion.emoji}',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ...suggestions.map((activity) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: ActivityCard(
                    activity: activity,
                    onTap: () {
                      Navigator.pop(context);
                      _startActivity(activity);
                    },
                  ),
                )),
            const SizedBox(height: 8),
            Center(
              child: TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Maybe later'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _startActivity(RegulationActivity activity) {
    Widget screen;
    switch (activity.type) {
      case RegulationActivityType.breathing:
        screen = BreathingActivityScreen(activity: activity);
        break;
      case RegulationActivityType.movement:
        screen = MovementActivityScreen(activity: activity);
        break;
      case RegulationActivityType.grounding:
        screen = GroundingActivityScreen(activity: activity);
        break;
      case RegulationActivityType.sensory:
        screen = SensoryActivityScreen(activity: activity);
        break;
    }

    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  void _startQuickBreathing() {
    final quickBreath = _activities.firstWhere(
      (a) => a.type == RegulationActivityType.breathing,
      orElse: () => RegulationActivity(
        id: 'quick-breath',
        name: 'Quick Breath',
        description: 'Take 3 deep breaths',
        type: RegulationActivityType.breathing,
        durationSeconds: 30,
        instructions: ['Breathe in...', 'Hold...', 'Breathe out...'],
        gradeTheme: GradeTheme.K5,
      ),
    );
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BreathingActivityScreen(activity: quickBreath),
      ),
    );
  }

  void _startPause() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => _PauseDialog(),
    );
  }

  void _showCalmSounds() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Calm sounds coming soon! 🎵'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

class _PauseDialog extends StatefulWidget {
  @override
  State<_PauseDialog> createState() => _PauseDialogState();
}

class _PauseDialogState extends State<_PauseDialog>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  int _secondsRemaining = 30;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 30),
    )..forward();

    _controller.addListener(() {
      setState(() {
        _secondsRemaining = (30 * (1 - _controller.value)).round();
      });
      if (_controller.isCompleted) {
        Navigator.pop(context);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: const Color(0xFF1E1B4B),
          borderRadius: BorderRadius.circular(24),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              '⏸️',
              style: TextStyle(fontSize: 48),
            ),
            const SizedBox(height: 16),
            const Text(
              'Taking a pause...',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: 120,
              height: 120,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CircularProgressIndicator(
                    value: 1 - _controller.value,
                    strokeWidth: 8,
                    backgroundColor: Colors.white.withOpacity(0.2),
                    valueColor: const AlwaysStoppedAnimation(AivoTheme.mint),
                  ),
                  Center(
                    child: Text(
                      '$_secondsRemaining',
                      style: const TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'End pause',
                style: TextStyle(color: Colors.white70),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Demo activities
List<RegulationActivity> _getDemoActivities() {
  return [
    // Breathing activities
    RegulationActivity(
      id: 'box-breathing',
      name: 'Box Breathing',
      description: 'Breathe in a calming square pattern',
      type: RegulationActivityType.breathing,
      durationSeconds: 120,
      instructions: [
        'Breathe in for 4 seconds',
        'Hold for 4 seconds',
        'Breathe out for 4 seconds',
        'Hold for 4 seconds',
        'Repeat',
      ],
      gradeTheme: GradeTheme.K5,
      recommendedFor: [EmotionType.anxious, EmotionType.overwhelmed],
    ),
    RegulationActivity(
      id: 'balloon-breath',
      name: 'Balloon Breath',
      description: 'Imagine filling a balloon with your breath',
      type: RegulationActivityType.breathing,
      durationSeconds: 90,
      instructions: [
        'Put your hands on your belly',
        'Breathe in slowly - feel your belly grow like a balloon',
        'Breathe out slowly - feel the balloon deflate',
        'Repeat 5 times',
      ],
      gradeTheme: GradeTheme.K5,
      recommendedFor: [EmotionType.anxious, EmotionType.frustrated],
    ),
    RegulationActivity(
      id: '478-breathing',
      name: '4-7-8 Breathing',
      description: 'A relaxing breathing technique for sleep and calm',
      type: RegulationActivityType.breathing,
      durationSeconds: 180,
      instructions: [
        'Breathe in quietly through your nose for 4 seconds',
        'Hold your breath for 7 seconds',
        'Exhale completely through your mouth for 8 seconds',
        'Repeat the cycle 3-4 times',
      ],
      gradeTheme: GradeTheme.MS,
      recommendedFor: [EmotionType.anxious, EmotionType.tired],
    ),

    // Movement activities
    RegulationActivity(
      id: 'shake-it-out',
      name: 'Shake It Out',
      description: 'Shake away tension from your body',
      type: RegulationActivityType.movement,
      durationSeconds: 60,
      instructions: [
        'Stand up and shake your hands',
        'Shake your arms',
        'Shake your legs one at a time',
        'Shake your whole body!',
        'Slow down and be still',
      ],
      gradeTheme: GradeTheme.K5,
      recommendedFor: [EmotionType.frustrated, EmotionType.angry, EmotionType.excited],
    ),
    RegulationActivity(
      id: 'stretch-break',
      name: 'Stretch Break',
      description: 'Gentle stretches to release tension',
      type: RegulationActivityType.movement,
      durationSeconds: 120,
      instructions: [
        'Reach your arms up high',
        'Slowly bend to touch your toes',
        'Roll your shoulders back',
        'Turn your head side to side',
        'Take a deep breath and relax',
      ],
      gradeTheme: GradeTheme.K5,
      recommendedFor: [EmotionType.tired, EmotionType.frustrated],
    ),
    RegulationActivity(
      id: 'power-pose',
      name: 'Power Pose',
      description: 'Stand tall and feel confident',
      type: RegulationActivityType.movement,
      durationSeconds: 60,
      instructions: [
        'Stand with feet shoulder-width apart',
        'Put your hands on your hips',
        'Stand tall with chest out',
        'Hold for 30 seconds',
        'Take 3 deep breaths',
      ],
      gradeTheme: GradeTheme.MS,
      recommendedFor: [EmotionType.anxious, EmotionType.sad],
    ),

    // Grounding activities
    RegulationActivity(
      id: '5-4-3-2-1',
      name: '5-4-3-2-1 Grounding',
      description: 'Use your senses to feel present',
      type: RegulationActivityType.grounding,
      durationSeconds: 180,
      instructions: [
        'Name 5 things you can SEE',
        'Name 4 things you can TOUCH',
        'Name 3 things you can HEAR',
        'Name 2 things you can SMELL',
        'Name 1 thing you can TASTE',
      ],
      gradeTheme: GradeTheme.K5,
      recommendedFor: [EmotionType.anxious, EmotionType.overwhelmed],
    ),
    RegulationActivity(
      id: 'feet-on-floor',
      name: 'Feet on the Floor',
      description: 'Feel connected to the ground',
      type: RegulationActivityType.grounding,
      durationSeconds: 60,
      instructions: [
        'Sit or stand comfortably',
        'Press your feet firmly into the floor',
        'Notice how solid the ground feels',
        'Imagine roots growing from your feet',
        'Take 3 slow breaths',
      ],
      gradeTheme: GradeTheme.K5,
      recommendedFor: [EmotionType.anxious, EmotionType.overwhelmed],
    ),

    // Sensory activities
    RegulationActivity(
      id: 'hand-massage',
      name: 'Hand Massage',
      description: 'Soothing touch for your hands',
      type: RegulationActivityType.sensory,
      durationSeconds: 90,
      instructions: [
        'Press your palms together',
        'Rub your hands in circles',
        'Gently squeeze each finger',
        'Press your thumbs into your palms',
        'Shake your hands gently',
      ],
      gradeTheme: GradeTheme.K5,
      recommendedFor: [EmotionType.anxious, EmotionType.frustrated],
    ),
    RegulationActivity(
      id: 'butterfly-hug',
      name: 'Butterfly Hug',
      description: 'A comforting self-hug technique',
      type: RegulationActivityType.sensory,
      durationSeconds: 60,
      instructions: [
        'Cross your arms over your chest',
        'Place hands on your shoulders',
        'Tap your shoulders alternately like butterfly wings',
        'Continue for 30 seconds',
        'Take a deep breath',
      ],
      gradeTheme: GradeTheme.K5,
      recommendedFor: [EmotionType.anxious, EmotionType.sad, EmotionType.overwhelmed],
    ),
  ];
}
