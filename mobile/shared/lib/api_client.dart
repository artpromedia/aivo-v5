import 'dart:convert';
import 'package:http/http.dart' as http;
import 'models.dart';
import 'sensory_profile.dart';

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

  // ==================== Regulation/Calm Corner APIs ====================

  /// Get available regulation activities
  Future<List<RegulationActivity>> getRegulationActivities({
    String? type,
    String? gradeTheme,
  }) async {
    final params = <String, String>{};
    if (type != null) params['type'] = type;
    if (gradeTheme != null) params['gradeTheme'] = gradeTheme;
    final queryString = params.isNotEmpty
        ? '?${params.entries.map((e) => '${e.key}=${e.value}').join('&')}'
        : '';
    final data = await _get('/regulation/activities$queryString');
    return (data['activities'] as List<dynamic>)
        .map((e) => RegulationActivity.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Start a regulation session
  Future<RegulationSession> startRegulationSession({
    required String learnerId,
    required String activityId,
    required String activityType,
    String? emotionBefore,
    int? emotionLevelBefore,
  }) async {
    final data = await _post('/regulation/sessions', {
      'learnerId': learnerId,
      'activityId': activityId,
      'activityType': activityType,
      if (emotionBefore != null) 'emotionBefore': emotionBefore,
      if (emotionLevelBefore != null) 'emotionLevelBefore': emotionLevelBefore,
    });
    return RegulationSession.fromJson(data);
  }

  /// Complete a regulation session
  Future<RegulationSession> completeRegulationSession({
    required String sessionId,
    required int durationSeconds,
    String? emotionAfter,
    int? emotionLevelAfter,
    int? effectiveness,
  }) async {
    final data = await _patch('/regulation/sessions/$sessionId', {
      'durationSeconds': durationSeconds,
      if (emotionAfter != null) 'emotionAfter': emotionAfter,
      if (emotionLevelAfter != null) 'emotionLevelAfter': emotionLevelAfter,
      if (effectiveness != null) 'effectiveness': effectiveness,
    });
    return RegulationSession.fromJson(data);
  }

  /// Get regulation history
  Future<List<RegulationSession>> getRegulationHistory(String learnerId) async {
    final data = await _get('/regulation/sessions?learnerId=$learnerId');
    return (data['sessions'] as List<dynamic>)
        .map((e) => RegulationSession.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Log emotion check-in
  Future<void> logEmotionCheckIn({
    required String learnerId,
    required String emotion,
    required int level,
    String? trigger,
    String? context,
  }) async {
    await _post('/regulation/check-ins', {
      'learnerId': learnerId,
      'emotion': emotion,
      'level': level,
      if (trigger != null) 'trigger': trigger,
      if (context != null) 'context': context,
    });
  }

  /// Get emotion history
  Future<List<EmotionCheckIn>> getEmotionHistory(String learnerId) async {
    final data = await _get('/regulation/check-ins?learnerId=$learnerId');
    return (data['checkIns'] as List<dynamic>)
        .map((e) => EmotionCheckIn.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ==================== Sensory Profile APIs ====================

  /// Get learner's sensory profile
  Future<SensoryProfile> getSensoryProfile(String learnerId) async {
    final data = await _get('/learners/$learnerId/sensory-profile');
    return SensoryProfile.fromJson(data);
  }

  /// Update learner's sensory profile
  Future<SensoryProfile> updateSensoryProfile({
    required String learnerId,
    required SensoryProfile profile,
  }) async {
    final data = await _put('/learners/$learnerId/sensory-profile', profile.toJson());
    return SensoryProfile.fromJson(data);
  }

  /// Get available sensory presets
  Future<List<SensoryPresetInfo>> getSensoryPresets() async {
    final data = await _get('/sensory/presets');
    return (data['presets'] as List<dynamic>)
        .map((e) => SensoryPresetInfo.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ==================== Analytics APIs ====================

  /// Get comprehensive analytics overview for a learner
  Future<LearnerAnalyticsOverview> getLearnerAnalytics(String learnerId) async {
    final data = await _get('/analytics/learners/$learnerId');
    return LearnerAnalyticsOverview.fromJson(data['analytics'] as Map<String, dynamic>);
  }

  // ==================== IEP Goal APIs ====================

  /// Get all IEP goals for a learner
  Future<List<IEPGoal>> getIEPGoals(String learnerId) async {
    final data = await _get('/iep/goals?learnerId=$learnerId');
    return (data['goals'] as List<dynamic>)
        .map((e) => IEPGoal.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Get a single IEP goal by ID
  Future<IEPGoal> getIEPGoal(String goalId) async {
    final data = await _get('/iep/goals/$goalId');
    return IEPGoal.fromJson(data);
  }

  /// Create a new IEP goal
  Future<IEPGoal> createIEPGoal({
    required String learnerId,
    required String goal,
    required String category,
    required DateTime targetDate,
    String? notes,
  }) async {
    final data = await _post('/iep/goals', {
      'learnerId': learnerId,
      'goal': goal,
      'category': category,
      'targetDate': targetDate.toIso8601String(),
      if (notes != null) 'notes': notes,
    });
    return IEPGoal.fromJson(data['goal'] as Map<String, dynamic>);
  }

  /// Update an IEP goal
  Future<IEPGoal> updateIEPGoal({
    required String goalId,
    String? goal,
    String? category,
    DateTime? targetDate,
    String? status,
    String? notes,
  }) async {
    final data = await _patch('/iep/goals/$goalId', {
      if (goal != null) 'goal': goal,
      if (category != null) 'category': category,
      if (targetDate != null) 'targetDate': targetDate.toIso8601String(),
      if (status != null) 'status': status,
      if (notes != null) 'notes': notes,
    });
    return IEPGoal.fromJson(data);
  }

  /// Add a data point to an IEP goal
  Future<IEPDataPoint> addIEPDataPoint({
    required String goalId,
    required int value,
    required DateTime date,
    required String collectedBy,
    String? notes,
    String? prompt,
    String? response,
    String? setting,
    List<String>? supportUsed,
  }) async {
    final data = await _post('/iep/goals/$goalId/data-points', {
      'value': value,
      'date': date.toIso8601String(),
      'collectedBy': collectedBy,
      if (notes != null) 'notes': notes,
      if (prompt != null) 'prompt': prompt,
      if (response != null) 'response': response,
      if (setting != null) 'setting': setting,
      if (supportUsed != null) 'supportUsed': supportUsed,
    });
    return IEPDataPoint.fromJson(data);
  }

  /// Get data points for an IEP goal
  Future<List<IEPDataPoint>> getIEPDataPoints(String goalId) async {
    final data = await _get('/iep/goals/$goalId/data-points');
    return (data['dataPoints'] as List<dynamic>)
        .map((e) => IEPDataPoint.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Add a note to an IEP goal
  Future<IEPNote> addIEPNote({
    required String goalId,
    required String content,
    required String authorId,
    required String authorName,
    required String authorRole,
  }) async {
    final data = await _post('/iep/goals/$goalId/notes', {
      'content': content,
      'authorId': authorId,
      'authorName': authorName,
      'authorRole': authorRole,
    });
    return IEPNote.fromJson(data);
  }

  /// Get notes for an IEP goal
  Future<List<IEPNote>> getIEPNotes(String goalId) async {
    final data = await _get('/iep/goals/$goalId/notes');
    return (data['notes'] as List<dynamic>)
        .map((e) => IEPNote.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ==================== IEP Document APIs ====================

  /// Get all IEP documents for a learner
  Future<List<IEPDocument>> getIEPDocuments(String learnerId) async {
    final data = await _get('/iep/documents/$learnerId');
    return (data as List<dynamic>)
        .map((e) => IEPDocument.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Upload an IEP document
  Future<IEPDocumentUploadResponse> uploadIEPDocument({
    required String learnerId,
    required List<int> fileBytes,
    required String filename,
  }) async {
    final uri = Uri.parse('$baseUrl/iep/upload?learner_id=$learnerId');
    final request = http.MultipartRequest('POST', uri);
    
    final headers = await _headers();
    request.headers.addAll(headers);
    
    request.files.add(http.MultipartFile.fromBytes(
      'file',
      fileBytes,
      filename: filename,
    ));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, response.body);
    }
    
    return IEPDocumentUploadResponse.fromJson(
      json.decode(response.body) as Map<String, dynamic>,
    );
  }

  /// Get document processing status
  Future<IEPDocumentStatus> getIEPDocumentStatus(String documentId) async {
    final data = await _get('/iep/documents/$documentId/status');
    return IEPDocumentStatus.fromJson(data);
  }

  /// Get extracted data from a document
  Future<IEPExtractionResult> getIEPExtractionResult(String documentId) async {
    final data = await _get('/iep/documents/$documentId/extracted');
    return IEPExtractionResult.fromJson(data);
  }

  // ==================== Homework Helper APIs ====================

  /// Create a new homework session
  Future<HomeworkSession> createHomeworkSession({
    required String learnerId,
    required String title,
    String? subject,
    String? difficultyAdjustment,
  }) async {
    final data = await _post('/homework/sessions', {
      'learnerId': learnerId,
      'title': title,
      if (subject != null) 'subject': subject,
      if (difficultyAdjustment != null) 'difficultyAdjustment': difficultyAdjustment,
    });
    return HomeworkSession.fromJson(data);
  }

  /// Get a homework session by ID
  Future<HomeworkSession> getHomeworkSession(String sessionId) async {
    final data = await _get('/homework/sessions/$sessionId');
    return HomeworkSession.fromJson(data);
  }

  /// Upload a file to a homework session (with OCR processing)
  Future<HomeworkFile> uploadHomeworkFile({
    required String sessionId,
    required List<int> fileBytes,
    required String filename,
    required String mimeType,
  }) async {
    final uri = Uri.parse('$baseUrl/homework/sessions/$sessionId/upload');
    final request = http.MultipartRequest('POST', uri);
    
    final headers = await _headers();
    request.headers.addAll(headers);
    
    request.files.add(http.MultipartFile.fromBytes(
      'file',
      fileBytes,
      filename: filename,
    ));
    request.fields['mimeType'] = mimeType;

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, response.body);
    }
    
    return HomeworkFile.fromJson(json.decode(response.body) as Map<String, dynamic>);
  }

  /// Advance to the next step in a homework session
  Future<HomeworkSession> advanceHomeworkStep({
    required String sessionId,
    required HomeworkStep currentStep,
    required String inputType,
    required Map<String, dynamic> inputData,
  }) async {
    final data = await _post('/homework/sessions/$sessionId/step', {
      'currentStep': currentStep.name,
      'inputType': inputType,
      'inputData': inputData,
    });
    return HomeworkSession.fromJson(data);
  }

  /// Request a hint for the current problem
  Future<HomeworkHintResponse> requestHomeworkHint({
    required String sessionId,
    required HomeworkStep step,
  }) async {
    final data = await _post('/homework/sessions/$sessionId/hint', {
      'step': step.name,
    });
    return HomeworkHintResponse.fromJson(data);
  }

  /// Get recent homework sessions for a learner
  Future<List<HomeworkSession>> getHomeworkSessions(String learnerId) async {
    final data = await _get('/homework/sessions?learnerId=$learnerId');
    return (data['sessions'] as List<dynamic>)
        .map((e) => HomeworkSession.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ==================== IEP Goals APIs ====================

  /// Get all IEP goals for a learner
  Future<List<IEPGoal>> getIEPGoals(String learnerId, {IEPGoalStatus? status}) async {
    final params = <String, String>{};
    if (status != null) params['status'] = status.name;
    final queryString = params.isNotEmpty
        ? '?${params.entries.map((e) => '${e.key}=${e.value}').join('&')}'
        : '';
    final data = await _get('/learners/$learnerId/iep/goals$queryString');
    return (data['goals'] as List<dynamic>)
        .map((e) => IEPGoal.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Get a specific IEP goal by ID
  Future<IEPGoal> getIEPGoal(String goalId) async {
    final data = await _get('/iep/goals/$goalId');
    return IEPGoal.fromJson(data);
  }

  /// Create a new IEP goal
  Future<IEPGoal> createIEPGoal({
    required String learnerId,
    required String title,
    required String description,
    required IEPGoalArea area,
    required String targetCriteria,
    required double targetValue,
    required double baselineValue,
    required IEPMeasurementUnit measurementUnit,
    required DateTime targetDate,
    List<IEPBenchmark>? benchmarks,
    List<IEPAccommodation>? accommodations,
  }) async {
    final data = await _post('/learners/$learnerId/iep/goals', {
      'title': title,
      'description': description,
      'area': area.name,
      'targetCriteria': targetCriteria,
      'targetValue': targetValue,
      'baselineValue': baselineValue,
      'measurementUnit': measurementUnit.name,
      'targetDate': targetDate.toIso8601String(),
      if (benchmarks != null) 'benchmarks': benchmarks.map((b) => b.toJson()).toList(),
      if (accommodations != null) 'accommodations': accommodations.map((a) => a.toJson()).toList(),
    });
    return IEPGoal.fromJson(data);
  }

  /// Update an IEP goal
  Future<IEPGoal> updateIEPGoal({
    required String goalId,
    String? title,
    String? description,
    IEPGoalStatus? status,
    double? currentValue,
    DateTime? targetDate,
    List<IEPBenchmark>? benchmarks,
    List<IEPAccommodation>? accommodations,
  }) async {
    final data = await _patch('/iep/goals/$goalId', {
      if (title != null) 'title': title,
      if (description != null) 'description': description,
      if (status != null) 'status': status.name,
      if (currentValue != null) 'currentValue': currentValue,
      if (targetDate != null) 'targetDate': targetDate.toIso8601String(),
      if (benchmarks != null) 'benchmarks': benchmarks.map((b) => b.toJson()).toList(),
      if (accommodations != null) 'accommodations': accommodations.map((a) => a.toJson()).toList(),
    });
    return IEPGoal.fromJson(data);
  }

  /// Add a data point to an IEP goal
  Future<IEPDataPoint> addIEPDataPoint({
    required String goalId,
    required double value,
    required DateTime date,
    String? notes,
    String? context,
    List<String>? evidenceUrls,
  }) async {
    final data = await _post('/iep/goals/$goalId/data-points', {
      'value': value,
      'date': date.toIso8601String(),
      if (notes != null) 'notes': notes,
      if (context != null) 'context': context,
      if (evidenceUrls != null) 'evidenceUrls': evidenceUrls,
    });
    return IEPDataPoint.fromJson(data);
  }

  /// Get notes for an IEP goal
  Future<List<IEPNote>> getIEPNotes(String goalId) async {
    final data = await _get('/iep/goals/$goalId/notes');
    return (data['notes'] as List<dynamic>)
        .map((e) => IEPNote.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Add a note to an IEP goal
  Future<IEPNote> addIEPNote({
    required String goalId,
    required String content,
    required IEPNoteType type,
    String? authorId,
  }) async {
    final data = await _post('/iep/goals/$goalId/notes', {
      'content': content,
      'type': type.name,
      if (authorId != null) 'authorId': authorId,
    });
    return IEPNote.fromJson(data);
  }

  /// Get IEP goal summary/analytics
  Future<IEPGoalSummary> getIEPGoalSummary(String learnerId) async {
    final data = await _get('/learners/$learnerId/iep/summary');
    return IEPGoalSummary.fromJson(data);
  }

  // ==================== Focus Monitor APIs ====================

  /// Log a focus event
  Future<void> logFocusEvent({
    required String learnerId,
    required String sessionId,
    required FocusEventType eventType,
    double? focusScore,
    Map<String, dynamic>? metadata,
  }) async {
    await _post('/focus/events', {
      'learnerId': learnerId,
      'sessionId': sessionId,
      'eventType': eventType.name,
      if (focusScore != null) 'focusScore': focusScore,
      if (metadata != null) 'metadata': metadata,
    });
  }

  /// Generate a break game suggestion
  Future<FocusBreakGame> generateBreakGame({
    required String learnerId,
    String? preferredType,
    int? durationMinutes,
  }) async {
    final data = await _post('/focus/break-game', {
      'learnerId': learnerId,
      if (preferredType != null) 'preferredType': preferredType,
      if (durationMinutes != null) 'durationMinutes': durationMinutes,
    });
    return FocusBreakGame.fromJson(data);
  }

  /// Log game completion
  Future<void> logGameCompleted({
    required String learnerId,
    required String sessionId,
    required String gameId,
    required String gameType,
    required int durationSeconds,
    int? score,
    Map<String, dynamic>? metrics,
  }) async {
    await _post('/focus/game-completed', {
      'learnerId': learnerId,
      'sessionId': sessionId,
      'gameId': gameId,
      'gameType': gameType,
      'durationSeconds': durationSeconds,
      if (score != null) 'score': score,
      if (metrics != null) 'metrics': metrics,
    });
  }

  /// Get focus metrics for a learner
  Future<FocusMetrics> getFocusMetrics(String learnerId, {
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final params = <String, String>{};
    if (startDate != null) params['startDate'] = startDate.toIso8601String();
    if (endDate != null) params['endDate'] = endDate.toIso8601String();
    final queryString = params.isNotEmpty
        ? '?${params.entries.map((e) => '${e.key}=${e.value}').join('&')}'
        : '';
    final data = await _get('/learners/$learnerId/focus/metrics$queryString');
    return FocusMetrics.fromJson(data);
  }

  /// Get break suggestions based on current focus state
  Future<List<FocusBreakGame>> getBreakSuggestions(String learnerId) async {
    final data = await _get('/learners/$learnerId/focus/break-suggestions');
    return (data['suggestions'] as List<dynamic>)
        .map((e) => FocusBreakGame.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, dynamic>> _put(String path, Map<String, dynamic> body) async {
    final response = await http.put(
      Uri.parse('$baseUrl$path'),
      headers: await _headers(),
      body: json.encode(body),
    );
    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, response.body);
    }
    return json.decode(response.body) as Map<String, dynamic>;
  }
}

/// Response wrapper for regulation activities list
class RegulationActivitiesResponse {
  final List<RegulationActivity> activities;

  RegulationActivitiesResponse({required this.activities});

  factory RegulationActivitiesResponse.fromJson(Map<String, dynamic> json) {
    return RegulationActivitiesResponse(
      activities: (json['activities'] as List<dynamic>)
          .map((e) => RegulationActivity.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

/// Response wrapper for emotion check-ins list
class EmotionCheckInsResponse {
  final List<EmotionCheckIn> checkIns;

  EmotionCheckInsResponse({required this.checkIns});

  factory EmotionCheckInsResponse.fromJson(Map<String, dynamic> json) {
    return EmotionCheckInsResponse(
      checkIns: (json['checkIns'] as List<dynamic>)
          .map((e) => EmotionCheckIn.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

/// Response wrapper for regulation sessions list
class RegulationSessionsResponse {
  final List<RegulationSession> sessions;

  RegulationSessionsResponse({required this.sessions});

  factory RegulationSessionsResponse.fromJson(Map<String, dynamic> json) {
    return RegulationSessionsResponse(
      sessions: (json['sessions'] as List<dynamic>)
          .map((e) => RegulationSession.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException(this.statusCode, this.message);

  @override
  String toString() => 'ApiException($statusCode): $message';
}
