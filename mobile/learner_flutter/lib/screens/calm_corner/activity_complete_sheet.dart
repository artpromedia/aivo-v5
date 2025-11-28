import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:aivo_shared/aivo_shared.dart';

/// Bottom sheet shown after completing a regulation activity
class ActivityCompleteSheet extends StatefulWidget {
  final RegulationActivity activity;
  final int duration;
  final String? extraInfo;
  final Function(int effectiveness) onComplete;

  const ActivityCompleteSheet({
    super.key,
    required this.activity,
    required this.duration,
    this.extraInfo,
    required this.onComplete,
  });

  @override
  State<ActivityCompleteSheet> createState() => _ActivityCompleteSheetState();
}

class _ActivityCompleteSheetState extends State<ActivityCompleteSheet> {
  int? _selectedEmotion;
  int _effectiveness = 3;

  final List<Map<String, dynamic>> _emotions = [
    {'emoji': '😊', 'label': 'Great', 'value': 1},
    {'emoji': '🙂', 'label': 'Good', 'value': 2},
    {'emoji': '😐', 'label': 'Okay', 'value': 3},
    {'emoji': '😔', 'label': 'Not great', 'value': 4},
    {'emoji': '😢', 'label': 'Still upset', 'value': 5},
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF1E293B),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 24),
              // Celebration
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [
                      AivoTheme.mint,
                      AivoTheme.mint.withOpacity(0.6),
                    ],
                  ),
                ),
                child: const Center(
                  child: Text('🎉', style: TextStyle(fontSize: 40)),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Great job!',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'You completed ${widget.activity.name}',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.white.withOpacity(0.7),
                ),
              ),
              const SizedBox(height: 16),
              // Stats
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildStat(
                    icon: Icons.timer_outlined,
                    value: _formatTime(widget.duration),
                    label: 'Time',
                  ),
                  const SizedBox(width: 32),
                  if (widget.extraInfo != null)
                    _buildStat(
                      icon: Icons.check_circle_outline,
                      value: widget.extraInfo!.split(' ').first,
                      label: widget.extraInfo!.split(' ').skip(1).join(' '),
                    ),
                ],
              ),
              const SizedBox(height: 32),
              // How do you feel now?
              Text(
                'How do you feel now?',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.white.withOpacity(0.9),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: _emotions.map((emotion) {
                  final isSelected = _selectedEmotion == emotion['value'];
                  return GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() => _selectedEmotion = emotion['value']);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AivoTheme.mint.withOpacity(0.3)
                            : Colors.white.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(16),
                        border: isSelected
                            ? Border.all(color: AivoTheme.mint, width: 2)
                            : null,
                      ),
                      child: Column(
                        children: [
                          Text(
                            emotion['emoji'],
                            style: TextStyle(
                              fontSize: isSelected ? 32 : 28,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            emotion['label'],
                            style: TextStyle(
                              fontSize: 10,
                              color: isSelected
                                  ? AivoTheme.mint
                                  : Colors.white.withOpacity(0.5),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
              // Effectiveness rating
              Text(
                'Did this activity help?',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.white.withOpacity(0.7),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  final isSelected = index < _effectiveness;
                  return GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      setState(() => _effectiveness = index + 1);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.all(8),
                      child: Icon(
                        isSelected ? Icons.star_rounded : Icons.star_outline_rounded,
                        size: 36,
                        color: isSelected
                            ? AivoTheme.sunshine
                            : Colors.white.withOpacity(0.3),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 32),
              // Done button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _selectedEmotion != null
                      ? () {
                          HapticFeedback.mediumImpact();
                          widget.onComplete(_effectiveness);
                        }
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AivoTheme.mint,
                    foregroundColor: AivoTheme.textPrimary,
                    disabledBackgroundColor: Colors.white.withOpacity(0.1),
                    disabledForegroundColor: Colors.white.withOpacity(0.3),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'Done',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              // Supportive message
              if (_selectedEmotion != null && _selectedEmotion! >= 4)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AivoTheme.violet.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Text('💜', style: TextStyle(fontSize: 24)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'It\'s okay to not feel better right away. You\'re doing great by trying. Would you like to try another activity?',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.8),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStat({
    required IconData icon,
    required String value,
    required String label,
  }) {
    return Column(
      children: [
        Icon(icon, color: Colors.white.withOpacity(0.5), size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
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
    );
  }

  String _formatTime(int seconds) {
    if (seconds < 60) {
      return '${seconds}s';
    }
    final mins = seconds ~/ 60;
    final secs = seconds % 60;
    if (secs == 0) {
      return '${mins}m';
    }
    return '${mins}m ${secs}s';
  }
}
