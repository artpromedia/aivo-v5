import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:aivo_shared/aivo_shared.dart';
import 'activity_complete_sheet.dart';

/// Grounding activity screen with 5-4-3-2-1 technique
class GroundingActivityScreen extends StatefulWidget {
  final RegulationActivity activity;

  const GroundingActivityScreen({super.key, required this.activity});

  @override
  State<GroundingActivityScreen> createState() => _GroundingActivityScreenState();
}

class _GroundingActivityScreenState extends State<GroundingActivityScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _fadeController;
  Timer? _sessionTimer;
  int _secondsElapsed = 0;
  int _currentStep = 0;
  bool _isActive = false;
  List<List<String>> _userInputs = [[], [], [], [], []];

  final List<GroundingStep> _steps = [
    GroundingStep(
      number: 5,
      sense: 'SEE',
      instruction: 'Name 5 things you can see',
      emoji: '👀',
      color: const Color(0xFF7DD3FC), // Sky blue
      examples: ['window', 'book', 'lamp', 'plant', 'clock'],
    ),
    GroundingStep(
      number: 4,
      sense: 'TOUCH',
      instruction: 'Name 4 things you can touch',
      emoji: '🖐️',
      color: const Color(0xFF86EFAC), // Mint green
      examples: ['desk', 'fabric', 'hair', 'phone'],
    ),
    GroundingStep(
      number: 3,
      sense: 'HEAR',
      instruction: 'Name 3 things you can hear',
      emoji: '👂',
      color: const Color(0xFFFCA5A5), // Coral
      examples: ['breathing', 'fan', 'birds'],
    ),
    GroundingStep(
      number: 2,
      sense: 'SMELL',
      instruction: 'Name 2 things you can smell',
      emoji: '👃',
      color: const Color(0xFFFCD34D), // Sunshine
      examples: ['air', 'lotion'],
    ),
    GroundingStep(
      number: 1,
      sense: 'TASTE',
      instruction: 'Name 1 thing you can taste',
      emoji: '👅',
      color: const Color(0xFFC4B5FD), // Violet
      examples: ['water'],
    ),
  ];

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
  }

  void _startActivity() {
    setState(() {
      _isActive = true;
      _currentStep = 0;
      _userInputs = [[], [], [], [], []];
    });
    _fadeController.forward();
    _startTimer();
    HapticFeedback.mediumImpact();
  }

  void _startTimer() {
    _sessionTimer?.cancel();
    _sessionTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() => _secondsElapsed++);
    });
  }

  void _addItem(String item) {
    if (item.trim().isEmpty) return;

    final step = _steps[_currentStep];
    if (_userInputs[_currentStep].length < step.number) {
      HapticFeedback.lightImpact();
      setState(() {
        _userInputs[_currentStep].add(item);
      });

      // Auto-advance if step is complete
      if (_userInputs[_currentStep].length >= step.number) {
        Future.delayed(const Duration(milliseconds: 500), () {
          if (_currentStep < _steps.length - 1) {
            _nextStep();
          } else {
            _completeActivity();
          }
        });
      }
    }
  }

  void _removeItem(int index) {
    HapticFeedback.selectionClick();
    setState(() {
      _userInputs[_currentStep].removeAt(index);
    });
  }

  void _nextStep() {
    if (_currentStep < _steps.length - 1) {
      HapticFeedback.mediumImpact();
      _fadeController.reverse().then((_) {
        setState(() => _currentStep++);
        _fadeController.forward();
      });
    } else {
      _completeActivity();
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      _fadeController.reverse().then((_) {
        setState(() => _currentStep--);
        _fadeController.forward();
      });
    }
  }

  void _completeActivity() {
    _sessionTimer?.cancel();
    setState(() => _isActive = false);

    final totalItems = _userInputs.fold<int>(0, (sum, list) => sum + list.length);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      isDismissible: false,
      builder: (_) => ActivityCompleteSheet(
        activity: widget.activity,
        duration: _secondsElapsed,
        extraInfo: '$totalItems items identified',
        onComplete: (effectiveness) {
          Navigator.of(context).pop();
          Navigator.of(context).pop();
        },
      ),
    );
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _sessionTimer?.cancel();
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
              child: _isActive ? _buildGroundingView() : _buildStartView(),
            ),
            if (_isActive) _buildInputArea(),
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
          // Step indicator
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: _isActive
                  ? _steps[_currentStep].color.withOpacity(0.3)
                  : Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              _isActive ? '${_currentStep + 1} / 5' : '5-4-3-2-1',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: _isActive ? _steps[_currentStep].color : Colors.white70,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStartView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('🧘', style: TextStyle(fontSize: 80)),
            const SizedBox(height: 32),
            Text(
              '5-4-3-2-1 Grounding',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.white.withOpacity(0.9),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Use your senses to ground yourself in the present moment.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Colors.white.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: 48),
            // Steps preview
            ..._steps.map((step) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: step.color.withOpacity(0.3),
                        ),
                        child: Center(
                          child: Text(
                            step.number.toString(),
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: step.color,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'things you can ${step.sense}',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.7),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(step.emoji),
                    ],
                  ),
                )),
            const SizedBox(height: 48),
            GestureDetector(
              onTap: _startActivity,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      _steps[0].color,
                      _steps[4].color,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(30),
                  boxShadow: [
                    BoxShadow(
                      color: _steps[0].color.withOpacity(0.4),
                      blurRadius: 20,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: const Text(
                  'Begin',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGroundingView() {
    final step = _steps[_currentStep];
    final items = _userInputs[_currentStep];

    return FadeTransition(
      opacity: _fadeController,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Step progress
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                final isComplete = _userInputs[index].length >= _steps[index].number;
                final isCurrent = index == _currentStep;
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 6),
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isComplete
                        ? _steps[index].color
                        : isCurrent
                            ? _steps[index].color.withOpacity(0.3)
                            : Colors.white.withOpacity(0.1),
                    border: isCurrent
                        ? Border.all(color: _steps[index].color, width: 2)
                        : null,
                  ),
                  child: Center(
                    child: Text(
                      _steps[index].number.toString(),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: isComplete
                            ? const Color(0xFF0F172A)
                            : isCurrent
                                ? _steps[index].color
                                : Colors.white.withOpacity(0.4),
                      ),
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 40),
            // Current step
            Text(
              step.emoji,
              style: const TextStyle(fontSize: 64),
            ),
            const SizedBox(height: 16),
            Text(
              step.instruction,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: step.color,
              ),
            ),
            const SizedBox(height: 32),
            // Items collected
            Expanded(
              child: Wrap(
                spacing: 12,
                runSpacing: 12,
                alignment: WrapAlignment.center,
                children: [
                  ...items.asMap().entries.map((entry) => _buildItemChip(
                        entry.value,
                        step.color,
                        () => _removeItem(entry.key),
                      )),
                  // Empty slots
                  ...List.generate(step.number - items.length, (index) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: step.color.withOpacity(0.3),
                          style: BorderStyle.solid,
                        ),
                      ),
                      child: Text(
                        '${items.length + index + 1}',
                        style: TextStyle(
                          color: step.color.withOpacity(0.4),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
            // Suggestions
            Text(
              'Examples: ${step.examples.join(", ")}',
              style: TextStyle(
                fontSize: 12,
                color: Colors.white.withOpacity(0.4),
              ),
            ),
            const SizedBox(height: 16),
            // Navigation
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (_currentStep > 0)
                  TextButton.icon(
                    onPressed: _previousStep,
                    icon: Icon(Icons.arrow_back, color: Colors.white.withOpacity(0.5)),
                    label: Text(
                      'Back',
                      style: TextStyle(color: Colors.white.withOpacity(0.5)),
                    ),
                  )
                else
                  const SizedBox(width: 80),
                if (items.length >= step.number || _currentStep == _steps.length - 1)
                  TextButton.icon(
                    onPressed: _currentStep == _steps.length - 1 && items.isNotEmpty
                        ? _completeActivity
                        : _nextStep,
                    icon: Text(
                      _currentStep == _steps.length - 1 ? 'Finish' : 'Next',
                      style: TextStyle(color: step.color),
                    ),
                    label: Icon(
                      _currentStep == _steps.length - 1
                          ? Icons.check
                          : Icons.arrow_forward,
                      color: step.color,
                    ),
                  )
                else
                  const SizedBox(width: 80),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildItemChip(String text, Color color, VoidCallback onRemove) {
    return GestureDetector(
      onTap: onRemove,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: color.withOpacity(0.2),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.5)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              text,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: 8),
            Icon(Icons.close, size: 16, color: color.withOpacity(0.7)),
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    final step = _steps[_currentStep];
    final controller = TextEditingController();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        border: Border(
          top: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Type something you can ${step.sense.toLowerCase()}...',
                hintStyle: TextStyle(color: Colors.white.withOpacity(0.4)),
                filled: true,
                fillColor: Colors.white.withOpacity(0.1),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
              ),
              onSubmitted: (value) {
                _addItem(value);
                controller.clear();
              },
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: () {
              _addItem(controller.text);
              controller.clear();
            },
            child: Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: step.color,
              ),
              child: const Icon(
                Icons.add,
                color: Color(0xFF0F172A),
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

/// Data class for grounding steps
class GroundingStep {
  final int number;
  final String sense;
  final String instruction;
  final String emoji;
  final Color color;
  final List<String> examples;

  const GroundingStep({
    required this.number,
    required this.sense,
    required this.instruction,
    required this.emoji,
    required this.color,
    required this.examples,
  });
}
