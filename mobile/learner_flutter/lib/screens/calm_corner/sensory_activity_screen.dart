import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:aivo_shared/aivo_shared.dart';
import 'activity_complete_sheet.dart';

/// Sensory activity screen with calming sensory tools
class SensoryActivityScreen extends StatefulWidget {
  final RegulationActivity activity;

  const SensoryActivityScreen({super.key, required this.activity});

  @override
  State<SensoryActivityScreen> createState() => _SensoryActivityScreenState();
}

class _SensoryActivityScreenState extends State<SensoryActivityScreen>
    with TickerProviderStateMixin {
  late AnimationController _glowController;
  Timer? _sessionTimer;
  int _secondsElapsed = 0;
  int _currentToolIndex = 0;
  bool _isActive = false;
  String _touchPattern = '';

  final List<SensoryTool> _tools = [
    SensoryTool(
      name: 'Calm Light',
      description: 'Watch the gentle glowing light',
      emoji: '✨',
      type: SensoryToolType.visual,
      color: const Color(0xFF7DD3FC),
    ),
    SensoryTool(
      name: 'Bubble Pop',
      description: 'Pop the bubbles on screen',
      emoji: '🫧',
      type: SensoryToolType.touch,
      color: const Color(0xFFC4B5FD),
    ),
    SensoryTool(
      name: 'Ocean Waves',
      description: 'Watch the calming waves',
      emoji: '🌊',
      type: SensoryToolType.visual,
      color: const Color(0xFF22D3EE),
    ),
    SensoryTool(
      name: 'Fidget Spinner',
      description: 'Spin the virtual spinner',
      emoji: '🎡',
      type: SensoryToolType.touch,
      color: const Color(0xFF86EFAC),
    ),
    SensoryTool(
      name: 'Color Mixing',
      description: 'Mix calming colors together',
      emoji: '🎨',
      type: SensoryToolType.visual,
      color: const Color(0xFFFCA5A5),
    ),
  ];

  // Bubble pop state
  List<Bubble> _bubbles = [];
  int _poppedCount = 0;

  // Spinner state
  late AnimationController _spinnerController;
  double _spinnerVelocity = 0;

  // Wave state
  late AnimationController _waveController;

  @override
  void initState() {
    super.initState();
    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);

    _spinnerController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );

    _waveController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();

    _generateBubbles();
  }

  void _generateBubbles() {
    _bubbles = List.generate(15, (index) {
      return Bubble(
        id: index,
        x: (index % 5) * 0.2 + 0.1,
        y: (index ~/ 5) * 0.25 + 0.2,
        size: 40 + (index % 3) * 20.0,
        popped: false,
      );
    });
  }

  void _startActivity() {
    setState(() {
      _isActive = true;
      _poppedCount = 0;
      _generateBubbles();
    });
    _startTimer();
    HapticFeedback.mediumImpact();
  }

  void _startTimer() {
    _sessionTimer?.cancel();
    _sessionTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() => _secondsElapsed++);
    });
  }

  void _selectTool(int index) {
    HapticFeedback.selectionClick();
    setState(() => _currentToolIndex = index);
  }

  void _popBubble(int id) {
    final index = _bubbles.indexWhere((b) => b.id == id);
    if (index != -1 && !_bubbles[index].popped) {
      HapticFeedback.lightImpact();
      setState(() {
        _bubbles[index] = _bubbles[index].copyWith(popped: true);
        _poppedCount++;
      });

      // Regenerate if all popped
      if (_bubbles.every((b) => b.popped)) {
        Future.delayed(const Duration(milliseconds: 500), () {
          setState(() => _generateBubbles());
        });
      }
    }
  }

  void _spinSpinner(DragUpdateDetails details) {
    _spinnerVelocity += details.delta.dx * 0.01;
    _spinnerController.animateTo(
      (_spinnerController.value + _spinnerVelocity) % 1.0,
      duration: const Duration(milliseconds: 100),
      curve: Curves.linear,
    );
  }

  void _completeActivity() {
    _sessionTimer?.cancel();
    setState(() => _isActive = false);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      isDismissible: false,
      builder: (_) => ActivityCompleteSheet(
        activity: widget.activity,
        duration: _secondsElapsed,
        extraInfo: '$_poppedCount bubbles popped',
        onComplete: (effectiveness) {
          Navigator.of(context).pop();
          Navigator.of(context).pop();
        },
      ),
    );
  }

  @override
  void dispose() {
    _glowController.dispose();
    _spinnerController.dispose();
    _waveController.dispose();
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
            _buildToolSelector(),
            Expanded(child: _buildToolView()),
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
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: _tools[_currentToolIndex].color.withOpacity(0.3),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              _tools[_currentToolIndex].name,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: _tools[_currentToolIndex].color,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildToolSelector() {
    return SizedBox(
      height: 80,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _tools.length,
        itemBuilder: (context, index) {
          final tool = _tools[index];
          final isSelected = index == _currentToolIndex;
          return GestureDetector(
            onTap: () => _selectTool(index),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isSelected
                    ? tool.color.withOpacity(0.3)
                    : Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
                border: isSelected
                    ? Border.all(color: tool.color, width: 2)
                    : null,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(tool.emoji, style: const TextStyle(fontSize: 24)),
                  const SizedBox(height: 4),
                  Text(
                    tool.name,
                    style: TextStyle(
                      fontSize: 12,
                      color: isSelected ? tool.color : Colors.white.withOpacity(0.6),
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildToolView() {
    if (!_isActive) {
      return _buildStartView();
    }

    switch (_tools[_currentToolIndex].name) {
      case 'Calm Light':
        return _buildCalmLightTool();
      case 'Bubble Pop':
        return _buildBubblePopTool();
      case 'Ocean Waves':
        return _buildOceanWavesTool();
      case 'Fidget Spinner':
        return _buildSpinnerTool();
      case 'Color Mixing':
        return _buildColorMixingTool();
      default:
        return _buildCalmLightTool();
    }
  }

  Widget _buildStartView() {
    final tool = _tools[_currentToolIndex];
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(tool.emoji, style: const TextStyle(fontSize: 80)),
          const SizedBox(height: 24),
          Text(
            tool.name,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: tool.color,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            tool.description,
            style: TextStyle(
              fontSize: 16,
              color: Colors.white.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 48),
          Text(
            'Tap the play button to begin',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withOpacity(0.4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCalmLightTool() {
    return Center(
      child: AnimatedBuilder(
        animation: _glowController,
        builder: (context, child) {
          final tool = _tools[_currentToolIndex];
          return Container(
            width: 200 + (_glowController.value * 50),
            height: 200 + (_glowController.value * 50),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  tool.color.withOpacity(0.8 - _glowController.value * 0.3),
                  tool.color.withOpacity(0.4 - _glowController.value * 0.2),
                  tool.color.withOpacity(0.1),
                  Colors.transparent,
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: tool.color.withOpacity(0.5),
                  blurRadius: 80 + (_glowController.value * 40),
                  spreadRadius: 20 + (_glowController.value * 20),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildBubblePopTool() {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Stack(
          children: _bubbles.map((bubble) {
            if (bubble.popped) {
              return const SizedBox.shrink();
            }
            return Positioned(
              left: bubble.x * constraints.maxWidth - bubble.size / 2,
              top: bubble.y * constraints.maxHeight - bubble.size / 2,
              child: GestureDetector(
                onTap: () => _popBubble(bubble.id),
                child: AnimatedBuilder(
                  animation: _glowController,
                  builder: (context, child) {
                    return Container(
                      width: bubble.size,
                      height: bubble.size,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            Colors.white.withOpacity(0.3),
                            const Color(0xFFC4B5FD).withOpacity(0.5),
                            const Color(0xFFC4B5FD).withOpacity(0.2),
                          ],
                          center: const Alignment(-0.3, -0.3),
                        ),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.3),
                          width: 1,
                        ),
                      ),
                    );
                  },
                ),
              ),
            );
          }).toList(),
        );
      },
    );
  }

  Widget _buildOceanWavesTool() {
    return AnimatedBuilder(
      animation: _waveController,
      builder: (context, child) {
        return CustomPaint(
          painter: WavePainter(
            animation: _waveController.value,
            color: const Color(0xFF22D3EE),
          ),
          child: Container(),
        );
      },
    );
  }

  Widget _buildSpinnerTool() {
    return Center(
      child: GestureDetector(
        onPanUpdate: _spinSpinner,
        child: AnimatedBuilder(
          animation: _spinnerController,
          builder: (context, child) {
            return Transform.rotate(
              angle: _spinnerController.value * 6.28,
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: SweepGradient(
                    colors: [
                      const Color(0xFF86EFAC),
                      const Color(0xFF7DD3FC),
                      const Color(0xFFC4B5FD),
                      const Color(0xFFFCA5A5),
                      const Color(0xFFFCD34D),
                      const Color(0xFF86EFAC),
                    ],
                  ),
                ),
                child: const Center(
                  child: CircleAvatar(
                    radius: 30,
                    backgroundColor: Color(0xFF0F172A),
                    child: Text('🎡', style: TextStyle(fontSize: 32)),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildColorMixingTool() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedBuilder(
            animation: _glowController,
            builder: (context, child) {
              return Stack(
                alignment: Alignment.center,
                children: [
                  Transform.translate(
                    offset: Offset(-40 + _glowController.value * 30, 0),
                    child: Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFFFCA5A5).withOpacity(0.6),
                      ),
                    ),
                  ),
                  Transform.translate(
                    offset: Offset(40 - _glowController.value * 30, 0),
                    child: Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFF7DD3FC).withOpacity(0.6),
                      ),
                    ),
                  ),
                  Transform.translate(
                    offset: Offset(0, 40 - _glowController.value * 30),
                    child: Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFFFCD34D).withOpacity(0.6),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 32),
          Text(
            'Watch the colors blend together',
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
          GestureDetector(
            onTap: () {
              if (!_isActive) {
                _startActivity();
              } else {
                _completeActivity();
              }
            },
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _tools[_currentToolIndex].color,
                boxShadow: [
                  BoxShadow(
                    color: _tools[_currentToolIndex].color.withOpacity(0.4),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Icon(
                _isActive ? Icons.check_rounded : Icons.play_arrow_rounded,
                size: 40,
                color: const Color(0xFF0F172A),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            _isActive ? 'Tap when done' : 'Tap to start',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withOpacity(0.6),
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

/// Data class for sensory tools
class SensoryTool {
  final String name;
  final String description;
  final String emoji;
  final SensoryToolType type;
  final Color color;

  const SensoryTool({
    required this.name,
    required this.description,
    required this.emoji,
    required this.type,
    required this.color,
  });
}

enum SensoryToolType { visual, touch, auditory }

/// Bubble data class
class Bubble {
  final int id;
  final double x;
  final double y;
  final double size;
  final bool popped;

  const Bubble({
    required this.id,
    required this.x,
    required this.y,
    required this.size,
    required this.popped,
  });

  Bubble copyWith({bool? popped}) {
    return Bubble(
      id: id,
      x: x,
      y: y,
      size: size,
      popped: popped ?? this.popped,
    );
  }
}

/// Custom painter for ocean waves
class WavePainter extends CustomPainter {
  final double animation;
  final Color color;

  WavePainter({required this.animation, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Colors.transparent,
          color.withOpacity(0.2),
          color.withOpacity(0.4),
          color.withOpacity(0.6),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    final path = Path();
    path.moveTo(0, size.height);

    for (double i = 0; i <= size.width; i++) {
      final y = size.height * 0.5 +
          (size.height * 0.15) *
              (0.5 +
                  0.5 *
                      (1 +
                          (2 * 3.14159 * (i / size.width + animation * 2))
                              .sin()) /
                          2) +
          (size.height * 0.1) *
              (0.5 +
                  0.5 *
                      (1 +
                          (4 * 3.14159 * (i / size.width - animation))
                              .sin()) /
                          2);
      path.lineTo(i, y);
    }

    path.lineTo(size.width, size.height);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(WavePainter oldDelegate) {
    return oldDelegate.animation != animation;
  }
}

extension on num {
  double sin() => (this * 3.14159 / 180).toDouble();
}
