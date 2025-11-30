"""
ADHD/Executive Function Support System Schemas

Pydantic models for organizational tools, project breakdown,
daily planning, and EF skill assessment.
"""

from datetime import datetime, date, time
from enum import Enum
from typing import Optional, List, Any
from pydantic import BaseModel, Field, validator


# ==========================================
# ENUMS
# ==========================================

class EFDomain(str, Enum):
    """Executive Function domains."""
    ORGANIZATION = "ORGANIZATION"
    TIME_MANAGEMENT = "TIME_MANAGEMENT"
    PLANNING = "PLANNING"
    TASK_INITIATION = "TASK_INITIATION"
    WORKING_MEMORY = "WORKING_MEMORY"
    METACOGNITION = "METACOGNITION"
    EMOTIONAL_CONTROL = "EMOTIONAL_CONTROL"
    FLEXIBILITY = "FLEXIBILITY"


class UrgencyLevel(str, Enum):
    """Assignment urgency levels."""
    CRITICAL = "CRITICAL"  # Due within 24 hours
    HIGH = "HIGH"  # Due within 3 days
    MEDIUM = "MEDIUM"  # Due within 7 days
    LOW = "LOW"  # Due beyond 7 days


class AssignmentStatus(str, Enum):
    """Assignment completion status."""
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    LATE = "LATE"
    EXCUSED = "EXCUSED"


class TimeBlockCategory(str, Enum):
    """Categories for daily plan time blocks."""
    CLASS = "CLASS"
    HOMEWORK = "HOMEWORK"
    BREAK = "BREAK"
    MEAL = "MEAL"
    ACTIVITY = "ACTIVITY"
    FREE_TIME = "FREE_TIME"
    ROUTINE = "ROUTINE"
    THERAPY = "THERAPY"
    STUDY = "STUDY"


class CheckInSchedule(str, Enum):
    """Binder check-in frequency."""
    DAILY = "DAILY"
    TWICE_WEEKLY = "TWICE_WEEKLY"
    WEEKLY = "WEEKLY"


class StudyTechnique(str, Enum):
    """Study session techniques."""
    POMODORO = "POMODORO"
    BLOCKED = "BLOCKED"
    FREE_FORM = "FREE_FORM"
    TIME_BOXING = "TIME_BOXING"
    SPACED_PRACTICE = "SPACED_PRACTICE"


class IntervalType(str, Enum):
    """Pomodoro interval types."""
    WORK = "WORK"
    SHORT_BREAK = "SHORT_BREAK"
    LONG_BREAK = "LONG_BREAK"


class ReminderType(str, Enum):
    """Reminder timing types."""
    THREE_DAY = "THREE_DAY"
    ONE_DAY = "ONE_DAY"
    MORNING_OF = "MORNING_OF"
    CUSTOM = "CUSTOM"
    RECURRING = "RECURRING"


class ReminderChannel(str, Enum):
    """Reminder delivery channels."""
    EMAIL = "EMAIL"
    PUSH = "PUSH"
    SMS = "SMS"
    PARENT_EMAIL = "PARENT_EMAIL"
    IN_APP = "IN_APP"


class SelfCheckType(str, Enum):
    """Self-monitoring check types."""
    ATTENTION = "ATTENTION"
    MATERIALS = "MATERIALS"
    PROGRESS = "PROGRESS"
    UNDERSTANDING = "UNDERSTANDING"
    ON_TASK = "ON_TASK"
    EMOTIONS = "EMOTIONS"


class PromptType(str, Enum):
    """How the self-monitoring check was prompted."""
    SELF_INITIATED = "SELF_INITIATED"
    TIMER = "TIMER"
    TEACHER = "TEACHER"
    PARENT = "PARENT"
    SYSTEM = "SYSTEM"


class ImplementedBy(str, Enum):
    """Who implements an intervention."""
    SELF = "SELF"
    TEACHER = "TEACHER"
    PARENT = "PARENT"
    THERAPIST = "THERAPIST"
    AIDE = "AIDE"


class CheckInStatus(str, Enum):
    """Binder check-in status."""
    COMPLETED = "COMPLETED"
    PARTIAL = "PARTIAL"
    SKIPPED = "SKIPPED"
    NEEDS_HELP = "NEEDS_HELP"


# ==========================================
# EXECUTIVE FUNCTION PROFILE
# ==========================================

class EFDomainRatings(BaseModel):
    """Ratings for each EF domain (1-5 scale)."""
    organization: int = Field(ge=1, le=5)
    time_management: int = Field(ge=1, le=5)
    planning: int = Field(ge=1, le=5)
    task_initiation: int = Field(ge=1, le=5)
    working_memory: int = Field(ge=1, le=5)
    metacognition: int = Field(ge=1, le=5)
    emotional_control: int = Field(ge=1, le=5)
    flexibility: int = Field(ge=1, le=5)


class EFProfileCreate(BaseModel):
    """Create a new EF profile."""
    learner_id: str
    assessment_date: Optional[datetime] = None
    assessed_by: Optional[str] = None
    assessment_tool: Optional[str] = None
    ratings: EFDomainRatings
    domain_notes: Optional[dict] = None
    strengths: List[str] = []
    challenges: List[str] = []
    recommended_strategies: List[str] = []
    accommodations: List[str] = []
    parent_observations: Optional[str] = None
    teacher_observations: Optional[str] = None
    learner_self_assessment: Optional[dict] = None


class EFProfileUpdate(BaseModel):
    """Update EF profile."""
    assessment_date: Optional[datetime] = None
    assessed_by: Optional[str] = None
    assessment_tool: Optional[str] = None
    ratings: Optional[EFDomainRatings] = None
    domain_notes: Optional[dict] = None
    strengths: Optional[List[str]] = None
    challenges: Optional[List[str]] = None
    recommended_strategies: Optional[List[str]] = None
    accommodations: Optional[List[str]] = None
    parent_observations: Optional[str] = None
    teacher_observations: Optional[str] = None
    learner_self_assessment: Optional[dict] = None


class EFProfileResponse(BaseModel):
    """EF profile response."""
    id: str
    learner_id: str
    assessment_date: datetime
    assessed_by: Optional[str]
    assessment_tool: Optional[str]
    organization_rating: int
    time_management_rating: int
    planning_rating: int
    task_initiation_rating: int
    working_memory_rating: int
    metacognition_rating: int
    emotional_control_rating: int
    flexibility_rating: int
    domain_notes: Optional[dict]
    strengths: List[str]
    challenges: List[str]
    recommended_strategies: List[str]
    accommodations: List[str]
    parent_observations: Optional[str]
    teacher_observations: Optional[str]
    learner_self_assessment: Optional[dict]
    previous_assessments: Optional[list]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# ASSIGNMENTS
# ==========================================

class RecurrencePattern(BaseModel):
    """Recurrence pattern for assignments."""
    frequency: str  # 'daily', 'weekly', 'biweekly', 'monthly'
    days: Optional[List[int]] = None  # Days of week (0-6)
    until: Optional[date] = None


class AssignmentCreate(BaseModel):
    """Create a new assignment."""
    learner_id: str
    class_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    instructions: Optional[str] = None
    attachment_urls: List[str] = []
    external_url: Optional[str] = None
    due_date: datetime
    assigned_date: Optional[datetime] = None
    estimated_minutes: Optional[int] = None
    parent_visible: bool = True
    teacher_notes: Optional[str] = None
    is_recurring: bool = False
    recurrence_pattern: Optional[RecurrencePattern] = None
    points_possible: Optional[float] = None


class AssignmentUpdate(BaseModel):
    """Update an assignment."""
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    instructions: Optional[str] = None
    attachment_urls: Optional[List[str]] = None
    external_url: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_minutes: Optional[int] = None
    status: Optional[AssignmentStatus] = None
    percent_complete: Optional[int] = Field(None, ge=0, le=100)
    completed_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    parent_visible: Optional[bool] = None
    teacher_notes: Optional[str] = None
    learner_notes: Optional[str] = None
    actual_minutes: Optional[int] = None
    points_earned: Optional[float] = None
    grade: Optional[str] = None
    feedback: Optional[str] = None


class AssignmentResponse(BaseModel):
    """Assignment response."""
    id: str
    learner_id: str
    class_id: Optional[str]
    title: str
    description: Optional[str]
    subject: Optional[str]
    instructions: Optional[str]
    attachment_urls: List[str]
    external_url: Optional[str]
    due_date: datetime
    assigned_date: datetime
    estimated_minutes: Optional[int]
    actual_minutes: Optional[int]
    urgency_level: UrgencyLevel
    status: AssignmentStatus
    percent_complete: int
    completed_at: Optional[datetime]
    submitted_at: Optional[datetime]
    parent_visible: bool
    teacher_notes: Optional[str]
    learner_notes: Optional[str]
    reminders_sent: List[datetime]
    is_recurring: bool
    recurrence_pattern: Optional[dict]
    points_possible: Optional[float]
    points_earned: Optional[float]
    grade: Optional[str]
    feedback: Optional[str]
    created_at: datetime
    updated_at: datetime
    # Calculated fields
    days_until_due: Optional[int] = None
    is_overdue: bool = False
    has_breakdown: bool = False

    class Config:
        from_attributes = True


class AssignmentListResponse(BaseModel):
    """List of assignments with summary."""
    assignments: List[AssignmentResponse]
    total: int
    by_urgency: dict  # { CRITICAL: 2, HIGH: 5, ... }
    by_status: dict  # { NOT_STARTED: 3, IN_PROGRESS: 2, ... }
    overdue_count: int


# ==========================================
# PROJECT BREAKDOWN
# ==========================================

class ProjectStep(BaseModel):
    """A single step in a project breakdown."""
    step_number: int
    title: str
    description: Optional[str] = None
    estimated_minutes: Optional[int] = None
    due_date: Optional[datetime] = None
    status: AssignmentStatus = AssignmentStatus.NOT_STARTED
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None


class ProjectBreakdownCreate(BaseModel):
    """Create a project breakdown."""
    assignment_id: str
    learner_id: str
    project_title: str
    final_due_date: datetime
    project_notes: Optional[str] = None
    steps: List[ProjectStep]
    generated_by_ai: bool = False
    ai_prompt: Optional[str] = None


class ProjectBreakdownUpdate(BaseModel):
    """Update a project breakdown."""
    project_title: Optional[str] = None
    project_notes: Optional[str] = None
    steps: Optional[List[ProjectStep]] = None
    was_modified: bool = True


class ProjectBreakdownResponse(BaseModel):
    """Project breakdown response."""
    id: str
    assignment_id: str
    learner_id: str
    project_title: str
    final_due_date: datetime
    project_notes: Optional[str]
    steps: List[ProjectStep]
    generated_by_ai: bool
    ai_prompt: Optional[str]
    was_modified: bool
    total_estimated_minutes: Optional[int]
    actual_time_spent: Optional[int]
    completed_steps: int
    total_steps: int
    completion_percentage: float = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AIBreakdownRequest(BaseModel):
    """Request AI to generate project breakdown."""
    assignment_id: str
    learner_id: str
    project_title: str
    project_description: str
    final_due_date: datetime
    estimated_total_minutes: Optional[int] = None
    learner_grade_level: Optional[int] = None
    ef_challenges: Optional[List[str]] = None  # To customize for learner's needs
    num_steps: int = Field(default=5, ge=3, le=10)


class AIBreakdownResponse(BaseModel):
    """AI-generated breakdown response."""
    breakdown: ProjectBreakdownResponse
    ai_explanation: str
    suggested_schedule: Optional[List[dict]] = None  # When to work on each step


# ==========================================
# DAILY PLAN
# ==========================================

class TimeBlock(BaseModel):
    """A time block in a daily plan."""
    id: str
    start_time: str  # "HH:MM" format
    end_time: str
    duration: int  # minutes
    activity: str
    category: TimeBlockCategory
    linked_assignment_id: Optional[str] = None
    is_flexible: bool = False
    is_completed: bool = False
    notes: Optional[str] = None


class DailyPlanCreate(BaseModel):
    """Create a daily plan."""
    learner_id: str
    date: date
    wake_time: Optional[str] = None
    school_start_time: Optional[str] = None
    school_end_time: Optional[str] = None
    bed_time: Optional[str] = None
    time_blocks: List[TimeBlock] = []
    morning_routine_notes: Optional[str] = None
    evening_routine_notes: Optional[str] = None


class DailyPlanUpdate(BaseModel):
    """Update a daily plan."""
    wake_time: Optional[str] = None
    school_start_time: Optional[str] = None
    school_end_time: Optional[str] = None
    bed_time: Optional[str] = None
    time_blocks: Optional[List[TimeBlock]] = None
    morning_routine_notes: Optional[str] = None
    evening_routine_notes: Optional[str] = None
    parent_notes: Optional[str] = None
    learner_reflection: Optional[str] = None
    was_modified: bool = True


class DailyPlanResponse(BaseModel):
    """Daily plan response."""
    id: str
    learner_id: str
    date: date
    wake_time: Optional[str]
    school_start_time: Optional[str]
    school_end_time: Optional[str]
    bed_time: Optional[str]
    time_blocks: List[TimeBlock]
    generated_by_ai: bool
    ai_prompt: Optional[str]
    was_modified: bool
    completion_rate: float
    total_blocks: int
    completed_blocks: int
    morning_routine_notes: Optional[str]
    evening_routine_notes: Optional[str]
    parent_notes: Optional[str]
    learner_reflection: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AIDailyPlanRequest(BaseModel):
    """Request AI to generate daily plan."""
    learner_id: str
    date: date
    wake_time: str = "07:00"
    school_start_time: str = "08:00"
    school_end_time: str = "15:00"
    bed_time: str = "21:00"
    assignments_due: Optional[List[str]] = None  # Assignment IDs
    fixed_activities: Optional[List[TimeBlock]] = None  # Pre-scheduled blocks
    ef_profile_id: Optional[str] = None  # To customize based on EF needs
    include_breaks: bool = True
    break_frequency_minutes: int = 45  # How often to schedule breaks
    preferred_study_time: Optional[str] = None  # "morning", "afternoon", "evening"


class AIDailyPlanResponse(BaseModel):
    """AI-generated daily plan response."""
    plan: DailyPlanResponse
    ai_explanation: str
    tips_for_success: List[str]


# ==========================================
# BINDER ORGANIZATION
# ==========================================

class BinderSection(BaseModel):
    """A section in the binder."""
    id: str
    name: str
    color: str
    subjects: List[str] = []
    order: int
    description: Optional[str] = None


class BinderCheckInRecord(BaseModel):
    """Record of a binder check-in."""
    date: datetime
    status: CheckInStatus
    duration_minutes: Optional[int] = None
    sections_checked: List[str] = []
    issues_found: List[str] = []
    notes: Optional[str] = None
    completed_by: Optional[str] = None


class BinderOrganizationCreate(BaseModel):
    """Create binder organization."""
    learner_id: str
    sections: List[BinderSection]
    check_in_schedule: CheckInSchedule = CheckInSchedule.WEEKLY
    check_in_day: Optional[int] = None  # 0-6
    check_in_time: Optional[str] = None
    custom_tips: List[str] = []
    reminder_phrase: Optional[str] = None


class BinderOrganizationUpdate(BaseModel):
    """Update binder organization."""
    sections: Optional[List[BinderSection]] = None
    check_in_schedule: Optional[CheckInSchedule] = None
    check_in_day: Optional[int] = None
    check_in_time: Optional[str] = None
    custom_tips: Optional[List[str]] = None
    reminder_phrase: Optional[str] = None


class BinderOrganizationResponse(BaseModel):
    """Binder organization response."""
    id: str
    learner_id: str
    sections: List[BinderSection]
    check_in_schedule: CheckInSchedule
    check_in_day: Optional[int]
    check_in_time: Optional[str]
    last_check_in: Optional[datetime]
    next_check_in: Optional[datetime]
    streak_count: int
    check_in_history: Optional[List[BinderCheckInRecord]]
    custom_tips: List[str]
    reminder_phrase: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BinderCheckInRequest(BaseModel):
    """Record a binder check-in."""
    status: CheckInStatus
    duration_minutes: Optional[int] = None
    sections_checked: List[str] = []
    issues_found: List[str] = []
    notes: Optional[str] = None
    completed_by: Optional[str] = None


# ==========================================
# STUDY SESSION
# ==========================================

class PomodoroSettings(BaseModel):
    """Pomodoro timer settings."""
    work_minutes: int = 25
    short_break_minutes: int = 5
    long_break_minutes: int = 15
    long_break_after: int = 4  # After N work intervals
    total_cycles: Optional[int] = None


class StudyInterval(BaseModel):
    """A single interval in a study session."""
    id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    interval_type: IntervalType
    completed: bool = False
    duration_minutes: Optional[int] = None


class StudySessionCreate(BaseModel):
    """Create a study session."""
    learner_id: str
    assignment_id: Optional[str] = None
    start_time: datetime
    planned_duration: int  # minutes
    technique: StudyTechnique = StudyTechnique.POMODORO
    pomodoro_settings: Optional[PomodoroSettings] = None
    location: Optional[str] = None
    energy_before: Optional[int] = Field(None, ge=1, le=5)


class StudySessionUpdate(BaseModel):
    """Update a study session."""
    end_time: Optional[datetime] = None
    actual_duration: Optional[int] = None
    intervals: Optional[List[StudyInterval]] = None
    distraction_count: Optional[int] = None
    focus_rating: Optional[int] = Field(None, ge=1, le=5)
    energy_after: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None
    accomplishments: Optional[List[str]] = None
    blockers: Optional[List[str]] = None
    next_steps: Optional[str] = None
    was_completed: Optional[bool] = None
    ended_early: Optional[bool] = None
    early_end_reason: Optional[str] = None
    location: Optional[str] = None
    music_playing: Optional[bool] = None
    noise_level: Optional[str] = None
    people_nearby: Optional[bool] = None


class StudySessionResponse(BaseModel):
    """Study session response."""
    id: str
    learner_id: str
    assignment_id: Optional[str]
    start_time: datetime
    end_time: Optional[datetime]
    planned_duration: int
    actual_duration: Optional[int]
    technique: StudyTechnique
    pomodoro_settings: Optional[PomodoroSettings]
    intervals: Optional[List[StudyInterval]]
    distraction_count: Optional[int]
    focus_rating: Optional[int]
    energy_before: Optional[int]
    energy_after: Optional[int]
    location: Optional[str]
    music_playing: Optional[bool]
    noise_level: Optional[str]
    people_nearby: Optional[bool]
    notes: Optional[str]
    accomplishments: List[str]
    blockers: List[str]
    next_steps: Optional[str]
    was_completed: bool
    ended_early: bool
    early_end_reason: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RecordIntervalRequest(BaseModel):
    """Record a study interval completion."""
    interval_type: IntervalType
    start_time: datetime
    end_time: datetime
    completed: bool = True
    distraction_count: Optional[int] = None


# ==========================================
# REMINDERS
# ==========================================

class ReminderCreate(BaseModel):
    """Create a reminder."""
    learner_id: str
    assignment_id: Optional[str] = None
    reminder_type: ReminderType
    scheduled_for: datetime
    channel: ReminderChannel
    recipient_email: Optional[str] = None
    recipient_phone: Optional[str] = None
    title: str
    message: str
    action_url: Optional[str] = None
    is_recurring: bool = False
    next_occurrence: Optional[datetime] = None


class ReminderResponse(BaseModel):
    """Reminder response."""
    id: str
    learner_id: str
    assignment_id: Optional[str]
    reminder_type: ReminderType
    scheduled_for: datetime
    sent_at: Optional[datetime]
    channel: ReminderChannel
    title: str
    message: str
    action_url: Optional[str]
    was_sent: bool
    was_acknowledged: bool
    acknowledged_at: Optional[datetime]
    was_delivered: Optional[bool]
    delivery_error: Optional[str]
    is_recurring: bool
    next_occurrence: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AcknowledgeReminderRequest(BaseModel):
    """Acknowledge a reminder."""
    acknowledged_at: datetime = Field(default_factory=datetime.now)


# ==========================================
# EF INTERVENTIONS
# ==========================================

class EffectivenessRating(BaseModel):
    """Rating of intervention effectiveness."""
    date: datetime
    rating: int = Field(ge=1, le=5)
    notes: Optional[str] = None
    rated_by: Optional[str] = None


class EFInterventionCreate(BaseModel):
    """Create an EF intervention."""
    learner_id: str
    domain: EFDomain
    strategy_name: str
    description: str
    how_to_implement: Optional[str] = None
    materials: List[str] = []
    frequency: Optional[str] = None
    implemented_by: ImplementedBy = ImplementedBy.TEACHER
    target_behavior: Optional[str] = None
    success_criteria: Optional[str] = None
    baseline_behavior: Optional[str] = None
    evidence_basis: Optional[str] = None
    source_url: Optional[str] = None


class EFInterventionUpdate(BaseModel):
    """Update an EF intervention."""
    strategy_name: Optional[str] = None
    description: Optional[str] = None
    how_to_implement: Optional[str] = None
    materials: Optional[List[str]] = None
    frequency: Optional[str] = None
    is_active: Optional[bool] = None
    implemented_by: Optional[ImplementedBy] = None
    end_date: Optional[datetime] = None
    target_behavior: Optional[str] = None
    success_criteria: Optional[str] = None
    teacher_notes: Optional[str] = None
    parent_notes: Optional[str] = None
    learner_notes: Optional[str] = None


class EFInterventionResponse(BaseModel):
    """EF intervention response."""
    id: str
    learner_id: str
    domain: EFDomain
    strategy_name: str
    description: str
    how_to_implement: Optional[str]
    materials: List[str]
    frequency: Optional[str]
    start_date: datetime
    end_date: Optional[datetime]
    is_active: bool
    implemented_by: ImplementedBy
    effectiveness_ratings: Optional[List[EffectivenessRating]]
    average_effectiveness: Optional[float]
    total_ratings: int
    target_behavior: Optional[str]
    success_criteria: Optional[str]
    baseline_behavior: Optional[str]
    teacher_notes: Optional[str]
    parent_notes: Optional[str]
    learner_notes: Optional[str]
    evidence_basis: Optional[str]
    source_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RateInterventionRequest(BaseModel):
    """Rate an intervention's effectiveness."""
    rating: int = Field(ge=1, le=5)
    notes: Optional[str] = None
    rated_by: Optional[str] = None


class AIStrategiesRequest(BaseModel):
    """Request AI-suggested strategies based on EF profile."""
    learner_id: str
    ef_profile_id: str
    target_domains: Optional[List[EFDomain]] = None  # If None, all challenging domains
    context: Optional[str] = None  # "classroom", "homework", "home"
    max_suggestions: int = 5


class AIStrategiesResponse(BaseModel):
    """AI-suggested strategies response."""
    suggestions: List[EFInterventionCreate]
    explanation: str
    priority_order: List[str]  # Domain names in priority order


# ==========================================
# SELF-MONITORING
# ==========================================

class SelfMonitoringLogCreate(BaseModel):
    """Create a self-monitoring log entry."""
    learner_id: str
    date: date
    time: time
    check_type: SelfCheckType
    prompt_type: PromptType = PromptType.TIMER
    was_on_task: Optional[bool] = None
    on_task_percent: Optional[int] = Field(None, ge=0, le=100)
    activity: Optional[str] = None
    actual_activity: Optional[str] = None
    location: Optional[str] = None
    subject: Optional[str] = None
    had_materials: Optional[bool] = None
    understood_task: Optional[bool] = None
    needs_help: Optional[bool] = None
    emotion_rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None


class SelfMonitoringLogResponse(BaseModel):
    """Self-monitoring log response."""
    id: str
    learner_id: str
    date: date
    time: time
    timestamp: datetime
    check_type: SelfCheckType
    prompt_type: PromptType
    was_on_task: Optional[bool]
    on_task_percent: Optional[int]
    activity: Optional[str]
    actual_activity: Optional[str]
    location: Optional[str]
    subject: Optional[str]
    had_materials: Optional[bool]
    understood_task: Optional[bool]
    needs_help: Optional[bool]
    emotion_rating: Optional[int]
    notes: Optional[str]
    teacher_note: Optional[str]
    action_taken: Optional[str]
    was_reviewed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SelfMonitoringSummary(BaseModel):
    """Summary of self-monitoring data."""
    learner_id: str
    date_range_start: date
    date_range_end: date
    total_checks: int
    on_task_percentage: float
    by_check_type: dict  # { check_type: { total, on_task_count, percentage } }
    by_subject: Optional[dict]
    by_time_of_day: dict  # { morning, afternoon, etc. }
    trends: List[str]  # Observed patterns
    recommendations: List[str]


# ==========================================
# PARENT DASHBOARD
# ==========================================

class ParentDashboardResponse(BaseModel):
    """Parent dashboard view."""
    learner_id: str
    learner_name: str
    # Assignments overview
    upcoming_assignments: List[AssignmentResponse]
    overdue_assignments: List[AssignmentResponse]
    recently_completed: List[AssignmentResponse]
    # Today's plan
    todays_plan: Optional[DailyPlanResponse]
    # Progress
    weekly_completion_rate: float
    ef_profile_summary: Optional[dict]  # Simplified EF info
    # Interventions
    active_interventions: List[dict]  # Simplified intervention info
    # Alerts
    alerts: List[dict]  # { type, message, severity, date }
    # Self-monitoring summary
    recent_self_monitoring: Optional[SelfMonitoringSummary]


# ==========================================
# URGENCY CALCULATION
# ==========================================

class UrgencyCalculationRequest(BaseModel):
    """Request to calculate urgency for assignments."""
    assignment_ids: List[str]
    include_estimated_time: bool = True


class UrgencyCalculationResponse(BaseModel):
    """Urgency calculation results."""
    calculations: List[dict]  # { assignment_id, urgency_level, days_until_due, adjusted_urgency }
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
