import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';
import '../services/focus_monitor_service.dart';

/// Modal dialog suggesting a brain break
/// 
/// Appears when focus score drops below threshold.
/// Respects cognitive accommodations (no popups setting).
class BreakSuggestionDialog extends StatelessWidget {
  final FocusMonitorService focusMonitor;
  final VoidCallback? onPlayGame;
  final VoidCallback? onBreathingExercise;
  final VoidCallback? onDismiss;

  const BreakSuggestionDialog({
    super.key,
    required this.focusMonitor,
    this.onPlayGame,
    this.onBreathingExercise,
    this.onDismiss,
  });

  /// Show the dialog if appropriate (respects settings)
  static Future<BreakSuggestionResult?> show({
    required BuildContext context,
    required FocusMonitorService focusMonitor,
    SensoryProfile? sensoryProfile,
  }) async {
    // Respect cognitive accommodation for avoiding popups
    if (sensoryProfile?.cognitive.avoidPopups == true) {
      // Don't show popup - mark as dismissed
      focusMonitor.dismissBreakSuggestion();
      return BreakSuggestionResult.dismissed;
    }
    
    focusMonitor.markBreakSuggested();
    
    return showDialog<BreakSuggestionResult>(
      context: context,
      barrierDismissible: false,
      builder: (context) => BreakSuggestionDialog(
        focusMonitor: focusMonitor,
        onPlayGame: () => Navigator.pop(context, BreakSuggestionResult.playGame),
        onBreathingExercise: () => Navigator.pop(context, BreakSuggestionResult.breathing),
        onDismiss: () => Navigator.pop(context, BreakSuggestionResult.dismissed),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
      ),
      child: Container(
        padding: const EdgeInsets.all(24),
        constraints: const BoxConstraints(maxWidth: 340),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Emoji header
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AivoTheme.mint.withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Text('🧠', style: TextStyle(fontSize: 40)),
              ),
            ),
            
            const SizedBox(height: 20),
            
            // Title
            const Text(
              'Time for a Brain Break?',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            
            const SizedBox(height: 12),
            
            // Message
            Text(
              _getEncouragingMessage(),
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AivoTheme.textSecondary,
                fontSize: 15,
                height: 1.4,
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Focus score display
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: _getScoreColor().withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _getScoreIcon(),
                    color: _getScoreColor(),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Focus: ${focusMonitor.focusScore.round()}%',
                    style: TextStyle(
                      color: _getScoreColor(),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Options
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: onPlayGame,
                icon: const Text('🎮', style: TextStyle(fontSize: 18)),
                label: const Text('Play a Game'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AivoTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
            
            const SizedBox(height: 12),
            
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onBreathingExercise,
                icon: const Text('🌬️', style: TextStyle(fontSize: 18)),
                label: const Text('Breathing Exercise'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
            
            const SizedBox(height: 12),
            
            TextButton(
              onPressed: onDismiss,
              child: Text(
                'Not now',
                style: TextStyle(color: AivoTheme.textMuted),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getEncouragingMessage() {
    final score = focusMonitor.focusScore;
    
    if (score < 30) {
      return 'Your brain has been working hard! A quick break will help you learn even better.';
    } else if (score < 50) {
      return 'Taking a short break helps your brain remember more. Ready for some fun?';
    } else {
      return 'A brain break keeps your mind fresh and ready to learn. Pick an activity!';
    }
  }

  Color _getScoreColor() {
    final score = focusMonitor.focusScore;
    if (score >= 60) return AivoTheme.mint;
    if (score >= 40) return AivoTheme.sunshine;
    return AivoTheme.coral;
  }

  IconData _getScoreIcon() {
    final score = focusMonitor.focusScore;
    if (score >= 60) return Icons.sentiment_satisfied;
    if (score >= 40) return Icons.sentiment_neutral;
    return Icons.sentiment_dissatisfied;
  }
}

/// Result of break suggestion dialog
enum BreakSuggestionResult {
  playGame,
  breathing,
  dismissed,
}

/// Non-modal break suggestion banner
/// 
/// Use this instead of dialog for less intrusive suggestions.
class BreakSuggestionBanner extends StatelessWidget {
  final FocusMonitorService focusMonitor;
  final VoidCallback? onTakeBreak;
  final VoidCallback? onDismiss;

  const BreakSuggestionBanner({
    super.key,
    required this.focusMonitor,
    this.onTakeBreak,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AivoTheme.mint.withOpacity(0.9),
            AivoTheme.sky.withOpacity(0.9),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AivoTheme.mint.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          const Text('🧠', style: TextStyle(fontSize: 28)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Time for a brain break!',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'A quick break helps you learn better',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ElevatedButton(
                onPressed: onTakeBreak,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AivoTheme.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  minimumSize: Size.zero,
                ),
                child: const Text('Break'),
              ),
              const SizedBox(height: 4),
              TextButton(
                onPressed: onDismiss,
                style: TextButton.styleFrom(
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text(
                  'Later',
                  style: TextStyle(fontSize: 11),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Snackbar-style break suggestion
/// 
/// Least intrusive option for break suggestions.
class BreakSuggestionSnackBar {
  static void show(
    BuildContext context, {
    required FocusMonitorService focusMonitor,
    required VoidCallback onTakeBreak,
  }) {
    focusMonitor.markBreakSuggested();
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Text('🧠', style: TextStyle(fontSize: 20)),
            const SizedBox(width: 12),
            const Expanded(
              child: Text('Time for a brain break?'),
            ),
            TextButton(
              onPressed: () {
                ScaffoldMessenger.of(context).hideCurrentSnackBar();
                onTakeBreak();
              },
              child: const Text(
                'Let\'s Go!',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        backgroundColor: AivoTheme.mint,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 8),
        action: SnackBarAction(
          label: 'Later',
          textColor: Colors.white70,
          onPressed: () {
            focusMonitor.dismissBreakSuggestion();
          },
        ),
      ),
    );
  }
}
