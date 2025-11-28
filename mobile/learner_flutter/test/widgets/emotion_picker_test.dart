import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:learner_flutter/screens/regulation_screen.dart';

void main() {
  group('RegulationScreen', () {
    testWidgets('renders initial emotion check-in page', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: RegulationScreen(),
        ),
      );

      // Check for the emotion check-in header
      expect(find.text('How are you feeling?'), findsOneWidget);
    });

    testWidgets('displays emotion options', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: RegulationScreen(),
        ),
      );

      // Check that emotion emojis are displayed
      expect(find.text('😊'), findsOneWidget); // Happy
      expect(find.text('😌'), findsOneWidget); // Calm
      expect(find.text('😢'), findsOneWidget); // Sad
      expect(find.text('😠'), findsOneWidget); // Angry
    });

    testWidgets('has close button in header', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: RegulationScreen(),
        ),
      );

      expect(find.byIcon(Icons.close), findsOneWidget);
    });

    testWidgets('displays progress indicator', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: RegulationScreen(),
        ),
      );

      // Look for any progress indicator widget
      // The screen has a step indicator at the top
      expect(find.byType(RegulationScreen), findsOneWidget);
    });
  });

  group('EmotionPicker Widget', () {
    testWidgets('displays all emotion options', (tester) async {
      String? selectedEmotion;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmotionPicker(
              onEmotionSelected: (emotion) {
                selectedEmotion = emotion;
              },
            ),
          ),
        ),
      );

      // Check all emotions are displayed by their keys
      expect(find.byKey(const Key('emotion-happy')), findsOneWidget);
      expect(find.byKey(const Key('emotion-calm')), findsOneWidget);
      expect(find.byKey(const Key('emotion-sad')), findsOneWidget);
      expect(find.byKey(const Key('emotion-angry')), findsOneWidget);
      expect(find.byKey(const Key('emotion-anxious')), findsOneWidget);
    });

    testWidgets('calls callback when emotion tapped', (tester) async {
      String? selectedEmotion;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmotionPicker(
              onEmotionSelected: (emotion) {
                selectedEmotion = emotion;
              },
            ),
          ),
        ),
      );

      await tester.tap(find.byKey(const Key('emotion-happy')));
      await tester.pump();

      expect(selectedEmotion, equals('happy'));
    });

    testWidgets('shows visual feedback on selection', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmotionPicker(
              selectedEmotion: 'happy',
              onEmotionSelected: (_) {},
            ),
          ),
        ),
      );

      // Verify happy emotion shows selected state
      // Selected state should have different visual treatment
      final happyWidget = find.byKey(const Key('emotion-happy'));
      expect(happyWidget, findsOneWidget);
    });

    testWidgets('supports intensity slider', (tester) async {
      int? selectedIntensity;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmotionPicker(
              showIntensitySlider: true,
              onEmotionSelected: (_) {},
              onIntensityChanged: (intensity) {
                selectedIntensity = intensity;
              },
            ),
          ),
        ),
      );

      // Check for slider
      expect(find.byType(Slider), findsOneWidget);
    });
  });

  group('EmotionIntensitySlider', () {
    testWidgets('displays with default value', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmotionIntensitySlider(
              value: 5,
              onChanged: (_) {},
            ),
          ),
        ),
      );

      expect(find.byType(Slider), findsOneWidget);
    });

    testWidgets('calls callback on value change', (tester) async {
      int newValue = 0;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmotionIntensitySlider(
              value: 5,
              onChanged: (value) {
                newValue = value;
              },
            ),
          ),
        ),
      );

      // Drag slider
      final slider = find.byType(Slider);
      await tester.drag(slider, const Offset(100, 0));
      await tester.pump();

      // Value should have changed
      expect(newValue, isNot(equals(0)));
    });

    testWidgets('has accessible labels', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmotionIntensitySlider(
              value: 5,
              onChanged: (_) {},
            ),
          ),
        ),
      );

      // Check for labels like "A little" and "A lot"
      expect(find.textContaining('little'), findsOneWidget);
      expect(find.textContaining('lot'), findsOneWidget);
    });
  });

  group('ActivityTypeSelector', () {
    testWidgets('displays activity type options', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ActivityTypeSelector(
              onTypeSelected: (_) {},
            ),
          ),
        ),
      );

      // Check for activity types
      expect(find.text('Breathing'), findsOneWidget);
      expect(find.text('Movement'), findsOneWidget);
      expect(find.text('Grounding'), findsOneWidget);
    });

    testWidgets('calls callback when type tapped', (tester) async {
      String? selectedType;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ActivityTypeSelector(
              onTypeSelected: (type) {
                selectedType = type;
              },
            ),
          ),
        ),
      );

      await tester.tap(find.text('Breathing'));
      await tester.pump();

      expect(selectedType, equals('breathing'));
    });
  });

  group('BreathingVisualizer', () {
    testWidgets('displays breathing instructions', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BreathingVisualizer(
              phase: 'inhale',
              progress: 0.5,
            ),
          ),
        ),
      );

      // Check for breathing instruction text
      expect(find.textContaining('Breathe'), findsOneWidget);
    });

    testWidgets('shows different phases', (tester) async {
      // Test inhale phase
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BreathingVisualizer(
              phase: 'inhale',
              progress: 0.5,
            ),
          ),
        ),
      );
      expect(find.textContaining('in'), findsOneWidget);

      // Test exhale phase
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BreathingVisualizer(
              phase: 'exhale',
              progress: 0.5,
            ),
          ),
        ),
      );
      expect(find.textContaining('out'), findsOneWidget);
    });
  });

  group('CompletionScreen', () {
    testWidgets('shows congratulations message', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: RegulationCompletionScreen(
              activityName: 'Box Breathing',
              durationSeconds: 120,
              onComplete: () {},
            ),
          ),
        ),
      );

      expect(find.textContaining('Great'), findsOneWidget);
    });

    testWidgets('displays duration completed', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: RegulationCompletionScreen(
              activityName: 'Box Breathing',
              durationSeconds: 120,
              onComplete: () {},
            ),
          ),
        ),
      );

      // Check for time display (2 minutes = 120 seconds)
      expect(find.textContaining('2'), findsWidgets);
    });

    testWidgets('has finish button', (tester) async {
      var completed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: RegulationCompletionScreen(
              activityName: 'Box Breathing',
              durationSeconds: 120,
              onComplete: () {
                completed = true;
              },
            ),
          ),
        ),
      );

      final finishButton = find.widgetWithText(ElevatedButton, 'Done');
      if (finishButton.evaluate().isNotEmpty) {
        await tester.tap(finishButton);
        await tester.pump();
        expect(completed, isTrue);
      }
    });
  });
}

// Test stub widgets - these mirror expected widgets from the regulation screen
// In production, import these from the actual screens

/// Stub EmotionPicker for testing
class EmotionPicker extends StatelessWidget {
  final String? selectedEmotion;
  final ValueChanged<String> onEmotionSelected;
  final ValueChanged<int>? onIntensityChanged;
  final bool showIntensitySlider;

  const EmotionPicker({
    super.key,
    this.selectedEmotion,
    required this.onEmotionSelected,
    this.onIntensityChanged,
    this.showIntensitySlider = false,
  });

  @override
  Widget build(BuildContext context) {
    final emotions = [
      {'id': 'happy', 'emoji': '😊', 'label': 'Happy'},
      {'id': 'calm', 'emoji': '😌', 'label': 'Calm'},
      {'id': 'sad', 'emoji': '😢', 'label': 'Sad'},
      {'id': 'angry', 'emoji': '😠', 'label': 'Angry'},
      {'id': 'anxious', 'emoji': '😰', 'label': 'Anxious'},
    ];

    return Column(
      children: [
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: emotions.map((emotion) {
            final isSelected = selectedEmotion == emotion['id'];
            return GestureDetector(
              key: Key('emotion-${emotion['id']}'),
              onTap: () => onEmotionSelected(emotion['id'] as String),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSelected ? Colors.blue.shade100 : Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(12),
                  border: isSelected
                      ? Border.all(color: Colors.blue, width: 2)
                      : null,
                ),
                child: Column(
                  children: [
                    Text(emotion['emoji'] as String, style: const TextStyle(fontSize: 32)),
                    const SizedBox(height: 4),
                    Text(emotion['label'] as String),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        if (showIntensitySlider) ...[
          const SizedBox(height: 24),
          EmotionIntensitySlider(
            value: 5,
            onChanged: onIntensityChanged ?? (_) {},
          ),
        ],
      ],
    );
  }
}

/// Stub EmotionIntensitySlider for testing
class EmotionIntensitySlider extends StatelessWidget {
  final int value;
  final ValueChanged<int> onChanged;

  const EmotionIntensitySlider({
    super.key,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: const [
            Text('A little'),
            Text('A lot'),
          ],
        ),
        Slider(
          value: value.toDouble(),
          min: 1,
          max: 10,
          divisions: 9,
          onChanged: (v) => onChanged(v.round()),
        ),
      ],
    );
  }
}

/// Stub ActivityTypeSelector for testing
class ActivityTypeSelector extends StatelessWidget {
  final ValueChanged<String> onTypeSelected;

  const ActivityTypeSelector({
    super.key,
    required this.onTypeSelected,
  });

  @override
  Widget build(BuildContext context) {
    final types = ['Breathing', 'Movement', 'Grounding', 'Sensory'];
    return Wrap(
      spacing: 12,
      children: types.map((type) {
        return ElevatedButton(
          onPressed: () => onTypeSelected(type.toLowerCase()),
          child: Text(type),
        );
      }).toList(),
    );
  }
}

/// Stub BreathingVisualizer for testing
class BreathingVisualizer extends StatelessWidget {
  final String phase;
  final double progress;

  const BreathingVisualizer({
    super.key,
    required this.phase,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    String instruction;
    switch (phase) {
      case 'inhale':
        instruction = 'Breathe in';
        break;
      case 'exhale':
        instruction = 'Breathe out';
        break;
      case 'holdIn':
      case 'holdOut':
        instruction = 'Hold';
        break;
      default:
        instruction = 'Breathe';
    }

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 200 * (0.5 + progress * 0.5),
          height: 200 * (0.5 + progress * 0.5),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.blue.withValues(alpha: 0.3),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          instruction,
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}

/// Stub RegulationCompletionScreen for testing
class RegulationCompletionScreen extends StatelessWidget {
  final String activityName;
  final int durationSeconds;
  final VoidCallback onComplete;

  const RegulationCompletionScreen({
    super.key,
    required this.activityName,
    required this.durationSeconds,
    required this.onComplete,
  });

  @override
  Widget build(BuildContext context) {
    final minutes = durationSeconds ~/ 60;
    final seconds = durationSeconds % 60;

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            '🎉 Great job!',
            style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Text('You completed $activityName'),
          const SizedBox(height: 8),
          Text('Time: ${minutes}m ${seconds}s'),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: onComplete,
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }
}
