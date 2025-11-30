"""
Autism Support System Schemas

Pydantic models for visual supports, social stories, behavior tracking,
communication profiles, and transition support.
"""

from datetime import datetime, date, time
from enum import Enum
from typing import Optional, List, Any
from pydantic import BaseModel, Field


# ==========================================
# ENUMS
# ==========================================

class CommunicationStyle(str, Enum):
    """Communication style categories."""
    VERBAL = "VERBAL"
    MINIMAL_VERBAL = "MINIMAL_VERBAL"
    NON_VERBAL = "NON_VERBAL"
    AAC_USER = "AAC_USER"


class SocialInteractionLevel(str, Enum):
    """Social interaction skill levels."""
    VERY_LIMITED = "VERY_LIMITED"
    LIMITED = "LIMITED"
    EMERGING = "EMERGING"
    DEVELOPING = "DEVELOPING"
    AGE_APPROPRIATE = "AGE_APPROPRIATE"


class ChangeFlexibility(str, Enum):
    """Flexibility with changes and routines."""
    VERY_RIGID = "VERY_RIGID"
    RIGID = "RIGID"
    MODERATELY_FLEXIBLE = "MODERATELY_FLEXIBLE"
    FLEXIBLE = "FLEXIBLE"
    VERY_FLEXIBLE = "VERY_FLEXIBLE"


class VisualSupportType(str, Enum):
    """Types of visual supports."""
    FIRST_THEN = "FIRST_THEN"
    VISUAL_SCHEDULE = "VISUAL_SCHEDULE"
    CHOICE_BOARD = "CHOICE_BOARD"
    TASK_ANALYSIS = "TASK_ANALYSIS"
    SOCIAL_STORY = "SOCIAL_STORY"
    EMOTION_CHART = "EMOTION_CHART"
    TOKEN_BOARD = "TOKEN_BOARD"
    TIMER = "TIMER"
    COPING_CARD = "COPING_CARD"
    RULE_REMINDER = "RULE_REMINDER"


class SocialStorySentenceType(str, Enum):
    """Carol Gray's Social Story sentence types."""
    DESCRIPTIVE = "DESCRIPTIVE"  # Factual, objective statements
    PERSPECTIVE = "PERSPECTIVE"  # Describes others' thoughts/feelings
    DIRECTIVE = "DIRECTIVE"  # Suggests appropriate response
    AFFIRMATIVE = "AFFIRMATIVE"  # Reassuring statements
    CONTROL = "CONTROL"  # Personal strategies by the learner
    COOPERATIVE = "COOPERATIVE"  # What others will do to help


class BehaviorFunction(str, Enum):
    """Hypothesized behavior functions."""
    ATTENTION = "ATTENTION"
    ESCAPE = "ESCAPE"
    TANGIBLE = "TANGIBLE"
    SENSORY = "SENSORY"
    UNKNOWN = "UNKNOWN"


class BehaviorIntensity(str, Enum):
    """Behavior intensity levels."""
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    SEVERE = "SEVERE"


class TransitionDifficulty(str, Enum):
    """Transition difficulty levels."""
    NONE = "NONE"
    MILD = "MILD"
    MODERATE = "MODERATE"
    SIGNIFICANT = "SIGNIFICANT"
    SEVERE = "SEVERE"


# ==========================================
# AUTISM PROFILE
# ==========================================

class SpecialInterest(BaseModel):
    """A special interest that can be leveraged for engagement."""
    topic: str
    intensity: int = Field(ge=1, le=5)  # 1-5 scale
    can_use_for_rewards: bool = True
    notes: Optional[str] = None


class AutismProfileCreate(BaseModel):
    """Create an autism profile."""
    learner_id: str
    diagnosis_date: Optional[datetime] = None
    diagnosed_by: Optional[str] = None
    support_level: Optional[int] = Field(None, ge=1, le=3)  # DSM-5 Level 1-3
    assessment_notes: Optional[str] = None
    
    # Communication
    communication_style: CommunicationStyle = CommunicationStyle.VERBAL
    expressive_language: Optional[int] = Field(None, ge=1, le=5)
    receptive_language: Optional[int] = Field(None, ge=1, le=5)
    uses_aac: bool = False
    aac_system_type: Optional[str] = None
    communication_strengths: List[str] = []
    communication_challenges: List[str] = []
    
    # Social interaction
    social_interaction_level: SocialInteractionLevel = SocialInteractionLevel.DEVELOPING
    joint_attention: Optional[int] = Field(None, ge=1, le=5)
    peer_interaction: Optional[int] = Field(None, ge=1, le=5)
    adult_interaction: Optional[int] = Field(None, ge=1, le=5)
    social_strengths: List[str] = []
    social_challenges: List[str] = []
    
    # Flexibility and routines
    change_flexibility: ChangeFlexibility = ChangeFlexibility.MODERATELY_FLEXIBLE
    needs_visual_schedule: bool = True
    needs_transition_warnings: bool = True
    preferred_warning_time: int = 5
    routine_preferences: Optional[dict] = None
    
    # Sensory and interests
    sensory_profile_id: Optional[str] = None
    primary_sensory_needs: List[str] = []
    special_interests: List[SpecialInterest] = []
    
    # Behavior
    common_triggers: List[str] = []
    calming_strategies: List[str] = []
    reinforcers: List[str] = []
    
    # Support preferences
    preferred_visual_support_types: List[VisualSupportType] = []
    needs_social_stories: bool = True
    needs_token_system: bool = False
    token_goal_size: Optional[int] = None
    
    # Team notes
    parent_notes: Optional[str] = None
    teacher_notes: Optional[str] = None
    therapist_notes: Optional[str] = None


class AutismProfileUpdate(BaseModel):
    """Update an autism profile."""
    diagnosis_date: Optional[datetime] = None
    diagnosed_by: Optional[str] = None
    support_level: Optional[int] = Field(None, ge=1, le=3)
    assessment_notes: Optional[str] = None
    communication_style: Optional[CommunicationStyle] = None
    expressive_language: Optional[int] = Field(None, ge=1, le=5)
    receptive_language: Optional[int] = Field(None, ge=1, le=5)
    uses_aac: Optional[bool] = None
    aac_system_type: Optional[str] = None
    communication_strengths: Optional[List[str]] = None
    communication_challenges: Optional[List[str]] = None
    social_interaction_level: Optional[SocialInteractionLevel] = None
    joint_attention: Optional[int] = Field(None, ge=1, le=5)
    peer_interaction: Optional[int] = Field(None, ge=1, le=5)
    adult_interaction: Optional[int] = Field(None, ge=1, le=5)
    social_strengths: Optional[List[str]] = None
    social_challenges: Optional[List[str]] = None
    change_flexibility: Optional[ChangeFlexibility] = None
    needs_visual_schedule: Optional[bool] = None
    needs_transition_warnings: Optional[bool] = None
    preferred_warning_time: Optional[int] = None
    routine_preferences: Optional[dict] = None
    sensory_profile_id: Optional[str] = None
    primary_sensory_needs: Optional[List[str]] = None
    special_interests: Optional[List[SpecialInterest]] = None
    common_triggers: Optional[List[str]] = None
    calming_strategies: Optional[List[str]] = None
    reinforcers: Optional[List[str]] = None
    preferred_visual_support_types: Optional[List[VisualSupportType]] = None
    needs_social_stories: Optional[bool] = None
    needs_token_system: Optional[bool] = None
    token_goal_size: Optional[int] = None
    parent_notes: Optional[str] = None
    teacher_notes: Optional[str] = None
    therapist_notes: Optional[str] = None


class AutismProfileResponse(BaseModel):
    """Autism profile response."""
    id: str
    learner_id: str
    diagnosis_date: Optional[datetime]
    diagnosed_by: Optional[str]
    support_level: Optional[int]
    assessment_notes: Optional[str]
    communication_style: CommunicationStyle
    expressive_language: Optional[int]
    receptive_language: Optional[int]
    uses_aac: bool
    aac_system_type: Optional[str]
    communication_strengths: List[str]
    communication_challenges: List[str]
    social_interaction_level: SocialInteractionLevel
    joint_attention: Optional[int]
    peer_interaction: Optional[int]
    adult_interaction: Optional[int]
    social_strengths: List[str]
    social_challenges: List[str]
    change_flexibility: ChangeFlexibility
    needs_visual_schedule: bool
    needs_transition_warnings: bool
    preferred_warning_time: int
    routine_preferences: Optional[dict]
    sensory_profile_id: Optional[str]
    primary_sensory_needs: List[str]
    special_interests: Optional[List[dict]]
    common_triggers: List[str]
    calming_strategies: List[str]
    reinforcers: List[str]
    preferred_visual_support_types: List[VisualSupportType]
    needs_social_stories: bool
    needs_token_system: bool
    token_goal_size: Optional[int]
    parent_notes: Optional[str]
    teacher_notes: Optional[str]
    therapist_notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# COMMUNICATION PROFILE
# ==========================================

class CommunicationProfileCreate(BaseModel):
    """Create a communication profile."""
    autism_profile_id: str
    
    # Expressive
    primary_expressive_mode: str = "speech"
    speech_clarity: Optional[int] = Field(None, ge=1, le=5)
    average_utterance_length: Optional[int] = None
    vocabulary_level: Optional[str] = None
    can_request_help: bool = False
    can_express_needs: bool = False
    can_ask_questions: bool = False
    can_tell_stories: bool = False
    
    # Receptive
    follows_simple_directions: bool = True
    follows_multi_step_directions: bool = False
    understands_questions: bool = True
    understands_sarcasm: bool = False
    understands_idioms: bool = False
    needs_visual_supports: bool = True
    needs_simplified_language: bool = False
    processing_time: Optional[int] = None
    
    # Pragmatic
    makes_eye_contact: bool = True
    initiates_conversation: bool = False
    maintains_conversation: bool = False
    takes_turns: bool = False
    understood_by_familiar: Optional[int] = Field(None, ge=1, le=5)
    understood_by_unfamiliar: Optional[int] = Field(None, ge=1, le=5)
    
    # AAC
    aac_device_type: Optional[str] = None
    aac_app_or_system: Optional[str] = None
    aac_vocabulary_size: Optional[int] = None
    aac_proficiency: Optional[int] = Field(None, ge=1, le=5)
    aac_supports_needed: List[str] = []
    
    # Goals and strategies
    current_goals: List[str] = []
    target_skills: List[str] = []
    effective_strategies: List[str] = []
    ineffective_approaches: List[str] = []


class CommunicationProfileUpdate(BaseModel):
    """Update a communication profile."""
    primary_expressive_mode: Optional[str] = None
    speech_clarity: Optional[int] = Field(None, ge=1, le=5)
    average_utterance_length: Optional[int] = None
    vocabulary_level: Optional[str] = None
    can_request_help: Optional[bool] = None
    can_express_needs: Optional[bool] = None
    can_ask_questions: Optional[bool] = None
    can_tell_stories: Optional[bool] = None
    follows_simple_directions: Optional[bool] = None
    follows_multi_step_directions: Optional[bool] = None
    understands_questions: Optional[bool] = None
    understands_sarcasm: Optional[bool] = None
    understands_idioms: Optional[bool] = None
    needs_visual_supports: Optional[bool] = None
    needs_simplified_language: Optional[bool] = None
    processing_time: Optional[int] = None
    makes_eye_contact: Optional[bool] = None
    initiates_conversation: Optional[bool] = None
    maintains_conversation: Optional[bool] = None
    takes_turns: Optional[bool] = None
    understood_by_familiar: Optional[int] = Field(None, ge=1, le=5)
    understood_by_unfamiliar: Optional[int] = Field(None, ge=1, le=5)
    aac_device_type: Optional[str] = None
    aac_app_or_system: Optional[str] = None
    aac_vocabulary_size: Optional[int] = None
    aac_proficiency: Optional[int] = Field(None, ge=1, le=5)
    aac_supports_needed: Optional[List[str]] = None
    current_goals: Optional[List[str]] = None
    target_skills: Optional[List[str]] = None
    effective_strategies: Optional[List[str]] = None
    ineffective_approaches: Optional[List[str]] = None


class CommunicationProfileResponse(BaseModel):
    """Communication profile response."""
    id: str
    autism_profile_id: str
    primary_expressive_mode: str
    speech_clarity: Optional[int]
    average_utterance_length: Optional[int]
    vocabulary_level: Optional[str]
    can_request_help: bool
    can_express_needs: bool
    can_ask_questions: bool
    can_tell_stories: bool
    follows_simple_directions: bool
    follows_multi_step_directions: bool
    understands_questions: bool
    understands_sarcasm: bool
    understands_idioms: bool
    needs_visual_supports: bool
    needs_simplified_language: bool
    processing_time: Optional[int]
    makes_eye_contact: bool
    initiates_conversation: bool
    maintains_conversation: bool
    takes_turns: bool
    understood_by_familiar: Optional[int]
    understood_by_unfamiliar: Optional[int]
    aac_device_type: Optional[str]
    aac_app_or_system: Optional[str]
    aac_vocabulary_size: Optional[int]
    aac_proficiency: Optional[int]
    aac_supports_needed: List[str]
    current_goals: List[str]
    target_skills: List[str]
    effective_strategies: List[str]
    ineffective_approaches: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# VISUAL SUPPORT
# ==========================================

class FirstThenContent(BaseModel):
    """Content for a First-Then board."""
    first: dict  # { text, imageUrl }
    then: dict  # { text, imageUrl }


class ChoiceBoardChoice(BaseModel):
    """A choice on a choice board."""
    id: str
    text: str
    image_url: Optional[str] = None


class TaskStep(BaseModel):
    """A step in a task analysis."""
    step_number: int
    text: str
    image_url: Optional[str] = None
    is_completed: bool = False


class VisualSupportCreate(BaseModel):
    """Create a visual support."""
    autism_profile_id: str
    type: VisualSupportType
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    image_url: Optional[str] = None
    image_urls: List[str] = []
    content: Optional[dict] = None
    is_active: bool = True
    is_printable: bool = True
    show_on_dashboard: bool = False
    display_order: int = 0
    contexts: List[str] = []
    subjects: List[str] = []
    activities: List[str] = []
    is_shared_with_parent: bool = True
    is_template: bool = False


class VisualSupportUpdate(BaseModel):
    """Update a visual support."""
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    content: Optional[dict] = None
    is_active: Optional[bool] = None
    is_printable: Optional[bool] = None
    show_on_dashboard: Optional[bool] = None
    display_order: Optional[int] = None
    contexts: Optional[List[str]] = None
    subjects: Optional[List[str]] = None
    activities: Optional[List[str]] = None
    is_shared_with_parent: Optional[bool] = None
    is_template: Optional[bool] = None


class VisualSupportResponse(BaseModel):
    """Visual support response."""
    id: str
    autism_profile_id: str
    created_by_id: Optional[str]
    type: VisualSupportType
    title: str
    description: Optional[str]
    instructions: Optional[str]
    image_url: Optional[str]
    image_urls: List[str]
    content: Optional[dict]
    is_active: bool
    is_printable: bool
    show_on_dashboard: bool
    display_order: int
    contexts: List[str]
    subjects: List[str]
    activities: List[str]
    usage_count: int
    last_used_at: Optional[datetime]
    effectiveness_rating: Optional[int]
    is_shared_with_parent: bool
    is_template: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RecordVisualSupportUsage(BaseModel):
    """Record usage of a visual support."""
    effectiveness_rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None


# ==========================================
# VISUAL SCHEDULE
# ==========================================

class ScheduleItem(BaseModel):
    """An item in a visual schedule."""
    id: str
    order: int
    activity: str
    image_url: Optional[str] = None
    start_time: Optional[str] = None  # "08:00"
    end_time: Optional[str] = None
    duration: Optional[int] = None  # minutes
    is_completed: bool = False
    notes: Optional[str] = None


class VisualScheduleCreate(BaseModel):
    """Create a visual schedule."""
    autism_profile_id: str
    name: str
    description: Optional[str] = None
    schedule_type: str = "daily"  # "daily", "weekly", "activity", "class", "custom"
    items: List[ScheduleItem] = []
    display_format: str = "vertical"  # "vertical", "horizontal", "grid"
    show_times: bool = True
    show_checkboxes: bool = True
    image_size: str = "medium"  # "small", "medium", "large"
    color_coding: Optional[dict] = None
    applicable_days: List[int] = []  # 0-6 for days of week
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_active: bool = True
    is_template: bool = False


class VisualScheduleUpdate(BaseModel):
    """Update a visual schedule."""
    name: Optional[str] = None
    description: Optional[str] = None
    schedule_type: Optional[str] = None
    items: Optional[List[ScheduleItem]] = None
    display_format: Optional[str] = None
    show_times: Optional[bool] = None
    show_checkboxes: Optional[bool] = None
    image_size: Optional[str] = None
    color_coding: Optional[dict] = None
    applicable_days: Optional[List[int]] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_active: Optional[bool] = None
    is_template: Optional[bool] = None


class VisualScheduleResponse(BaseModel):
    """Visual schedule response."""
    id: str
    autism_profile_id: str
    created_by_id: Optional[str]
    name: str
    description: Optional[str]
    schedule_type: str
    items: List[dict]
    display_format: str
    show_times: bool
    show_checkboxes: bool
    image_size: str
    color_coding: Optional[dict]
    applicable_days: List[int]
    start_time: Optional[str]
    end_time: Optional[str]
    is_active: bool
    is_template: bool
    times_used: int
    last_used_at: Optional[datetime]
    completion_rate: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MarkScheduleItemComplete(BaseModel):
    """Mark a schedule item as complete."""
    item_id: str
    is_completed: bool = True


# ==========================================
# SOCIAL STORY
# ==========================================

class SocialStorySentence(BaseModel):
    """A sentence in a social story."""
    order: int
    text: str
    type: SocialStorySentenceType
    image_url: Optional[str] = None
    emphasis: bool = False


class ComprehensionQuestion(BaseModel):
    """A comprehension question for a social story."""
    question: str
    correct_answer: str
    options: Optional[List[str]] = None  # For multiple choice


class SocialStoryCreate(BaseModel):
    """Create a social story."""
    autism_profile_id: str
    title: str
    topic: str
    target_situation: Optional[str] = None
    target_behavior: Optional[str] = None
    sentences: List[SocialStorySentence] = []
    font_size: str = "large"
    show_images: bool = True
    read_aloud: bool = True
    page_per_sentence: bool = False
    comprehension_questions: List[ComprehensionQuestion] = []
    is_active: bool = True
    is_shared_with_parent: bool = True
    is_template: bool = False


class SocialStoryUpdate(BaseModel):
    """Update a social story."""
    title: Optional[str] = None
    topic: Optional[str] = None
    target_situation: Optional[str] = None
    target_behavior: Optional[str] = None
    sentences: Optional[List[SocialStorySentence]] = None
    font_size: Optional[str] = None
    show_images: Optional[bool] = None
    read_aloud: Optional[bool] = None
    page_per_sentence: Optional[bool] = None
    comprehension_questions: Optional[List[ComprehensionQuestion]] = None
    is_active: Optional[bool] = None
    is_shared_with_parent: Optional[bool] = None
    is_template: Optional[bool] = None


class SocialStoryResponse(BaseModel):
    """Social story response."""
    id: str
    autism_profile_id: str
    created_by_id: Optional[str]
    title: str
    topic: str
    target_situation: Optional[str]
    target_behavior: Optional[str]
    sentences: List[dict]
    descriptive_count: int
    perspective_count: int
    directive_count: int
    affirmative_count: int
    control_count: int
    cooperative_count: int
    ratio_valid: bool
    font_size: str
    show_images: bool
    read_aloud: bool
    page_per_sentence: bool
    comprehension_questions: Optional[List[dict]]
    is_active: bool
    times_read: int
    last_read_at: Optional[datetime]
    comprehension_score: Optional[float]
    behavior_improvement: Optional[int]
    generated_by_ai: bool
    ai_prompt: Optional[str]
    was_edited: bool
    is_shared_with_parent: bool
    is_template: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RecordSocialStoryReading(BaseModel):
    """Record a social story reading."""
    comprehension_answers: Optional[List[dict]] = None  # [{ question_index, answer, is_correct }]
    notes: Optional[str] = None


class AIGenerateSocialStoryRequest(BaseModel):
    """Request to generate a social story with AI."""
    autism_profile_id: str
    topic: str
    target_situation: str
    target_behavior: Optional[str] = None
    learner_age: Optional[int] = None
    learner_interests: List[str] = []
    include_images: bool = True
    reading_level: str = "simple"  # "simple", "intermediate", "advanced"


class AIGenerateSocialStoryResponse(BaseModel):
    """AI-generated social story response."""
    title: str
    sentences: List[SocialStorySentence]
    comprehension_questions: List[ComprehensionQuestion]
    ratio_valid: bool
    generation_notes: Optional[str] = None


# ==========================================
# BEHAVIOR INCIDENT (ABC Data)
# ==========================================

class BehaviorIncidentCreate(BaseModel):
    """Create a behavior incident record (ABC data)."""
    autism_profile_id: str
    incident_date: date
    incident_time: time
    location: Optional[str] = None
    activity: Optional[str] = None
    subject: Optional[str] = None
    antecedent: str
    behavior: str
    consequence: str
    hypothesized_function: BehaviorFunction = BehaviorFunction.UNKNOWN
    intensity: BehaviorIntensity = BehaviorIntensity.MODERATE
    duration: Optional[int] = None  # minutes
    frequency_in_period: Optional[int] = None
    staff_present: List[str] = []
    peers_present: Optional[int] = None
    environment_factors: List[str] = []
    physical_state: Optional[str] = None
    intervention_used: Optional[str] = None
    intervention_effective: Optional[bool] = None
    debrief_notes: Optional[str] = None
    parent_notified: bool = False


class BehaviorIncidentUpdate(BaseModel):
    """Update a behavior incident."""
    incident_date: Optional[date] = None
    incident_time: Optional[time] = None
    location: Optional[str] = None
    activity: Optional[str] = None
    subject: Optional[str] = None
    antecedent: Optional[str] = None
    behavior: Optional[str] = None
    consequence: Optional[str] = None
    hypothesized_function: Optional[BehaviorFunction] = None
    intensity: Optional[BehaviorIntensity] = None
    duration: Optional[int] = None
    frequency_in_period: Optional[int] = None
    staff_present: Optional[List[str]] = None
    peers_present: Optional[int] = None
    environment_factors: Optional[List[str]] = None
    physical_state: Optional[str] = None
    intervention_used: Optional[str] = None
    intervention_effective: Optional[bool] = None
    debrief_completed: Optional[bool] = None
    debrief_notes: Optional[str] = None
    parent_notified: Optional[bool] = None
    pattern_id: Optional[str] = None


class BehaviorIncidentResponse(BaseModel):
    """Behavior incident response."""
    id: str
    autism_profile_id: str
    recorded_by_id: Optional[str]
    incident_date: date
    incident_time: time
    location: Optional[str]
    activity: Optional[str]
    subject: Optional[str]
    antecedent: str
    behavior: str
    consequence: str
    hypothesized_function: BehaviorFunction
    intensity: BehaviorIntensity
    duration: Optional[int]
    frequency_in_period: Optional[int]
    staff_present: List[str]
    peers_present: Optional[int]
    environment_factors: List[str]
    physical_state: Optional[str]
    intervention_used: Optional[str]
    intervention_effective: Optional[bool]
    debrief_completed: bool
    debrief_notes: Optional[str]
    parent_notified: bool
    parent_notified_at: Optional[datetime]
    pattern_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BehaviorIncidentListResponse(BaseModel):
    """List of behavior incidents with summary."""
    incidents: List[BehaviorIncidentResponse]
    total: int
    function_breakdown: dict  # { function: count }
    intensity_breakdown: dict  # { intensity: count }


# ==========================================
# BEHAVIOR PATTERN
# ==========================================

class BehaviorPatternCreate(BaseModel):
    """Create a behavior pattern."""
    autism_profile_id: str
    pattern_name: str
    description: str
    primary_function: BehaviorFunction
    secondary_function: Optional[BehaviorFunction] = None
    function_evidence: Optional[str] = None
    common_antecedents: List[str] = []
    common_settings: List[str] = []
    common_times: List[str] = []
    trigger_themes: List[str] = []
    topography_description: Optional[str] = None
    average_intensity: Optional[BehaviorIntensity] = None
    average_duration: Optional[int] = None
    average_frequency: Optional[float] = None
    prevention_strategies: List[str] = []
    replacement_behaviors: List[str] = []
    teaching_strategies: List[str] = []
    consequence_strategies: List[str] = []
    crisis_strategies: List[str] = []
    incident_count_before: Optional[int] = None
    intervention_start_date: Optional[datetime] = None


class BehaviorPatternUpdate(BaseModel):
    """Update a behavior pattern."""
    pattern_name: Optional[str] = None
    description: Optional[str] = None
    primary_function: Optional[BehaviorFunction] = None
    secondary_function: Optional[BehaviorFunction] = None
    function_evidence: Optional[str] = None
    common_antecedents: Optional[List[str]] = None
    common_settings: Optional[List[str]] = None
    common_times: Optional[List[str]] = None
    trigger_themes: Optional[List[str]] = None
    topography_description: Optional[str] = None
    average_intensity: Optional[BehaviorIntensity] = None
    average_duration: Optional[int] = None
    average_frequency: Optional[float] = None
    prevention_strategies: Optional[List[str]] = None
    replacement_behaviors: Optional[List[str]] = None
    teaching_strategies: Optional[List[str]] = None
    consequence_strategies: Optional[List[str]] = None
    crisis_strategies: Optional[List[str]] = None
    incident_count_before: Optional[int] = None
    incident_count_after: Optional[int] = None
    percent_reduction: Optional[float] = None
    intervention_start_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class BehaviorPatternResponse(BaseModel):
    """Behavior pattern response."""
    id: str
    autism_profile_id: str
    pattern_name: str
    description: str
    identified_date: datetime
    primary_function: BehaviorFunction
    secondary_function: Optional[BehaviorFunction]
    function_evidence: Optional[str]
    common_antecedents: List[str]
    common_settings: List[str]
    common_times: List[str]
    trigger_themes: List[str]
    topography_description: Optional[str]
    average_intensity: Optional[BehaviorIntensity]
    average_duration: Optional[int]
    average_frequency: Optional[float]
    prevention_strategies: List[str]
    replacement_behaviors: List[str]
    teaching_strategies: List[str]
    consequence_strategies: List[str]
    crisis_strategies: List[str]
    incident_count_before: Optional[int]
    incident_count_after: Optional[int]
    percent_reduction: Optional[float]
    last_review_date: Optional[datetime]
    is_active: bool
    intervention_start_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BehaviorFunctionAnalysisRequest(BaseModel):
    """Request behavior function analysis."""
    autism_profile_id: str
    incident_ids: List[str]
    time_period_days: int = 30


class BehaviorFunctionAnalysisResponse(BaseModel):
    """Behavior function analysis response."""
    total_incidents: int
    function_breakdown: dict
    most_likely_function: BehaviorFunction
    confidence: float
    common_antecedents: List[dict]  # [{ antecedent, count, percentage }]
    common_settings: List[dict]
    common_times: List[dict]
    recommendations: List[str]
    suggested_pattern: Optional[BehaviorPatternCreate] = None


# ==========================================
# TOKEN BOARD
# ==========================================

class TokenHistoryEntry(BaseModel):
    """A token history entry."""
    earned_at: datetime
    criterion: str
    awarded_by: Optional[str] = None
    notes: Optional[str] = None


class TokenBoardCreate(BaseModel):
    """Create a token board."""
    autism_profile_id: str
    name: str
    description: Optional[str] = None
    token_image_url: Optional[str] = None
    empty_token_url: Optional[str] = None
    reward_image_url: Optional[str] = None
    total_tokens_needed: int = 5
    token_shape: str = "star"
    reward_name: str
    reward_description: Optional[str] = None
    is_reward_activity: bool = False
    earning_criteria: List[str] = []
    token_value: int = 1
    reset_frequency: str = "session"  # "session", "daily", "weekly", "manual"


class TokenBoardUpdate(BaseModel):
    """Update a token board."""
    name: Optional[str] = None
    description: Optional[str] = None
    token_image_url: Optional[str] = None
    empty_token_url: Optional[str] = None
    reward_image_url: Optional[str] = None
    total_tokens_needed: Optional[int] = None
    token_shape: Optional[str] = None
    reward_name: Optional[str] = None
    reward_description: Optional[str] = None
    is_reward_activity: Optional[bool] = None
    earning_criteria: Optional[List[str]] = None
    token_value: Optional[int] = None
    reset_frequency: Optional[str] = None
    is_active: Optional[bool] = None


class TokenBoardResponse(BaseModel):
    """Token board response."""
    id: str
    autism_profile_id: str
    name: str
    description: Optional[str]
    token_image_url: Optional[str]
    empty_token_url: Optional[str]
    reward_image_url: Optional[str]
    total_tokens_needed: int
    current_tokens: int
    token_shape: str
    reward_name: str
    reward_description: Optional[str]
    is_reward_activity: bool
    earning_criteria: List[str]
    token_value: int
    reset_frequency: str
    last_reset_at: Optional[datetime]
    token_history: Optional[List[dict]]
    times_completed: int
    total_tokens_earned: int
    average_to_completion: Optional[float]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AwardTokenRequest(BaseModel):
    """Award a token."""
    criterion: str
    awarded_by: Optional[str] = None
    notes: Optional[str] = None
    token_count: int = 1


class ResetTokenBoardRequest(BaseModel):
    """Reset a token board."""
    reason: Optional[str] = None
    award_reward: bool = False


# ==========================================
# TRANSITION SUPPORT
# ==========================================

class TransitionStep(BaseModel):
    """A step in a transition routine."""
    order: int
    step: str
    image_url: Optional[str] = None
    duration: Optional[int] = None  # seconds


class TransitionSupportCreate(BaseModel):
    """Create a transition support."""
    autism_profile_id: str
    name: str
    from_activity: str
    to_activity: str
    transition_type: str = "activity"  # "activity", "location", "person", "schedule_change"
    difficulty: TransitionDifficulty = TransitionDifficulty.MODERATE
    specific_challenges: List[str] = []
    warning_time_minutes: int = 5
    warning_type: str = "verbal"  # "verbal", "visual", "timer", "song", "combination"
    uses_visual_timer: bool = True
    uses_first_then: bool = False
    uses_social_story: bool = False
    uses_countdown: bool = True
    linked_visual_support_id: Optional[str] = None
    linked_social_story_id: Optional[str] = None
    transition_steps: List[TransitionStep] = []
    sensory_supports_before: List[str] = []
    sensory_supports_after: List[str] = []
    uses_reinforcement: bool = False
    reinforcement_type: Optional[str] = None


class TransitionSupportUpdate(BaseModel):
    """Update a transition support."""
    name: Optional[str] = None
    from_activity: Optional[str] = None
    to_activity: Optional[str] = None
    transition_type: Optional[str] = None
    difficulty: Optional[TransitionDifficulty] = None
    specific_challenges: Optional[List[str]] = None
    warning_time_minutes: Optional[int] = None
    warning_type: Optional[str] = None
    uses_visual_timer: Optional[bool] = None
    uses_first_then: Optional[bool] = None
    uses_social_story: Optional[bool] = None
    uses_countdown: Optional[bool] = None
    linked_visual_support_id: Optional[str] = None
    linked_social_story_id: Optional[str] = None
    transition_steps: Optional[List[TransitionStep]] = None
    sensory_supports_before: Optional[List[str]] = None
    sensory_supports_after: Optional[List[str]] = None
    uses_reinforcement: Optional[bool] = None
    reinforcement_type: Optional[str] = None
    is_active: Optional[bool] = None


class TransitionSupportResponse(BaseModel):
    """Transition support response."""
    id: str
    autism_profile_id: str
    name: str
    from_activity: str
    to_activity: str
    transition_type: str
    difficulty: TransitionDifficulty
    specific_challenges: List[str]
    warning_time_minutes: int
    warning_type: str
    uses_visual_timer: bool
    uses_first_then: bool
    uses_social_story: bool
    uses_countdown: bool
    linked_visual_support_id: Optional[str]
    linked_social_story_id: Optional[str]
    transition_steps: Optional[List[dict]]
    sensory_supports_before: List[str]
    sensory_supports_after: List[str]
    uses_reinforcement: bool
    reinforcement_type: Optional[str]
    success_rate: Optional[float]
    total_attempts: int
    successful_attempts: int
    average_duration: Optional[int]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RecordTransitionAttempt(BaseModel):
    """Record a transition attempt."""
    was_successful: bool
    duration_seconds: Optional[int] = None
    supports_used: List[str] = []
    challenges_encountered: List[str] = []
    notes: Optional[str] = None


# ==========================================
# DASHBOARD AND SUMMARY
# ==========================================

class AutismDashboardResponse(BaseModel):
    """Dashboard overview for autism support."""
    profile: AutismProfileResponse
    communication_profile: Optional[CommunicationProfileResponse]
    active_visual_supports_count: int
    active_schedules_count: int
    active_social_stories_count: int
    recent_incidents_count: int
    active_patterns_count: int
    active_token_boards: List[TokenBoardResponse]
    upcoming_transitions: List[TransitionSupportResponse]
    recent_behavior_summary: dict
    effectiveness_trends: dict
