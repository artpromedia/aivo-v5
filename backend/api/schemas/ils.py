"""
Independent Living Skills (ILS) Pydantic Schemas
Functional life skills instruction with task analysis and generalization tracking
Author: artpromedia
Date: 2025-11-29
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


# ==========================================
# ENUMS
# ==========================================

class IndependentLivingDomain(str, Enum):
    MONEY_MANAGEMENT = "MONEY_MANAGEMENT"
    COOKING_NUTRITION = "COOKING_NUTRITION"
    TRANSPORTATION = "TRANSPORTATION"
    HOUSING_HOME_CARE = "HOUSING_HOME_CARE"
    HEALTH_SAFETY = "HEALTH_SAFETY"
    COMMUNITY_RESOURCES = "COMMUNITY_RESOURCES"


class SkillMasteryLevel(str, Enum):
    NOT_INTRODUCED = "NOT_INTRODUCED"
    AWARENESS = "AWARENESS"
    EMERGING = "EMERGING"
    DEVELOPING = "DEVELOPING"
    PRACTICING = "PRACTICING"
    INDEPENDENT = "INDEPENDENT"
    MASTERED = "MASTERED"
    GENERALIZED = "GENERALIZED"


class PromptLevel(str, Enum):
    FULL_PHYSICAL = "FULL_PHYSICAL"
    PARTIAL_PHYSICAL = "PARTIAL_PHYSICAL"
    MODELING = "MODELING"
    GESTURAL = "GESTURAL"
    VERBAL_DIRECT = "VERBAL_DIRECT"
    VERBAL_INDIRECT = "VERBAL_INDIRECT"
    VISUAL = "VISUAL"
    INDEPENDENT = "INDEPENDENT"


class DataCollectionMethod(str, Enum):
    TASK_ANALYSIS = "TASK_ANALYSIS"
    FREQUENCY = "FREQUENCY"
    DURATION = "DURATION"
    LATENCY = "LATENCY"
    INTERVAL = "INTERVAL"
    WHOLE_INTERVAL = "WHOLE_INTERVAL"
    PARTIAL_INTERVAL = "PARTIAL_INTERVAL"
    MOMENTARY_TIME = "MOMENTARY_TIME"
    PERMANENT_PRODUCT = "PERMANENT_PRODUCT"


class SettingType(str, Enum):
    CLASSROOM = "CLASSROOM"
    HOME = "HOME"
    SCHOOL_CAFETERIA = "SCHOOL_CAFETERIA"
    SCHOOL_COMMON = "SCHOOL_COMMON"
    COMMUNITY_STORE = "COMMUNITY_STORE"
    COMMUNITY_RESTAURANT = "COMMUNITY_RESTAURANT"
    COMMUNITY_TRANSPORT = "COMMUNITY_TRANSPORT"
    COMMUNITY_MEDICAL = "COMMUNITY_MEDICAL"
    COMMUNITY_RECREATION = "COMMUNITY_RECREATION"
    COMMUNITY_WORKPLACE = "COMMUNITY_WORKPLACE"
    COMMUNITY_GOVERNMENT = "COMMUNITY_GOVERNMENT"
    COMMUNITY_LIBRARY = "COMMUNITY_LIBRARY"
    COMMUNITY_BANK = "COMMUNITY_BANK"
    COMMUNITY_OTHER = "COMMUNITY_OTHER"
    SIMULATION = "SIMULATION"
    VIRTUAL = "VIRTUAL"


class CBIStatus(str, Enum):
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    RESCHEDULED = "RESCHEDULED"


class ILSGoalStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ON_HOLD = "ON_HOLD"
    ACHIEVED = "ACHIEVED"
    NOT_ACHIEVED = "NOT_ACHIEVED"
    DISCONTINUED = "DISCONTINUED"


# ==========================================
# TASK ANALYSIS SCHEMAS
# ==========================================

class TaskStep(BaseModel):
    """A single step in a task analysis"""
    step_number: int = Field(..., ge=1, description="Step number in sequence")
    description: str = Field(..., description="Description of the step")
    prompt_hierarchy: List[PromptLevel] = Field(
        default=[PromptLevel.FULL_PHYSICAL, PromptLevel.PARTIAL_PHYSICAL, 
                 PromptLevel.MODELING, PromptLevel.GESTURAL, 
                 PromptLevel.VERBAL_DIRECT, PromptLevel.INDEPENDENT],
        description="Prompt levels for this step from most to least support"
    )
    critical_step: bool = Field(default=False, description="Is this a critical/safety step")
    notes: Optional[str] = Field(None, description="Teaching notes for this step")


class VisualSupport(BaseModel):
    """Visual support resource for skill instruction"""
    name: str = Field(..., description="Name of the visual support")
    url: str = Field(..., description="URL to the resource")
    type: str = Field(..., description="Type: image, video, pdf, interactive")


class StepProgressData(BaseModel):
    """Progress data for a single task analysis step"""
    step_number: int = Field(..., ge=1)
    mastery_level: SkillMasteryLevel = Field(default=SkillMasteryLevel.NOT_INTRODUCED)
    last_prompt_level: Optional[PromptLevel] = None
    trials_correct: int = Field(default=0)
    trials_total: int = Field(default=0)


# ==========================================
# FUNCTIONAL SKILL SCHEMAS
# ==========================================

class FunctionalSkillBase(BaseModel):
    """Base schema for functional skills"""
    domain: IndependentLivingDomain
    name: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    
    task_steps: List[TaskStep]
    total_steps: int = Field(..., ge=1)
    
    prerequisite_skill_ids: List[str] = Field(default=[])
    scaffolding_notes: Optional[str] = None
    
    min_age: Optional[int] = Field(None, ge=5, le=26)
    max_age: Optional[int] = Field(None, ge=5, le=26)
    min_grade_level: Optional[int] = Field(None, ge=0, le=12)
    max_grade_level: Optional[int] = Field(None, ge=0, le=12)
    
    materials_needed: List[str] = Field(default=[])
    visual_supports: List[VisualSupport] = Field(default=[])
    video_modeling_urls: List[str] = Field(default=[])
    social_story_url: Optional[str] = None
    
    target_settings: List[SettingType] = Field(default=[])
    
    mastery_threshold: float = Field(default=0.9, ge=0.5, le=1.0)
    data_collection_method: DataCollectionMethod = Field(default=DataCollectionMethod.TASK_ANALYSIS)
    min_trials_for_mastery: int = Field(default=3, ge=1, le=10)
    
    is_critical_safety: bool = Field(default=False)
    community_relevance: int = Field(default=3, ge=1, le=5)
    employment_relevance: int = Field(default=3, ge=1, le=5)


class FunctionalSkillCreate(FunctionalSkillBase):
    """Schema for creating a new functional skill"""
    pass


class FunctionalSkillUpdate(BaseModel):
    """Schema for updating a functional skill"""
    name: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    task_steps: Optional[List[TaskStep]] = None
    total_steps: Optional[int] = Field(None, ge=1)
    prerequisite_skill_ids: Optional[List[str]] = None
    scaffolding_notes: Optional[str] = None
    min_age: Optional[int] = Field(None, ge=5, le=26)
    max_age: Optional[int] = Field(None, ge=5, le=26)
    materials_needed: Optional[List[str]] = None
    visual_supports: Optional[List[VisualSupport]] = None
    video_modeling_urls: Optional[List[str]] = None
    social_story_url: Optional[str] = None
    target_settings: Optional[List[SettingType]] = None
    mastery_threshold: Optional[float] = Field(None, ge=0.5, le=1.0)
    data_collection_method: Optional[DataCollectionMethod] = None
    is_critical_safety: Optional[bool] = None
    community_relevance: Optional[int] = Field(None, ge=1, le=5)
    employment_relevance: Optional[int] = Field(None, ge=1, le=5)
    is_active: Optional[bool] = None


class FunctionalSkillResponse(FunctionalSkillBase):
    """Schema for functional skill response"""
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FunctionalSkillListResponse(BaseModel):
    """Paginated list of functional skills"""
    skills: List[FunctionalSkillResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ==========================================
# LEARNER SKILL PROGRESS SCHEMAS
# ==========================================

class LearnerSkillProgressBase(BaseModel):
    """Base schema for learner skill progress"""
    learner_id: str
    skill_id: str
    
    mastery_level: SkillMasteryLevel = Field(default=SkillMasteryLevel.NOT_INTRODUCED)
    percent_mastered: float = Field(default=0.0, ge=0, le=100)
    
    step_progress: Optional[List[StepProgressData]] = None
    
    baseline_date: Optional[datetime] = None
    baseline_score: Optional[float] = Field(None, ge=0, le=100)
    target_mastery_date: Optional[datetime] = None
    
    current_prompt_level: PromptLevel = Field(default=PromptLevel.FULL_PHYSICAL)
    
    settings_mastered: List[SettingType] = Field(default=[])
    generalization_score: Optional[float] = Field(None, ge=0, le=100)
    
    teacher_notes: Optional[str] = None
    parent_notes: Optional[str] = None


class LearnerSkillProgressCreate(BaseModel):
    """Schema for creating learner skill progress"""
    skill_id: str
    baseline_date: Optional[datetime] = None
    baseline_score: Optional[float] = Field(None, ge=0, le=100)
    target_mastery_date: Optional[datetime] = None
    teacher_notes: Optional[str] = None


class LearnerSkillProgressUpdate(BaseModel):
    """Schema for updating learner skill progress"""
    mastery_level: Optional[SkillMasteryLevel] = None
    percent_mastered: Optional[float] = Field(None, ge=0, le=100)
    step_progress: Optional[List[StepProgressData]] = None
    target_mastery_date: Optional[datetime] = None
    current_prompt_level: Optional[PromptLevel] = None
    teacher_notes: Optional[str] = None
    parent_notes: Optional[str] = None
    is_active: Optional[bool] = None


class LearnerSkillProgressResponse(LearnerSkillProgressBase):
    """Schema for learner skill progress response"""
    id: str
    current_streak: int
    total_practice_minutes: int
    last_practice_date: Optional[datetime]
    prompt_fading_history: Optional[List[Dict[str, Any]]]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Include skill details for convenience
    skill: Optional[FunctionalSkillResponse] = None
    
    class Config:
        from_attributes = True


class LearnerSkillProgressListResponse(BaseModel):
    """List of learner skill progress"""
    progress: List[LearnerSkillProgressResponse]
    total: int
    by_domain: Dict[str, int]  # Count by domain
    by_mastery_level: Dict[str, int]  # Count by mastery level


# ==========================================
# DATA POINT SCHEMAS
# ==========================================

class StepDataEntry(BaseModel):
    """Data for a single step in a data collection session"""
    step_number: int = Field(..., ge=1)
    completed: bool = Field(default=False)
    prompt_level: PromptLevel = Field(default=PromptLevel.FULL_PHYSICAL)
    notes: Optional[str] = None


class EnvironmentalFactors(BaseModel):
    """Environmental factors during data collection"""
    noise_level: Optional[str] = None  # low, medium, high
    distractions: Optional[str] = None
    support_level: Optional[str] = None
    peer_presence: Optional[bool] = None
    familiar_environment: Optional[bool] = None
    other: Optional[str] = None


class SkillDataPointBase(BaseModel):
    """Base schema for skill data points"""
    skill_id: str
    learner_id: str
    
    session_date: datetime = Field(default_factory=datetime.now)
    setting: SettingType
    duration: Optional[int] = Field(None, ge=1, description="Duration in minutes")
    instructor: Optional[str] = None
    
    collection_method: DataCollectionMethod
    
    # Task Analysis Data
    steps_attempted: Optional[int] = Field(None, ge=0)
    steps_completed: Optional[int] = Field(None, ge=0)
    step_by_step_data: Optional[List[StepDataEntry]] = None
    
    # Frequency/Duration Data
    frequency: Optional[int] = Field(None, ge=0)
    duration_seconds: Optional[int] = Field(None, ge=0)
    latency_seconds: Optional[int] = Field(None, ge=0)
    
    # Prompts
    highest_prompt_used: Optional[PromptLevel] = None
    lowest_prompt_used: Optional[PromptLevel] = None
    prompts_provided: Optional[List[Dict[str, Any]]] = None
    
    # Scores
    accuracy_percent: Optional[float] = Field(None, ge=0, le=100)
    independence_percent: Optional[float] = Field(None, ge=0, le=100)
    
    # Notes
    behavior_notes: Optional[str] = None
    antecedents: Optional[str] = None
    consequences: Optional[str] = None
    
    environmental_factors: Optional[EnvironmentalFactors] = None


class SkillDataPointCreate(BaseModel):
    """Schema for creating a data point"""
    skill_id: str
    session_date: Optional[datetime] = None
    setting: SettingType
    duration: Optional[int] = Field(None, ge=1)
    instructor: Optional[str] = None
    collection_method: DataCollectionMethod = Field(default=DataCollectionMethod.TASK_ANALYSIS)
    
    steps_attempted: Optional[int] = Field(None, ge=0)
    steps_completed: Optional[int] = Field(None, ge=0)
    step_by_step_data: Optional[List[StepDataEntry]] = None
    
    frequency: Optional[int] = Field(None, ge=0)
    duration_seconds: Optional[int] = Field(None, ge=0)
    latency_seconds: Optional[int] = Field(None, ge=0)
    
    highest_prompt_used: Optional[PromptLevel] = None
    lowest_prompt_used: Optional[PromptLevel] = None
    
    accuracy_percent: Optional[float] = Field(None, ge=0, le=100)
    independence_percent: Optional[float] = Field(None, ge=0, le=100)
    
    behavior_notes: Optional[str] = None
    antecedents: Optional[str] = None
    consequences: Optional[str] = None
    environmental_factors: Optional[EnvironmentalFactors] = None


class SkillDataPointResponse(SkillDataPointBase):
    """Schema for data point response"""
    id: str
    verified_by: Optional[str]
    parent_signoff: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class SkillDataPointListResponse(BaseModel):
    """List of data points with aggregations"""
    data_points: List[SkillDataPointResponse]
    total: int
    average_accuracy: Optional[float]
    average_independence: Optional[float]
    sessions_this_week: int
    sessions_this_month: int


# ==========================================
# GENERALIZATION RECORD SCHEMAS
# ==========================================

class GeneralizationRecordBase(BaseModel):
    """Base schema for generalization records"""
    skill_id: str
    learner_id: str
    
    setting: SettingType
    location_name: Optional[str] = None
    
    is_introduced: bool = Field(default=False)
    introduced_date: Optional[datetime] = None
    is_mastered: bool = Field(default=False)
    mastered_date: Optional[datetime] = None
    
    trials_attempted: int = Field(default=0, ge=0)
    trials_successful: int = Field(default=0, ge=0)
    success_rate: Optional[float] = Field(None, ge=0, le=100)
    
    current_prompt_level: Optional[PromptLevel] = None
    supports_needed: List[str] = Field(default=[])
    
    barriers: List[str] = Field(default=[])
    accommodations: List[str] = Field(default=[])
    
    notes: Optional[str] = None


class GeneralizationRecordCreate(BaseModel):
    """Schema for creating generalization record"""
    skill_id: str
    setting: SettingType
    location_name: Optional[str] = None
    notes: Optional[str] = None


class GeneralizationRecordUpdate(BaseModel):
    """Schema for updating generalization record"""
    location_name: Optional[str] = None
    is_introduced: Optional[bool] = None
    introduced_date: Optional[datetime] = None
    is_mastered: Optional[bool] = None
    mastered_date: Optional[datetime] = None
    current_prompt_level: Optional[PromptLevel] = None
    supports_needed: Optional[List[str]] = None
    barriers: Optional[List[str]] = None
    accommodations: Optional[List[str]] = None
    notes: Optional[str] = None


class GeneralizationRecordResponse(GeneralizationRecordBase):
    """Schema for generalization record response"""
    id: str
    last_attempt_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class GeneralizationMatrixResponse(BaseModel):
    """Matrix view of generalization across settings"""
    skill_id: str
    skill_name: str
    settings: Dict[str, GeneralizationRecordResponse]  # Setting -> Record
    total_settings: int
    mastered_settings: int
    introduced_settings: int
    generalization_percent: float


# ==========================================
# CBI (COMMUNITY-BASED INSTRUCTION) SCHEMAS
# ==========================================

class CBIActivityBase(BaseModel):
    """Base schema for CBI activities"""
    skill_id: str
    activity_name: str = Field(..., min_length=3)
    activity_description: Optional[str] = None
    order_in_session: int = Field(default=1, ge=1)
    target_steps: List[int] = Field(default=[])
    target_prompt_level: PromptLevel = Field(default=PromptLevel.VERBAL_DIRECT)


class CBIActivityCreate(CBIActivityBase):
    """Schema for creating CBI activity"""
    pass


class CBIActivityUpdate(BaseModel):
    """Schema for updating CBI activity"""
    activity_name: Optional[str] = None
    activity_description: Optional[str] = None
    order_in_session: Optional[int] = Field(None, ge=1)
    target_steps: Optional[List[int]] = None
    target_prompt_level: Optional[PromptLevel] = None
    was_completed: Optional[bool] = None
    steps_completed: Optional[int] = None
    actual_prompt_level: Optional[PromptLevel] = None
    notes: Optional[str] = None


class CBIActivityResponse(CBIActivityBase):
    """Schema for CBI activity response"""
    id: str
    cbi_id: str
    was_completed: bool
    steps_completed: Optional[int]
    actual_prompt_level: Optional[PromptLevel]
    notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class CommunityBasedInstructionBase(BaseModel):
    """Base schema for CBI sessions"""
    learner_id: str
    
    scheduled_date: datetime
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: CBIStatus = Field(default=CBIStatus.PLANNED)
    
    location_name: str = Field(..., min_length=3)
    location_address: Optional[str] = None
    setting_type: SettingType
    
    instructor_name: str = Field(..., min_length=2)
    staff_ratio: Optional[str] = None
    additional_staff: List[str] = Field(default=[])
    
    transportation_type: Optional[str] = None
    transportation_notes: Optional[str] = None
    
    parent_permission: bool = Field(default=False)
    permission_form_date: Optional[datetime] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    medical_notes: Optional[str] = None
    
    pre_teaching_completed: bool = Field(default=False)
    pre_teaching_notes: Optional[str] = None
    visual_schedule_url: Optional[str] = None
    social_story_url: Optional[str] = None


class CommunityBasedInstructionCreate(BaseModel):
    """Schema for creating CBI session"""
    scheduled_date: datetime
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    
    location_name: str = Field(..., min_length=3)
    location_address: Optional[str] = None
    setting_type: SettingType
    
    instructor_name: str = Field(..., min_length=2)
    staff_ratio: Optional[str] = None
    additional_staff: List[str] = Field(default=[])
    
    transportation_type: Optional[str] = None
    transportation_notes: Optional[str] = None
    
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    medical_notes: Optional[str] = None
    
    pre_teaching_notes: Optional[str] = None
    
    # Activities to include
    activities: List[CBIActivityCreate] = Field(default=[])


class CommunityBasedInstructionUpdate(BaseModel):
    """Schema for updating CBI session"""
    scheduled_date: Optional[datetime] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[CBIStatus] = None
    
    location_name: Optional[str] = None
    location_address: Optional[str] = None
    setting_type: Optional[SettingType] = None
    
    instructor_name: Optional[str] = None
    staff_ratio: Optional[str] = None
    additional_staff: Optional[List[str]] = None
    
    transportation_type: Optional[str] = None
    transportation_notes: Optional[str] = None
    
    parent_permission: Optional[bool] = None
    permission_form_date: Optional[datetime] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    medical_notes: Optional[str] = None
    
    pre_teaching_completed: Optional[bool] = None
    pre_teaching_notes: Optional[str] = None
    visual_schedule_url: Optional[str] = None
    social_story_url: Optional[str] = None
    
    # Outcomes
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    overall_success_rating: Optional[int] = Field(None, ge=1, le=5)
    behavior_notes: Optional[str] = None
    general_notes: Optional[str] = None
    
    follow_up_needed: Optional[bool] = None
    follow_up_notes: Optional[str] = None
    next_cbi_date: Optional[datetime] = None


class CommunityBasedInstructionResponse(CommunityBasedInstructionBase):
    """Schema for CBI session response"""
    id: str
    actual_start_time: Optional[datetime]
    actual_end_time: Optional[datetime]
    overall_success_rating: Optional[int]
    behavior_notes: Optional[str]
    general_notes: Optional[str]
    follow_up_needed: bool
    follow_up_notes: Optional[str]
    next_cbi_date: Optional[datetime]
    activities: List[CBIActivityResponse] = Field(default=[])
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CBIListResponse(BaseModel):
    """List of CBI sessions"""
    sessions: List[CommunityBasedInstructionResponse]
    total: int
    upcoming: int
    completed_this_month: int


# ==========================================
# ILS GOAL SCHEMAS
# ==========================================

class ILSGoalObjectiveBase(BaseModel):
    """Base schema for ILS goal objectives"""
    skill_id: Optional[str] = None
    objective_number: int = Field(..., ge=1)
    objective_statement: str = Field(..., min_length=10)
    target_criteria: str = Field(..., min_length=10)


class ILSGoalObjectiveCreate(ILSGoalObjectiveBase):
    """Schema for creating goal objective"""
    pass


class ILSGoalObjectiveUpdate(BaseModel):
    """Schema for updating goal objective"""
    objective_statement: Optional[str] = None
    target_criteria: Optional[str] = None
    is_completed: Optional[bool] = None
    completed_date: Optional[datetime] = None
    current_performance: Optional[float] = Field(None, ge=0, le=100)
    notes: Optional[str] = None


class ILSGoalObjectiveResponse(ILSGoalObjectiveBase):
    """Schema for goal objective response"""
    id: str
    goal_id: str
    is_completed: bool
    completed_date: Optional[datetime]
    current_performance: Optional[float]
    data_points: int
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProgressNote(BaseModel):
    """A progress note entry"""
    date: datetime
    note: str
    performance: Optional[float] = None


class ILSGoalBase(BaseModel):
    """Base schema for ILS goals"""
    learner_id: str
    domain: IndependentLivingDomain
    goal_statement: str = Field(..., min_length=20)
    rationale: Optional[str] = None
    
    start_date: datetime = Field(default_factory=datetime.now)
    target_date: datetime
    status: ILSGoalStatus = Field(default=ILSGoalStatus.DRAFT)
    
    baseline_description: Optional[str] = None
    baseline_date: Optional[datetime] = None
    baseline_performance: Optional[float] = Field(None, ge=0, le=100)
    
    linked_iep_goal_id: Optional[str] = None
    
    review_schedule: Optional[str] = None


class ILSGoalCreate(BaseModel):
    """Schema for creating ILS goal"""
    domain: IndependentLivingDomain
    goal_statement: str = Field(..., min_length=20)
    rationale: Optional[str] = None
    
    start_date: Optional[datetime] = None
    target_date: datetime
    
    baseline_description: Optional[str] = None
    baseline_date: Optional[datetime] = None
    baseline_performance: Optional[float] = Field(None, ge=0, le=100)
    
    linked_iep_goal_id: Optional[str] = None
    review_schedule: Optional[str] = None
    
    # Objectives to create
    objectives: List[ILSGoalObjectiveCreate] = Field(default=[])


class ILSGoalUpdate(BaseModel):
    """Schema for updating ILS goal"""
    goal_statement: Optional[str] = None
    rationale: Optional[str] = None
    target_date: Optional[datetime] = None
    status: Optional[ILSGoalStatus] = None
    
    baseline_description: Optional[str] = None
    baseline_performance: Optional[float] = Field(None, ge=0, le=100)
    
    current_performance: Optional[float] = Field(None, ge=0, le=100)
    
    linked_iep_goal_id: Optional[str] = None
    review_schedule: Optional[str] = None
    
    completed_date: Optional[datetime] = None
    completion_notes: Optional[str] = None


class ILSGoalResponse(ILSGoalBase):
    """Schema for ILS goal response"""
    id: str
    current_performance: Optional[float]
    last_progress_date: Optional[datetime]
    progress_notes: Optional[List[ProgressNote]]
    objectives: List[ILSGoalObjectiveResponse] = Field(default=[])
    last_review_date: Optional[datetime]
    next_review_date: Optional[datetime]
    completed_date: Optional[datetime]
    completion_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ILSGoalListResponse(BaseModel):
    """List of ILS goals"""
    goals: List[ILSGoalResponse]
    total: int
    active: int
    achieved: int
    by_domain: Dict[str, int]


# ==========================================
# DASHBOARD/REPORT SCHEMAS
# ==========================================

class DomainSummary(BaseModel):
    """Summary for a single ILS domain"""
    domain: IndependentLivingDomain
    domain_name: str
    total_skills: int
    skills_introduced: int
    skills_mastered: int
    skills_generalized: int
    average_mastery_percent: float
    active_goals: int
    recent_data_points: int


class ILSDashboardResponse(BaseModel):
    """Overall ILS dashboard for a learner"""
    learner_id: str
    learner_name: str
    
    # Overall Stats
    total_skills_tracked: int
    skills_mastered: int
    skills_generalized: int
    overall_mastery_percent: float
    
    # By Domain
    domain_summaries: List[DomainSummary]
    
    # Recent Activity
    recent_data_points: int
    recent_cbi_sessions: int
    last_activity_date: Optional[datetime]
    
    # Goals
    active_goals: int
    goals_achieved_this_year: int
    
    # Recommendations
    priority_skills: List[str]  # Skill IDs needing attention
    upcoming_cbis: List[CommunityBasedInstructionResponse]


class ILSProgressReportRequest(BaseModel):
    """Request for generating progress report"""
    learner_id: str
    start_date: datetime
    end_date: datetime
    domains: Optional[List[IndependentLivingDomain]] = None
    include_data_points: bool = Field(default=True)
    include_goals: bool = Field(default=True)
    include_cbi: bool = Field(default=True)
    include_generalization: bool = Field(default=True)


class SkillProgressSummary(BaseModel):
    """Progress summary for a single skill"""
    skill_id: str
    skill_name: str
    domain: IndependentLivingDomain
    start_mastery_level: SkillMasteryLevel
    end_mastery_level: SkillMasteryLevel
    start_percent: float
    end_percent: float
    growth: float
    data_points_collected: int
    settings_practiced: List[SettingType]


class ILSProgressReportResponse(BaseModel):
    """Progress report response"""
    learner_id: str
    learner_name: str
    report_period_start: datetime
    report_period_end: datetime
    generated_at: datetime
    
    # Summary
    skills_tracked: int
    skills_improved: int
    skills_mastered: int
    average_growth: float
    
    # Detailed Progress
    skill_progress: List[SkillProgressSummary]
    
    # Goals Progress
    goals_summary: Optional[Dict[str, Any]] = None
    
    # CBI Summary
    cbi_summary: Optional[Dict[str, Any]] = None
    
    # Generalization Summary
    generalization_summary: Optional[Dict[str, Any]] = None
    
    # Recommendations
    recommendations: List[str]
    next_steps: List[str]


# ==========================================
# BULK OPERATION SCHEMAS
# ==========================================

class BulkSkillAssignRequest(BaseModel):
    """Assign multiple skills to a learner"""
    learner_id: str
    skill_ids: List[str]
    target_mastery_date: Optional[datetime] = None


class BulkDataPointCreate(BaseModel):
    """Create data points for multiple skills in one session"""
    session_date: datetime
    setting: SettingType
    instructor: Optional[str] = None
    data_points: List[SkillDataPointCreate]


class BulkGeneralizationUpdate(BaseModel):
    """Update generalization for multiple settings"""
    skill_id: str
    updates: List[GeneralizationRecordUpdate]
