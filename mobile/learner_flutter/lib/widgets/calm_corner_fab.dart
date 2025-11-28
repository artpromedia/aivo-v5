import 'dart:math';
import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';
import '../services/focus_monitor_service.dart';

/// Floating Action Button for Calm Corner / Focus Break access
/// 
/// Shows on learner screens and pulses gently when a break is suggested.
class CalmCornerFab extends StatefulWidget {
  final FocusMonitorService? focusMonitor;
  final VoidCallback? onPressed;
  final bool showPulse;

  const CalmCornerFab({
    super.key,
    this.focusMonitor,
    this.onPressed,
    this.showPulse = false,
  });

  @override
  State<CalmCornerFab> createState() => _CalmCornerFabState();
}

class _CalmCornerFabState extends State<CalmCornerFab>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(
        parent: _pulseController,
        curve: Curves.easeInOut,
      ),
    );
    
    // Listen to focus monitor for break suggestions
    widget.focusMonitor?.addListener(_onFocusChange);
    
    _updatePulseState();
  }

  @override
  void didUpdateWidget(CalmCornerFab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.focusMonitor != widget.focusMonitor) {
      oldWidget.focusMonitor?.removeListener(_onFocusChange);
      widget.focusMonitor?.addListener(_onFocusChange);
    }
    _updatePulseState();
  }

  void _onFocusChange() {
    _updatePulseState();
  }

  void _updatePulseState() {
    final shouldPulse = widget.showPulse ||
        (widget.focusMonitor?.breakSuggested ?? false);
    
    if (shouldPulse) {
      if (!_pulseController.isAnimating) {
        _pulseController.repeat(reverse: true);
      }
    } else {
      _pulseController.stop();
      _pulseController.reset();
    }
  }

  @override
  void dispose() {
    widget.focusMonitor?.removeListener(_onFocusChange);
    _pulseController.dispose();
    super.dispose();
  }

  void _handlePress() {
    if (widget.onPressed != null) {
      widget.onPressed!();
    } else {
      _showCalmCornerOptions();
    }
  }

  void _showCalmCornerOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => _CalmCornerOptionsSheet(
        focusMonitor: widget.focusMonitor,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final shouldPulse = widget.showPulse ||
        (widget.focusMonitor?.breakSuggested ?? false);

    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: shouldPulse ? _pulseAnimation.value : 1.0,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              // Pulse ring effect
              if (shouldPulse)
                Positioned.fill(
                  child: AnimatedBuilder(
                    animation: _pulseAnimation,
                    builder: (context, _) {
                      return Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AivoTheme.mint.withOpacity(
                              (1 - (_pulseAnimation.value - 1) / 0.15) * 0.5,
                            ),
                            width: 4,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              FloatingActionButton.extended(
                heroTag: 'calm-corner-fab',
                onPressed: _handlePress,
                backgroundColor: shouldPulse
                    ? AivoTheme.mint
                    : AivoTheme.mint.withOpacity(0.9),
                foregroundColor: AivoTheme.textPrimary,
                elevation: shouldPulse ? 8 : 4,
                icon: const Text('🧘', style: TextStyle(fontSize: 20)),
                label: Text(
                  shouldPulse ? 'Take a Break' : 'Calm Corner',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
              // Notification badge when break is suggested
              if (shouldPulse)
                Positioned(
                  top: -4,
                  right: -4,
                  child: Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      color: AivoTheme.coral,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: const Center(
                      child: Text(
                        '!',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

/// Bottom sheet with Calm Corner options
class _CalmCornerOptionsSheet extends StatelessWidget {
  final FocusMonitorService? focusMonitor;

  const _CalmCornerOptionsSheet({this.focusMonitor});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Header
                  Row(
                    children: [
                      const Text('🧘', style: TextStyle(fontSize: 28)),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Calm Corner',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'Take a moment for yourself',
                            style: TextStyle(
                              color: AivoTheme.textMuted,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Options
                  _OptionTile(
                    emoji: '🎮',
                    title: 'Play a Game',
                    subtitle: 'Fun brain breaks to refresh your mind',
                    color: AivoTheme.primary,
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.pushNamed(context, '/focus-break');
                    },
                  ),
                  
                  const SizedBox(height: 12),
                  
                  _OptionTile(
                    emoji: '🌬️',
                    title: 'Breathing Exercise',
                    subtitle: 'Calm breathing to relax',
                    color: AivoTheme.sky,
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.pushNamed(context, '/regulation');
                    },
                  ),
                  
                  const SizedBox(height: 12),
                  
                  _OptionTile(
                    emoji: '🎨',
                    title: 'Full Calm Corner',
                    subtitle: 'All tools and activities',
                    color: AivoTheme.mint,
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.pushNamed(context, '/calm-corner');
                    },
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // Focus score (if available)
                  if (focusMonitor != null)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AivoTheme.surfaceBackground,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          _FocusScoreIndicator(
                            score: focusMonitor!.focusScore,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Focus Level',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                Text(
                                  _getFocusMessage(focusMonitor!.focusScore),
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
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getFocusMessage(double score) {
    if (score >= 80) return 'Great focus! Keep it up! 🌟';
    if (score >= 60) return 'Doing well! A short break might help.';
    if (score >= 40) return 'Time for a brain break! 🧠';
    return 'Let\'s recharge with a fun activity!';
  }
}

/// Option tile in the Calm Corner sheet
class _OptionTile extends StatelessWidget {
  final String emoji;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _OptionTile({
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
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: color.withOpacity(0.2),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(emoji, style: const TextStyle(fontSize: 24)),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
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
            Icon(Icons.arrow_forward_ios, size: 16, color: color),
          ],
        ),
      ),
    );
  }
}

/// Circular focus score indicator
class _FocusScoreIndicator extends StatelessWidget {
  final double score;

  const _FocusScoreIndicator({required this.score});

  Color _getScoreColor() {
    if (score >= 80) return AivoTheme.success;
    if (score >= 60) return AivoTheme.mint;
    if (score >= 40) return AivoTheme.sunshine;
    return AivoTheme.coral;
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 56,
      height: 56,
      child: Stack(
        fit: StackFit.expand,
        children: [
          CircularProgressIndicator(
            value: score / 100,
            strokeWidth: 6,
            backgroundColor: Colors.grey.shade200,
            valueColor: AlwaysStoppedAnimation<Color>(_getScoreColor()),
          ),
          Center(
            child: Text(
              '${score.round()}',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: _getScoreColor(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Compact FAB version for smaller screens
class CompactCalmCornerFab extends StatelessWidget {
  final FocusMonitorService? focusMonitor;
  final VoidCallback? onPressed;

  const CompactCalmCornerFab({
    super.key,
    this.focusMonitor,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final shouldPulse = focusMonitor?.breakSuggested ?? false;
    
    return FloatingActionButton(
      heroTag: 'compact-calm-fab',
      mini: true,
      onPressed: onPressed ?? () => Navigator.pushNamed(context, '/calm-corner'),
      backgroundColor: shouldPulse ? AivoTheme.coral : AivoTheme.mint,
      child: shouldPulse
          ? const Icon(Icons.notifications_active, color: Colors.white)
          : const Text('🧘', style: TextStyle(fontSize: 16)),
    );
  }
}
