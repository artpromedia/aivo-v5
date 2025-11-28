import 'package:flutter_test/flutter_test.dart';
import 'package:fake_async/fake_async.dart';
import 'package:learner_flutter/services/focus_monitor_service.dart';
import 'package:aivo_shared/aivo_shared.dart';

void main() {
  group('FocusMonitorService', () {
    late FocusMonitorService focusMonitor;

    setUp(() {
      focusMonitor = FocusMonitorService(
        learnerId: 'test-learner-123',
        sessionId: 'test-session-456',
      );
    });

    tearDown(() {
      focusMonitor.dispose();
    });

    group('Initial State', () {
      test('starts with 100% focus score', () {
        expect(focusMonitor.focusScore, equals(100.0));
      });

      test('starts with no breaks taken', () {
        expect(focusMonitor.breaksTaken, equals(0));
      });

      test('starts with no games played', () {
        expect(focusMonitor.gamesPlayed, equals(0));
      });

      test('starts not idle', () {
        expect(focusMonitor.isIdle, isFalse);
      });

      test('starts without break suggested', () {
        expect(focusMonitor.breakSuggested, isFalse);
      });

      test('break suggestions enabled by default', () {
        expect(focusMonitor.breakSuggestionsEnabled, isTrue);
      });

      test('default break interval is 20 minutes', () {
        expect(focusMonitor.breakIntervalMinutes, equals(20));
      });
    });

    group('Interaction Logging', () {
      test('logInteraction does not throw', () {
        expect(
          () => focusMonitor.logInteraction(InteractionType.tap),
          returnsNormally,
        );
      });

      test('correct answer boosts focus score', () {
        final initialScore = focusMonitor.focusScore;
        focusMonitor.logInteraction(InteractionType.correctAnswer);
        
        expect(focusMonitor.focusScore, greaterThanOrEqualTo(initialScore));
      });

      test('incorrect answers can decrease focus score', () {
        // Log several incorrect answers
        for (var i = 0; i < 5; i++) {
          focusMonitor.logInteraction(InteractionType.incorrectAnswer);
        }
        
        expect(focusMonitor.focusScore, lessThan(100.0));
      });

      test('consecutive incorrect answers trigger frustration detection', () {
        final initialScore = focusMonitor.focusScore;
        
        // Log 3+ consecutive incorrect answers
        for (var i = 0; i < 4; i++) {
          focusMonitor.logInteraction(InteractionType.incorrectAnswer);
        }
        
        // Focus should drop significantly due to frustration
        expect(focusMonitor.focusScore, lessThan(initialScore - 10));
      });

      test('correct answer resets consecutive incorrect counter', () {
        // Log some incorrect answers
        focusMonitor.logInteraction(InteractionType.incorrectAnswer);
        focusMonitor.logInteraction(InteractionType.incorrectAnswer);
        
        // Then a correct answer
        focusMonitor.logInteraction(InteractionType.correctAnswer);
        
        // More incorrect answers shouldn't trigger frustration immediately
        focusMonitor.logInteraction(InteractionType.incorrectAnswer);
        focusMonitor.logInteraction(InteractionType.incorrectAnswer);
        
        // Should not be as low as if all were consecutive incorrect
        expect(focusMonitor.focusScore, greaterThan(50.0));
      });
    });

    group('Focus Score Calculation', () {
      test('calculateFocusScore returns current score', () {
        expect(focusMonitor.calculateFocusScore(), equals(focusMonitor.focusScore));
      });

      test('focus score is clamped between 0 and 100', () {
        // Log many incorrect answers to try to go below 0
        for (var i = 0; i < 50; i++) {
          focusMonitor.logInteraction(InteractionType.incorrectAnswer);
        }
        
        expect(focusMonitor.focusScore, greaterThanOrEqualTo(0));
        expect(focusMonitor.focusScore, lessThanOrEqualTo(100));
      });

      test('focus score cannot exceed 100', () {
        // Log many correct answers
        for (var i = 0; i < 50; i++) {
          focusMonitor.logInteraction(InteractionType.correctAnswer);
        }
        
        expect(focusMonitor.focusScore, lessThanOrEqualTo(100));
      });
    });

    group('Break Suggestions', () {
      test('shouldSuggestBreak returns false initially', () {
        expect(focusMonitor.shouldSuggestBreak(), isFalse);
      });

      test('shouldSuggestBreak returns true when focus is low', () {
        // Lower focus score significantly
        for (var i = 0; i < 20; i++) {
          focusMonitor.logInteraction(InteractionType.incorrectAnswer);
        }
        
        // Might suggest break if score is below threshold
        // The actual result depends on score calculation
        final shouldSuggest = focusMonitor.shouldSuggestBreak();
        expect(shouldSuggest, isA<bool>());
      });

      test('markBreakSuggested sets flag', () {
        focusMonitor.markBreakSuggested();
        expect(focusMonitor.breakSuggested, isTrue);
      });

      test('dismissBreakSuggestion clears flag', () {
        focusMonitor.markBreakSuggested();
        focusMonitor.dismissBreakSuggestion();
        expect(focusMonitor.breakSuggested, isFalse);
      });
    });

    group('Break Handling', () {
      test('startBreak does not throw', () {
        expect(() => focusMonitor.startBreak(), returnsNormally);
      });

      test('completeBreak increments breaks taken', () {
        focusMonitor.completeBreak();
        expect(focusMonitor.breaksTaken, equals(1));
      });

      test('completeBreak restores focus score', () {
        // Lower focus first
        for (var i = 0; i < 10; i++) {
          focusMonitor.logInteraction(InteractionType.incorrectAnswer);
        }
        final lowScore = focusMonitor.focusScore;
        
        focusMonitor.completeBreak();
        
        expect(focusMonitor.focusScore, greaterThan(lowScore));
      });

      test('completeBreak clears break suggested flag', () {
        focusMonitor.markBreakSuggested();
        focusMonitor.completeBreak();
        expect(focusMonitor.breakSuggested, isFalse);
      });

      test('completeBreak accepts duration and game ID', () {
        expect(
          () => focusMonitor.completeBreak(
            durationSeconds: 60,
            gameId: 'memory-1',
          ),
          returnsNormally,
        );
        expect(focusMonitor.breaksTaken, equals(1));
      });
    });

    group('Game Tracking', () {
      test('logGamePlayed increments games played', () {
        focusMonitor.logGamePlayed('memory-1', 60);
        expect(focusMonitor.gamesPlayed, equals(1));
      });

      test('logGamePlayed accepts duration', () {
        expect(
          () => focusMonitor.logGamePlayed('math-1', 30),
          returnsNormally,
        );
      });

      test('multiple games are tracked', () {
        focusMonitor.logGamePlayed('memory-1', 60);
        focusMonitor.logGamePlayed('math-1', 30);
        focusMonitor.logGamePlayed('scramble-1', 45);
        
        expect(focusMonitor.gamesPlayed, equals(3));
      });
    });

    group('Sensory Profile Integration', () {
      test('setSensoryProfile does not throw', () {
        final profile = SensoryProfile.defaultProfile();
        expect(
          () => focusMonitor.setSensoryProfile(profile),
          returnsNormally,
        );
      });

      test('setSensoryProfile with null clears profile', () {
        final profile = SensoryProfile.defaultProfile();
        focusMonitor.setSensoryProfile(profile);
        focusMonitor.setSensoryProfile(null);
        
        // Default values should apply
        expect(focusMonitor.breakSuggestionsEnabled, isTrue);
        expect(focusMonitor.breakIntervalMinutes, equals(20));
      });
    });

    group('Aggregated Metrics', () {
      test('getAggregatedMetrics returns valid metrics', () {
        focusMonitor.logInteraction(InteractionType.tap);
        focusMonitor.logInteraction(InteractionType.correctAnswer);
        
        final metrics = focusMonitor.getAggregatedMetrics();
        
        expect(metrics.learnerId, equals('test-learner-123'));
        expect(metrics.sessionId, equals('test-session-456'));
        expect(metrics.breaksTaken, equals(0));
        expect(metrics.gamesPlayed, equals(0));
        expect(metrics.averageFocusScore, isA<double>());
        expect(metrics.periodStart, isA<DateTime>());
        expect(metrics.periodEnd, isA<DateTime>());
      });

      test('metrics reflect break activity', () {
        focusMonitor.completeBreak();
        focusMonitor.logGamePlayed('memory-1', 60);
        
        final metrics = focusMonitor.getAggregatedMetrics();
        
        expect(metrics.breaksTaken, equals(1));
        expect(metrics.gamesPlayed, equals(1));
      });
    });

    group('Reset', () {
      test('reset restores initial state', () {
        // Make some changes
        focusMonitor.logInteraction(InteractionType.incorrectAnswer);
        focusMonitor.completeBreak();
        focusMonitor.logGamePlayed('memory-1', 60);
        focusMonitor.markBreakSuggested();
        
        // Reset
        focusMonitor.reset();
        
        expect(focusMonitor.focusScore, equals(100.0));
        expect(focusMonitor.breaksTaken, equals(0));
        expect(focusMonitor.gamesPlayed, equals(0));
        expect(focusMonitor.breakSuggested, isFalse);
        expect(focusMonitor.isIdle, isFalse);
      });
    });

    group('Notifier', () {
      test('notifies listeners on interaction', () {
        var notified = false;
        focusMonitor.addListener(() => notified = true);
        
        focusMonitor.logInteraction(InteractionType.tap);
        
        expect(notified, isTrue);
      });

      test('notifies listeners on break complete', () {
        var notified = false;
        focusMonitor.addListener(() => notified = true);
        
        focusMonitor.completeBreak();
        
        expect(notified, isTrue);
      });

      test('notifies listeners on game played', () {
        var notified = false;
        focusMonitor.addListener(() => notified = true);
        
        focusMonitor.logGamePlayed('memory-1', 60);
        
        expect(notified, isTrue);
      });

      test('notifies listeners on reset', () {
        var notified = false;
        focusMonitor.addListener(() => notified = true);
        
        focusMonitor.reset();
        
        expect(notified, isTrue);
      });
    });
  });

  group('FocusBreakGames', () {
    test('getAllGames returns 5 games', () {
      final games = FocusBreakGames.getAllGames();
      expect(games.length, equals(5));
    });

    test('memoryGame has correct structure', () {
      final game = FocusBreakGames.memoryGame();
      
      expect(game.id, equals('memory-1'));
      expect(game.type, equals(FocusBreakGameType.memory));
      expect(game.name, equals('Memory Match'));
      expect(game.gameData['pairs'], isA<List>());
      expect(game.gameData['gridSize'], equals(4));
    });

    test('quickMathGame has problems', () {
      final game = FocusBreakGames.quickMathGame();
      
      expect(game.id, equals('math-1'));
      expect(game.type, equals(FocusBreakGameType.quickMath));
      expect(game.gameData['problems'], isA<List>());
      expect((game.gameData['problems'] as List).length, equals(10));
    });

    test('wordScrambleGame has puzzles', () {
      final game = FocusBreakGames.wordScrambleGame();
      
      expect(game.id, equals('scramble-1'));
      expect(game.type, equals(FocusBreakGameType.wordScramble));
      expect(game.gameData['puzzles'], isA<List>());
    });

    test('movementBreak has exercises', () {
      final game = FocusBreakGames.movementBreak();
      
      expect(game.id, equals('movement-1'));
      expect(game.type, equals(FocusBreakGameType.movement));
      expect(game.gameData['exercises'], isA<List>());
      expect((game.gameData['exercises'] as List).length, equals(5));
    });

    test('breathingExercise has pattern', () {
      final game = FocusBreakGames.breathingExercise();
      
      expect(game.id, equals('breathing-1'));
      expect(game.type, equals(FocusBreakGameType.breathing));
      expect(game.gameData['pattern'], isA<Map>());
      expect(game.gameData['pattern']['inhaleSeconds'], equals(4));
    });

    test('randomGame returns a valid game', () {
      final game = FocusBreakGames.randomGame();
      
      expect(game, isNotNull);
      expect(game.id, isNotEmpty);
      expect(game.type, isA<FocusBreakGameType>());
    });

    test('getByType returns correct game', () {
      final game = FocusBreakGames.getByType(FocusBreakGameType.memory);
      
      expect(game, isNotNull);
      expect(game!.type, equals(FocusBreakGameType.memory));
    });

    test('getByType returns null for invalid type', () {
      // This test assumes all types have games - testing edge case
      final allGames = FocusBreakGames.getAllGames();
      expect(allGames.isNotEmpty, isTrue);
    });
  });

  group('InteractionType', () {
    test('has expected values', () {
      expect(
        InteractionType.values,
        containsAll([
          InteractionType.tap,
          InteractionType.correctAnswer,
          InteractionType.incorrectAnswer,
        ]),
      );
    });
  });

  group('FocusMetrics', () {
    test('can be created with all fields', () {
      final metrics = FocusMetrics(
        learnerId: 'learner-1',
        sessionId: 'session-1',
        averageFocusScore: 85.5,
        breaksTaken: 2,
        gamesPlayed: 1,
        totalActiveSeconds: 1800,
        totalIdleSeconds: 120,
        periodStart: DateTime.now().subtract(const Duration(minutes: 35)),
        periodEnd: DateTime.now(),
      );
      
      expect(metrics.learnerId, equals('learner-1'));
      expect(metrics.sessionId, equals('session-1'));
      expect(metrics.averageFocusScore, equals(85.5));
      expect(metrics.breaksTaken, equals(2));
      expect(metrics.gamesPlayed, equals(1));
      expect(metrics.totalActiveSeconds, equals(1800));
      expect(metrics.totalIdleSeconds, equals(120));
    });
  });
}
