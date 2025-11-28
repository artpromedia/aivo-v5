import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:aivo_shared/aivo_shared.dart';
import 'activity_complete_sheet.dart';

/// Breathing activity screen with animated breathing guide
class BreathingActivityScreen extends StatefulWidget {
  final RegulationActivity activity;

  const BreathingActivityScreen({super.key, required this.activity});

  @override
  State<BreathingActivityScreen> createState() => _BreathingActivityScreenState();
}

class _BreathingActivityScreenState extends State<BreathingActivityScreen>
    with TickerProviderStateMixin {
  late AnimationController _breathController;
  late AnimationController _pulseController;
  Timer? _sessionTimer;
  int _secondsElapsed = 0;
  int _breathCount = 0;
  String _phase = 'inhale';
  bool _isActive = false;
  bool _isPaused = false;

  // Breathing pattern (in seconds)
  final int _inhaleTime = 4;
  final int _holdInTime = 4;
  final int _exhaleTime = 4;
  final int _holdOutTime = 4;

  @override
  void initState() {
    super.initState();
    _breathController = AnimationController(
      vsync: this,
      duration: Duration(seconds: _inhaleTime),
    );

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _breathController.addStatusListener(_onBreathPhaseComplete);
  }

  void _onBreathPhaseComplete(AnimationStatus status) {
    if (!_isActive || _isPaused) return;

    if (status == AnimationStatus.completed) {
      HapticFeedback.lightImpact();
      _nextPhase();
    }
  }

  void _nextPhase() {
    switch (_phase) {
      case 'inhale':
        setState(() => _phase = 'holdIn');
        _breathController.duration = Duration(seconds: _holdInTime);
        _breathController.forward(from: 0);
        break;
      case 'holdIn':
        setState(() => _phase = 'exhale');
        _breathController.duration = Duration(seconds: _exhaleTime);
        _breathController.reverse(from: 1);
        break;
      case 'exhale':
        setState(() => _phase = 'holdOut');
        _breathController.duration = Duration(seconds: _holdOutTime);
        _breathController.forward(from: 0);
        break;
      case 'holdOut':
        setState(() {
          _phase = 'inhale';
          _breathCount++;
        });
        _breathController.duration = Duration(seconds: _inhaleTime);
        _breathController.forward(from: 0);
        break;
    }
  }

  void _startBreathing() {
    setState(() {
      _isActive = true;
      _isPaused = false;
      _phase = 'inhale';
    });
    _breathController.duration = Duration(seconds: _inhaleTime);
    _breathController.forward(from: 0);
    _startTimer();
    HapticFeedback.mediumImpact();
  }

  void _pauseBreathing() {
    setState(() => _isPaused = true);
    _breathController.stop();
    _sessionTimer?.cancel();
  }

  void _resumeBreathing() {
    setState(() => _isPaused = false);
    _breathController.forward();
    _startTimer();
  }

  void _startTimer() {
    _sessionTimer?.cancel();
    _sessionTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() => _secondsElapsed++);
      if (_secondsElapsed >= widget.activity.durationSeconds) {
        _completeActivity();
      }
    });
  }

  void _completeActivity() {
    _sessionTimer?.cancel();
    _breathController.stop();
    setState(() => _isActive = false);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      isDismissible: false,
      builder: (_) => ActivityCompleteSheet(
        activity: widget.activity,
        duration: _secondsElapsed,
        extraInfo: '$_breathCount breaths completed',
        onComplete: (effectiveness) {
          Navigator.of(context).pop(); // Close sheet
          Navigator.of(context).pop(); // Go back to calm corner
        },
      ),
    );
  }

  @override
  void dispose() {
    _breathController.dispose();
    _pulseController.dispose();
    _sessionTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Dark calm background
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(child: _buildBreathingVisual()),
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
          // Progress indicator
          SizedBox(
            width: 48,
            height: 48,
            child: CircularProgressIndicator(
              value: _secondsElapsed / widget.activity.durationSeconds,
              strokeWidth: 3,
              backgroundColor: Colors.white.withOpacity(0.2),
              valueColor: const AlwaysStoppedAnimation(AivoTheme.mint),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBreathingVisual() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Phase instruction
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: Text(
              _getPhaseInstruction(),
              key: ValueKey(_phase),
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w300,
                color: Colors.white.withOpacity(0.9),
              ),
            ),
          ),
          const SizedBox(height: 48),
          // Breathing circle
          AnimatedBuilder(
            animation: _breathController,
            builder: (context, child) {
              final baseSize = 150.0;
              final expandedSize = 250.0;
              double size;

              if (_phase == 'inhale') {
                size = baseSize + (_breathController.value * (expandedSize - baseSize));
              } else if (_phase == 'exhale') {
                size = expandedSize - (_breathController.value * (expandedSize - baseSize));
              } else if (_phase == 'holdIn') {
                size = expandedSize;
              } else {
                size = baseSize;
              }

              if (!_isActive) {
                // Gentle pulse when not active
                size = baseSize + (_pulseController.value * 20);
              }

              return Container(
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
                      blurRadius: 60,
                      spreadRadius: 20,
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    _isActive ? _breathCount.toString() : '🌬️',
                    style: TextStyle(
                      fontSize: _isActive ? 48 : 64,
                      fontWeight: FontWeight.w200,
                      color: Colors.white,
                    ),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 48),
          // Breath count
          if (_isActive)
            Text(
              '$_breathCount breaths',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white.withOpacity(0.6),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildControls() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // Main control button
          GestureDetector(
            onTap: () {
              if (!_isActive) {
                _startBreathing();
              } else if (_isPaused) {
                _resumeBreathing();
              } else {
                _pauseBreathing();
              }
            },
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _isActive
                    ? (_isPaused ? AivoTheme.mint : Colors.white.withOpacity(0.2))
                    : AivoTheme.mint,
                boxShadow: [
                  BoxShadow(
                    color: AivoTheme.mint.withOpacity(0.4),
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
                : 'Tap to begin',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 24),
          // End early button
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

  String _getPhaseInstruction() {
    if (!_isActive) return 'Get comfortable and relax';
    switch (_phase) {
      case 'inhale':
        return 'Breathe in...';
      case 'holdIn':
        return 'Hold...';
      case 'exhale':
        return 'Breathe out...';
      case 'holdOut':
        return 'Hold...';
      default:
        return '';
    }
  }

  String _formatTime(int seconds) {
    final mins = seconds ~/ 60;
    final secs = seconds % 60;
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }
}
