import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

void main() {
  group('EmotionPicker Golden Tests', () {
    testGoldens('EmotionPicker renders correctly in all states', (tester) async {
      final builder = GoldenBuilder.grid(
        columns: 2,
        widthToHeightRatio: 1.2,
      )
        ..addScenario(
          'No selection',
          const TestEmotionPicker(selectedEmotion: null),
        )
        ..addScenario(
          'Happy selected',
          const TestEmotionPicker(selectedEmotion: 'happy'),
        )
        ..addScenario(
          'Sad selected',
          const TestEmotionPicker(selectedEmotion: 'sad'),
        )
        ..addScenario(
          'Angry selected',
          const TestEmotionPicker(selectedEmotion: 'angry'),
        );

      await tester.pumpWidgetBuilder(
        builder.build(),
        surfaceSize: const Size(600, 800),
      );

      await screenMatchesGolden(tester, 'emotion_picker_states');
    }, tags: ['golden']);

    testGoldens('EmotionPicker with intensity slider', (tester) async {
      final builder = GoldenBuilder.column(
        bgColor: Colors.white,
      )
        ..addScenario(
          'Low intensity',
          const TestEmotionPickerWithSlider(
            selectedEmotion: 'anxious',
            intensity: 2,
          ),
        )
        ..addScenario(
          'Medium intensity',
          const TestEmotionPickerWithSlider(
            selectedEmotion: 'anxious',
            intensity: 5,
          ),
        )
        ..addScenario(
          'High intensity',
          const TestEmotionPickerWithSlider(
            selectedEmotion: 'anxious',
            intensity: 9,
          ),
        );

      await tester.pumpWidgetBuilder(
        builder.build(),
        surfaceSize: const Size(400, 600),
      );

      await screenMatchesGolden(tester, 'emotion_picker_intensity');
    }, tags: ['golden']);
  });

  group('HomeworkStep Golden Tests', () {
    testGoldens('HomeworkStepIndicator renders correctly', (tester) async {
      final builder = GoldenBuilder.column(
        bgColor: Colors.white,
      )
        ..addScenario(
          'Step 1 - Understand',
          const TestHomeworkStepIndicator(currentStep: 0),
        )
        ..addScenario(
          'Step 2 - Plan',
          const TestHomeworkStepIndicator(currentStep: 1, completedSteps: [0]),
        )
        ..addScenario(
          'Step 3 - Solve',
          const TestHomeworkStepIndicator(currentStep: 2, completedSteps: [0, 1]),
        )
        ..addScenario(
          'Step 4 - Check',
          const TestHomeworkStepIndicator(currentStep: 3, completedSteps: [0, 1, 2]),
        );

      await tester.pumpWidgetBuilder(
        builder.build(),
        surfaceSize: const Size(400, 400),
      );

      await screenMatchesGolden(tester, 'homework_step_indicator');
    }, tags: ['golden']);
  });

  group('HintButton Golden Tests', () {
    testGoldens('HintButton renders correctly in all states', (tester) async {
      final builder = GoldenBuilder.grid(
        columns: 3,
        widthToHeightRatio: 2.0,
      )
        ..addScenario(
          '3 hints',
          const TestHintButton(hintsRemaining: 3),
        )
        ..addScenario(
          '1 hint',
          const TestHintButton(hintsRemaining: 1),
        )
        ..addScenario(
          '0 hints',
          const TestHintButton(hintsRemaining: 0),
        );

      await tester.pumpWidgetBuilder(
        builder.build(),
        surfaceSize: const Size(600, 200),
      );

      await screenMatchesGolden(tester, 'hint_button_states');
    }, tags: ['golden']);
  });

  group('BreathingVisualizer Golden Tests', () {
    testGoldens('BreathingVisualizer renders breathing phases', (tester) async {
      final builder = GoldenBuilder.grid(
        columns: 2,
        widthToHeightRatio: 1.0,
      )
        ..addScenario(
          'Inhale start',
          const TestBreathingVisualizer(phase: 'inhale', progress: 0.0),
        )
        ..addScenario(
          'Inhale mid',
          const TestBreathingVisualizer(phase: 'inhale', progress: 0.5),
        )
        ..addScenario(
          'Hold',
          const TestBreathingVisualizer(phase: 'hold', progress: 1.0),
        )
        ..addScenario(
          'Exhale',
          const TestBreathingVisualizer(phase: 'exhale', progress: 0.5),
        );

      await tester.pumpWidgetBuilder(
        builder.build(),
        surfaceSize: const Size(500, 500),
      );

      await screenMatchesGolden(tester, 'breathing_visualizer_phases');
    }, tags: ['golden']);
  });

  group('Activity Card Golden Tests', () {
    testGoldens('RegulationActivityCard renders correctly', (tester) async {
      final builder = GoldenBuilder.column(
        bgColor: const Color(0xFF0F172A),
      )
        ..addScenario(
          'Breathing activity',
          const TestActivityCard(
            name: 'Box Breathing',
            description: 'Breathe in a square pattern',
            emoji: '🌬️',
            isSelected: false,
          ),
        )
        ..addScenario(
          'Movement activity selected',
          const TestActivityCard(
            name: 'Shake It Out',
            description: 'Shake your whole body to release tension',
            emoji: '🤸',
            isSelected: true,
          ),
        )
        ..addScenario(
          'Grounding activity',
          const TestActivityCard(
            name: '5-4-3-2-1 Senses',
            description: 'Notice things around you using your senses',
            emoji: '🎯',
            isSelected: false,
          ),
        );

      await tester.pumpWidgetBuilder(
        builder.build(),
        surfaceSize: const Size(400, 500),
      );

      await screenMatchesGolden(tester, 'activity_cards');
    }, tags: ['golden']);
  });

  group('Completion Screen Golden Tests', () {
    testGoldens('CompletionScreen renders correctly', (tester) async {
      final builder = GoldenBuilder.column(
        bgColor: const Color(0xFF0F172A),
      )
        ..addScenario(
          'Homework completion',
          const TestCompletionScreen(
            title: 'Great job!',
            subtitle: 'You completed Math Problem Set',
            emoji: '🎉',
            stats: {'Hints used': '2', 'Time': '15 min'},
          ),
        )
        ..addScenario(
          'Regulation completion',
          const TestCompletionScreen(
            title: 'Well done!',
            subtitle: 'You completed Box Breathing',
            emoji: '✨',
            stats: {'Duration': '2 min', 'Breaths': '8'},
          ),
        );

      await tester.pumpWidgetBuilder(
        builder.build(),
        surfaceSize: const Size(400, 600),
      );

      await screenMatchesGolden(tester, 'completion_screens');
    }, tags: ['golden']);
  });
}

// Test widgets for golden tests

class TestEmotionPicker extends StatelessWidget {
  final String? selectedEmotion;

  const TestEmotionPicker({super.key, this.selectedEmotion});

  @override
  Widget build(BuildContext context) {
    final emotions = [
      {'id': 'happy', 'emoji': '😊', 'label': 'Happy', 'color': const Color(0xFFFCD34D)},
      {'id': 'calm', 'emoji': '😌', 'label': 'Calm', 'color': const Color(0xFF86EFAC)},
      {'id': 'sad', 'emoji': '😢', 'label': 'Sad', 'color': const Color(0xFF93C5FD)},
      {'id': 'angry', 'emoji': '😠', 'label': 'Angry', 'color': const Color(0xFFFCA5A5)},
      {'id': 'anxious', 'emoji': '😰', 'label': 'Anxious', 'color': const Color(0xFF7DD3FC)},
    ];

    return Container(
      color: const Color(0xFF0F172A),
      padding: const EdgeInsets.all(16),
      child: Wrap(
        spacing: 12,
        runSpacing: 12,
        children: emotions.map((emotion) {
          final isSelected = selectedEmotion == emotion['id'];
          return Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected
                  ? (emotion['color'] as Color).withValues(alpha: 0.3)
                  : Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
              border: isSelected
                  ? Border.all(color: emotion['color'] as Color, width: 2)
                  : null,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  emotion['emoji'] as String,
                  style: const TextStyle(fontSize: 36),
                ),
                const SizedBox(height: 4),
                Text(
                  emotion['label'] as String,
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.white70,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

class TestEmotionPickerWithSlider extends StatelessWidget {
  final String? selectedEmotion;
  final int intensity;

  const TestEmotionPickerWithSlider({
    super.key,
    this.selectedEmotion,
    this.intensity = 5,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF0F172A),
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TestEmotionPicker(selectedEmotion: selectedEmotion),
          const SizedBox(height: 24),
          const Text(
            'How strongly do you feel this?',
            style: TextStyle(color: Colors.white70),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Text('A little', style: TextStyle(color: Colors.white54)),
              Expanded(
                child: Slider(
                  value: intensity.toDouble(),
                  min: 1,
                  max: 10,
                  divisions: 9,
                  activeColor: Colors.blue,
                  onChanged: (_) {},
                ),
              ),
              const Text('A lot', style: TextStyle(color: Colors.white54)),
            ],
          ),
        ],
      ),
    );
  }
}

class TestHomeworkStepIndicator extends StatelessWidget {
  final int currentStep;
  final List<int> completedSteps;

  const TestHomeworkStepIndicator({
    super.key,
    required this.currentStep,
    this.completedSteps = const [],
  });

  @override
  Widget build(BuildContext context) {
    final steps = ['Understand', 'Plan', 'Solve', 'Check'];

    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: List.generate(4, (index) {
          final isComplete = completedSteps.contains(index);
          final isCurrent = index == currentStep;

          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isCurrent
                      ? Colors.blue
                      : isComplete
                          ? Colors.green
                          : Colors.grey.shade300,
                ),
                child: Center(
                  child: isComplete && !isCurrent
                      ? const Icon(Icons.check, color: Colors.white, size: 20)
                      : Text(
                          '${index + 1}',
                          style: TextStyle(
                            color: isCurrent || isComplete ? Colors.white : Colors.black,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                steps[index],
                style: TextStyle(
                  fontSize: 12,
                  color: isCurrent ? Colors.blue : Colors.grey,
                ),
              ),
            ],
          );
        }),
      ),
    );
  }
}

class TestHintButton extends StatelessWidget {
  final int hintsRemaining;

  const TestHintButton({super.key, required this.hintsRemaining});

  @override
  Widget build(BuildContext context) {
    final isEnabled = hintsRemaining > 0;

    return Container(
      padding: const EdgeInsets.all(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isEnabled ? Colors.amber : Colors.grey.shade400,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.lightbulb_outline,
              color: isEnabled ? Colors.black87 : Colors.grey.shade600,
            ),
            const SizedBox(width: 8),
            Text(
              'Hint ($hintsRemaining)',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isEnabled ? Colors.black87 : Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class TestBreathingVisualizer extends StatelessWidget {
  final String phase;
  final double progress;

  const TestBreathingVisualizer({
    super.key,
    required this.phase,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    String instruction;
    Color color;

    switch (phase) {
      case 'inhale':
        instruction = 'Breathe in';
        color = Colors.cyan;
        break;
      case 'exhale':
        instruction = 'Breathe out';
        color = Colors.purple;
        break;
      default:
        instruction = 'Hold';
        color = Colors.amber;
    }

    final size = 80 + (progress * 80);

    return Container(
      color: const Color(0xFF0F172A),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color.withValues(alpha: 0.3),
              border: Border.all(color: color, width: 3),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            instruction,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

class TestActivityCard extends StatelessWidget {
  final String name;
  final String description;
  final String emoji;
  final bool isSelected;

  const TestActivityCard({
    super.key,
    required this.name,
    required this.description,
    required this.emoji,
    required this.isSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isSelected
            ? Colors.blue.withValues(alpha: 0.2)
            : Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: isSelected
            ? Border.all(color: Colors.blue, width: 2)
            : Border.all(color: Colors.white24),
      ),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 36)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class TestCompletionScreen extends StatelessWidget {
  final String title;
  final String subtitle;
  final String emoji;
  final Map<String, String> stats;

  const TestCompletionScreen({
    super.key,
    required this.title,
    required this.subtitle,
    required this.emoji,
    required this.stats,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 64)),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 16,
              color: Colors.white70,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ...stats.entries.map((entry) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      '${entry.key}: ',
                      style: const TextStyle(color: Colors.white54),
                    ),
                    Text(
                      entry.value,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              )),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 16),
            ),
            child: const Text('Done', style: TextStyle(fontSize: 18)),
          ),
        ],
      ),
    );
  }
}
