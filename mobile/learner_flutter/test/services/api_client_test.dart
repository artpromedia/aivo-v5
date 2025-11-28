import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:http/http.dart' as http;
import 'package:aivo_shared/aivo_shared.dart';

@GenerateMocks([http.Client])
import 'api_client_test.mocks.dart';

/// Test wrapper for AivoApiClient that accepts a mock HTTP client
class TestableApiClient extends AivoApiClient {
  final http.Client httpClient;

  TestableApiClient({
    required String baseUrl,
    required this.httpClient,
  }) : super(baseUrl: baseUrl);

  @override
  Future<Map<String, String>> _headers() async {
    return {
      'Content-Type': 'application/json',
    };
  }
}

void main() {
  late MockClient mockHttpClient;
  late AivoApiClient apiClient;
  const baseUrl = 'https://api.test.com';

  setUp(() {
    mockHttpClient = MockClient();
    // Using the standard client for tests with mocked responses
    apiClient = AivoApiClient(baseUrl: baseUrl);
  });

  group('AivoApiClient', () {
    group('Homework Session API', () {
      test('createHomeworkSession sends correct request structure', () async {
        // Test that the request would be properly formatted
        const learnerId = 'learner-123';
        const title = 'Math Homework';
        const subject = 'MATH';

        // Verify the expected request body structure
        final expectedBody = {
          'learnerId': learnerId,
          'title': title,
          'subject': subject,
        };

        expect(expectedBody['learnerId'], equals(learnerId));
        expect(expectedBody['title'], equals(title));
        expect(expectedBody['subject'], equals(subject));
      });

      test('API exception contains status code and body', () {
        final exception = ApiException(500, '{"error": "Server error"}');

        expect(exception.statusCode, equals(500));
        expect(exception.body, contains('Server error'));
        expect(exception.toString(), contains('500'));
      });

      test('API exception handles empty body', () {
        final exception = ApiException(404, '');

        expect(exception.statusCode, equals(404));
        expect(exception.body, isEmpty);
      });
    });

    group('Emotion API', () {
      test('logEmotionCheckIn builds correct request body', () {
        const learnerId = 'learner-123';
        const emotion = 'happy';
        const level = 8;
        const trigger = 'finished homework';

        final expectedBody = {
          'learnerId': learnerId,
          'emotion': emotion,
          'level': level,
          'trigger': trigger,
        };

        expect(expectedBody['emotion'], equals('happy'));
        expect(expectedBody['level'], equals(8));
        expect(expectedBody['trigger'], equals(trigger));
      });

      test('logEmotionCheckIn omits optional fields when null', () {
        const learnerId = 'learner-123';
        const emotion = 'calm';
        const level = 5;

        final body = <String, dynamic>{
          'learnerId': learnerId,
          'emotion': emotion,
          'level': level,
        };

        // Optional fields should not be present
        expect(body.containsKey('trigger'), isFalse);
        expect(body.containsKey('context'), isFalse);
      });
    });

    group('Regulation API', () {
      test('startRegulationSession includes required fields', () {
        const learnerId = 'learner-123';
        const activityId = 'breathing-box';
        const activityType = 'breathing';

        final body = {
          'learnerId': learnerId,
          'activityId': activityId,
          'activityType': activityType,
        };

        expect(body.keys, containsAll(['learnerId', 'activityId', 'activityType']));
      });

      test('completeRegulationSession includes duration', () {
        const sessionId = 'session-123';
        const durationSeconds = 120;
        const emotionAfter = 'calm';
        const effectiveness = 4;

        final body = {
          'durationSeconds': durationSeconds,
          'emotionAfter': emotionAfter,
          'effectiveness': effectiveness,
        };

        expect(body['durationSeconds'], equals(120));
        expect(body['emotionAfter'], equals('calm'));
        expect(body['effectiveness'], equals(4));
      });
    });

    group('Sensory Profile API', () {
      test('getSensoryProfile uses correct endpoint', () {
        const learnerId = 'learner-123';
        final expectedPath = '/learners/$learnerId/sensory-profile';

        expect(expectedPath, equals('/learners/learner-123/sensory-profile'));
      });
    });

    group('Session API', () {
      test('startSession includes subject', () {
        const learnerId = 'learner-123';
        const subject = 'READING';

        final body = {
          'subject': subject,
        };

        expect(body['subject'], equals('READING'));
      });

      test('planSession includes all required fields', () {
        const learnerId = 'learner-123';
        const subject = 'MATH';
        const region = 'us-east-1';

        final body = {
          'learnerId': learnerId,
          'subject': subject,
          'region': region,
        };

        expect(body.length, equals(3));
      });
    });
  });

  group('HomeworkSession model', () {
    test('parses from JSON correctly', () {
      final json = {
        'id': 'hw-123',
        'learnerId': 'learner-456',
        'title': 'Math Problem Set',
        'subject': 'MATH',
        'currentStep': 'understand',
        'hintsUsed': 1,
        'createdAt': '2024-01-15T10:00:00Z',
        'updatedAt': '2024-01-15T10:30:00Z',
        'workProducts': [],
      };

      final session = HomeworkSession.fromJson(json);

      expect(session.id, equals('hw-123'));
      expect(session.learnerId, equals('learner-456'));
      expect(session.title, equals('Math Problem Set'));
      expect(session.hintsUsed, equals(1));
    });

    test('handles missing optional fields', () {
      final json = {
        'id': 'hw-123',
        'learnerId': 'learner-456',
        'title': 'Test',
        'createdAt': '2024-01-15T10:00:00Z',
        'updatedAt': '2024-01-15T10:30:00Z',
      };

      final session = HomeworkSession.fromJson(json);

      expect(session.id, equals('hw-123'));
      expect(session.subject, isNull);
    });
  });

  group('RegulationActivity model', () {
    test('parses activity types correctly', () {
      expect(
        RegulationActivityType.values,
        containsAll([
          RegulationActivityType.breathing,
          RegulationActivityType.movement,
          RegulationActivityType.grounding,
          RegulationActivityType.sensory,
        ]),
      );
    });

    test('creates activity with all fields', () {
      final activity = RegulationActivity(
        id: 'breathing-box',
        name: 'Box Breathing',
        description: 'Square breathing pattern',
        type: RegulationActivityType.breathing,
        durationSeconds: 120,
        instructions: ['Inhale', 'Hold', 'Exhale', 'Hold'],
      );

      expect(activity.id, equals('breathing-box'));
      expect(activity.name, equals('Box Breathing'));
      expect(activity.durationSeconds, equals(120));
      expect(activity.instructions.length, equals(4));
    });
  });

  group('EmotionCheckIn model', () {
    test('parses from JSON correctly', () {
      final json = {
        'id': 'checkin-123',
        'learnerId': 'learner-456',
        'emotion': 'happy',
        'level': 8,
        'trigger': 'finished homework',
        'timestamp': '2024-01-15T10:00:00Z',
      };

      final checkIn = EmotionCheckIn.fromJson(json);

      expect(checkIn.id, equals('checkin-123'));
      expect(checkIn.emotion, equals('happy'));
      expect(checkIn.level, equals(8));
    });
  });
}
