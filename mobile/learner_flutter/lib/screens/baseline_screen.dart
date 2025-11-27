import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';

class BaselineScreen extends StatefulWidget {
  const BaselineScreen({super.key});

  @override
  State<BaselineScreen> createState() => _BaselineScreenState();
}

class _BaselineScreenState extends State<BaselineScreen> {
  final AivoApiClient _client = AivoApiClient();
  final PageController _pageController = PageController();

  bool _loading = false;
  String? _assessmentId;
  String? _error;
  String? _learnerId;
  List<String> _subjects = ['math', 'reading'];
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _loadLearnerInfo();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _loadLearnerInfo() async {
    try {
      final me = await _client.me();
      if (me.learner != null) {
        setState(() {
          _learnerId = me.learner!.id;
          _subjects = me.learner!.subjects ?? ['math', 'reading'];
        });
      }
    } catch (e) {
      // Silent fail - will prompt user to retry when starting baseline
    }
  }

  Future<void> _startBaseline() async {
    if (_learnerId == null) {
      setState(() {
        _error = 'Unable to identify learner. Please try again.';
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final result = await _client.generateBaseline(
        learnerId: _learnerId!,
        subjects: _subjects,
      );
      setState(() {
        _assessmentId = result.assessment.id;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to start baseline check-in: $e';
        _loading = false;
      });
    }
  }

  void _nextPage() {
    if (_currentPage < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOutCubic,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AivoTheme.backgroundGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Custom app bar
              _buildAppBar(),
              
              // Progress dots
              _buildProgressDots(),
              
              // Page content
              Expanded(
                child: PageView(
                  controller: _pageController,
                  onPageChanged: (page) => setState(() => _currentPage = page),
                  children: [
                    _buildWelcomePage(),
                    _buildInfoPage(),
                    _buildStartPage(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(Icons.arrow_back_rounded, color: AivoTheme.textPrimary),
            ),
          ),
          const Spacer(),
          if (_currentPage < 2)
            TextButton(
              onPressed: () {
                _pageController.animateToPage(
                  2,
                  duration: const Duration(milliseconds: 400),
                  curve: Curves.easeOutCubic,
                );
              },
              child: Text(
                'Skip',
                style: TextStyle(
                  color: AivoTheme.textMuted,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildProgressDots() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(3, (index) {
          final isActive = index == _currentPage;
          return AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            margin: const EdgeInsets.symmetric(horizontal: 4),
            width: isActive ? 28 : 10,
            height: 10,
            decoration: BoxDecoration(
              color: isActive ? AivoTheme.primary : AivoTheme.primary.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(5),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildWelcomePage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 20),
          // Friendly illustration
          Container(
            width: 160,
            height: 160,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AivoTheme.primary.withValues(alpha: 0.15),
                  AivoTheme.sky.withValues(alpha: 0.15),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(80),
            ),
            child: const Center(
              child: Text('👋', style: TextStyle(fontSize: 80)),
            ),
          ),
          const SizedBox(height: 40),
          const Text(
            'Welcome to AIVO!',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AivoTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            "We're so excited to meet you! Before we start, let's do a quick check-in to learn about you.",
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              color: AivoTheme.textMuted,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 40),
          _buildNextButton(),
        ],
      ),
    );
  }

  Widget _buildInfoPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 20),
          // Features illustration
          Container(
            width: 140,
            height: 140,
            decoration: BoxDecoration(
              color: AivoTheme.mint.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(70),
            ),
            child: const Center(
              child: Text('🌟', style: TextStyle(fontSize: 70)),
            ),
          ),
          const SizedBox(height: 40),
          const Text(
            "What to Expect",
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.bold,
              color: AivoTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 32),
          
          // Feature cards
          _buildFeatureCard(
            '⏱️',
            'Just 5-10 minutes',
            "It's short and sweet - we'll get to know you quickly!",
            AivoTheme.sky,
          ),
          const SizedBox(height: 16),
          _buildFeatureCard(
            '🎯',
            'Adapts to you',
            'The questions will adjust to your pace. No pressure!',
            AivoTheme.primary,
          ),
          const SizedBox(height: 16),
          _buildFeatureCard(
            '💜',
            'No wrong answers',
            "This isn't a test. It just helps us understand how to help you best.",
            AivoTheme.mint,
          ),
          
          const SizedBox(height: 40),
          _buildNextButton(),
        ],
      ),
    );
  }

  Widget _buildFeatureCard(String emoji, String title, String description, Color color) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.15),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
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
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 13,
                    color: AivoTheme.textMuted,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStartPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 20),
          // Ready illustration
          Container(
            width: 160,
            height: 160,
            decoration: BoxDecoration(
              gradient: AivoTheme.primaryGradient,
              borderRadius: BorderRadius.circular(80),
              boxShadow: [
                BoxShadow(
                  color: AivoTheme.primary.withValues(alpha: 0.4),
                  blurRadius: 30,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: const Center(
              child: Text('🚀', style: TextStyle(fontSize: 80)),
            ),
          ),
          const SizedBox(height: 40),
          const Text(
            "You're Ready!",
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AivoTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            "Remember: take your time, breathe, and just be yourself. You've got this! 💪",
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              color: AivoTheme.textMuted,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 40),

          // Error state
          if (_error != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: AivoTheme.coral.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AivoTheme.coral.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Text('😅', style: TextStyle(fontSize: 24)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Oops! Something went wrong. Tap the button to try again.',
                      style: TextStyle(
                        color: AivoTheme.coral,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Success state
          if (_assessmentId != null) ...[
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AivoTheme.mint.withValues(alpha: 0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Container(
                    width: 70,
                    height: 70,
                    decoration: BoxDecoration(
                      color: AivoTheme.mint.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(35),
                    ),
                    child: const Center(
                      child: Text('🎉', style: TextStyle(fontSize: 36)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Assessment Started!',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AivoTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "You're all set. Let's begin your learning journey!",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: AivoTheme.textMuted,
                    ),
                  ),
                  const SizedBox(height: 20),
                  GestureDetector(
                    onTap: () => Navigator.pushReplacementNamed(context, '/'),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        gradient: AivoTheme.primaryGradient,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: AivoTheme.primary.withValues(alpha: 0.4),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Text(
                          'Go to Home',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            // Start button
            GestureDetector(
              onTap: _loading ? null : _startBaseline,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 18),
                decoration: BoxDecoration(
                  gradient: AivoTheme.primaryGradient,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AivoTheme.primary.withValues(alpha: 0.4),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Center(
                  child: _loading
                      ? Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            ),
                            const SizedBox(width: 14),
                            const Text(
                              'Getting things ready...',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        )
                      : const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              "Let's Start!",
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            SizedBox(width: 10),
                            Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 22),
                          ],
                        ),
                ),
              ),
            ),
          ],
          
          const SizedBox(height: 30),
          // Encouragement text
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('🌈', style: TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
              Text(
                'Take your time. There\'s no rush.',
                style: TextStyle(
                  fontSize: 14,
                  color: AivoTheme.textMuted,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNextButton() {
    return GestureDetector(
      onTap: _nextPage,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AivoTheme.primary.withValues(alpha: 0.3)),
          boxShadow: [
            BoxShadow(
              color: AivoTheme.primary.withValues(alpha: 0.1),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Continue',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AivoTheme.primary,
                ),
              ),
              const SizedBox(width: 8),
              Icon(Icons.arrow_forward_rounded, color: AivoTheme.primary, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}
