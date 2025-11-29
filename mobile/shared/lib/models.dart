// ==================== Core Types ====================

class Learner {
  final String id;
  final String displayName;
  final int currentGrade;
  final String region;
  final List<String>? subjects;

  Learner({
    required this.id,
    required this.displayName,
    required this.currentGrade,
    required this.region,
    this.subjects,
  });

  factory Learner.fromJson(Map<String, dynamic> json) {
    return Learner(
      id: json['id'] as String,
      displayName: json['displayName'] as String,
      currentGrade: json['currentGrade'] as int,
      region: json['region'] as String,
      subjects: (json['subjects'] as List<dynamic>?)?.cast<String>(),
    );
  }
}

class SubjectLevel {
  final String subject;
  final int enrolledGrade;
  final int assessedGradeLevel;
  final double masteryScore;
  final String? difficultyRecommendation;

  SubjectLevel({
    required this.subject,
    required this.enrolledGrade,
    required this.assessedGradeLevel,
    required this.masteryScore,
    this.difficultyRecommendation,
  });

  factory SubjectLevel.fromJson(Map<String, dynamic> json) {
    return SubjectLevel(
      subject: json['subject'] as String,
      enrolledGrade: json['enrolledGrade'] as int,
      assessedGradeLevel: json['assessedGradeLevel'] as int,
      masteryScore: (json['masteryScore'] as num).toDouble(),
      difficultyRecommendation: json['difficultyRecommendation'] as String?,
    );
  }
}

class BrainProfile {
  final String id;
  final List<SubjectLevel> subjectLevels;

  BrainProfile({
    required this.id,
    required this.subjectLevels,
  });

  factory BrainProfile.fromJson(Map<String, dynamic> json) {
    return BrainProfile(
      id: json['id'] as String,
      subjectLevels: (json['subjectLevels'] as List<dynamic>)
          .map((e) => SubjectLevel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

// ==================== Session Types ====================

class SessionActivity {
  final String id;
  final String type;
  final String title;
  final String instructions;
  final int estimatedMinutes;
  final String status;
  final String subject;

  SessionActivity({
    required this.id,
    required this.type,
    required this.title,
    required this.instructions,
    required this.estimatedMinutes,
    required this.status,
    required this.subject,
  });

  factory SessionActivity.fromJson(Map<String, dynamic> json) {
    return SessionActivity(
      id: json['id'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      instructions: json['instructions'] as String,
      estimatedMinutes: json['estimatedMinutes'] as int,
      status: json['status'] as String,
      subject: json['subject'] as String? ?? 'math',
    );
  }
}

class LearnerSession {
  final String id;
  final String status;
  final int plannedMinutes;
  final List<SessionActivity> activities;

  LearnerSession({
    required this.id,
    required this.status,
    required this.plannedMinutes,
    required this.activities,
  });

  factory LearnerSession.fromJson(Map<String, dynamic> json) {
    return LearnerSession(
      id: json['id'] as String,
      status: json['status'] as String,
      plannedMinutes: json['plannedMinutes'] as int,
      activities: (json['activities'] as List<dynamic>)
          .map((e) => SessionActivity.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class SessionPlanInsights {
  final String objective;
  final String tone;
  final String difficultySummary;
  final List<String> calmingStrategies;

  SessionPlanInsights({
    required this.objective,
    required this.tone,
    required this.difficultySummary,
    required this.calmingStrategies,
  });

  factory SessionPlanInsights.fromJson(Map<String, dynamic> json) {
    return SessionPlanInsights(
      objective: json['objective'] as String,
      tone: json['tone'] as String,
      difficultySummary: json['difficultySummary'] as String,
      calmingStrategies: (json['calmingStrategies'] as List<dynamic>).cast<String>(),
    );
  }
}

class SessionPlan {
  final String id;
  final int plannedMinutes;
  final List<SessionActivity> activities;

  SessionPlan({
    required this.id,
    required this.plannedMinutes,
    required this.activities,
  });

  factory SessionPlan.fromJson(Map<String, dynamic> json) {
    return SessionPlan(
      id: json['id'] as String,
      plannedMinutes: json['plannedMinutes'] as int,
      activities: (json['activities'] as List<dynamic>)
          .map((e) => SessionActivity.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class SessionPlanRun {
  final SessionPlan plan;
  final SessionPlanInsights insights;

  SessionPlanRun({
    required this.plan,
    required this.insights,
  });

  factory SessionPlanRun.fromJson(Map<String, dynamic> json) {
    return SessionPlanRun(
      plan: SessionPlan.fromJson(json['plan'] as Map<String, dynamic>),
      insights: SessionPlanInsights.fromJson(json['insights'] as Map<String, dynamic>),
    );
  }
}

// ==================== Caregiver Types ====================

class DifficultyChangeProposal {
  final String id;
  final String subject;
  final String direction;
  final int fromAssessedGradeLevel;
  final int toAssessedGradeLevel;
  final String rationale;
  final String status;

  DifficultyChangeProposal({
    required this.id,
    required this.subject,
    required this.direction,
    required this.fromAssessedGradeLevel,
    required this.toAssessedGradeLevel,
    required this.rationale,
    required this.status,
  });

  factory DifficultyChangeProposal.fromJson(Map<String, dynamic> json) {
    return DifficultyChangeProposal(
      id: json['id'] as String,
      subject: json['subject'] as String,
      direction: json['direction'] as String,
      fromAssessedGradeLevel: json['fromAssessedGradeLevel'] as int,
      toAssessedGradeLevel: json['toAssessedGradeLevel'] as int,
      rationale: json['rationale'] as String,
      status: json['status'] as String,
    );
  }
}

class BaselineSummary {
  final String notes;
  final List<SubjectLevel> subjectLevels;

  BaselineSummary({
    required this.notes,
    required this.subjectLevels,
  });

  factory BaselineSummary.fromJson(Map<String, dynamic> json) {
    return BaselineSummary(
      notes: json['notes'] as String,
      subjectLevels: (json['subjectLevels'] as List<dynamic>)
          .map((e) => SubjectLevel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class CaregiverLearnerOverview {
  final Learner learner;
  final List<SubjectLevel> subjects;
  final BaselineSummary? lastBaselineSummary;
  final List<DifficultyChangeProposal> pendingDifficultyProposals;
  final List<String> recentSessionDates;

  CaregiverLearnerOverview({
    required this.learner,
    required this.subjects,
    this.lastBaselineSummary,
    required this.pendingDifficultyProposals,
    required this.recentSessionDates,
  });

  factory CaregiverLearnerOverview.fromJson(Map<String, dynamic> json) {
    return CaregiverLearnerOverview(
      learner: Learner.fromJson(json['learner'] as Map<String, dynamic>),
      subjects: (json['subjects'] as List<dynamic>)
          .map((e) => SubjectLevel.fromJson(e as Map<String, dynamic>))
          .toList(),
      lastBaselineSummary: json['lastBaselineSummary'] != null
          ? BaselineSummary.fromJson(json['lastBaselineSummary'] as Map<String, dynamic>)
          : null,
      pendingDifficultyProposals: (json['pendingDifficultyProposals'] as List<dynamic>)
          .map((e) => DifficultyChangeProposal.fromJson(e as Map<String, dynamic>))
          .toList(),
      recentSessionDates: (json['recentSessionDates'] as List<dynamic>).cast<String>(),
    );
  }
}

class NotificationSummary {
  final String id;
  final String title;
  final String body;
  final String createdAtFriendly;
  final bool read;

  NotificationSummary({
    required this.id,
    required this.title,
    required this.body,
    required this.createdAtFriendly,
    required this.read,
  });

  factory NotificationSummary.fromJson(Map<String, dynamic> json) {
    return NotificationSummary(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      createdAtFriendly: json['createdAtFriendly'] as String,
      read: json['read'] as bool? ?? false,
    );
  }
}

// ==================== API Response Types ====================

class MeResponse {
  final Learner? learner;

  MeResponse({this.learner});

  factory MeResponse.fromJson(Map<String, dynamic> json) {
    return MeResponse(
      learner: json['learner'] != null
          ? Learner.fromJson(json['learner'] as Map<String, dynamic>)
          : null,
    );
  }
}

class LearnerResponse {
  final Learner learner;
  final BrainProfile? brainProfile;

  LearnerResponse({
    required this.learner,
    this.brainProfile,
  });

  factory LearnerResponse.fromJson(Map<String, dynamic> json) {
    return LearnerResponse(
      learner: Learner.fromJson(json['learner'] as Map<String, dynamic>),
      brainProfile: json['brainProfile'] != null
          ? BrainProfile.fromJson(json['brainProfile'] as Map<String, dynamic>)
          : null,
    );
  }
}

class TodaySessionResponse {
  final LearnerSession? session;

  TodaySessionResponse({this.session});

  factory TodaySessionResponse.fromJson(Map<String, dynamic> json) {
    return TodaySessionResponse(
      session: json['session'] != null
          ? LearnerSession.fromJson(json['session'] as Map<String, dynamic>)
          : null,
    );
  }
}

class StartSessionResponse {
  final LearnerSession session;

  StartSessionResponse({required this.session});

  factory StartSessionResponse.fromJson(Map<String, dynamic> json) {
    return StartSessionResponse(
      session: LearnerSession.fromJson(json['session'] as Map<String, dynamic>),
    );
  }
}

class SessionPlanResponse {
  final SessionPlanRun run;

  SessionPlanResponse({required this.run});

  factory SessionPlanResponse.fromJson(Map<String, dynamic> json) {
    return SessionPlanResponse(
      run: SessionPlanRun.fromJson(json['run'] as Map<String, dynamic>),
    );
  }
}

class UpdateActivityResponse {
  final LearnerSession session;

  UpdateActivityResponse({required this.session});

  factory UpdateActivityResponse.fromJson(Map<String, dynamic> json) {
    return UpdateActivityResponse(
      session: LearnerSession.fromJson(json['session'] as Map<String, dynamic>),
    );
  }
}

class BaselineResponse {
  final Assessment assessment;

  BaselineResponse({required this.assessment});

  factory BaselineResponse.fromJson(Map<String, dynamic> json) {
    return BaselineResponse(
      assessment: Assessment.fromJson(json['assessment'] as Map<String, dynamic>),
    );
  }
}

class Assessment {
  final String id;

  Assessment({required this.id});

  factory Assessment.fromJson(Map<String, dynamic> json) {
    return Assessment(id: json['id'] as String);
  }
}

class CaregiverOverviewResponse {
  final CaregiverLearnerOverview overview;

  CaregiverOverviewResponse({required this.overview});

  factory CaregiverOverviewResponse.fromJson(Map<String, dynamic> json) {
    return CaregiverOverviewResponse(
      overview: CaregiverLearnerOverview.fromJson(json['overview'] as Map<String, dynamic>),
    );
  }
}

class NotificationsResponse {
  final List<NotificationSummary> items;

  NotificationsResponse({required this.items});

  factory NotificationsResponse.fromJson(Map<String, dynamic> json) {
    return NotificationsResponse(
      items: (json['items'] as List<dynamic>)
          .map((e) => NotificationSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class DifficultyProposalsResponse {
  final List<DifficultyChangeProposal> proposals;

  DifficultyProposalsResponse({required this.proposals});

  factory DifficultyProposalsResponse.fromJson(Map<String, dynamic> json) {
    return DifficultyProposalsResponse(
      proposals: (json['proposals'] as List<dynamic>)
          .map((e) => DifficultyChangeProposal.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

// ==================== Self-Regulation Hub Types ====================

/// Types of regulation activities available
enum RegulationActivityType { breathing, movement, grounding, sensory }

/// Emotion options for check-ins
enum EmotionType {
  happy,
  sad,
  anxious,
  frustrated,
  calm,
  excited,
  tired,
  angry,
  overwhelmed,
  proud,
}

/// Grade-appropriate theme levels
enum GradeTheme { K5, MS, HS }

/// Extension methods for RegulationActivityType
extension RegulationActivityTypeExtension on RegulationActivityType {
  String get displayName {
    switch (this) {
      case RegulationActivityType.breathing:
        return 'Breathing';
      case RegulationActivityType.movement:
        return 'Movement';
      case RegulationActivityType.grounding:
        return 'Grounding';
      case RegulationActivityType.sensory:
        return 'Sensory';
    }
  }

  String get emoji {
    switch (this) {
      case RegulationActivityType.breathing:
        return '🌬️';
      case RegulationActivityType.movement:
        return '🏃';
      case RegulationActivityType.grounding:
        return '🌳';
      case RegulationActivityType.sensory:
        return '✨';
    }
  }

  String get description {
    switch (this) {
      case RegulationActivityType.breathing:
        return 'Calm your body with breathing exercises';
      case RegulationActivityType.movement:
        return 'Release energy through movement';
      case RegulationActivityType.grounding:
        return 'Connect with your surroundings';
      case RegulationActivityType.sensory:
        return 'Engage your senses mindfully';
    }
  }

  static RegulationActivityType fromString(String value) {
    return RegulationActivityType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => RegulationActivityType.breathing,
    );
  }
}

/// Extension methods for EmotionType
extension EmotionTypeExtension on EmotionType {
  String get displayName {
    switch (this) {
      case EmotionType.happy:
        return 'Happy';
      case EmotionType.sad:
        return 'Sad';
      case EmotionType.anxious:
        return 'Anxious';
      case EmotionType.frustrated:
        return 'Frustrated';
      case EmotionType.calm:
        return 'Calm';
      case EmotionType.excited:
        return 'Excited';
      case EmotionType.tired:
        return 'Tired';
      case EmotionType.angry:
        return 'Angry';
      case EmotionType.overwhelmed:
        return 'Overwhelmed';
      case EmotionType.proud:
        return 'Proud';
    }
  }

  String get emoji {
    switch (this) {
      case EmotionType.happy:
        return '😊';
      case EmotionType.sad:
        return '😢';
      case EmotionType.anxious:
        return '😰';
      case EmotionType.frustrated:
        return '😤';
      case EmotionType.calm:
        return '😌';
      case EmotionType.excited:
        return '🤩';
      case EmotionType.tired:
        return '😴';
      case EmotionType.angry:
        return '😠';
      case EmotionType.overwhelmed:
        return '😵';
      case EmotionType.proud:
        return '🥳';
    }
  }

  /// Whether this emotion typically needs calming strategies
  bool get needsRegulation {
    switch (this) {
      case EmotionType.anxious:
      case EmotionType.frustrated:
      case EmotionType.angry:
      case EmotionType.overwhelmed:
        return true;
      default:
        return false;
    }
  }

  static EmotionType fromString(String value) {
    return EmotionType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => EmotionType.calm,
    );
  }
}

/// Record of a learner's emotional check-in
class EmotionCheckIn {
  final String id;
  final String learnerId;
  final EmotionType emotion;
  final int level; // 1-5 intensity
  final String? trigger;
  final String? strategy;
  final String? context;
  final DateTime timestamp;

  EmotionCheckIn({
    required this.id,
    required this.learnerId,
    required this.emotion,
    required this.level,
    this.trigger,
    this.strategy,
    this.context,
    required this.timestamp,
  });

  factory EmotionCheckIn.fromJson(Map<String, dynamic> json) {
    return EmotionCheckIn(
      id: json['id'] as String,
      learnerId: json['learnerId'] as String,
      emotion: EmotionTypeExtension.fromString(json['emotion'] as String),
      level: json['level'] as int,
      trigger: json['trigger'] as String?,
      strategy: json['strategy'] as String?,
      context: json['context'] as String?,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'learnerId': learnerId,
      'emotion': emotion.name,
      'level': level,
      'trigger': trigger,
      'strategy': strategy,
      'context': context,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

/// A regulation activity that can be performed
class RegulationActivity {
  final String id;
  final String name;
  final String description;
  final RegulationActivityType type;
  final int durationSeconds;
  final String? audioUrl;
  final String? videoUrl;
  final String? imageUrl;
  final List<String> instructions;
  final GradeTheme gradeTheme;
  final List<EmotionType> recommendedFor;
  final int? minAge;
  final int? maxAge;

  RegulationActivity({
    required this.id,
    required this.name,
    required this.description,
    required this.type,
    required this.durationSeconds,
    this.audioUrl,
    this.videoUrl,
    this.imageUrl,
    required this.instructions,
    required this.gradeTheme,
    this.recommendedFor = const [],
    this.minAge,
    this.maxAge,
  });

  factory RegulationActivity.fromJson(Map<String, dynamic> json) {
    return RegulationActivity(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      type: RegulationActivityTypeExtension.fromString(json['type'] as String),
      durationSeconds: json['durationSeconds'] as int,
      audioUrl: json['audioUrl'] as String?,
      videoUrl: json['videoUrl'] as String?,
      imageUrl: json['imageUrl'] as String?,
      instructions: (json['instructions'] as List<dynamic>).cast<String>(),
      gradeTheme: GradeTheme.values.firstWhere(
        (e) => e.name == json['gradeTheme'],
        orElse: () => GradeTheme.K5,
      ),
      recommendedFor: (json['recommendedFor'] as List<dynamic>?)
              ?.map((e) => EmotionTypeExtension.fromString(e as String))
              .toList() ??
          [],
      minAge: json['minAge'] as int?,
      maxAge: json['maxAge'] as int?,
    );
  }

  String get durationDisplay {
    if (durationSeconds < 60) {
      return '${durationSeconds}s';
    } else {
      final minutes = durationSeconds ~/ 60;
      final seconds = durationSeconds % 60;
      return seconds > 0 ? '${minutes}m ${seconds}s' : '${minutes}m';
    }
  }
}

/// A completed regulation session
class RegulationSession {
  final String id;
  final String learnerId;
  final String activityId;
  final RegulationActivityType activityType;
  final EmotionType? emotionBefore;
  final int? emotionLevelBefore;
  final EmotionType? emotionAfter;
  final int? emotionLevelAfter;
  final int durationSeconds;
  final bool completed;
  final int? effectiveness; // 1-5 rating
  final String? notes;
  final DateTime createdAt;

  RegulationSession({
    required this.id,
    required this.learnerId,
    required this.activityId,
    required this.activityType,
    this.emotionBefore,
    this.emotionLevelBefore,
    this.emotionAfter,
    this.emotionLevelAfter,
    required this.durationSeconds,
    required this.completed,
    this.effectiveness,
    this.notes,
    required this.createdAt,
  });

  factory RegulationSession.fromJson(Map<String, dynamic> json) {
    return RegulationSession(
      id: json['id'] as String,
      learnerId: json['learnerId'] as String,
      activityId: json['activityId'] as String,
      activityType: RegulationActivityTypeExtension.fromString(json['activityType'] as String),
      emotionBefore: json['emotionBefore'] != null
          ? EmotionTypeExtension.fromString(json['emotionBefore'] as String)
          : null,
      emotionLevelBefore: json['emotionLevelBefore'] as int?,
      emotionAfter: json['emotionAfter'] != null
          ? EmotionTypeExtension.fromString(json['emotionAfter'] as String)
          : null,
      emotionLevelAfter: json['emotionLevelAfter'] as int?,
      durationSeconds: json['durationSeconds'] as int,
      completed: json['completed'] as bool,
      effectiveness: json['effectiveness'] as int?,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'learnerId': learnerId,
      'activityId': activityId,
      'activityType': activityType.name,
      'emotionBefore': emotionBefore?.name,
      'emotionLevelBefore': emotionLevelBefore,
      'emotionAfter': emotionAfter?.name,
      'emotionLevelAfter': emotionLevelAfter,
      'durationSeconds': durationSeconds,
      'completed': completed,
      'effectiveness': effectiveness,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  /// Calculate emotional improvement (-4 to +4, positive is improvement)
  int? get emotionalImprovement {
    if (emotionLevelBefore == null || emotionLevelAfter == null) return null;
    // For negative emotions, lower level is better
    // For positive emotions, higher level is better
    if (emotionBefore?.needsRegulation == true) {
      return emotionLevelBefore! - emotionLevelAfter!;
    }
    return emotionLevelAfter! - emotionLevelBefore!;
  }
}

/// Summary of regulation activity for a period
class RegulationSummary {
  final int totalSessions;
  final int totalMinutes;
  final Map<RegulationActivityType, int> sessionsByType;
  final double averageEffectiveness;
  final int streakDays;
  final List<RegulationSession> recentSessions;

  RegulationSummary({
    required this.totalSessions,
    required this.totalMinutes,
    required this.sessionsByType,
    required this.averageEffectiveness,
    required this.streakDays,
    required this.recentSessions,
  });

  factory RegulationSummary.fromJson(Map<String, dynamic> json) {
    return RegulationSummary(
      totalSessions: json['totalSessions'] as int,
      totalMinutes: json['totalMinutes'] as int,
      sessionsByType: (json['sessionsByType'] as Map<String, dynamic>).map(
        (key, value) => MapEntry(
          RegulationActivityTypeExtension.fromString(key),
          value as int,
        ),
      ),
      averageEffectiveness: (json['averageEffectiveness'] as num).toDouble(),
      streakDays: json['streakDays'] as int,
      recentSessions: (json['recentSessions'] as List<dynamic>)
          .map((e) => RegulationSession.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

// ==================== Regulation API Response Types ====================

class EmotionCheckInResponse {
  final EmotionCheckIn checkIn;
  final List<RegulationActivity>? suggestedActivities;

  EmotionCheckInResponse({
    required this.checkIn,
    this.suggestedActivities,
  });

  factory EmotionCheckInResponse.fromJson(Map<String, dynamic> json) {
    return EmotionCheckInResponse(
      checkIn: EmotionCheckIn.fromJson(json['checkIn'] as Map<String, dynamic>),
      suggestedActivities: (json['suggestedActivities'] as List<dynamic>?)
          ?.map((e) => RegulationActivity.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

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

class RegulationSessionResponse {
  final RegulationSession session;

  RegulationSessionResponse({required this.session});

  factory RegulationSessionResponse.fromJson(Map<String, dynamic> json) {
    return RegulationSessionResponse(
      session: RegulationSession.fromJson(json['session'] as Map<String, dynamic>),
    );
  }
}

class RegulationSummaryResponse {
  final RegulationSummary summary;

  RegulationSummaryResponse({required this.summary});

  factory RegulationSummaryResponse.fromJson(Map<String, dynamic> json) {
    return RegulationSummaryResponse(
      summary: RegulationSummary.fromJson(json['summary'] as Map<String, dynamic>),
    );
  }
}

// ==================== Sensory Profile Types ====================

/// Information about a sensory preset from the API
class SensoryPresetInfo {
  final String id;
  final String name;
  final String description;
  final String category;
  final List<String> tags;
  final String? iconName;

  SensoryPresetInfo({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    this.tags = const [],
    this.iconName,
  });

  factory SensoryPresetInfo.fromJson(Map<String, dynamic> json) {
    return SensoryPresetInfo(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      category: json['category'] as String,
      tags: (json['tags'] as List<dynamic>?)?.cast<String>() ?? [],
      iconName: json['iconName'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'category': category,
      'tags': tags,
      if (iconName != null) 'iconName': iconName,
    };
  }
}

// ==================== Homework Helper Types ====================

/// Steps in the homework helper workflow
enum HomeworkStep {
  understand,
  plan,
  solve,
  check,
  complete;

  static HomeworkStep fromString(String value) {
    return HomeworkStep.values.firstWhere(
      (e) => e.name == value,
      orElse: () => HomeworkStep.understand,
    );
  }
}

/// A homework help session tracking progress through the 4-step process
class HomeworkSession {
  final String id;
  final String learnerId;
  final String title;
  final String? subject;
  final HomeworkStep currentStep;
  final String? difficultyAdjustment; // simplified, scaffolded, standard
  final List<HomeworkFile> files;
  final List<WorkProduct> workProducts;
  final int hintsUsed;
  final DateTime createdAt;
  final DateTime updatedAt;

  HomeworkSession({
    required this.id,
    required this.learnerId,
    required this.title,
    this.subject,
    this.currentStep = HomeworkStep.understand,
    this.difficultyAdjustment,
    this.files = const [],
    this.workProducts = const [],
    this.hintsUsed = 0,
    required this.createdAt,
    required this.updatedAt,
  });

  factory HomeworkSession.fromJson(Map<String, dynamic> json) {
    return HomeworkSession(
      id: json['id'] as String,
      learnerId: json['learnerId'] as String,
      title: json['title'] as String,
      subject: json['subject'] as String?,
      currentStep: HomeworkStep.fromString(json['currentStep'] as String? ?? 'understand'),
      difficultyAdjustment: json['difficultyAdjustment'] as String?,
      files: (json['files'] as List<dynamic>?)
              ?.map((e) => HomeworkFile.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      workProducts: (json['workProducts'] as List<dynamic>?)
              ?.map((e) => WorkProduct.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      hintsUsed: json['hintsUsed'] as int? ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'learnerId': learnerId,
      'title': title,
      if (subject != null) 'subject': subject,
      'currentStep': currentStep.name,
      if (difficultyAdjustment != null) 'difficultyAdjustment': difficultyAdjustment,
      'files': files.map((f) => f.toJson()).toList(),
      'workProducts': workProducts.map((w) => w.toJson()).toList(),
      'hintsUsed': hintsUsed,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  HomeworkSession copyWith({
    String? id,
    String? learnerId,
    String? title,
    String? subject,
    HomeworkStep? currentStep,
    String? difficultyAdjustment,
    List<HomeworkFile>? files,
    List<WorkProduct>? workProducts,
    int? hintsUsed,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return HomeworkSession(
      id: id ?? this.id,
      learnerId: learnerId ?? this.learnerId,
      title: title ?? this.title,
      subject: subject ?? this.subject,
      currentStep: currentStep ?? this.currentStep,
      difficultyAdjustment: difficultyAdjustment ?? this.difficultyAdjustment,
      files: files ?? this.files,
      workProducts: workProducts ?? this.workProducts,
      hintsUsed: hintsUsed ?? this.hintsUsed,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  /// Get work product for a specific step
  WorkProduct? getWorkProductForStep(HomeworkStep step) {
    try {
      return workProducts.firstWhere((w) => w.step == step);
    } catch (_) {
      return null;
    }
  }

  /// Check if a step is complete
  bool isStepComplete(HomeworkStep step) {
    return getWorkProductForStep(step) != null;
  }

  /// Get the primary file (first successfully OCR'd file)
  HomeworkFile? get primaryFile {
    try {
      return files.firstWhere((f) => f.ocrStatus == 'complete');
    } catch (_) {
      return files.isNotEmpty ? files.first : null;
    }
  }
}

/// A file uploaded as part of a homework session (e.g., photo of problem)
class HomeworkFile {
  final String id;
  final String sessionId;
  final String filename;
  final String mimeType;
  final String fileUrl;
  final String ocrStatus; // pending, processing, complete, failed
  final String? extractedText;
  final double? ocrConfidence;

  HomeworkFile({
    required this.id,
    required this.sessionId,
    required this.filename,
    required this.mimeType,
    required this.fileUrl,
    this.ocrStatus = 'pending',
    this.extractedText,
    this.ocrConfidence,
  });

  factory HomeworkFile.fromJson(Map<String, dynamic> json) {
    return HomeworkFile(
      id: json['id'] as String,
      sessionId: json['sessionId'] as String,
      filename: json['filename'] as String,
      mimeType: json['mimeType'] as String,
      fileUrl: json['fileUrl'] as String,
      ocrStatus: json['ocrStatus'] as String? ?? 'pending',
      extractedText: json['extractedText'] as String?,
      ocrConfidence: (json['ocrConfidence'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sessionId': sessionId,
      'filename': filename,
      'mimeType': mimeType,
      'fileUrl': fileUrl,
      'ocrStatus': ocrStatus,
      if (extractedText != null) 'extractedText': extractedText,
      if (ocrConfidence != null) 'ocrConfidence': ocrConfidence,
    };
  }

  HomeworkFile copyWith({
    String? id,
    String? sessionId,
    String? filename,
    String? mimeType,
    String? fileUrl,
    String? ocrStatus,
    String? extractedText,
    double? ocrConfidence,
  }) {
    return HomeworkFile(
      id: id ?? this.id,
      sessionId: sessionId ?? this.sessionId,
      filename: filename ?? this.filename,
      mimeType: mimeType ?? this.mimeType,
      fileUrl: fileUrl ?? this.fileUrl,
      ocrStatus: ocrStatus ?? this.ocrStatus,
      extractedText: extractedText ?? this.extractedText,
      ocrConfidence: ocrConfidence ?? this.ocrConfidence,
    );
  }

  bool get isProcessing => ocrStatus == 'processing' || ocrStatus == 'pending';
  bool get isComplete => ocrStatus == 'complete';
  bool get isFailed => ocrStatus == 'failed';
}

/// Work product created at each step of the homework process
class WorkProduct {
  final String id;
  final String sessionId;
  final HomeworkStep step;
  final String inputType; // text, image, audio
  final Map<String, dynamic> outputData;
  final DateTime createdAt;

  WorkProduct({
    required this.id,
    required this.sessionId,
    required this.step,
    required this.inputType,
    required this.outputData,
    required this.createdAt,
  });

  factory WorkProduct.fromJson(Map<String, dynamic> json) {
    return WorkProduct(
      id: json['id'] as String,
      sessionId: json['sessionId'] as String,
      step: HomeworkStep.fromString(json['step'] as String),
      inputType: json['inputType'] as String,
      outputData: json['outputData'] as Map<String, dynamic>? ?? {},
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sessionId': sessionId,
      'step': step.name,
      'inputType': inputType,
      'outputData': outputData,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  WorkProduct copyWith({
    String? id,
    String? sessionId,
    HomeworkStep? step,
    String? inputType,
    Map<String, dynamic>? outputData,
    DateTime? createdAt,
  }) {
    return WorkProduct(
      id: id ?? this.id,
      sessionId: sessionId ?? this.sessionId,
      step: step ?? this.step,
      inputType: inputType ?? this.inputType,
      outputData: outputData ?? this.outputData,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  // Convenience getters for common output fields
  String? get whatWeKnow => outputData['whatWeKnow'] as String?;
  String? get whatWeNeedToFind => outputData['whatWeNeedToFind'] as String?;
  List<String>? get keyConcepts => (outputData['keyConcepts'] as List<dynamic>?)?.cast<String>();
  List<String>? get planSteps => (outputData['planSteps'] as List<dynamic>?)?.cast<String>();
  String? get solution => outputData['solution'] as String?;
  String? get verification => outputData['verification'] as String?;
  bool? get isCorrect => outputData['isCorrect'] as bool?;
}

/// Response wrapper for homework hint requests
class HomeworkHintResponse {
  final String hint;
  final int hintNumber;
  final int hintsRemaining;
  final String hintLevel; // general, moderate, specific

  HomeworkHintResponse({
    required this.hint,
    required this.hintNumber,
    required this.hintsRemaining,
    required this.hintLevel,
  });

  factory HomeworkHintResponse.fromJson(Map<String, dynamic> json) {
    return HomeworkHintResponse(
      hint: json['hint'] as String,
      hintNumber: json['hintNumber'] as int,
      hintsRemaining: json['hintsRemaining'] as int,
      hintLevel: json['hintLevel'] as String,
    );
  }
}

// ==================== Focus Monitor Types ====================

/// Type of educational game for focus breaks
enum FocusBreakGameType {
  memory,
  quickMath,
  wordScramble,
  movement,
  breathing,
  creative;

  static FocusBreakGameType fromString(String value) {
    return FocusBreakGameType.values.firstWhere(
      (e) => e.name == value || e.name == value.replaceAll('_', ''),
      orElse: () => FocusBreakGameType.memory,
    );
  }

  String get displayName {
    switch (this) {
      case FocusBreakGameType.memory:
        return 'Memory Game';
      case FocusBreakGameType.quickMath:
        return 'Quick Math';
      case FocusBreakGameType.wordScramble:
        return 'Word Scramble';
      case FocusBreakGameType.movement:
        return 'Movement Break';
      case FocusBreakGameType.breathing:
        return 'Breathing Exercise';
      case FocusBreakGameType.creative:
        return 'Creative Time';
    }
  }

  String get emoji {
    switch (this) {
      case FocusBreakGameType.memory:
        return '🧠';
      case FocusBreakGameType.quickMath:
        return '🔢';
      case FocusBreakGameType.wordScramble:
        return '📝';
      case FocusBreakGameType.movement:
        return '🏃';
      case FocusBreakGameType.breathing:
        return '🌬️';
      case FocusBreakGameType.creative:
        return '🎨';
    }
  }
}

/// A mini-game for focus breaks
class FocusBreakGame {
  final String id;
  final FocusBreakGameType type;
  final String name;
  final String description;
  final int durationSeconds;
  final Map<String, dynamic> gameData;

  FocusBreakGame({
    required this.id,
    required this.type,
    required this.name,
    required this.description,
    this.durationSeconds = 60,
    this.gameData = const {},
  });

  factory FocusBreakGame.fromJson(Map<String, dynamic> json) {
    return FocusBreakGame(
      id: json['id'] as String,
      type: FocusBreakGameType.fromString(json['type'] as String),
      name: json['name'] as String,
      description: json['description'] as String,
      durationSeconds: json['durationSeconds'] as int? ?? 60,
      gameData: json['gameData'] as Map<String, dynamic>? ?? {},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.name,
      'name': name,
      'description': description,
      'durationSeconds': durationSeconds,
      'gameData': gameData,
    };
  }

  FocusBreakGame copyWith({
    String? id,
    FocusBreakGameType? type,
    String? name,
    String? description,
    int? durationSeconds,
    Map<String, dynamic>? gameData,
  }) {
    return FocusBreakGame(
      id: id ?? this.id,
      type: type ?? this.type,
      name: name ?? this.name,
      description: description ?? this.description,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      gameData: gameData ?? this.gameData,
    );
  }
}

/// Type of focus-related event
enum FocusEventType {
  distractionDetected,
  breakStarted,
  breakCompleted,
  gamePlayed,
  focusRestored,
  idleDetected;

  static FocusEventType fromString(String value) {
    switch (value) {
      case 'distraction_detected':
        return FocusEventType.distractionDetected;
      case 'break_started':
        return FocusEventType.breakStarted;
      case 'break_completed':
        return FocusEventType.breakCompleted;
      case 'game_played':
        return FocusEventType.gamePlayed;
      case 'focus_restored':
        return FocusEventType.focusRestored;
      case 'idle_detected':
        return FocusEventType.idleDetected;
      default:
        return FocusEventType.values.firstWhere(
          (e) => e.name == value,
          orElse: () => FocusEventType.distractionDetected,
        );
    }
  }

  String toApiString() {
    switch (this) {
      case FocusEventType.distractionDetected:
        return 'distraction_detected';
      case FocusEventType.breakStarted:
        return 'break_started';
      case FocusEventType.breakCompleted:
        return 'break_completed';
      case FocusEventType.gamePlayed:
        return 'game_played';
      case FocusEventType.focusRestored:
        return 'focus_restored';
      case FocusEventType.idleDetected:
        return 'idle_detected';
    }
  }
}

/// An event tracked by the focus monitor
class FocusEvent {
  final String learnerId;
  final FocusEventType eventType;
  final double? focusScore;
  final String? gameId;
  final int? durationSeconds;
  final DateTime timestamp;
  final Map<String, dynamic>? metadata;

  FocusEvent({
    required this.learnerId,
    required this.eventType,
    this.focusScore,
    this.gameId,
    this.durationSeconds,
    required this.timestamp,
    this.metadata,
  });

  factory FocusEvent.fromJson(Map<String, dynamic> json) {
    return FocusEvent(
      learnerId: json['learnerId'] as String,
      eventType: FocusEventType.fromString(json['eventType'] as String),
      focusScore: (json['focusScore'] as num?)?.toDouble(),
      gameId: json['gameId'] as String?,
      durationSeconds: json['durationSeconds'] as int?,
      timestamp: DateTime.parse(json['timestamp'] as String),
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'learnerId': learnerId,
      'eventType': eventType.toApiString(),
      if (focusScore != null) 'focusScore': focusScore,
      if (gameId != null) 'gameId': gameId,
      if (durationSeconds != null) 'durationSeconds': durationSeconds,
      'timestamp': timestamp.toIso8601String(),
      if (metadata != null) 'metadata': metadata,
    };
  }

  FocusEvent copyWith({
    String? learnerId,
    FocusEventType? eventType,
    double? focusScore,
    String? gameId,
    int? durationSeconds,
    DateTime? timestamp,
    Map<String, dynamic>? metadata,
  }) {
    return FocusEvent(
      learnerId: learnerId ?? this.learnerId,
      eventType: eventType ?? this.eventType,
      focusScore: focusScore ?? this.focusScore,
      gameId: gameId ?? this.gameId,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      timestamp: timestamp ?? this.timestamp,
      metadata: metadata ?? this.metadata,
    );
  }
}

/// Type of user interaction for focus tracking
enum InteractionType {
  tap,
  scroll,
  answer,
  correctAnswer,
  incorrectAnswer,
  navigate,
  pause,
  resume,
  idle,
}

/// Aggregated focus metrics for privacy-safe server sync
class FocusMetrics {
  final String learnerId;
  final String sessionId;
  final double averageFocusScore;
  final int breaksTaken;
  final int gamesPlayed;
  final int totalActiveSeconds;
  final int totalIdleSeconds;
  final DateTime periodStart;
  final DateTime periodEnd;

  FocusMetrics({
    required this.learnerId,
    required this.sessionId,
    required this.averageFocusScore,
    required this.breaksTaken,
    required this.gamesPlayed,
    required this.totalActiveSeconds,
    required this.totalIdleSeconds,
    required this.periodStart,
    required this.periodEnd,
  });

  factory FocusMetrics.fromJson(Map<String, dynamic> json) {
    return FocusMetrics(
      learnerId: json['learnerId'] as String,
      sessionId: json['sessionId'] as String,
      averageFocusScore: (json['averageFocusScore'] as num).toDouble(),
      breaksTaken: json['breaksTaken'] as int,
      gamesPlayed: json['gamesPlayed'] as int,
      totalActiveSeconds: json['totalActiveSeconds'] as int,
      totalIdleSeconds: json['totalIdleSeconds'] as int,
      periodStart: DateTime.parse(json['periodStart'] as String),
      periodEnd: DateTime.parse(json['periodEnd'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'learnerId': learnerId,
      'sessionId': sessionId,
      'averageFocusScore': averageFocusScore,
      'breaksTaken': breaksTaken,
      'gamesPlayed': gamesPlayed,
      'totalActiveSeconds': totalActiveSeconds,
      'totalIdleSeconds': totalIdleSeconds,
      'periodStart': periodStart.toIso8601String(),
      'periodEnd': periodEnd.toIso8601String(),
    };
  }
}

// ==================== IEP Goal Tracking Types ====================

/// Status of an IEP goal
enum IEPGoalStatus {
  notStarted,
  inProgress,
  achieved,
  modified,
  discontinued;

  static IEPGoalStatus fromString(String value) {
    return IEPGoalStatus.values.firstWhere(
      (e) => e.name == value || e.name == _snakeToCamel(value),
      orElse: () => IEPGoalStatus.notStarted,
    );
  }

  String get displayName {
    switch (this) {
      case IEPGoalStatus.notStarted:
        return 'Not Started';
      case IEPGoalStatus.inProgress:
        return 'In Progress';
      case IEPGoalStatus.achieved:
        return 'Achieved';
      case IEPGoalStatus.modified:
        return 'Modified';
      case IEPGoalStatus.discontinued:
        return 'Discontinued';
    }
  }

  /// Get status color for UI
  int get colorValue {
    switch (this) {
      case IEPGoalStatus.notStarted:
        return 0xFF9E9E9E; // Gray
      case IEPGoalStatus.inProgress:
        return 0xFF2196F3; // Blue
      case IEPGoalStatus.achieved:
        return 0xFF4CAF50; // Green
      case IEPGoalStatus.modified:
        return 0xFFFF9800; // Orange
      case IEPGoalStatus.discontinued:
        return 0xFFF44336; // Red
    }
  }
}

/// Category of an IEP goal
enum IEPCategory {
  academic,
  behavioral,
  socialEmotional,
  communication,
  motor,
  selfCare,
  transition;

  static IEPCategory fromString(String value) {
    return IEPCategory.values.firstWhere(
      (e) => e.name == value || e.name == _snakeToCamel(value),
      orElse: () => IEPCategory.academic,
    );
  }

  String get displayName {
    switch (this) {
      case IEPCategory.academic:
        return 'Academic';
      case IEPCategory.behavioral:
        return 'Behavioral';
      case IEPCategory.socialEmotional:
        return 'Social-Emotional';
      case IEPCategory.communication:
        return 'Communication';
      case IEPCategory.motor:
        return 'Motor';
      case IEPCategory.selfCare:
        return 'Self-Care';
      case IEPCategory.transition:
        return 'Transition';
    }
  }

  String get emoji {
    switch (this) {
      case IEPCategory.academic:
        return '📚';
      case IEPCategory.behavioral:
        return '🎯';
      case IEPCategory.socialEmotional:
        return '💜';
      case IEPCategory.communication:
        return '💬';
      case IEPCategory.motor:
        return '🏃';
      case IEPCategory.selfCare:
        return '🧹';
      case IEPCategory.transition:
        return '🚀';
    }
  }
}

/// Type of IEP note
enum IEPNoteType {
  observation,
  strategy,
  concern,
  celebration;

  static IEPNoteType fromString(String value) {
    return IEPNoteType.values.firstWhere(
      (e) => e.name == value || e.name.toUpperCase() == value.toUpperCase(),
      orElse: () => IEPNoteType.observation,
    );
  }

  String get displayName {
    switch (this) {
      case IEPNoteType.observation:
        return 'Observation';
      case IEPNoteType.strategy:
        return 'Strategy';
      case IEPNoteType.concern:
        return 'Concern';
      case IEPNoteType.celebration:
        return 'Celebration';
    }
  }

  String get emoji {
    switch (this) {
      case IEPNoteType.observation:
        return '👀';
      case IEPNoteType.strategy:
        return '💡';
      case IEPNoteType.concern:
        return '⚠️';
      case IEPNoteType.celebration:
        return '🎉';
    }
  }
}

/// Context where data point was recorded
enum IEPMeasurementContext {
  classroom,
  home,
  therapy,
  community,
  assessment,
  other;

  static IEPMeasurementContext fromString(String value) {
    return IEPMeasurementContext.values.firstWhere(
      (e) => e.name == value || e.name.toUpperCase() == value.toUpperCase(),
      orElse: () => IEPMeasurementContext.other,
    );
  }

  String get displayName {
    switch (this) {
      case IEPMeasurementContext.classroom:
        return 'Classroom';
      case IEPMeasurementContext.home:
        return 'Home';
      case IEPMeasurementContext.therapy:
        return 'Therapy';
      case IEPMeasurementContext.community:
        return 'Community';
      case IEPMeasurementContext.assessment:
        return 'Assessment';
      case IEPMeasurementContext.other:
        return 'Other';
    }
  }
}

/// Helper to convert snake_case to camelCase
String _snakeToCamel(String value) {
  final parts = value.toLowerCase().split('_');
  if (parts.isEmpty) return value;
  return parts.first + parts.skip(1).map((p) => 
    p.isNotEmpty ? '${p[0].toUpperCase()}${p.substring(1)}' : ''
  ).join('');
}

/// A data point measurement for an IEP goal
class IEPDataPoint {
  final String id;
  final String goalId;
  final double value;
  final DateTime measurementDate;
  final String? recordedById;
  final String? recordedByRole; // TEACHER, THERAPIST, PARENT
  final String? recordedByName;
  final IEPMeasurementContext context;
  final String? notes;
  final String? evidenceUrl;
  final DateTime createdAt;

  IEPDataPoint({
    required this.id,
    required this.goalId,
    required this.value,
    required this.measurementDate,
    this.recordedById,
    this.recordedByRole,
    this.recordedByName,
    this.context = IEPMeasurementContext.classroom,
    this.notes,
    this.evidenceUrl,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory IEPDataPoint.fromJson(Map<String, dynamic> json) {
    return IEPDataPoint(
      id: json['id'] as String,
      goalId: json['goalId'] as String,
      value: (json['value'] as num).toDouble(),
      measurementDate: DateTime.parse(json['measurementDate'] as String),
      recordedById: json['recordedById'] as String?,
      recordedByRole: json['recordedByRole'] as String?,
      recordedByName: json['recordedByName'] as String?,
      context: IEPMeasurementContext.fromString(json['context'] as String? ?? 'other'),
      notes: json['notes'] as String?,
      evidenceUrl: json['evidenceUrl'] as String?,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'goalId': goalId,
      'value': value,
      'measurementDate': measurementDate.toIso8601String(),
      'recordedById': recordedById,
      'recordedByRole': recordedByRole,
      'recordedByName': recordedByName,
      'context': context.name,
      'notes': notes,
      'evidenceUrl': evidenceUrl,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

/// A note/comment on an IEP goal
class IEPNote {
  final String id;
  final String goalId;
  final String authorId;
  final String authorRole;
  final String? authorName;
  final String content;
  final IEPNoteType noteType;
  final bool isPrivate; // Only visible to educators
  final DateTime createdAt;

  IEPNote({
    required this.id,
    required this.goalId,
    required this.authorId,
    required this.authorRole,
    this.authorName,
    required this.content,
    this.noteType = IEPNoteType.observation,
    this.isPrivate = false,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory IEPNote.fromJson(Map<String, dynamic> json) {
    return IEPNote(
      id: json['id'] as String,
      goalId: json['goalId'] as String,
      authorId: json['authorId'] as String,
      authorRole: json['authorRole'] as String,
      authorName: json['authorName'] as String?,
      content: json['content'] as String,
      noteType: IEPNoteType.fromString(json['noteType'] as String? ?? 'observation'),
      isPrivate: json['isPrivate'] as bool? ?? false,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'goalId': goalId,
      'authorId': authorId,
      'authorRole': authorRole,
      'authorName': authorName,
      'content': content,
      'noteType': noteType.name,
      'isPrivate': isPrivate,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

/// An IEP (Individualized Education Program) goal
class IEPGoal {
  final String id;
  final String learnerId;
  final String goalName;
  final IEPCategory category;
  final String? subject;
  final String description;
  final double currentLevel;
  final double targetLevel;
  final String measurementUnit; // "accuracy %", "instances per day", "minutes"
  final double progressPercentage;
  final IEPGoalStatus status;
  final DateTime startDate;
  final DateTime targetDate;
  final DateTime? reviewDate;
  final String? createdById;
  final String? createdByName;
  final String? assignedToId;
  final String? assignedToName;
  final List<IEPDataPoint> dataPoints;
  final List<IEPNote> notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  IEPGoal({
    required this.id,
    required this.learnerId,
    required this.goalName,
    required this.category,
    this.subject,
    required this.description,
    required this.currentLevel,
    required this.targetLevel,
    required this.measurementUnit,
    double? progressPercentage,
    this.status = IEPGoalStatus.notStarted,
    required this.startDate,
    required this.targetDate,
    this.reviewDate,
    this.createdById,
    this.createdByName,
    this.assignedToId,
    this.assignedToName,
    this.dataPoints = const [],
    this.notes = const [],
    DateTime? createdAt,
    DateTime? updatedAt,
  }) : 
    progressPercentage = progressPercentage ?? _calculateProgress(currentLevel, targetLevel),
    createdAt = createdAt ?? DateTime.now(),
    updatedAt = updatedAt ?? DateTime.now();

  static double _calculateProgress(double current, double target) {
    if (target <= 0) return 0;
    final progress = (current / target) * 100;
    return progress.clamp(0, 100);
  }

  factory IEPGoal.fromJson(Map<String, dynamic> json) {
    return IEPGoal(
      id: json['id'] as String,
      learnerId: json['learnerId'] as String,
      goalName: json['goalName'] as String,
      category: IEPCategory.fromString(json['category'] as String),
      subject: json['subject'] as String?,
      description: json['description'] as String,
      currentLevel: (json['currentLevel'] as num).toDouble(),
      targetLevel: (json['targetLevel'] as num).toDouble(),
      measurementUnit: json['measurementUnit'] as String,
      progressPercentage: json['progressPercentage'] != null 
          ? (json['progressPercentage'] as num).toDouble()
          : null,
      status: IEPGoalStatus.fromString(json['status'] as String? ?? 'not_started'),
      startDate: DateTime.parse(json['startDate'] as String),
      targetDate: DateTime.parse(json['targetDate'] as String),
      reviewDate: json['reviewDate'] != null 
          ? DateTime.parse(json['reviewDate'] as String)
          : null,
      createdById: json['createdById'] as String?,
      createdByName: json['createdByName'] as String?,
      assignedToId: json['assignedToId'] as String?,
      assignedToName: json['assignedToName'] as String?,
      dataPoints: (json['dataPoints'] as List<dynamic>?)
          ?.map((e) => IEPDataPoint.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      notes: (json['notes'] as List<dynamic>?)
          ?.map((e) => IEPNote.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'learnerId': learnerId,
      'goalName': goalName,
      'category': category.name,
      'subject': subject,
      'description': description,
      'currentLevel': currentLevel,
      'targetLevel': targetLevel,
      'measurementUnit': measurementUnit,
      'progressPercentage': progressPercentage,
      'status': status.name,
      'startDate': startDate.toIso8601String(),
      'targetDate': targetDate.toIso8601String(),
      'reviewDate': reviewDate?.toIso8601String(),
      'createdById': createdById,
      'createdByName': createdByName,
      'assignedToId': assignedToId,
      'assignedToName': assignedToName,
      'dataPoints': dataPoints.map((e) => e.toJson()).toList(),
      'notes': notes.map((e) => e.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  /// Get days until target date
  int get daysUntilTarget {
    return targetDate.difference(DateTime.now()).inDays;
  }

  /// Get days since start
  int get daysSinceStart {
    return DateTime.now().difference(startDate).inDays;
  }

  /// Get total duration in days
  int get totalDurationDays {
    return targetDate.difference(startDate).inDays;
  }

  /// Get time progress (% of time elapsed)
  double get timeProgressPercentage {
    if (totalDurationDays <= 0) return 100;
    final elapsed = daysSinceStart;
    return ((elapsed / totalDurationDays) * 100).clamp(0, 100);
  }

  /// Check if goal needs attention (progress behind schedule)
  bool get needsAttention {
    // If less than 50% progress when more than 50% time has passed
    return progressPercentage < 50 && timeProgressPercentage > 50;
  }

  /// Check if goal is on track
  bool get isOnTrack {
    return progressPercentage >= 75 || progressPercentage >= timeProgressPercentage;
  }

  /// Get the latest data point
  IEPDataPoint? get latestDataPoint {
    if (dataPoints.isEmpty) return null;
    return dataPoints.reduce((a, b) => 
      a.measurementDate.isAfter(b.measurementDate) ? a : b
    );
  }

  /// Copy with modifications
  IEPGoal copyWith({
    String? id,
    String? learnerId,
    String? goalName,
    IEPCategory? category,
    String? subject,
    String? description,
    double? currentLevel,
    double? targetLevel,
    String? measurementUnit,
    double? progressPercentage,
    IEPGoalStatus? status,
    DateTime? startDate,
    DateTime? targetDate,
    DateTime? reviewDate,
    String? createdById,
    String? createdByName,
    String? assignedToId,
    String? assignedToName,
    List<IEPDataPoint>? dataPoints,
    List<IEPNote>? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return IEPGoal(
      id: id ?? this.id,
      learnerId: learnerId ?? this.learnerId,
      goalName: goalName ?? this.goalName,
      category: category ?? this.category,
      subject: subject ?? this.subject,
      description: description ?? this.description,
      currentLevel: currentLevel ?? this.currentLevel,
      targetLevel: targetLevel ?? this.targetLevel,
      measurementUnit: measurementUnit ?? this.measurementUnit,
      progressPercentage: progressPercentage ?? this.progressPercentage,
      status: status ?? this.status,
      startDate: startDate ?? this.startDate,
      targetDate: targetDate ?? this.targetDate,
      reviewDate: reviewDate ?? this.reviewDate,
      createdById: createdById ?? this.createdById,
      createdByName: createdByName ?? this.createdByName,
      assignedToId: assignedToId ?? this.assignedToId,
      assignedToName: assignedToName ?? this.assignedToName,
      dataPoints: dataPoints ?? this.dataPoints,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

// ==================== Additional IEP Types ====================

/// Area/domain of an IEP goal (used by API)
enum IEPGoalArea {
  academics,
  behavior,
  communication,
  socialSkills,
  dailyLiving,
  motor,
  transition;

  static IEPGoalArea fromString(String value) {
    return IEPGoalArea.values.firstWhere(
      (e) => e.name == value || e.name == _snakeToCamel(value),
      orElse: () => IEPGoalArea.academics,
    );
  }

  String get displayName {
    switch (this) {
      case IEPGoalArea.academics:
        return 'Academics';
      case IEPGoalArea.behavior:
        return 'Behavior';
      case IEPGoalArea.communication:
        return 'Communication';
      case IEPGoalArea.socialSkills:
        return 'Social Skills';
      case IEPGoalArea.dailyLiving:
        return 'Daily Living';
      case IEPGoalArea.motor:
        return 'Motor Skills';
      case IEPGoalArea.transition:
        return 'Transition';
    }
  }

  /// Convert to IEPCategory for compatibility
  IEPCategory toCategory() {
    switch (this) {
      case IEPGoalArea.academics:
        return IEPCategory.academic;
      case IEPGoalArea.behavior:
        return IEPCategory.behavioral;
      case IEPGoalArea.communication:
        return IEPCategory.communication;
      case IEPGoalArea.socialSkills:
        return IEPCategory.socialEmotional;
      case IEPGoalArea.dailyLiving:
        return IEPCategory.selfCare;
      case IEPGoalArea.motor:
        return IEPCategory.motor;
      case IEPGoalArea.transition:
        return IEPCategory.transition;
    }
  }
}

/// Measurement unit for IEP goal tracking
enum IEPMeasurementUnit {
  percentage,
  count,
  minutes,
  trials,
  rating,
  frequency,
  duration;

  static IEPMeasurementUnit fromString(String value) {
    return IEPMeasurementUnit.values.firstWhere(
      (e) => e.name == value || e.name == _snakeToCamel(value),
      orElse: () => IEPMeasurementUnit.percentage,
    );
  }

  String get displayName {
    switch (this) {
      case IEPMeasurementUnit.percentage:
        return 'Percentage (%)';
      case IEPMeasurementUnit.count:
        return 'Count';
      case IEPMeasurementUnit.minutes:
        return 'Minutes';
      case IEPMeasurementUnit.trials:
        return 'Trials';
      case IEPMeasurementUnit.rating:
        return 'Rating (1-5)';
      case IEPMeasurementUnit.frequency:
        return 'Frequency';
      case IEPMeasurementUnit.duration:
        return 'Duration';
    }
  }

  String get suffix {
    switch (this) {
      case IEPMeasurementUnit.percentage:
        return '%';
      case IEPMeasurementUnit.count:
        return '';
      case IEPMeasurementUnit.minutes:
        return ' min';
      case IEPMeasurementUnit.trials:
        return ' trials';
      case IEPMeasurementUnit.rating:
        return '/5';
      case IEPMeasurementUnit.frequency:
        return 'x';
      case IEPMeasurementUnit.duration:
        return ' min';
    }
  }
}

/// A benchmark/milestone for an IEP goal
class IEPBenchmark {
  final String id;
  final String description;
  final double targetValue;
  final DateTime targetDate;
  final bool isAchieved;
  final DateTime? achievedDate;

  IEPBenchmark({
    required this.id,
    required this.description,
    required this.targetValue,
    required this.targetDate,
    this.isAchieved = false,
    this.achievedDate,
  });

  factory IEPBenchmark.fromJson(Map<String, dynamic> json) {
    return IEPBenchmark(
      id: json['id'] as String,
      description: json['description'] as String,
      targetValue: (json['targetValue'] as num).toDouble(),
      targetDate: DateTime.parse(json['targetDate'] as String),
      isAchieved: json['isAchieved'] as bool? ?? false,
      achievedDate: json['achievedDate'] != null
          ? DateTime.parse(json['achievedDate'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'description': description,
      'targetValue': targetValue,
      'targetDate': targetDate.toIso8601String(),
      'isAchieved': isAchieved,
      'achievedDate': achievedDate?.toIso8601String(),
    };
  }
}

/// An accommodation/support for an IEP goal
class IEPAccommodation {
  final String id;
  final String title;
  final String description;
  final String category; // 'presentation', 'response', 'setting', 'timing'
  final bool isActive;

  IEPAccommodation({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    this.isActive = true,
  });

  factory IEPAccommodation.fromJson(Map<String, dynamic> json) {
    return IEPAccommodation(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      category: json['category'] as String,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'isActive': isActive,
    };
  }
}

/// Summary analytics for IEP goals
class IEPGoalSummary {
  final int totalGoals;
  final int goalsOnTrack;
  final int goalsNeedingAttention;
  final int goalsAchieved;
  final double overallProgress;
  final Map<String, int> goalsByCategory;
  final Map<String, int> goalsByStatus;
  final List<IEPGoal> upcomingReviews;
  final DateTime? nextReviewDate;

  IEPGoalSummary({
    required this.totalGoals,
    required this.goalsOnTrack,
    required this.goalsNeedingAttention,
    required this.goalsAchieved,
    required this.overallProgress,
    required this.goalsByCategory,
    required this.goalsByStatus,
    this.upcomingReviews = const [],
    this.nextReviewDate,
  });

  factory IEPGoalSummary.fromJson(Map<String, dynamic> json) {
    return IEPGoalSummary(
      totalGoals: json['totalGoals'] as int,
      goalsOnTrack: json['goalsOnTrack'] as int,
      goalsNeedingAttention: json['goalsNeedingAttention'] as int,
      goalsAchieved: json['goalsAchieved'] as int,
      overallProgress: (json['overallProgress'] as num).toDouble(),
      goalsByCategory: Map<String, int>.from(json['goalsByCategory'] as Map),
      goalsByStatus: Map<String, int>.from(json['goalsByStatus'] as Map),
      upcomingReviews: (json['upcomingReviews'] as List<dynamic>?)
          ?.map((e) => IEPGoal.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      nextReviewDate: json['nextReviewDate'] != null
          ? DateTime.parse(json['nextReviewDate'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalGoals': totalGoals,
      'goalsOnTrack': goalsOnTrack,
      'goalsNeedingAttention': goalsNeedingAttention,
      'goalsAchieved': goalsAchieved,
      'overallProgress': overallProgress,
      'goalsByCategory': goalsByCategory,
      'goalsByStatus': goalsByStatus,
      'upcomingReviews': upcomingReviews.map((e) => e.toJson()).toList(),
      'nextReviewDate': nextReviewDate?.toIso8601String(),
    };
  }
}

// ==================== Analytics Types ====================

/// A single point in a learner's progress timeseries
class LearnerProgressTimeseriesPoint {
  final DateTime date;
  final double masteryScore;
  final int minutesPracticed;
  final double difficultyLevel;

  LearnerProgressTimeseriesPoint({
    required this.date,
    required this.masteryScore,
    required this.minutesPracticed,
    required this.difficultyLevel,
  });

  factory LearnerProgressTimeseriesPoint.fromJson(Map<String, dynamic> json) {
    return LearnerProgressTimeseriesPoint(
      date: DateTime.parse(json['date'] as String),
      masteryScore: (json['masteryScore'] as num).toDouble(),
      minutesPracticed: json['minutesPracticed'] as int,
      difficultyLevel: (json['difficultyLevel'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'date': date.toIso8601String(),
      'masteryScore': masteryScore,
      'minutesPracticed': minutesPracticed,
      'difficultyLevel': difficultyLevel,
    };
  }
}

/// Progress overview for a single subject
class LearnerSubjectProgressOverview {
  final String subject;
  final int enrolledGrade;
  final double currentAssessedGradeLevel;
  final List<LearnerProgressTimeseriesPoint> timeseries;

  LearnerSubjectProgressOverview({
    required this.subject,
    required this.enrolledGrade,
    required this.currentAssessedGradeLevel,
    required this.timeseries,
  });

  factory LearnerSubjectProgressOverview.fromJson(Map<String, dynamic> json) {
    return LearnerSubjectProgressOverview(
      subject: json['subject'] as String,
      enrolledGrade: json['enrolledGrade'] as int,
      currentAssessedGradeLevel: (json['currentAssessedGradeLevel'] as num).toDouble(),
      timeseries: (json['timeseries'] as List<dynamic>)
          .map((e) => LearnerProgressTimeseriesPoint.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'subject': subject,
      'enrolledGrade': enrolledGrade,
      'currentAssessedGradeLevel': currentAssessedGradeLevel,
      'timeseries': timeseries.map((e) => e.toJson()).toList(),
    };
  }
}

/// A factor that influences difficulty recommendations
class ExplainableRecommendationFactor {
  final String label;
  final String description;
  final double weight;

  ExplainableRecommendationFactor({
    required this.label,
    required this.description,
    required this.weight,
  });

  factory ExplainableRecommendationFactor.fromJson(Map<String, dynamic> json) {
    return ExplainableRecommendationFactor(
      label: json['label'] as String,
      description: json['description'] as String,
      weight: (json['weight'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'description': description,
      'weight': weight,
    };
  }
}

/// Explainable difficulty summary for a subject
class ExplainableDifficultySummary {
  final String subject;
  final double currentDifficultyLevel;
  final double targetDifficultyLevel;
  final String rationale;
  final List<ExplainableRecommendationFactor> factors;

  ExplainableDifficultySummary({
    required this.subject,
    required this.currentDifficultyLevel,
    required this.targetDifficultyLevel,
    required this.rationale,
    required this.factors,
  });

  factory ExplainableDifficultySummary.fromJson(Map<String, dynamic> json) {
    return ExplainableDifficultySummary(
      subject: json['subject'] as String,
      currentDifficultyLevel: (json['currentDifficultyLevel'] as num).toDouble(),
      targetDifficultyLevel: (json['targetDifficultyLevel'] as num).toDouble(),
      rationale: json['rationale'] as String,
      factors: (json['factors'] as List<dynamic>)
          .map((e) => ExplainableRecommendationFactor.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'subject': subject,
      'currentDifficultyLevel': currentDifficultyLevel,
      'targetDifficultyLevel': targetDifficultyLevel,
      'rationale': rationale,
      'factors': factors.map((e) => e.toJson()).toList(),
    };
  }
}

/// Complete analytics overview for a learner
class LearnerAnalyticsOverview {
  final String learnerId;
  final List<LearnerSubjectProgressOverview> subjects;
  final List<ExplainableDifficultySummary> difficultySummaries;

  LearnerAnalyticsOverview({
    required this.learnerId,
    required this.subjects,
    required this.difficultySummaries,
  });

  factory LearnerAnalyticsOverview.fromJson(Map<String, dynamic> json) {
    return LearnerAnalyticsOverview(
      learnerId: json['learnerId'] as String,
      subjects: (json['subjects'] as List<dynamic>)
          .map((e) => LearnerSubjectProgressOverview.fromJson(e as Map<String, dynamic>))
          .toList(),
      difficultySummaries: (json['difficultySummaries'] as List<dynamic>?)
          ?.map((e) => ExplainableDifficultySummary.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'learnerId': learnerId,
      'subjects': subjects.map((e) => e.toJson()).toList(),
      'difficultySummaries': difficultySummaries.map((e) => e.toJson()).toList(),
    };
  }
}
