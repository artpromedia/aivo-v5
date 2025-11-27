import 'dart:convert';
import 'package:http/http.dart' as http;
import 'models.dart';

class AivoApiClient {
  final String baseUrl;
  final Future<String?> Function()? getToken;

  AivoApiClient({
    this.baseUrl = 'http://localhost:4000',
    this.getToken,
  });

  Future<Map<String, String>> _headers() async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (getToken != null) {
      final token = await getToken!();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  Future<Map<String, dynamic>> _get(String path) async {
    final response = await http.get(
      Uri.parse('$baseUrl$path'),
      headers: await _headers(),
    );
    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, response.body);
    }
    return json.decode(response.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> _post(String path, Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: await _headers(),
      body: json.encode(body),
    );
    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, response.body);
    }
    return json.decode(response.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> _patch(String path, Map<String, dynamic> body) async {
    final response = await http.patch(
      Uri.parse('$baseUrl$path'),
      headers: await _headers(),
      body: json.encode(body),
    );
    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, response.body);
    }
    return json.decode(response.body) as Map<String, dynamic>;
  }

  // ==================== Learner APIs ====================

  Future<MeResponse> me() async {
    final data = await _get('/me');
    return MeResponse.fromJson(data);
  }

  Future<LearnerResponse> getLearner(String learnerId) async {
    final data = await _get('/learners/$learnerId');
    return LearnerResponse.fromJson(data);
  }

  Future<TodaySessionResponse> getTodaySession(String learnerId, String subject) async {
    final data = await _get('/learners/$learnerId/sessions/today?subject=$subject');
    return TodaySessionResponse.fromJson(data);
  }

  Future<StartSessionResponse> startSession({
    required String learnerId,
    required String subject,
  }) async {
    final data = await _post('/learners/$learnerId/sessions', {
      'subject': subject,
    });
    return StartSessionResponse.fromJson(data);
  }

  Future<SessionPlanResponse> planSession({
    required String learnerId,
    required String subject,
    required String region,
  }) async {
    final data = await _post('/sessions/plan', {
      'learnerId': learnerId,
      'subject': subject,
      'region': region,
    });
    return SessionPlanResponse.fromJson(data);
  }

  Future<UpdateActivityResponse> updateActivityStatus({
    required String sessionId,
    required String activityId,
    required String status,
  }) async {
    final data = await _patch('/sessions/$sessionId/activities/$activityId', {
      'status': status,
    });
    return UpdateActivityResponse.fromJson(data);
  }

  Future<BaselineResponse> generateBaseline({
    required String learnerId,
    required List<String> subjects,
  }) async {
    final data = await _post('/learners/$learnerId/baseline', {
      'subjects': subjects,
    });
    return BaselineResponse.fromJson(data);
  }

  Future<void> recordFeedback({
    required String targetType,
    required String targetId,
    required int rating,
    required String label,
  }) async {
    await _post('/feedback', {
      'targetType': targetType,
      'targetId': targetId,
      'rating': rating,
      'label': label,
    });
  }

  // ==================== Parent/Teacher APIs ====================

  Future<CaregiverOverviewResponse> getCaregiverLearnerOverview(String learnerId) async {
    final data = await _get('/caregivers/learners/$learnerId/overview');
    return CaregiverOverviewResponse.fromJson(data);
  }

  Future<NotificationsResponse> listNotifications() async {
    final data = await _get('/notifications');
    return NotificationsResponse.fromJson(data);
  }

  Future<void> markNotificationRead(String id) async {
    await _patch('/notifications/$id', {'read': true});
  }

  Future<DifficultyProposalsResponse> listDifficultyProposals(String learnerId) async {
    final data = await _get('/learners/$learnerId/difficulty-proposals');
    return DifficultyProposalsResponse.fromJson(data);
  }

  Future<void> decideOnDifficultyProposal({
    required String proposalId,
    required bool approve,
  }) async {
    await _post('/difficulty-proposals/$proposalId/decide', {
      'approve': approve,
    });
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException(this.statusCode, this.message);

  @override
  String toString() => 'ApiException($statusCode): $message';
}
