import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';
import '../services/focus_monitor_service.dart';

/// Focus Break screen with educational mini-games
class FocusBreakScreen extends StatefulWidget {
  final FocusBreakGame? initialGame;
  final FocusMonitorService? focusMonitor;

  const FocusBreakScreen({
    super.key,
    this.initialGame,
    this.focusMonitor,
  });

  @override
  State<FocusBreakScreen> createState() => _FocusBreakScreenState();
}

class _FocusBreakScreenState extends State<FocusBreakScreen> {
  FocusBreakGame? _selectedGame;
  bool _gameInProgress = false;
  bool _gameCompleted = false;
  int _score = 0;
  DateTime? _gameStartTime;

  @override
  void initState() {
    super.initState();
    _selectedGame = widget.initialGame;
    widget.focusMonitor?.startBreak();
  }

  void _selectGame(FocusBreakGame game) {
    setState(() {
      _selectedGame = game;
      _gameInProgress = false;
      _gameCompleted = false;
      _score = 0;
    });
  }

  void _startGame() {
    setState(() {
      _gameInProgress = true;
      _gameStartTime = DateTime.now();
    });
  }

  void _completeGame(int score) {
    final duration = _gameStartTime != null
        ? DateTime.now().difference(_gameStartTime!).inSeconds
        : 0;
    
    widget.focusMonitor?.logGamePlayed(_selectedGame!.id, duration);
    widget.focusMonitor?.completeBreak(
      durationSeconds: duration,
      gameId: _selectedGame!.id,
    );
    
    setState(() {
      _gameCompleted = true;
      _gameInProgress = false;
      _score = score;
    });
  }

  void _exitBreak() {
    if (!_gameCompleted && _gameInProgress) {
      // Game was abandoned
      widget.focusMonitor?.dismissBreakSuggestion();
    }
    Navigator.pop(context);
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
              _buildHeader(),
              Expanded(
                child: _gameCompleted
                    ? _buildCompletionScreen()
                    : _gameInProgress && _selectedGame != null
                        ? _buildGameScreen()
                        : _buildGameSelection(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: _exitBreak,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Brain Break',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  _gameInProgress
                      ? _selectedGame?.name ?? ''
                      : 'Pick a fun activity!',
                  style: TextStyle(
                    fontSize: 14,
                    color: AivoTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          if (_gameInProgress && _selectedGame != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AivoTheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'Score: $_score',
                style: TextStyle(
                  color: AivoTheme.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildGameSelection() {
    final games = FocusBreakGames.getAllGames();
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Encouraging message
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AivoTheme.mint.withOpacity(0.15),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Text('🧠', style: TextStyle(fontSize: 32)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Time for a brain break!',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'A quick break helps you learn better. Pick an activity!',
                        style: TextStyle(
                          color: AivoTheme.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Game grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.85,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: games.length,
            itemBuilder: (context, index) {
              final game = games[index];
              return _GameCard(
                game: game,
                isSelected: _selectedGame?.id == game.id,
                onTap: () => _selectGame(game),
              );
            },
          ),
          
          const SizedBox(height: 24),
          
          // Start button
          if (_selectedGame != null)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _startGame,
                icon: const Icon(Icons.play_arrow),
                label: Text('Play ${_selectedGame!.name}'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildGameScreen() {
    switch (_selectedGame!.type) {
      case FocusBreakGameType.memory:
        return _MemoryGame(
          game: _selectedGame!,
          onComplete: _completeGame,
          onScoreUpdate: (s) => setState(() => _score = s),
        );
      case FocusBreakGameType.quickMath:
        return _QuickMathGame(
          game: _selectedGame!,
          onComplete: _completeGame,
          onScoreUpdate: (s) => setState(() => _score = s),
        );
      case FocusBreakGameType.wordScramble:
        return _WordScrambleGame(
          game: _selectedGame!,
          onComplete: _completeGame,
          onScoreUpdate: (s) => setState(() => _score = s),
        );
      case FocusBreakGameType.movement:
        return _MovementBreak(
          game: _selectedGame!,
          onComplete: _completeGame,
        );
      case FocusBreakGameType.breathing:
        return _BreathingGame(
          game: _selectedGame!,
          onComplete: _completeGame,
        );
      case FocusBreakGameType.creative:
        return _buildCreativeActivity();
    }
  }

  Widget _buildCreativeActivity() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text('🎨', style: TextStyle(fontSize: 64)),
          const SizedBox(height: 16),
          const Text(
            'Creative Time!',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Draw, doodle, or imagine something fun!',
            style: TextStyle(color: AivoTheme.textSecondary),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () => _completeGame(10),
            child: const Text('I\'m Ready to Continue'),
          ),
        ],
      ),
    );
  }

  Widget _buildCompletionScreen() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: AivoTheme.mint.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Text('🌟', style: TextStyle(fontSize: 50)),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Great Break!',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'You scored $_score points!',
              style: TextStyle(
                fontSize: 18,
                color: AivoTheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Your brain is refreshed and ready to learn!',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AivoTheme.textSecondary,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_forward),
              label: const Text('Back to Learning'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
              ),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () {
                setState(() {
                  _selectedGame = null;
                  _gameCompleted = false;
                  _gameInProgress = false;
                  _score = 0;
                });
              },
              child: const Text('Play Another Game'),
            ),
          ],
        ),
      ),
    );
  }
}

// ==================== Game Card ====================

class _GameCard extends StatelessWidget {
  final FocusBreakGame game;
  final bool isSelected;
  final VoidCallback onTap;

  const _GameCard({
    required this.game,
    required this.isSelected,
    required this.onTap,
  });

  Color _getGameColor() {
    switch (game.type) {
      case FocusBreakGameType.memory:
        return AivoTheme.primary;
      case FocusBreakGameType.quickMath:
        return AivoTheme.sunshine;
      case FocusBreakGameType.wordScramble:
        return AivoTheme.coral;
      case FocusBreakGameType.movement:
        return AivoTheme.mint;
      case FocusBreakGameType.breathing:
        return AivoTheme.sky;
      case FocusBreakGameType.creative:
        return Colors.pink;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _getGameColor();
    
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: isSelected
              ? Border.all(color: color, width: 3)
              : null,
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? color.withOpacity(0.3)
                  : Colors.black.withOpacity(0.05),
              blurRadius: isSelected ? 12 : 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Center(
                  child: Text(
                    game.type.emoji,
                    style: const TextStyle(fontSize: 28),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                game.name,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${game.durationSeconds ~/ 60}:${(game.durationSeconds % 60).toString().padLeft(2, '0')}',
                style: TextStyle(
                  fontSize: 12,
                  color: AivoTheme.textMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ==================== Memory Game ====================

class _MemoryGame extends StatefulWidget {
  final FocusBreakGame game;
  final ValueChanged<int> onComplete;
  final ValueChanged<int> onScoreUpdate;

  const _MemoryGame({
    required this.game,
    required this.onComplete,
    required this.onScoreUpdate,
  });

  @override
  State<_MemoryGame> createState() => _MemoryGameState();
}

class _MemoryGameState extends State<_MemoryGame> {
  late List<_MemoryCard> _cards;
  int? _firstSelectedIndex;
  int? _secondSelectedIndex;
  int _matchesFound = 0;
  int _attempts = 0;
  bool _isChecking = false;

  @override
  void initState() {
    super.initState();
    _initializeCards();
  }

  void _initializeCards() {
    final pairs = widget.game.gameData['pairs'] as List<dynamic>;
    _cards = [];
    
    for (final pair in pairs) {
      final emoji = pair['emoji'] as String;
      final id = pair['id'] as int;
      // Add each card twice for matching
      _cards.add(_MemoryCard(id: id, emoji: emoji));
      _cards.add(_MemoryCard(id: id, emoji: emoji));
    }
    
    _cards.shuffle();
  }

  void _onCardTapped(int index) {
    if (_isChecking) return;
    if (_cards[index].isMatched) return;
    if (_cards[index].isFlipped) return;
    if (_firstSelectedIndex == index) return;

    setState(() {
      _cards[index].isFlipped = true;
    });

    if (_firstSelectedIndex == null) {
      _firstSelectedIndex = index;
    } else {
      _secondSelectedIndex = index;
      _attempts++;
      _checkMatch();
    }
  }

  void _checkMatch() {
    _isChecking = true;
    
    final first = _cards[_firstSelectedIndex!];
    final second = _cards[_secondSelectedIndex!];

    if (first.id == second.id) {
      // Match found!
      setState(() {
        first.isMatched = true;
        second.isMatched = true;
        _matchesFound++;
      });
      
      widget.onScoreUpdate(_matchesFound * 10);
      
      if (_matchesFound == _cards.length ~/ 2) {
        // Game complete!
        Future.delayed(const Duration(milliseconds: 500), () {
          widget.onComplete(_matchesFound * 10 + max(0, 50 - _attempts));
        });
      }
      
      _firstSelectedIndex = null;
      _secondSelectedIndex = null;
      _isChecking = false;
    } else {
      // No match - flip back after delay
      Future.delayed(const Duration(milliseconds: 1000), () {
        if (mounted) {
          setState(() {
            _cards[_firstSelectedIndex!].isFlipped = false;
            _cards[_secondSelectedIndex!].isFlipped = false;
            _firstSelectedIndex = null;
            _secondSelectedIndex = null;
            _isChecking = false;
          });
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Stats row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _StatChip(
                icon: Icons.favorite,
                label: 'Matches',
                value: '$_matchesFound/${_cards.length ~/ 2}',
                color: AivoTheme.coral,
              ),
              _StatChip(
                icon: Icons.touch_app,
                label: 'Attempts',
                value: '$_attempts',
                color: AivoTheme.primary,
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Card grid
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                childAspectRatio: 1,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: _cards.length,
              itemBuilder: (context, index) {
                final card = _cards[index];
                return GestureDetector(
                  onTap: () => _onCardTapped(index),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    decoration: BoxDecoration(
                      color: card.isFlipped || card.isMatched
                          ? Colors.white
                          : AivoTheme.primary,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Center(
                      child: card.isFlipped || card.isMatched
                          ? Text(
                              card.emoji,
                              style: TextStyle(
                                fontSize: 28,
                                color: card.isMatched
                                    ? AivoTheme.success
                                    : null,
                              ),
                            )
                          : const Text(
                              '?',
                              style: TextStyle(
                                fontSize: 24,
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _MemoryCard {
  final int id;
  final String emoji;
  bool isFlipped = false;
  bool isMatched = false;

  _MemoryCard({required this.id, required this.emoji});
}

// ==================== Quick Math Game ====================

class _QuickMathGame extends StatefulWidget {
  final FocusBreakGame game;
  final ValueChanged<int> onComplete;
  final ValueChanged<int> onScoreUpdate;

  const _QuickMathGame({
    required this.game,
    required this.onComplete,
    required this.onScoreUpdate,
  });

  @override
  State<_QuickMathGame> createState() => _QuickMathGameState();
}

class _QuickMathGameState extends State<_QuickMathGame> {
  late List<Map<String, dynamic>> _problems;
  int _currentIndex = 0;
  int _score = 0;
  int _timeRemaining = 30;
  Timer? _timer;
  bool _answered = false;
  int? _selectedOption;

  @override
  void initState() {
    super.initState();
    _problems = List<Map<String, dynamic>>.from(
      widget.game.gameData['problems'] as List<dynamic>,
    );
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeRemaining > 0) {
        setState(() => _timeRemaining--);
      } else {
        _timer?.cancel();
        widget.onComplete(_score);
      }
    });
  }

  void _selectAnswer(int optionIndex) {
    if (_answered) return;
    
    final correct = _problems[_currentIndex]['correct'] as int;
    
    setState(() {
      _answered = true;
      _selectedOption = optionIndex;
    });
    
    if (optionIndex == correct) {
      _score += 10;
      widget.onScoreUpdate(_score);
    }
    
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        if (_currentIndex < _problems.length - 1) {
          setState(() {
            _currentIndex++;
            _answered = false;
            _selectedOption = null;
          });
        } else {
          _timer?.cancel();
          widget.onComplete(_score);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final problem = _problems[_currentIndex];
    final options = List<int>.from(problem['options'] as List<dynamic>);
    final correct = problem['correct'] as int;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Timer and progress
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _StatChip(
                icon: Icons.timer,
                label: 'Time',
                value: '$_timeRemaining s',
                color: _timeRemaining < 10 ? AivoTheme.coral : AivoTheme.primary,
              ),
              _StatChip(
                icon: Icons.check_circle,
                label: 'Score',
                value: '$_score',
                color: AivoTheme.mint,
              ),
            ],
          ),
          
          const SizedBox(height: 32),
          
          // Progress indicator
          LinearProgressIndicator(
            value: (_currentIndex + 1) / _problems.length,
            backgroundColor: AivoTheme.surfaceBackground,
            valueColor: AlwaysStoppedAnimation<Color>(AivoTheme.primary),
          ),
          
          const SizedBox(height: 8),
          Text(
            'Problem ${_currentIndex + 1} of ${_problems.length}',
            style: TextStyle(color: AivoTheme.textMuted, fontSize: 12),
          ),
          
          const SizedBox(height: 48),
          
          // Question
          Text(
            problem['question'] as String,
            style: const TextStyle(
              fontSize: 48,
              fontWeight: FontWeight.bold,
            ),
          ),
          
          const SizedBox(height: 48),
          
          // Options
          GridView.count(
            shrinkWrap: true,
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 2,
            children: List.generate(options.length, (index) {
              final isSelected = _selectedOption == index;
              final isCorrect = index == correct;
              
              Color bgColor = Colors.white;
              if (_answered) {
                if (isCorrect) {
                  bgColor = AivoTheme.mint;
                } else if (isSelected) {
                  bgColor = AivoTheme.coral;
                }
              }
              
              return GestureDetector(
                onTap: () => _selectAnswer(index),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? AivoTheme.primary : Colors.grey.shade200,
                      width: 2,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      '${options[index]}',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: _answered && (isCorrect || isSelected)
                            ? Colors.white
                            : AivoTheme.textPrimary,
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

// ==================== Word Scramble Game ====================

class _WordScrambleGame extends StatefulWidget {
  final FocusBreakGame game;
  final ValueChanged<int> onComplete;
  final ValueChanged<int> onScoreUpdate;

  const _WordScrambleGame({
    required this.game,
    required this.onComplete,
    required this.onScoreUpdate,
  });

  @override
  State<_WordScrambleGame> createState() => _WordScrambleGameState();
}

class _WordScrambleGameState extends State<_WordScrambleGame> {
  late List<Map<String, dynamic>> _puzzles;
  int _currentIndex = 0;
  int _score = 0;
  String _currentGuess = '';
  final TextEditingController _controller = TextEditingController();
  bool _showHint = false;
  bool _showResult = false;
  bool _wasCorrect = false;

  @override
  void initState() {
    super.initState();
    _puzzles = List<Map<String, dynamic>>.from(
      widget.game.gameData['puzzles'] as List<dynamic>,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submitGuess() {
    final answer = _puzzles[_currentIndex]['answer'] as String;
    final correct = _currentGuess.toUpperCase() == answer;
    
    setState(() {
      _showResult = true;
      _wasCorrect = correct;
    });
    
    if (correct) {
      _score += _showHint ? 5 : 10;
      widget.onScoreUpdate(_score);
    }
    
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        if (_currentIndex < _puzzles.length - 1) {
          setState(() {
            _currentIndex++;
            _currentGuess = '';
            _controller.clear();
            _showHint = false;
            _showResult = false;
          });
        } else {
          widget.onComplete(_score);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final puzzle = _puzzles[_currentIndex];
    final scrambled = puzzle['scrambled'] as String;
    final hint = puzzle['hint'] as String;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Progress
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Word ${_currentIndex + 1} of ${_puzzles.length}',
                style: TextStyle(color: AivoTheme.textMuted),
              ),
              _StatChip(
                icon: Icons.star,
                label: 'Score',
                value: '$_score',
                color: AivoTheme.sunshine,
              ),
            ],
          ),
          
          const SizedBox(height: 32),
          
          // Scrambled letters
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: BoxDecoration(
              color: AivoTheme.primarySoft,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: scrambled.split('').map((letter) {
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: 40,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 2,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      letter,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Hint
          if (_showHint)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AivoTheme.sunshine.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('💡 Hint: ', style: TextStyle(fontWeight: FontWeight.bold)),
                  Text(hint),
                ],
              ),
            )
          else
            TextButton.icon(
              onPressed: () => setState(() => _showHint = true),
              icon: const Icon(Icons.lightbulb_outline),
              label: const Text('Need a hint?'),
            ),
          
          const SizedBox(height: 32),
          
          // Result feedback
          if (_showResult)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _wasCorrect ? AivoTheme.mint : AivoTheme.coral,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _wasCorrect ? Icons.check_circle : Icons.close,
                    color: Colors.white,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _wasCorrect ? 'Correct! 🎉' : 'It was: ${puzzle['answer']}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          
          if (!_showResult) ...[
            // Input field
            TextField(
              controller: _controller,
              textCapitalization: TextCapitalization.characters,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                letterSpacing: 4,
              ),
              decoration: InputDecoration(
                hintText: 'Type your answer',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
              ),
              onChanged: (value) {
                setState(() => _currentGuess = value);
              },
              onSubmitted: (_) => _submitGuess(),
            ),
            
            const SizedBox(height: 16),
            
            ElevatedButton(
              onPressed: _currentGuess.isNotEmpty ? _submitGuess : null,
              child: const Text('Check Answer'),
            ),
          ],
        ],
      ),
    );
  }
}

// ==================== Movement Break ====================

class _MovementBreak extends StatefulWidget {
  final FocusBreakGame game;
  final ValueChanged<int> onComplete;

  const _MovementBreak({
    required this.game,
    required this.onComplete,
  });

  @override
  State<_MovementBreak> createState() => _MovementBreakState();
}

class _MovementBreakState extends State<_MovementBreak> {
  late List<Map<String, dynamic>> _exercises;
  int _currentIndex = 0;
  int _countdown = 0;
  bool _exerciseInProgress = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _exercises = List<Map<String, dynamic>>.from(
      widget.game.gameData['exercises'] as List<dynamic>,
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startExercise() {
    final count = _exercises[_currentIndex]['count'] as int;
    setState(() {
      _exerciseInProgress = true;
      _countdown = count;
    });
    
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdown > 1) {
        setState(() => _countdown--);
      } else {
        _timer?.cancel();
        _nextExercise();
      }
    });
  }

  void _nextExercise() {
    if (_currentIndex < _exercises.length - 1) {
      setState(() {
        _currentIndex++;
        _exerciseInProgress = false;
      });
    } else {
      widget.onComplete(_exercises.length * 10);
    }
  }

  @override
  Widget build(BuildContext context) {
    final exercise = _exercises[_currentIndex];

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Progress
          Text(
            'Exercise ${_currentIndex + 1} of ${_exercises.length}',
            style: TextStyle(color: AivoTheme.textMuted),
          ),
          
          const SizedBox(height: 32),
          
          // Exercise display
          Text(
            exercise['emoji'] as String,
            style: const TextStyle(fontSize: 80),
          ),
          
          const SizedBox(height: 24),
          
          Text(
            exercise['name'] as String,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
          
          const SizedBox(height: 16),
          
          if (_exerciseInProgress) ...[
            Text(
              '$_countdown',
              style: TextStyle(
                fontSize: 64,
                fontWeight: FontWeight.bold,
                color: AivoTheme.primary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Keep going!',
              style: TextStyle(
                fontSize: 18,
                color: AivoTheme.textSecondary,
              ),
            ),
          ] else ...[
            Text(
              'Do ${exercise['count']} ${exercise['name']}',
              style: TextStyle(
                fontSize: 18,
                color: AivoTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: _startExercise,
              icon: const Icon(Icons.play_arrow),
              label: const Text('Start'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ==================== Breathing Game ====================

class _BreathingGame extends StatefulWidget {
  final FocusBreakGame game;
  final ValueChanged<int> onComplete;

  const _BreathingGame({
    required this.game,
    required this.onComplete,
  });

  @override
  State<_BreathingGame> createState() => _BreathingGameState();
}

class _BreathingGameState extends State<_BreathingGame>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  
  int _currentCycle = 0;
  String _phase = 'Ready';
  bool _isStarted = false;
  
  late int _inhaleSeconds;
  late int _holdSeconds;
  late int _exhaleSeconds;
  late int _totalCycles;

  @override
  void initState() {
    super.initState();
    final pattern = widget.game.gameData['pattern'] as Map<String, dynamic>;
    _inhaleSeconds = pattern['inhaleSeconds'] as int? ?? 4;
    _holdSeconds = pattern['holdSeconds'] as int? ?? 4;
    _exhaleSeconds = pattern['exhaleSeconds'] as int? ?? 4;
    _totalCycles = pattern['cycles'] as int? ?? 4;
    
    final cycleDuration = _inhaleSeconds + _holdSeconds + _exhaleSeconds;
    
    _controller = AnimationController(
      duration: Duration(seconds: cycleDuration),
      vsync: this,
    );
    
    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.5, end: 1.0)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: _inhaleSeconds.toDouble(),
      ),
      TweenSequenceItem(
        tween: ConstantTween<double>(1.0),
        weight: _holdSeconds.toDouble(),
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 0.5)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: _exhaleSeconds.toDouble(),
      ),
    ]).animate(_controller);
    
    _controller.addListener(_updatePhase);
    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _currentCycle++;
        if (_currentCycle >= _totalCycles) {
          widget.onComplete(50);
        } else {
          _controller.reset();
          _controller.forward();
        }
      }
    });
  }

  void _updatePhase() {
    final cycleDuration = _inhaleSeconds + _holdSeconds + _exhaleSeconds;
    final progress = _controller.value * cycleDuration;
    
    String newPhase;
    if (progress < _inhaleSeconds) {
      newPhase = 'Breathe In';
    } else if (progress < _inhaleSeconds + _holdSeconds) {
      newPhase = 'Hold';
    } else {
      newPhase = 'Breathe Out';
    }
    
    if (newPhase != _phase) {
      setState(() => _phase = newPhase);
    }
  }

  void _startBreathing() {
    setState(() {
      _isStarted = true;
      _phase = 'Breathe In';
    });
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Progress
          if (_isStarted)
            Text(
              'Cycle ${_currentCycle + 1} of $_totalCycles',
              style: TextStyle(color: AivoTheme.textMuted),
            ),
          
          const SizedBox(height: 32),
          
          // Breathing circle
          AnimatedBuilder(
            animation: _scaleAnimation,
            builder: (context, child) {
              return Container(
                width: 200 * (_isStarted ? _scaleAnimation.value : 0.5),
                height: 200 * (_isStarted ? _scaleAnimation.value : 0.5),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AivoTheme.sky.withOpacity(0.3),
                      AivoTheme.sky.withOpacity(0.7),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AivoTheme.sky.withOpacity(0.3),
                      blurRadius: 20,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    '🌬️',
                    style: TextStyle(
                      fontSize: 40 * (_isStarted ? _scaleAnimation.value : 0.5),
                    ),
                  ),
                ),
              );
            },
          ),
          
          const SizedBox(height: 32),
          
          // Phase text
          Text(
            _phase,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          
          const SizedBox(height: 16),
          
          if (!_isStarted) ...[
            Text(
              'Follow the circle to calm your breathing',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AivoTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: _startBreathing,
              icon: const Icon(Icons.play_arrow),
              label: const Text('Start Breathing'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ==================== Helper Widgets ====================

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatChip({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            '$label: ',
            style: TextStyle(
              fontSize: 12,
              color: AivoTheme.textMuted,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
