import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:aivo_shared/aivo_shared.dart';
import 'activity_complete_sheet.dart';

/// Movement break activity screen with guided exercises
class MovementActivityScreen extends StatefulWidget {
  final RegulationActivity activity;

  const MovementActivityScreen({super.key, required this.activity});

  @override
  State<MovementActivityScreen> createState() => _MovementActivityScreenState();
}

class _MovementActivityScreenState extends State<MovementActivityScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _bounceController;
  Timer? _sessionTimer;
  Timer? _exerciseTimer;
  int _secondsElapsed = 0;
  int _currentExerciseIndex = 0;
  int _exerciseSecondsRemaining = 0;
  bool _isActive = false;
  bool _isPaused = false;

  final List<MovementExercise> _exercises = [
    MovementExercise(
      name: 'Arm Circles',
      description: 'Make big circles with your arms',
      emoji: '🔄',
      durationSeconds: 20,
    ),
    MovementExercise(
      name: 'Jumping Jacks',
      description: 'Jump and spread your arms and legs',
      emoji: '⭐',
      durationSeconds: 20,
    ),
    MovementExercise(
      name: 'March in Place',
      description: 'Lift your knees up high',
      emoji: '🚶',
      durationSeconds: 20,
    ),
    MovementExercise(
      name: 'Shoulder Shrugs',
      description: 'Lift your shoulders up to your ears',
      emoji: '💪',
      durationSeconds: 15,
    ),
    MovementExercise(
      name: 'Toe Touches',
      description: 'Reach down and touch your toes',
      emoji: '🙆',
      durationSeconds: 20,
    ),
    MovementExercise(
      name: 'Twist Side to Side',
      description: 'Gently twist your body left and right',
      emoji: '🌀',
      durationSeconds: 20,
    ),
    MovementExercise(
      name: 'Shake It Out',
      description: 'Shake your whole body loose!',
      emoji: '🎉',
      durationSeconds: 15,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _bounceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..repeat(reverse: true);
  }

  void _startActivity() {
    setState(() {
      _isActive = true;
      _isPaused = false;
      _currentExerciseIndex = 0;
      _exerciseSecondsRemaining = _exercises[0].durationSeconds;
    });
    _startTimers();
    HapticFeedback.mediumImpact();
  }

  void _startTimers() {
    _sessionTimer?.cancel();
    _exerciseTimer?.cancel();

    _sessionTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() => _secondsElapsed++);
      if (_secondsElapsed >= widget.activity.durationSeconds) {
        _completeActivity();
      }
    });

    _exerciseTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _exerciseSecondsRemaining--;
        if (_exerciseSecondsRemaining <= 0) {
          _nextExercise();
        }
      });
    });
  }

  void _nextExercise() {
    if (_currentExerciseIndex < _exercises.length - 1) {
      HapticFeedback.lightImpact();
      setState(() {
        _currentExerciseIndex++;
        _exerciseSecondsRemaining = _exercises[_currentExerciseIndex].durationSeconds;
      });
    } else {
      // Loop back to first exercise
      setState(() {
        _currentExerciseIndex = 0;
        _exerciseSecondsRemaining = _exercises[0].durationSeconds;
      });
    }
  }

  void _skipExercise() {
    HapticFeedback.selectionClick();
    _nextExercise();
  }

  void _pauseActivity() {
    setState(() => _isPaused = true);
    _sessionTimer?.cancel();
    _exerciseTimer?.cancel();
  }

  void _resumeActivity() {
    setState(() => _isPaused = false);
    _startTimers();
  }

  void _completeActivity() {
    _sessionTimer?.cancel();
    _exerciseTimer?.cancel();
    setState(() => _isActive = false);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      isDismissible: false,
      builder: (_) => ActivityCompleteSheet(
        activity: widget.activity,
        duration: _secondsElapsed,
        extraInfo: '${_currentExerciseIndex + 1} exercises completed',
        onComplete: (effectiveness) {
          Navigator.of(context).pop();
          Navigator.of(context).pop();
        },
      ),
    );
  }

  @override
  void dispose() {
    _bounceController.dispose();
    _sessionTimer?.cancel();
    _exerciseTimer?.cancel();
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
            Expanded(
              child: _isActive ? _buildExerciseView() : _buildStartView(),
            ),
            _buildControls(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.close, color: Colors.white70),
            onPressed: () => Navigator.pop(context),
          ),
          Expanded(
            child: Column(
              children: [
                Text(
                  widget.activity.name,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatTime(_secondsElapsed),
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.7),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            width: 48,
            height: 48,
            child: CircularProgressIndicator(
              value: _secondsElapsed / widget.activity.durationSeconds,
              strokeWidth: 3,
              backgroundColor: Colors.white.withOpacity(0.2),
              valueColor: const AlwaysStoppedAnimation(AivoTheme.coral),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStartView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedBuilder(
            animation: _bounceController,
            builder: (context, child) {
              return Transform.translate(
                offset: Offset(0, _bounceController.value * -20),
                child: const Text(
                  '🏃‍♂️',
                  style: TextStyle(fontSize: 80),
                ),
              );
            },
          ),
          const SizedBox(height: 32),
          Text(
            'Ready to move?',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 48),
            child: Text(
              'You\'ll do quick exercises to get your energy out and help you feel better.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Colors.white.withOpacity(0.6),
              ),
            ),
          ),
          const SizedBox(height: 32),
          // Preview exercises
          SizedBox(
            height: 60,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 24),
              itemCount: _exercises.length,
              itemBuilder: (context, index) {
                final exercise = _exercises[index];
                return Container(
                  margin: const EdgeInsets.only(right: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Text(exercise.emoji, style: const TextStyle(fontSize: 24)),
                      const SizedBox(width: 8),
                      Text(
                        exercise.name,
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExerciseView() {
    final exercise = _exercises[_currentExerciseIndex];

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Progress dots
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(_exercises.length, (index) {
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              width: index == _currentExerciseIndex ? 24 : 8,
              height: 8,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(4),
                color: index == _currentExerciseIndex
                    ? AivoTheme.coral
                    : index < _currentExerciseIndex
                        ? AivoTheme.coral.withOpacity(0.5)
                        : Colors.white.withOpacity(0.2),
              ),
            );
          }),
        ),
        const SizedBox(height: 48),
        // Exercise countdown
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: AivoTheme.coral.withOpacity(0.5),
              width: 4,
            ),
          ),
          child: Center(
            child: Text(
              _exerciseSecondsRemaining.toString(),
              style: const TextStyle(
                fontSize: 48,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ),
        const SizedBox(height: 32),
        // Exercise emoji
        AnimatedBuilder(
          animation: _bounceController,
          builder: (context, child) {
            return Transform.scale(
              scale: 1.0 + (_bounceController.value * 0.1),
              child: Text(
                exercise.emoji,
                style: const TextStyle(fontSize: 80),
              ),
            );
          },
        ),
        const SizedBox(height: 24),
        // Exercise name
        Text(
          exercise.name,
          style: const TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          exercise.description,
          style: TextStyle(
            fontSize: 18,
            color: Colors.white.withOpacity(0.7),
          ),
        ),
        const SizedBox(height: 32),
        // Skip button
        TextButton.icon(
          onPressed: _skipExercise,
          icon: Icon(
            Icons.skip_next_rounded,
            color: Colors.white.withOpacity(0.5),
          ),
          label: Text(
            'Skip this one',
            style: TextStyle(
              color: Colors.white.withOpacity(0.5),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildControls() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          GestureDetector(
            onTap: () {
              if (!_isActive) {
                _startActivity();
              } else if (_isPaused) {
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
                color: _isActive
                    ? (_isPaused ? AivoTheme.coral : Colors.white.withOpacity(0.2))
                    : AivoTheme.coral,
                boxShadow: [
                  BoxShadow(
                    color: AivoTheme.coral.withOpacity(0.4),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Icon(
                _isActive
                    ? (_isPaused ? Icons.play_arrow_rounded : Icons.pause_rounded)
                    : Icons.play_arrow_rounded,
                size: 40,
                color: _isActive && !_isPaused ? Colors.white : AivoTheme.textPrimary,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            _isActive
                ? (_isPaused ? 'Tap to resume' : 'Tap to pause')
                : 'Tap to start',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 24),
          if (_isActive)
            TextButton(
              onPressed: _completeActivity,
              child: Text(
                'End activity',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.5),
                ),
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

/// Data class for movement exercises
class MovementExercise {
  final String name;
  final String description;
  final String emoji;
  final int durationSeconds;

  const MovementExercise({
    required this.name,
    required this.description,
    required this.emoji,
    required this.durationSeconds,
  });
}
