import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:aivo_shared/aivo_shared.dart';

/// Multi-page regulation flow with 4 sections:
/// 1. Emotion Check-In
/// 2. Activity Selection
/// 3. Activity In Progress
/// 4. Completion
class RegulationScreen extends StatefulWidget {
  final String? gradeTheme; // 'K5' for playful, 'HS' for mature

  const RegulationScreen({super.key, this.gradeTheme});

  @override
  State<RegulationScreen> createState() => _RegulationScreenState();
}

class _RegulationScreenState extends State<RegulationScreen>
    with TickerProviderStateMixin {
  // Flow state
  int _currentPage = 0; // 0: check-in, 1: selection, 2: activity, 3: complete

  // Emotion check-in state (before)
  String? _emotionBefore;
  int _emotionLevelBefore = 3;

  // Emotion check-in state (after)
  String? _emotionAfter;
  int _emotionLevelAfter = 3;

  // Activity state
  RegulationActivity? _selectedActivity;
  RegulationActivityType? _selectedType;

  // Timer state
  Timer? _activityTimer;
  int _secondsElapsed = 0;
  bool _activityPaused = false;

  // Completion state
  int _effectivenessRating = 3;

  // Animation controllers
  late AnimationController _breathingController;
  late AnimationController _pulseController;

  // Breathing phase
  String _breathingPhase = 'inhale';
  int _breathCount = 0;

  // Grade-based theming
  bool get _isPlayful => widget.gradeTheme == 'K5' || widget.gradeTheme == null;

  // Demo activities (hardcoded for offline mode)
  final List<RegulationActivity> _demoActivities = [
    // Breathing
    RegulationActivity(
      id: 'breathing-box',
      name: 'Box Breathing',
      description: 'Breathe in a square pattern: inhale, hold, exhale, hold',
      type: RegulationActivityType.breathing,
      durationSeconds: 120,
      instructions: ['Breathe in for 4 seconds', 'Hold for 4 seconds', 'Breathe out for 4 seconds', 'Hold for 4 seconds'],
    ),
    RegulationActivity(
      id: 'breathing-belly',
      name: 'Belly Breathing',
      description: 'Deep breaths that fill your belly like a balloon',
      type: RegulationActivityType.breathing,
      durationSeconds: 90,
      instructions: ['Place hand on belly', 'Breathe in deeply', 'Feel belly rise', 'Slowly exhale'],
    ),
    RegulationActivity(
      id: 'breathing-478',
      name: '4-7-8 Breathing',
      description: 'A calming breath pattern to help you relax',
      type: RegulationActivityType.breathing,
      durationSeconds: 120,
      instructions: ['Breathe in for 4 seconds', 'Hold for 7 seconds', 'Breathe out for 8 seconds'],
    ),
    // Movement
    RegulationActivity(
      id: 'movement-shake',
      name: 'Shake It Out',
      description: 'Shake your whole body to release tension',
      type: RegulationActivityType.movement,
      durationSeconds: 60,
      instructions: ['Shake your hands', 'Shake your arms', 'Shake your whole body', 'Take a deep breath'],
    ),
    RegulationActivity(
      id: 'movement-stretch',
      name: 'Stretch Break',
      description: 'Gentle stretches to relax your muscles',
      type: RegulationActivityType.movement,
      durationSeconds: 90,
      instructions: ['Reach up high', 'Touch your toes', 'Roll your shoulders', 'Twist gently'],
    ),
    RegulationActivity(
      id: 'movement-jumping',
      name: 'Jumping Jacks',
      description: 'Get your energy out with some jumping jacks',
      type: RegulationActivityType.movement,
      durationSeconds: 60,
      instructions: ['Jump with arms up', 'Land with arms down', 'Keep a steady pace', 'Breathe rhythmically'],
    ),
    // Grounding
    RegulationActivity(
      id: 'grounding-54321',
      name: '5-4-3-2-1 Senses',
      description: 'Notice things around you using your 5 senses',
      type: RegulationActivityType.grounding,
      durationSeconds: 120,
      instructions: ['5 things you see', '4 things you touch', '3 things you hear', '2 things you smell', '1 thing you taste'],
    ),
    RegulationActivity(
      id: 'grounding-body',
      name: 'Body Scan',
      description: 'Notice how each part of your body feels',
      type: RegulationActivityType.grounding,
      durationSeconds: 90,
      instructions: ['Start at your feet', 'Move up slowly', 'Notice any tension', 'Relax each area'],
    ),
    // Sensory
    RegulationActivity(
      id: 'sensory-sounds',
      name: 'Calm Sounds',
      description: 'Listen to peaceful sounds to relax your mind',
      type: RegulationActivityType.sensory,
      durationSeconds: 120,
      instructions: ['Close your eyes', 'Listen to the sounds', 'Breathe slowly', 'Let your mind rest'],
    ),
    RegulationActivity(
      id: 'sensory-visual',
      name: 'Visual Relaxation',
      description: 'Watch calming visuals to help you feel peaceful',
      type: RegulationActivityType.sensory,
      durationSeconds: 90,
      instructions: ['Focus on the colors', 'Let your eyes relax', 'Breathe gently', 'Feel calm wash over you'],
    ),
  ];

  // Emotions with emojis
  final List<Map<String, dynamic>> _emotions = [
    {'id': 'happy', 'emoji': '😊', 'label': 'Happy', 'color': const Color(0xFFFCD34D)},
    {'id': 'calm', 'emoji': '😌', 'label': 'Calm', 'color': const Color(0xFF86EFAC)},
    {'id': 'excited', 'emoji': '🤩', 'label': 'Excited', 'color': const Color(0xFFFCA5A5)},
    {'id': 'tired', 'emoji': '😴', 'label': 'Tired', 'color': const Color(0xFFC4B5FD)},
    {'id': 'anxious', 'emoji': '😰', 'label': 'Anxious', 'color': const Color(0xFF7DD3FC)},
    {'id': 'frustrated', 'emoji': '😤', 'label': 'Frustrated', 'color': const Color(0xFFFCA5A5)},
    {'id': 'sad', 'emoji': '😢', 'label': 'Sad', 'color': const Color(0xFF93C5FD)},
    {'id': 'angry', 'emoji': '😠', 'label': 'Angry', 'color': const Color(0xFFFCA5A5)},
  ];

  @override
  void initState() {
    super.initState();
    _breathingController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    );
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _breathingController.addStatusListener(_onBreathingPhaseComplete);
  }

  void _onBreathingPhaseComplete(AnimationStatus status) {
    if (status == AnimationStatus.completed && !_activityPaused) {
      _nextBreathingPhase();
    }
  }

  void _nextBreathingPhase() {
    HapticFeedback.lightImpact();
    switch (_breathingPhase) {
      case 'inhale':
        setState(() => _breathingPhase = 'holdIn');
        _breathingController.duration = const Duration(seconds: 4);
        _breathingController.forward(from: 0);
        break;
      case 'holdIn':
        setState(() => _breathingPhase = 'exhale');
        _breathingController.duration = const Duration(seconds: 4);
        _breathingController.reverse(from: 1);
        break;
      case 'exhale':
        setState(() => _breathingPhase = 'holdOut');
        _breathingController.duration = const Duration(seconds: 4);
        _breathingController.forward(from: 0);
        break;
      case 'holdOut':
        setState(() {
          _breathingPhase = 'inhale';
          _breathCount++;
        });
        _breathingController.duration = const Duration(seconds: 4);
        _breathingController.forward(from: 0);
        break;
    }
  }

  void _startActivity() {
    if (_selectedActivity == null) return;

    setState(() {
      _currentPage = 2;
      _secondsElapsed = 0;
      _activityPaused = false;
      _breathCount = 0;
      _breathingPhase = 'inhale';
    });

    // Start breathing animation if breathing activity
    if (_selectedActivity!.type == RegulationActivityType.breathing) {
      _breathingController.forward(from: 0);
    }

    _startTimer();
    HapticFeedback.mediumImpact();
  }

  void _startTimer() {
    _activityTimer?.cancel();
    _activityTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!_activityPaused) {
        setState(() => _secondsElapsed++);
        if (_secondsElapsed >= (_selectedActivity?.durationSeconds ?? 0)) {
          _completeActivity();
        }
      }
    });
  }

  void _pauseActivity() {
    setState(() => _activityPaused = true);
    _breathingController.stop();
  }

  void _resumeActivity() {
    setState(() => _activityPaused = false);
    if (_selectedActivity?.type == RegulationActivityType.breathing) {
      _breathingController.forward();
    }
  }

  void _completeActivity() {
    _activityTimer?.cancel();
    _breathingController.stop();
    setState(() {
      _currentPage = 3;
      _emotionAfter = null;
      _emotionLevelAfter = 3;
      _effectivenessRating = 3;
    });
    HapticFeedback.heavyImpact();
  }

  void _finishAndSave() {
    // TODO: Save to API
    HapticFeedback.mediumImpact();
    Navigator.of(context).pop();
  }

  @override
  void dispose() {
    _activityTimer?.cancel();
    _breathingController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildProgressIndicator(),
            Expanded(child: _buildCurrentPage()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final titles = ['How are you feeling?', 'Choose an activity', 'You\'re doing great!', 'Great job! 🎉'];
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.close, color: Colors.white70),
            onPressed: () {
              if (_currentPage == 2) {
                _showExitConfirmation();
              } else {
                Navigator.pop(context);
              }
            },
          ),
          Expanded(
            child: Text(
              titles[_currentPage],
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: _isPlayful ? 22 : 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 48), // Balance the close button
        ],
      ),
    );
  }

  void _showExitConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Leave activity?', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Your progress won\'t be saved.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Stay'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('Leave', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Row(
        children: List.generate(4, (index) {
          final isActive = index <= _currentPage;
          final isCurrent = index == _currentPage;
          return Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              height: 4,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(2),
                color: isActive
                    ? (isCurrent ? AivoTheme.mint : AivoTheme.mint.withOpacity(0.5))
                    : Colors.white.withOpacity(0.2),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildCurrentPage() {
    switch (_currentPage) {
      case 0:
        return _buildEmotionCheckIn(isBefore: true);
      case 1:
        return _buildActivitySelection();
      case 2:
        return _buildActivityInProgress();
      case 3:
        return _buildCompletion();
      default:
        return _buildEmotionCheckIn(isBefore: true);
    }
  }

  // ==================== Page 1: Emotion Check-In ====================
  Widget _buildEmotionCheckIn({required bool isBefore}) {
    final selectedEmotion = isBefore ? _emotionBefore : _emotionAfter;
    final level = isBefore ? _emotionLevelBefore : _emotionLevelAfter;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 20),
          Text(
            _isPlayful ? 'Tap how you feel right now! 👇' : 'Select your current mood',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 32),
          // Emotion grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              childAspectRatio: 0.85,
            ),
            itemCount: _emotions.length,
            itemBuilder: (context, index) {
              final emotion = _emotions[index];
              final isSelected = selectedEmotion == emotion['id'];
              return _buildEmotionTile(emotion, isSelected, isBefore);
            },
          ),
          const SizedBox(height: 40),
          // Intensity slider
          if (selectedEmotion != null) ...[
            Text(
              _isPlayful ? 'How strong is this feeling?' : 'Intensity level',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white.withOpacity(0.9),
              ),
            ),
            const SizedBox(height: 16),
            _buildIntensitySlider(isBefore),
            const SizedBox(height: 40),
          ],
          // Continue button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: selectedEmotion != null
                  ? () {
                      HapticFeedback.mediumImpact();
                      if (isBefore) {
                        setState(() => _currentPage = 1);
                      } else {
                        _finishAndSave();
                      }
                    }
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AivoTheme.mint,
                foregroundColor: const Color(0xFF0F172A),
                disabledBackgroundColor: Colors.white.withOpacity(0.1),
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: Text(
                isBefore ? 'Continue' : 'Finish',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmotionTile(Map<String, dynamic> emotion, bool isSelected, bool isBefore) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() {
          if (isBefore) {
            _emotionBefore = emotion['id'];
          } else {
            _emotionAfter = emotion['id'];
          }
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: isSelected
              ? (emotion['color'] as Color).withOpacity(0.3)
              : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: isSelected
              ? Border.all(color: emotion['color'] as Color, width: 2)
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              emotion['emoji'],
              style: TextStyle(fontSize: isSelected ? 36 : 32),
            ),
            const SizedBox(height: 4),
            Text(
              emotion['label'],
              style: TextStyle(
                fontSize: 12,
                color: isSelected
                    ? emotion['color'] as Color
                    : Colors.white.withOpacity(0.7),
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIntensitySlider(bool isBefore) {
    final level = isBefore ? _emotionLevelBefore : _emotionLevelAfter;
    final labels = _isPlayful
        ? ['A little', 'Some', 'Medium', 'A lot', 'Super strong!']
        : ['Very low', 'Low', 'Moderate', 'High', 'Very high'];

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(5, (index) {
            final isActive = index < level;
            return GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                setState(() {
                  if (isBefore) {
                    _emotionLevelBefore = index + 1;
                  } else {
                    _emotionLevelAfter = index + 1;
                  }
                });
              },
              child: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isActive
                      ? AivoTheme.violet.withOpacity(0.3 + (index * 0.15))
                      : Colors.white.withOpacity(0.1),
                  border: Border.all(
                    color: isActive ? AivoTheme.violet : Colors.white.withOpacity(0.2),
                    width: 2,
                  ),
                ),
                child: Center(
                  child: Text(
                    '${index + 1}',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: isActive ? AivoTheme.violet : Colors.white.withOpacity(0.5),
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 12),
        Text(
          labels[level - 1],
          style: TextStyle(
            fontSize: 14,
            color: AivoTheme.violet,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  // ==================== Page 2: Activity Selection ====================
  Widget _buildActivitySelection() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Type filter
          Text(
            _isPlayful ? 'What kind of activity sounds good? 🤔' : 'Select activity type',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 16),
          _buildTypeFilter(),
          const SizedBox(height: 32),
          // Activities grid
          ..._buildActivitySections(),
          const SizedBox(height: 24),
          // Start button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _selectedActivity != null ? _startActivity : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AivoTheme.mint,
                foregroundColor: const Color(0xFF0F172A),
                disabledBackgroundColor: Colors.white.withOpacity(0.1),
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: Text(
                _selectedActivity != null
                    ? 'Start ${_selectedActivity!.name}'
                    : 'Select an activity',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypeFilter() {
    final types = [
      {'type': null, 'label': 'All', 'emoji': '✨'},
      {'type': RegulationActivityType.breathing, 'label': 'Breathing', 'emoji': '🌬️'},
      {'type': RegulationActivityType.movement, 'label': 'Movement', 'emoji': '🏃'},
      {'type': RegulationActivityType.grounding, 'label': 'Grounding', 'emoji': '🧘'},
      {'type': RegulationActivityType.sensory, 'label': 'Sensory', 'emoji': '✨'},
    ];

    return SizedBox(
      height: 48,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: types.length,
        itemBuilder: (context, index) {
          final type = types[index];
          final isSelected = _selectedType == type['type'];
          return GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              setState(() => _selectedType = type['type'] as RegulationActivityType?);
            },
            child: Container(
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: isSelected
                    ? AivoTheme.violet.withOpacity(0.3)
                    : Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(24),
                border: isSelected
                    ? Border.all(color: AivoTheme.violet, width: 2)
                    : null,
              ),
              child: Row(
                children: [
                  Text(type['emoji'] as String, style: const TextStyle(fontSize: 18)),
                  const SizedBox(width: 8),
                  Text(
                    type['label'] as String,
                    style: TextStyle(
                      color: isSelected ? AivoTheme.violet : Colors.white.withOpacity(0.7),
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  List<Widget> _buildActivitySections() {
    final filteredActivities = _selectedType == null
        ? _demoActivities
        : _demoActivities.where((a) => a.type == _selectedType).toList();

    if (_selectedType != null) {
      return [
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 0.9,
          ),
          itemCount: filteredActivities.length,
          itemBuilder: (context, index) {
            return _buildActivityCard(filteredActivities[index]);
          },
        ),
      ];
    }

    // Group by type
    final grouped = <RegulationActivityType, List<RegulationActivity>>{};
    for (final activity in filteredActivities) {
      grouped.putIfAbsent(activity.type, () => []).add(activity);
    }

    final sections = <Widget>[];
    grouped.forEach((type, activities) {
      sections.add(
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Text(
            _getTypeTitle(type),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ),
      );
      sections.add(
        SizedBox(
          height: 160,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: activities.length,
            itemBuilder: (context, index) {
              return Container(
                width: 160,
                margin: EdgeInsets.only(right: index < activities.length - 1 ? 12 : 0),
                child: _buildActivityCard(activities[index]),
              );
            },
          ),
        ),
      );
      sections.add(const SizedBox(height: 24));
    });

    return sections;
  }

  String _getTypeTitle(RegulationActivityType type) {
    switch (type) {
      case RegulationActivityType.breathing:
        return '🌬️ Breathing';
      case RegulationActivityType.movement:
        return '🏃 Movement';
      case RegulationActivityType.grounding:
        return '🧘 Grounding';
      case RegulationActivityType.sensory:
        return '✨ Sensory';
    }
  }

  Widget _buildActivityCard(RegulationActivity activity) {
    final isSelected = _selectedActivity?.id == activity.id;
    final color = _getActivityColor(activity.type);

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _selectedActivity = activity);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.2) : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(20),
          border: isSelected ? Border.all(color: color, width: 2) : null,
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
                    color: color.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      _getActivityEmoji(activity.type),
                      style: const TextStyle(fontSize: 20),
                    ),
                  ),
                ),
                const Spacer(),
                if (isSelected)
                  Icon(Icons.check_circle, color: color, size: 24),
              ],
            ),
            const Spacer(),
            Text(
              activity.name,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: isSelected ? color : Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${(activity.durationSeconds / 60).round()} min',
              style: TextStyle(
                fontSize: 12,
                color: Colors.white.withOpacity(0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getActivityColor(RegulationActivityType type) {
    switch (type) {
      case RegulationActivityType.breathing:
        return const Color(0xFF7DD3FC);
      case RegulationActivityType.movement:
        return const Color(0xFFFCA5A5);
      case RegulationActivityType.grounding:
        return const Color(0xFF86EFAC);
      case RegulationActivityType.sensory:
        return const Color(0xFFC4B5FD);
    }
  }

  String _getActivityEmoji(RegulationActivityType type) {
    switch (type) {
      case RegulationActivityType.breathing:
        return '🌬️';
      case RegulationActivityType.movement:
        return '🏃';
      case RegulationActivityType.grounding:
        return '🧘';
      case RegulationActivityType.sensory:
        return '✨';
    }
  }

  // ==================== Page 3: Activity In Progress ====================
  Widget _buildActivityInProgress() {
    if (_selectedActivity == null) return const SizedBox();

    final progress = _secondsElapsed / _selectedActivity!.durationSeconds;
    final remainingSeconds = _selectedActivity!.durationSeconds - _secondsElapsed;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // Timer circle
          Expanded(
            child: Center(
              child: _selectedActivity!.type == RegulationActivityType.breathing
                  ? _buildBreathingCircle(progress)
                  : _buildTimerCircle(progress, remainingSeconds),
            ),
          ),
          // Instruction
          _buildCurrentInstruction(),
          const SizedBox(height: 32),
          // Controls
          _buildActivityControls(),
        ],
      ),
    );
  }

  Widget _buildTimerCircle(double progress, int remainingSeconds) {
    return Stack(
      alignment: Alignment.center,
      children: [
        SizedBox(
          width: 220,
          height: 220,
          child: CircularProgressIndicator(
            value: progress,
            strokeWidth: 12,
            backgroundColor: Colors.white.withOpacity(0.1),
            valueColor: AlwaysStoppedAnimation(_getActivityColor(_selectedActivity!.type)),
            strokeCap: StrokeCap.round,
          ),
        ),
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _formatTime(remainingSeconds),
              style: const TextStyle(
                fontSize: 48,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            Text(
              'remaining',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white.withOpacity(0.6),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildBreathingCircle(double progress) {
    return AnimatedBuilder(
      animation: _breathingController,
      builder: (context, child) {
        final baseSize = 120.0;
        final expandedSize = 200.0;
        double size;

        if (_breathingPhase == 'inhale') {
          size = baseSize + (_breathingController.value * (expandedSize - baseSize));
        } else if (_breathingPhase == 'exhale') {
          size = expandedSize - ((1 - _breathingController.value) * (expandedSize - baseSize));
        } else if (_breathingPhase == 'holdIn') {
          size = expandedSize;
        } else {
          size = baseSize;
        }

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF7DD3FC).withOpacity(0.8),
                    const Color(0xFF7DD3FC).withOpacity(0.3),
                    const Color(0xFF7DD3FC).withOpacity(0.1),
                  ],
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF7DD3FC).withOpacity(0.4),
                    blurRadius: 40,
                    spreadRadius: 10,
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  _breathCount.toString(),
                  style: const TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.w200,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),
            Text(
              _getBreathingInstruction(),
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w300,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              _formatTime(_selectedActivity!.durationSeconds - _secondsElapsed),
              style: TextStyle(
                fontSize: 16,
                color: Colors.white.withOpacity(0.6),
              ),
            ),
          ],
        );
      },
    );
  }

  String _getBreathingInstruction() {
    switch (_breathingPhase) {
      case 'inhale':
        return _isPlayful ? 'Breathe in... 🌬️' : 'Inhale';
      case 'holdIn':
        return _isPlayful ? 'Hold it... ✨' : 'Hold';
      case 'exhale':
        return _isPlayful ? 'Breathe out... 💨' : 'Exhale';
      case 'holdOut':
        return _isPlayful ? 'Pause... 🌟' : 'Hold';
      default:
        return '';
    }
  }

  Widget _buildCurrentInstruction() {
    if (_selectedActivity == null) return const SizedBox();

    final instructions = _selectedActivity!.instructions ?? [];
    if (instructions.isEmpty) return const SizedBox();

    final progress = _secondsElapsed / _selectedActivity!.durationSeconds;
    final currentIndex = (progress * instructions.length).floor().clamp(0, instructions.length - 1);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: _getActivityColor(_selectedActivity!.type).withOpacity(0.3),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '${currentIndex + 1}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: _getActivityColor(_selectedActivity!.type),
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              instructions[currentIndex],
              style: const TextStyle(
                fontSize: 16,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityControls() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Pause/Resume button
        GestureDetector(
          onTap: () {
            HapticFeedback.mediumImpact();
            if (_activityPaused) {
              _resumeActivity();
            } else {
              _pauseActivity();
            }
          },
          child: Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _activityPaused
                  ? AivoTheme.mint
                  : Colors.white.withOpacity(0.2),
              boxShadow: [
                BoxShadow(
                  color: AivoTheme.mint.withOpacity(0.3),
                  blurRadius: 20,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Icon(
              _activityPaused ? Icons.play_arrow_rounded : Icons.pause_rounded,
              size: 40,
              color: _activityPaused ? const Color(0xFF0F172A) : Colors.white,
            ),
          ),
        ),
        const SizedBox(width: 24),
        // Skip/Complete button
        GestureDetector(
          onTap: _completeActivity,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(30),
            ),
            child: Text(
              _isPlayful ? 'I\'m done! ✅' : 'End activity',
              style: TextStyle(
                color: Colors.white.withOpacity(0.8),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ==================== Page 4: Completion ====================
  Widget _buildCompletion() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // Celebration
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [AivoTheme.mint, AivoTheme.mint.withOpacity(0.6)],
              ),
            ),
            child: const Center(
              child: Text('🎉', style: TextStyle(fontSize: 50)),
            ),
          ),
          const SizedBox(height: 24),
          // Stats
          _buildCompletionStats(),
          const SizedBox(height: 32),
          // Post-activity emotion check-in
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                Text(
                  _isPlayful ? 'How do you feel now? 🤔' : 'Current mood',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                // Mini emotion grid
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  alignment: WrapAlignment.center,
                  children: _emotions.map((emotion) {
                    final isSelected = _emotionAfter == emotion['id'];
                    return GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _emotionAfter = emotion['id']);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          color: isSelected
                              ? (emotion['color'] as Color).withOpacity(0.3)
                              : Colors.white.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(16),
                          border: isSelected
                              ? Border.all(color: emotion['color'] as Color, width: 2)
                              : null,
                        ),
                        child: Center(
                          child: Text(
                            emotion['emoji'],
                            style: TextStyle(fontSize: isSelected ? 32 : 28),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Effectiveness rating
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                Text(
                  _isPlayful ? 'Did this help? ⭐' : 'How helpful was this activity?',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    final isActive = index < _effectivenessRating;
                    return GestureDetector(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        setState(() => _effectivenessRating = index + 1);
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: Icon(
                          isActive ? Icons.star_rounded : Icons.star_outline_rounded,
                          size: 40,
                          color: isActive ? AivoTheme.sunshine : Colors.white.withOpacity(0.3),
                        ),
                      ),
                    );
                  }),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Before/After comparison
          if (_emotionBefore != null && _emotionAfter != null)
            _buildBeforeAfterComparison(),
          const SizedBox(height: 32),
          // Done button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _emotionAfter != null ? _finishAndSave : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AivoTheme.mint,
                foregroundColor: const Color(0xFF0F172A),
                disabledBackgroundColor: Colors.white.withOpacity(0.1),
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: Text(
                _isPlayful ? 'All done! 🎊' : 'Complete',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompletionStats() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _buildStatChip(Icons.timer_outlined, _formatTime(_secondsElapsed), 'Duration'),
        const SizedBox(width: 16),
        if (_selectedActivity?.type == RegulationActivityType.breathing)
          _buildStatChip(Icons.air, '$_breathCount', 'Breaths'),
      ],
    );
  }

  Widget _buildStatChip(IconData icon, String value, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white.withOpacity(0.7), size: 20),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withOpacity(0.5),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBeforeAfterComparison() {
    final beforeEmotion = _emotions.firstWhere((e) => e['id'] == _emotionBefore);
    final afterEmotion = _emotions.firstWhere((e) => e['id'] == _emotionAfter);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AivoTheme.violet.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AivoTheme.violet.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              children: [
                Text(
                  'Before',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withOpacity(0.6),
                  ),
                ),
                const SizedBox(height: 8),
                Text(beforeEmotion['emoji'], style: const TextStyle(fontSize: 32)),
                Text(
                  beforeEmotion['label'],
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withOpacity(0.7),
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.arrow_forward_rounded,
            color: AivoTheme.violet,
            size: 32,
          ),
          Expanded(
            child: Column(
              children: [
                Text(
                  'After',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withOpacity(0.6),
                  ),
                ),
                const SizedBox(height: 8),
                Text(afterEmotion['emoji'], style: const TextStyle(fontSize: 32)),
                Text(
                  afterEmotion['label'],
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withOpacity(0.7),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(int seconds) {
    final mins = seconds ~/ 60;
    final secs = seconds % 60;
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }
}
