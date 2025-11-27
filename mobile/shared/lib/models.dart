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
