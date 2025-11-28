import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:aivo_shared/aivo_shared.dart';

/// Privacy-first focus monitoring service
/// 
/// Tracks user interactions locally and calculates focus score.
/// Only aggregated, anonymized metrics are sent to the server.
class FocusMonitorService extends ChangeNotifier {
  final String learnerId;
  final String? sessionId;
  final AivoApiClient? apiClient;
  
  // Configuration
  static const int _idleThresholdSeconds = 120; // 2 minutes
  static const int _consecutiveIncorrectThreshold = 3;
  static const double _breakSuggestionThreshold = 40.0;
  static const int _minTimeBetweenSuggestionsSeconds = 300; // 5 minutes

  // Internal state
  final List<_InteractionRecord> _interactions = [];
  final List<FocusEvent> _events = [];
  DateTime? _lastInteractionTime;
  DateTime? _lastBreakSuggestionTime;
  DateTime? _sessionStartTime;
  Timer? _idleTimer;
  
  // Tracking counters
  int _consecutiveIncorrect = 0;
  int _breaksTaken = 0;
  int _gamesPlayed = 0;
  int _totalIdleSeconds = 0;
  
  // Current state
  double _currentFocusScore = 100.0;
  bool _breakSuggested = false;
  bool _isIdle = false;
  
  // Sensory profile integration
  SensoryProfile? _sensoryProfile;

  FocusMonitorService({
    required this.learnerId,
    this.sessionId,
    this.apiClient,
  }) {
    _sessionStartTime = DateTime.now();
    _lastInteractionTime = DateTime.now();
    _startIdleTimer();
  }

  // ==================== Public Getters ====================

  double get focusScore => _currentFocusScore;
  bool get breakSuggested => _breakSuggested;
  bool get isIdle => _isIdle;
  int get breaksTaken => _breaksTaken;
  int get gamesPlayed => _gamesPlayed;
  
  /// Whether break suggestions are enabled based on sensory profile
  bool get breakSuggestionsEnabled {
    if (_sensoryProfile == null) return true;
    // Respect cognitive accommodation for avoiding popups
    if (_sensoryProfile!.cognitive.avoidPopups) return false;
    return true;
  }

  /// Break interval from sensory profile (or default)
  int get breakIntervalMinutes {
    return _sensoryProfile?.cognitive.breakIntervalMinutes ?? 20;
  }

  // ==================== Public Methods ====================

  /// Set the sensory profile for accommodation-aware behavior
  void setSensoryProfile(SensoryProfile? profile) {
    _sensoryProfile = profile;
    notifyListeners();
  }

  /// Log a user interaction
  void logInteraction(InteractionType type, {Map<String, dynamic>? data}) {
    final now = DateTime.now();
    _interactions.add(_InteractionRecord(type: type, timestamp: now, data: data));
    _lastInteractionTime = now;
    
    // Reset idle state
    if (_isIdle) {
      _isIdle = false;
      _logEvent(FocusEventType.focusRestored);
    }
    
    // Track consecutive incorrect answers
    if (type == InteractionType.incorrectAnswer) {
      _consecutiveIncorrect++;
      if (_consecutiveIncorrect >= _consecutiveIncorrectThreshold) {
        _onFrustrationDetected();
      }
    } else if (type == InteractionType.correctAnswer) {
      _consecutiveIncorrect = 0;
      _boostFocusScore(5);
    }
    
    // Restart idle timer
    _resetIdleTimer();
    
    // Recalculate focus score
    _recalculateFocusScore();
    notifyListeners();
  }

  /// Calculate current focus score (0-100)
  double calculateFocusScore() {
    return _currentFocusScore;
  }

  /// Check if a break should be suggested
  bool shouldSuggestBreak() {
    if (!breakSuggestionsEnabled) return false;
    if (_breakSuggested) return false;
    
    // Check minimum time between suggestions
    if (_lastBreakSuggestionTime != null) {
      final elapsed = DateTime.now().difference(_lastBreakSuggestionTime!);
      if (elapsed.inSeconds < _minTimeBetweenSuggestionsSeconds) {
        return false;
      }
    }
    
    // Suggest break if focus score is low
    if (_currentFocusScore < _breakSuggestionThreshold) {
      return true;
    }
    
    // Suggest break based on time interval from sensory profile
    if (_sessionStartTime != null) {
      final elapsed = DateTime.now().difference(_sessionStartTime!);
      if (elapsed.inMinutes >= breakIntervalMinutes && _breaksTaken == 0) {
        return true;
      }
    }
    
    return false;
  }

  /// Mark that a break has been suggested (to prevent repeated suggestions)
  void markBreakSuggested() {
    _breakSuggested = true;
    _lastBreakSuggestionTime = DateTime.now();
    _logEvent(FocusEventType.distractionDetected, focusScore: _currentFocusScore);
    notifyListeners();
  }

  /// Called when user starts a break
  void startBreak() {
    _logEvent(FocusEventType.breakStarted, focusScore: _currentFocusScore);
    notifyListeners();
  }

  /// Called when user completes a break
  void completeBreak({int? durationSeconds, String? gameId}) {
    _breaksTaken++;
    _breakSuggested = false;
    
    // Restore focus after break
    _currentFocusScore = min(100.0, _currentFocusScore + 30);
    _consecutiveIncorrect = 0;
    
    _logEvent(
      FocusEventType.breakCompleted,
      focusScore: _currentFocusScore,
      durationSeconds: durationSeconds,
      gameId: gameId,
    );
    
    notifyListeners();
  }

  /// Called when user plays a game
  void logGamePlayed(String gameId, int durationSeconds) {
    _gamesPlayed++;
    _logEvent(
      FocusEventType.gamePlayed,
      gameId: gameId,
      durationSeconds: durationSeconds,
    );
    notifyListeners();
  }

  /// Dismiss break suggestion without taking a break
  void dismissBreakSuggestion() {
    _breakSuggested = false;
    _lastBreakSuggestionTime = DateTime.now();
    notifyListeners();
  }

  /// Get aggregated metrics for server sync (privacy-safe)
  FocusMetrics getAggregatedMetrics() {
    final now = DateTime.now();
    final activeSeconds = _interactions.length > 0
        ? _interactions.last.timestamp.difference(_sessionStartTime!).inSeconds - _totalIdleSeconds
        : 0;
    
    // Calculate average focus score from events
    final focusEvents = _events.where((e) => e.focusScore != null).toList();
    final avgScore = focusEvents.isNotEmpty
        ? focusEvents.map((e) => e.focusScore!).reduce((a, b) => a + b) / focusEvents.length
        : _currentFocusScore;
    
    return FocusMetrics(
      learnerId: learnerId,
      sessionId: sessionId ?? 'unknown',
      averageFocusScore: avgScore,
      breaksTaken: _breaksTaken,
      gamesPlayed: _gamesPlayed,
      totalActiveSeconds: activeSeconds,
      totalIdleSeconds: _totalIdleSeconds,
      periodStart: _sessionStartTime!,
      periodEnd: now,
    );
  }

  /// Sync aggregated metrics to server
  Future<void> syncMetrics() async {
    if (apiClient == null) return;
    
    try {
      final metrics = getAggregatedMetrics();
      // API call would go here
      // await apiClient!.syncFocusMetrics(metrics);
    } catch (e) {
      // Fail silently - metrics are not critical
      debugPrint('Failed to sync focus metrics: $e');
    }
  }

  /// Reset the monitor for a new session
  void reset() {
    _interactions.clear();
    _events.clear();
    _sessionStartTime = DateTime.now();
    _lastInteractionTime = DateTime.now();
    _lastBreakSuggestionTime = null;
    _consecutiveIncorrect = 0;
    _breaksTaken = 0;
    _gamesPlayed = 0;
    _totalIdleSeconds = 0;
    _currentFocusScore = 100.0;
    _breakSuggested = false;
    _isIdle = false;
    notifyListeners();
  }

  @override
  void dispose() {
    _idleTimer?.cancel();
    super.dispose();
  }

  // ==================== Private Methods ====================

  void _startIdleTimer() {
    _idleTimer?.cancel();
    _idleTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      _checkIdle();
    });
  }

  void _resetIdleTimer() {
    _idleTimer?.cancel();
    _startIdleTimer();
  }

  void _checkIdle() {
    if (_lastInteractionTime == null) return;
    
    final elapsed = DateTime.now().difference(_lastInteractionTime!);
    if (elapsed.inSeconds >= _idleThresholdSeconds && !_isIdle) {
      _onIdleDetected();
    }
    
    if (_isIdle) {
      _totalIdleSeconds += 10;
    }
  }

  void _onIdleDetected() {
    _isIdle = true;
    _currentFocusScore = max(0, _currentFocusScore - 15);
    _logEvent(FocusEventType.idleDetected, focusScore: _currentFocusScore);
    notifyListeners();
  }

  void _onFrustrationDetected() {
    _currentFocusScore = max(0, _currentFocusScore - 20);
    _logEvent(FocusEventType.distractionDetected, focusScore: _currentFocusScore);
    notifyListeners();
  }

  void _boostFocusScore(double amount) {
    _currentFocusScore = min(100, _currentFocusScore + amount);
  }

  void _recalculateFocusScore() {
    // Get recent interactions (last 2 minutes)
    final cutoff = DateTime.now().subtract(const Duration(minutes: 2));
    final recentInteractions = _interactions.where(
      (i) => i.timestamp.isAfter(cutoff),
    ).toList();
    
    if (recentInteractions.isEmpty) {
      _currentFocusScore = max(0, _currentFocusScore - 5);
      return;
    }
    
    // Calculate score based on interaction patterns
    double score = _currentFocusScore;
    
    // Factor 1: Interaction frequency (more is better, up to a point)
    final interactionsPerMinute = recentInteractions.length / 2.0;
    if (interactionsPerMinute < 1) {
      score -= 5;
    } else if (interactionsPerMinute > 10) {
      // Too many interactions might indicate frustration
      score -= 10;
    } else {
      score += 2;
    }
    
    // Factor 2: Correct vs incorrect answers
    final correctCount = recentInteractions
        .where((i) => i.type == InteractionType.correctAnswer)
        .length;
    final incorrectCount = recentInteractions
        .where((i) => i.type == InteractionType.incorrectAnswer)
        .length;
    
    if (incorrectCount > 0 && correctCount == 0) {
      score -= 10;
    } else if (correctCount > incorrectCount) {
      score += 5;
    }
    
    // Factor 3: Check for erratic patterns (rapid taps)
    final tapInteractions = recentInteractions
        .where((i) => i.type == InteractionType.tap)
        .toList();
    if (tapInteractions.length > 20) {
      // Too many taps in 2 minutes suggests frustration
      score -= 15;
    }
    
    _currentFocusScore = score.clamp(0, 100);
  }

  void _logEvent(
    FocusEventType eventType, {
    double? focusScore,
    String? gameId,
    int? durationSeconds,
  }) {
    _events.add(FocusEvent(
      learnerId: learnerId,
      eventType: eventType,
      focusScore: focusScore,
      gameId: gameId,
      durationSeconds: durationSeconds,
      timestamp: DateTime.now(),
    ));
  }
}

/// Internal record of an interaction
class _InteractionRecord {
  final InteractionType type;
  final DateTime timestamp;
  final Map<String, dynamic>? data;

  _InteractionRecord({
    required this.type,
    required this.timestamp,
    this.data,
  });
}

// ==================== Pre-built Focus Break Games ====================

/// Factory for creating pre-built focus break games
class FocusBreakGames {
  static final Random _random = Random();

  /// Get all available games
  static List<FocusBreakGame> getAllGames() {
    return [
      memoryGame(),
      quickMathGame(),
      wordScrambleGame(),
      movementBreak(),
      breathingExercise(),
    ];
  }

  /// Memory card matching game
  static FocusBreakGame memoryGame() {
    final emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
    final pairs = <Map<String, dynamic>>[];
    
    for (var i = 0; i < emojis.length; i++) {
      pairs.add({'id': i, 'emoji': emojis[i]});
    }
    
    return FocusBreakGame(
      id: 'memory-1',
      type: FocusBreakGameType.memory,
      name: 'Memory Match',
      description: 'Find matching pairs of animals!',
      durationSeconds: 120,
      gameData: {
        'pairs': pairs,
        'gridSize': 4,
      },
    );
  }

  /// Quick arithmetic game
  static FocusBreakGame quickMathGame() {
    final problems = <Map<String, dynamic>>[];
    
    for (var i = 0; i < 10; i++) {
      final a = _random.nextInt(10) + 1;
      final b = _random.nextInt(10) + 1;
      final isAddition = _random.nextBool();
      
      final question = isAddition ? '$a + $b' : '${a + b} - $a';
      final correct = isAddition ? a + b : b;
      
      // Generate wrong options
      final options = <int>[correct];
      while (options.length < 4) {
        final wrong = correct + _random.nextInt(5) - 2;
        if (wrong != correct && wrong > 0 && !options.contains(wrong)) {
          options.add(wrong);
        }
      }
      options.shuffle();
      
      problems.add({
        'question': question,
        'options': options,
        'correct': options.indexOf(correct),
      });
    }
    
    return FocusBreakGame(
      id: 'math-1',
      type: FocusBreakGameType.quickMath,
      name: 'Quick Math',
      description: 'Solve as many as you can in 30 seconds!',
      durationSeconds: 30,
      gameData: {
        'problems': problems,
      },
    );
  }

  /// Word unscrambling game
  static FocusBreakGame wordScrambleGame() {
    final words = [
      'APPLE', 'HAPPY', 'MUSIC', 'DANCE', 'SMILE',
      'BRAIN', 'LEARN', 'FOCUS', 'SMART', 'THINK',
    ];
    
    final puzzles = words.map((word) {
      final letters = word.split('');
      letters.shuffle();
      return {
        'scrambled': letters.join(''),
        'answer': word,
        'hint': '${word[0]}...',
      };
    }).toList();
    
    return FocusBreakGame(
      id: 'scramble-1',
      type: FocusBreakGameType.wordScramble,
      name: 'Word Scramble',
      description: 'Unscramble the letters to find the word!',
      durationSeconds: 60,
      gameData: {
        'puzzles': puzzles,
      },
    );
  }

  /// Movement/exercise break
  static FocusBreakGame movementBreak() {
    final exercises = [
      {'name': 'Jumping Jacks', 'count': 10, 'emoji': '🤸'},
      {'name': 'Arm Circles', 'count': 10, 'emoji': '🙆'},
      {'name': 'Toe Touches', 'count': 5, 'emoji': '🧘'},
      {'name': 'March in Place', 'count': 20, 'emoji': '🚶'},
      {'name': 'Shoulder Shrugs', 'count': 10, 'emoji': '💪'},
    ];
    
    return FocusBreakGame(
      id: 'movement-1',
      type: FocusBreakGameType.movement,
      name: 'Movement Break',
      description: 'Get your body moving!',
      durationSeconds: 90,
      gameData: {
        'exercises': exercises,
      },
    );
  }

  /// Breathing/calming exercise
  static FocusBreakGame breathingExercise() {
    return FocusBreakGame(
      id: 'breathing-1',
      type: FocusBreakGameType.breathing,
      name: 'Calm Breathing',
      description: 'Follow the circle to calm your mind',
      durationSeconds: 60,
      gameData: {
        'pattern': {
          'inhaleSeconds': 4,
          'holdSeconds': 4,
          'exhaleSeconds': 4,
          'cycles': 4,
        },
      },
    );
  }

  /// Get a random game
  static FocusBreakGame randomGame() {
    final games = getAllGames();
    return games[_random.nextInt(games.length)];
  }

  /// Get a game by type
  static FocusBreakGame? getByType(FocusBreakGameType type) {
    try {
      return getAllGames().firstWhere((g) => g.type == type);
    } catch (_) {
      return null;
    }
  }
}
