import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';

/// Bottom sheet for emotion check-in
class EmotionCheckInSheet extends StatefulWidget {
  final EmotionType? currentEmotion;
  final int currentLevel;
  final Function(EmotionType emotion, int level, String? trigger) onCheckIn;

  const EmotionCheckInSheet({
    super.key,
    this.currentEmotion,
    this.currentLevel = 3,
    required this.onCheckIn,
  });

  @override
  State<EmotionCheckInSheet> createState() => _EmotionCheckInSheetState();
}

class _EmotionCheckInSheetState extends State<EmotionCheckInSheet> {
  EmotionType? _selectedEmotion;
  int _level = 3;
  String? _selectedTrigger;
  int _step = 0; // 0: emotion, 1: intensity, 2: trigger (optional)

  final List<String> _triggers = [
    'School work',
    'Friends',
    'Family',
    'Tired',
    'Hungry',
    'Bored',
    'Too much noise',
    'Change in plans',
    'Not sure',
  ];

  @override
  void initState() {
    super.initState();
    _selectedEmotion = widget.currentEmotion;
    _level = widget.currentLevel;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle bar
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),

              // Progress dots
              _buildProgressDots(),
              const SizedBox(height: 24),

              // Content based on step
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: _buildStepContent(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProgressDots() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (int i = 0; i < 3; i++) ...[
          Container(
            width: i == _step ? 24 : 8,
            height: 8,
            decoration: BoxDecoration(
              color: i <= _step
                  ? AivoTheme.primary
                  : AivoTheme.primary.withOpacity(0.2),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          if (i < 2) const SizedBox(width: 8),
        ],
      ],
    );
  }

  Widget _buildStepContent() {
    switch (_step) {
      case 0:
        return _buildEmotionStep();
      case 1:
        return _buildIntensityStep();
      case 2:
        return _buildTriggerStep();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildEmotionStep() {
    return Column(
      key: const ValueKey('emotion'),
      children: [
        const Text(
          'How are you feeling right now?',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AivoTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Tap the emoji that matches your mood',
          style: TextStyle(
            fontSize: 14,
            color: AivoTheme.textMuted,
          ),
        ),
        const SizedBox(height: 24),
        // Emotion grid
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 5,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.85,
          children: EmotionType.values.map((emotion) {
            final isSelected = _selectedEmotion == emotion;
            return GestureDetector(
              onTap: () {
                setState(() {
                  _selectedEmotion = emotion;
                });
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AivoTheme.primary.withOpacity(0.15)
                      : Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSelected
                        ? AivoTheme.primary
                        : Colors.transparent,
                    width: 2,
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      emotion.emoji,
                      style: const TextStyle(fontSize: 28),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      emotion.displayName,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                        color: isSelected
                            ? AivoTheme.primary
                            : AivoTheme.textMuted,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        // Next button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _selectedEmotion != null
                ? () => setState(() => _step = 1)
                : null,
            child: const Text('Next'),
          ),
        ),
      ],
    );
  }

  Widget _buildIntensityStep() {
    return Column(
      key: const ValueKey('intensity'),
      children: [
        Text(
          'How ${_selectedEmotion!.displayName.toLowerCase()} do you feel?',
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AivoTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Move the slider to show how strong this feeling is',
          style: TextStyle(
            fontSize: 14,
            color: AivoTheme.textMuted,
          ),
        ),
        const SizedBox(height: 32),
        // Emotion with level
        Text(
          _selectedEmotion!.emoji,
          style: TextStyle(fontSize: 48 + (_level * 8).toDouble()),
        ),
        const SizedBox(height: 24),
        // Slider
        Row(
          children: [
            const Text('A little', style: TextStyle(fontSize: 12)),
            Expanded(
              child: Slider(
                value: _level.toDouble(),
                min: 1,
                max: 5,
                divisions: 4,
                activeColor: AivoTheme.primary,
                onChanged: (value) {
                  setState(() => _level = value.round());
                },
              ),
            ),
            const Text('A lot!', style: TextStyle(fontSize: 12)),
          ],
        ),
        // Level labels
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(5, (index) {
            final level = index + 1;
            final isSelected = level == _level;
            return Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isSelected
                    ? AivoTheme.primary
                    : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Text(
                  '$level',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isSelected
                        ? Colors.white
                        : AivoTheme.textMuted,
                  ),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 32),
        // Buttons
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _step = 0),
                child: const Text('Back'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: () {
                  // If negative emotion with high intensity, ask about trigger
                  if (_selectedEmotion!.needsRegulation && _level >= 3) {
                    setState(() => _step = 2);
                  } else {
                    widget.onCheckIn(_selectedEmotion!, _level, null);
                  }
                },
                child: Text(
                  _selectedEmotion!.needsRegulation && _level >= 3
                      ? 'Next'
                      : 'Done',
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTriggerStep() {
    return Column(
      key: const ValueKey('trigger'),
      children: [
        const Text(
          'What might be causing this feeling?',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AivoTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'This is optional - skip if you\'re not sure',
          style: TextStyle(
            fontSize: 14,
            color: AivoTheme.textMuted,
          ),
        ),
        const SizedBox(height: 24),
        // Trigger chips
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: _triggers.map((trigger) {
            final isSelected = _selectedTrigger == trigger;
            return GestureDetector(
              onTap: () {
                setState(() {
                  _selectedTrigger = isSelected ? null : trigger;
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AivoTheme.primary.withOpacity(0.15)
                      : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSelected
                        ? AivoTheme.primary
                        : Colors.transparent,
                  ),
                ),
                child: Text(
                  trigger,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: isSelected
                        ? AivoTheme.primary
                        : AivoTheme.textPrimary,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 32),
        // Buttons
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _step = 1),
                child: const Text('Back'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: () {
                  widget.onCheckIn(_selectedEmotion!, _level, _selectedTrigger);
                },
                child: const Text('Done'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
