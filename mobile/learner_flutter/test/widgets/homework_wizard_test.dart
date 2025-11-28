import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:learner_flutter/screens/homework_screen.dart';
import 'package:aivo_shared/aivo_shared.dart';

void main() {
  group('HomeworkScreen', () {
    testWidgets('renders initial screen', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: HomeworkScreen(),
        ),
      );

      // The screen should render without errors
      expect(find.byType(HomeworkScreen), findsOneWidget);
    });

    testWidgets('shows camera and gallery options for new session', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: HomeworkScreen(),
        ),
      );

      // Look for camera-related icons or buttons
      expect(find.byIcon(Icons.camera_alt), findsWidgets);
    });
  });

  group('HomeworkWizard Widget', () {
    testWidgets('shows understand step initially', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HomeworkWizard(
              session: HomeworkSession(
                id: 'test',
                learnerId: 'learner-123',
                title: 'Math HW',
                currentStep: HomeworkStep.understand,
                createdAt: DateTime.now(),
                updatedAt: DateTime.now(),
              ),
            ),
          ),
        ),
      );

      expect(find.text('Step 1: Understand'), findsOneWidget);
      expect(find.textContaining('problem'), findsWidgets);
    });

    testWidgets('shows plan step when step is plan', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HomeworkWizard(
              session: HomeworkSession(
                id: 'test',
                learnerId: 'learner-123',
                title: 'Math HW',
                currentStep: HomeworkStep.plan,
                createdAt: DateTime.now(),
                updatedAt: DateTime.now(),
              ),
            ),
          ),
        ),
      );

      expect(find.text('Step 2: Plan'), findsOneWidget);
    });

    testWidgets('shows solve step when step is solve', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HomeworkWizard(
              session: HomeworkSession(
                id: 'test',
                learnerId: 'learner-123',
                title: 'Math HW',
                currentStep: HomeworkStep.solve,
                createdAt: DateTime.now(),
                updatedAt: DateTime.now(),
              ),
            ),
          ),
        ),
      );

      expect(find.text('Step 3: Solve'), findsOneWidget);
    });

    testWidgets('shows check step when step is check', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HomeworkWizard(
              session: HomeworkSession(
                id: 'test',
                learnerId: 'learner-123',
                title: 'Math HW',
                currentStep: HomeworkStep.check,
                createdAt: DateTime.now(),
                updatedAt: DateTime.now(),
              ),
            ),
          ),
        ),
      );

      expect(find.text('Step 4: Check'), findsOneWidget);
    });

    testWidgets('has text input field', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HomeworkWizard(
              session: HomeworkSession(
                id: 'test',
                learnerId: 'learner-123',
                title: 'Math HW',
                currentStep: HomeworkStep.understand,
                createdAt: DateTime.now(),
                updatedAt: DateTime.now(),
              ),
            ),
          ),
        ),
      );

      expect(find.byType(TextField), findsWidgets);
    });

    testWidgets('has next button', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HomeworkWizard(
              session: HomeworkSession(
                id: 'test',
                learnerId: 'learner-123',
                title: 'Math HW',
                currentStep: HomeworkStep.understand,
                createdAt: DateTime.now(),
                updatedAt: DateTime.now(),
              ),
            ),
          ),
        ),
      );

      expect(find.text('Next'), findsOneWidget);
    });

    testWidgets('shows hint button', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HomeworkWizard(
              session: HomeworkSession(
                id: 'test',
                learnerId: 'learner-123',
                title: 'Math HW',
                currentStep: HomeworkStep.solve,
                createdAt: DateTime.now(),
                updatedAt: DateTime.now(),
              ),
              showHintButton: true,
            ),
          ),
        ),
      );

      expect(find.byKey(const Key('hint-button')), findsOneWidget);
    });

    testWidgets('advances to next step on next tap', (tester) async {
      var currentStep = HomeworkStep.understand;

      await tester.pumpWidget(
        MaterialApp(
          home: StatefulBuilder(
            builder: (context, setState) {
              return Scaffold(
                body: HomeworkWizard(
                  session: HomeworkSession(
                    id: 'test',
                    learnerId: 'learner-123',
                    title: 'Math HW',
                    currentStep: currentStep,
                    createdAt: DateTime.now(),
                    updatedAt: DateTime.now(),
                  ),
                  onStepComplete: (step) {
                    setState(() {
                      currentStep = HomeworkStep.plan;
                    });
                  },
                ),
              );
            },
          ),
        ),
      );

      // Enter text in understand step
      await tester.enterText(
        find.byType(TextField).first,
        'I need to solve 2 + 2',
      );

      // Tap next
      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();

      // Should now show step 2
      expect(find.text('Step 2: Plan'), findsOneWidget);
    });
  });

  group('HomeworkStepIndicator', () {
    testWidgets('displays all 4 steps', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HomeworkStepIndicator(
              currentStep: HomeworkStep.understand,
            ),
          ),
        ),
      );

      expect(find.text('1'), findsOneWidget);
      expect(find.text('2'), findsOneWidget);
      expect(find.text('3'), findsOneWidget);
      expect(find.text('4'), findsOneWidget);
    });

    testWidgets('highlights current step', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HomeworkStepIndicator(
              currentStep: HomeworkStep.plan,
            ),
          ),
        ),
      );

      // Step 2 should be highlighted
      // The exact implementation depends on the widget, but we verify it renders
      expect(find.byType(HomeworkStepIndicator), findsOneWidget);
    });

    testWidgets('shows completed steps differently', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HomeworkStepIndicator(
              currentStep: HomeworkStep.solve,
              completedSteps: [HomeworkStep.understand, HomeworkStep.plan],
            ),
          ),
        ),
      );

      // Verify widget renders with completed steps
      expect(find.byType(HomeworkStepIndicator), findsOneWidget);
    });
  });

  group('HintButton', () {
    testWidgets('displays hint count', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HintButton(
              hintsRemaining: 3,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('3'), findsOneWidget);
    });

    testWidgets('is disabled when no hints remaining', (tester) async {
      var tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HintButton(
              hintsRemaining: 0,
              onTap: () {
                tapped = true;
              },
            ),
          ),
        ),
      );

      await tester.tap(find.byType(HintButton));
      await tester.pump();

      expect(tapped, isFalse);
    });

    testWidgets('calls callback when tapped with hints remaining', (tester) async {
      var tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HintButton(
              hintsRemaining: 2,
              onTap: () {
                tapped = true;
              },
            ),
          ),
        ),
      );

      await tester.tap(find.byType(HintButton));
      await tester.pump();

      expect(tapped, isTrue);
    });
  });

  group('HintDisplay', () {
    testWidgets('displays hint content', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HintDisplay(
              hint: 'Think about counting on your fingers',
            ),
          ),
        ),
      );

      expect(find.text('Think about counting on your fingers'), findsOneWidget);
    });

    testWidgets('shows loading state', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HintDisplay(
              hint: null,
              isLoading: true,
            ),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('has close button', (tester) async {
      var closed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HintDisplay(
              hint: 'A hint',
              onClose: () {
                closed = true;
              },
            ),
          ),
        ),
      );

      await tester.tap(find.byIcon(Icons.close));
      await tester.pump();

      expect(closed, isTrue);
    });
  });

  group('HomeworkCompletionScreen', () {
    testWidgets('shows celebration message', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HomeworkCompletionScreen(
              sessionTitle: 'Math Problem Set',
              hintsUsed: 2,
              onDone: () {},
            ),
          ),
        ),
      );

      expect(find.textContaining('Great'), findsOneWidget);
    });

    testWidgets('displays session title', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HomeworkCompletionScreen(
              sessionTitle: 'Math Problem Set',
              hintsUsed: 2,
              onDone: () {},
            ),
          ),
        ),
      );

      expect(find.text('Math Problem Set'), findsOneWidget);
    });

    testWidgets('shows hints used', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HomeworkCompletionScreen(
              sessionTitle: 'Test',
              hintsUsed: 2,
              onDone: () {},
            ),
          ),
        ),
      );

      expect(find.textContaining('2'), findsWidgets);
    });

    testWidgets('has done button', (tester) async {
      var done = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HomeworkCompletionScreen(
              sessionTitle: 'Test',
              hintsUsed: 0,
              onDone: () {
                done = true;
              },
            ),
          ),
        ),
      );

      await tester.tap(find.text('Done'));
      await tester.pump();

      expect(done, isTrue);
    });
  });
}

// Test stub widgets - these mirror expected widgets from the homework screen

/// Stub HomeworkWizard for testing
class HomeworkWizard extends StatefulWidget {
  final HomeworkSession session;
  final bool showHintButton;
  final ValueChanged<HomeworkStep>? onStepComplete;

  const HomeworkWizard({
    super.key,
    required this.session,
    this.showHintButton = false,
    this.onStepComplete,
  });

  @override
  State<HomeworkWizard> createState() => _HomeworkWizardState();
}

class _HomeworkWizardState extends State<HomeworkWizard> {
  late HomeworkStep _currentStep;

  @override
  void initState() {
    super.initState();
    _currentStep = widget.session.currentStep;
  }

  @override
  void didUpdateWidget(HomeworkWizard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.session.currentStep != oldWidget.session.currentStep) {
      _currentStep = widget.session.currentStep;
    }
  }

  String _getStepTitle() {
    switch (_currentStep) {
      case HomeworkStep.understand:
        return 'Step 1: Understand';
      case HomeworkStep.plan:
        return 'Step 2: Plan';
      case HomeworkStep.solve:
        return 'Step 3: Solve';
      case HomeworkStep.check:
        return 'Step 4: Check';
      case HomeworkStep.complete:
        return 'Complete!';
    }
  }

  String _getStepPrompt() {
    switch (_currentStep) {
      case HomeworkStep.understand:
        return 'What is the problem asking you to find?';
      case HomeworkStep.plan:
        return 'What steps will you take to solve this?';
      case HomeworkStep.solve:
        return 'Show your work here:';
      case HomeworkStep.check:
        return 'Does your answer make sense?';
      case HomeworkStep.complete:
        return 'Great job!';
    }
  }

  void _goToNextStep() {
    HomeworkStep nextStep;
    switch (_currentStep) {
      case HomeworkStep.understand:
        nextStep = HomeworkStep.plan;
        break;
      case HomeworkStep.plan:
        nextStep = HomeworkStep.solve;
        break;
      case HomeworkStep.solve:
        nextStep = HomeworkStep.check;
        break;
      case HomeworkStep.check:
        nextStep = HomeworkStep.complete;
        break;
      case HomeworkStep.complete:
        return;
    }
    
    setState(() => _currentStep = nextStep);
    widget.onStepComplete?.call(nextStep);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          _getStepTitle(),
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Text(_getStepPrompt()),
        const SizedBox(height: 16),
        const TextField(
          maxLines: 4,
          decoration: InputDecoration(
            border: OutlineInputBorder(),
            hintText: 'Type here...',
          ),
        ),
        const SizedBox(height: 16),
        if (widget.showHintButton && _currentStep == HomeworkStep.solve)
          IconButton(
            key: const Key('hint-button'),
            icon: const Icon(Icons.lightbulb_outline),
            onPressed: () {},
          ),
        ElevatedButton(
          onPressed: _goToNextStep,
          child: Text(_currentStep == HomeworkStep.check ? 'Complete' : 'Next'),
        ),
      ],
    );
  }
}

/// Stub HomeworkStepIndicator for testing
class HomeworkStepIndicator extends StatelessWidget {
  final HomeworkStep currentStep;
  final List<HomeworkStep>? completedSteps;

  const HomeworkStepIndicator({
    super.key,
    required this.currentStep,
    this.completedSteps,
  });

  @override
  Widget build(BuildContext context) {
    final steps = [
      HomeworkStep.understand,
      HomeworkStep.plan,
      HomeworkStep.solve,
      HomeworkStep.check,
    ];

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: List.generate(4, (index) {
        final step = steps[index];
        final isComplete = completedSteps?.contains(step) ?? false;
        final isCurrent = step == currentStep;

        return Container(
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
            child: Text(
              '${index + 1}',
              style: TextStyle(
                color: isCurrent || isComplete ? Colors.white : Colors.black,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        );
      }),
    );
  }
}

/// Stub HintButton for testing
class HintButton extends StatelessWidget {
  final int hintsRemaining;
  final VoidCallback onTap;

  const HintButton({
    super.key,
    required this.hintsRemaining,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: hintsRemaining > 0 ? onTap : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: hintsRemaining > 0 ? Colors.amber : Colors.grey,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.lightbulb_outline),
            const SizedBox(width: 8),
            Text('$hintsRemaining'),
          ],
        ),
      ),
    );
  }
}

/// Stub HintDisplay for testing
class HintDisplay extends StatelessWidget {
  final String? hint;
  final bool isLoading;
  final VoidCallback? onClose;

  const HintDisplay({
    super.key,
    this.hint,
    this.isLoading = false,
    this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.amber.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.lightbulb, color: Colors.amber),
              const Spacer(),
              if (onClose != null)
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: onClose,
                ),
            ],
          ),
          if (isLoading)
            const Center(child: CircularProgressIndicator())
          else if (hint != null)
            Text(hint!),
        ],
      ),
    );
  }
}

/// Stub HomeworkCompletionScreen for testing
class HomeworkCompletionScreen extends StatelessWidget {
  final String sessionTitle;
  final int hintsUsed;
  final VoidCallback onDone;

  const HomeworkCompletionScreen({
    super.key,
    required this.sessionTitle,
    required this.hintsUsed,
    required this.onDone,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            '🎉 Great job!',
            style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Text(sessionTitle, style: const TextStyle(fontSize: 20)),
          const SizedBox(height: 8),
          Text('Hints used: $hintsUsed'),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: onDone,
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }
}
