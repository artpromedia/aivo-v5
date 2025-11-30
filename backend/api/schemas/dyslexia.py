"""
Dyslexia Intervention System - Pydantic Schemas
Structured literacy instruction based on Orton-Gillingham principles
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ==========================================
# ENUMS
# ==========================================

class DyslexiaSeverity(str, Enum):
    MILD = "MILD"
    MODERATE = "MODERATE"
    SEVERE = "SEVERE"
    PROFOUND = "PROFOUND"


class DyslexiaSubtype(str, Enum):
    PHONOLOGICAL = "PHONOLOGICAL"
    SURFACE = "SURFACE"
    MIXED = "MIXED"
    RAPID_NAMING = "RAPID_NAMING"
    DOUBLE_DEFICIT = "DOUBLE_DEFICIT"


class PhonologicalSkillType(str, Enum):
    RHYME_RECOGNITION = "RHYME_RECOGNITION"
    RHYME_PRODUCTION = "RHYME_PRODUCTION"
    SYLLABLE_SEGMENTATION = "SYLLABLE_SEGMENTATION"
    SYLLABLE_BLENDING = "SYLLABLE_BLENDING"
    ONSET_RIME = "ONSET_RIME"
    PHONEME_ISOLATION = "PHONEME_ISOLATION"
    PHONEME_BLENDING = "PHONEME_BLENDING"
    PHONEME_SEGMENTATION = "PHONEME_SEGMENTATION"
    PHONEME_MANIPULATION = "PHONEME_MANIPULATION"
    PHONEME_DELETION = "PHONEME_DELETION"


class PhonicsMasteryLevel(str, Enum):
    NOT_INTRODUCED = "NOT_INTRODUCED"
    EMERGING = "EMERGING"
    DEVELOPING = "DEVELOPING"
    PROFICIENT = "PROFICIENT"
    MASTERED = "MASTERED"
    AUTOMATICITY = "AUTOMATICITY"


class PhonicsCategory(str, Enum):
    SINGLE_CONSONANTS = "SINGLE_CONSONANTS"
    SHORT_VOWELS = "SHORT_VOWELS"
    CONSONANT_DIGRAPHS = "CONSONANT_DIGRAPHS"
    CONSONANT_BLENDS = "CONSONANT_BLENDS"
    LONG_VOWELS_CVCe = "LONG_VOWELS_CVCe"
    VOWEL_TEAMS = "VOWEL_TEAMS"
    R_CONTROLLED_VOWELS = "R_CONTROLLED_VOWELS"
    DIPHTHONGS = "DIPHTHONGS"
    COMPLEX_CONSONANTS = "COMPLEX_CONSONANTS"
    ADVANCED_VOWELS = "ADVANCED_VOWELS"
    MULTISYLLABIC = "MULTISYLLABIC"
    MORPHOLOGY = "MORPHOLOGY"


class SightWordListType(str, Enum):
    DOLCH_PRE_PRIMER = "DOLCH_PRE_PRIMER"
    DOLCH_PRIMER = "DOLCH_PRIMER"
    DOLCH_FIRST = "DOLCH_FIRST"
    DOLCH_SECOND = "DOLCH_SECOND"
    DOLCH_THIRD = "DOLCH_THIRD"
    FRY_FIRST_100 = "FRY_FIRST_100"
    FRY_SECOND_100 = "FRY_SECOND_100"
    FRY_THIRD_100 = "FRY_THIRD_100"
    FRY_FOURTH_100 = "FRY_FOURTH_100"
    FRY_FIFTH_100 = "FRY_FIFTH_100"
    HIGH_FREQUENCY_CUSTOM = "HIGH_FREQUENCY_CUSTOM"


class ComprehensionSkillType(str, Enum):
    MAIN_IDEA = "MAIN_IDEA"
    SUPPORTING_DETAILS = "SUPPORTING_DETAILS"
    SEQUENCING = "SEQUENCING"
    CAUSE_EFFECT = "CAUSE_EFFECT"
    COMPARE_CONTRAST = "COMPARE_CONTRAST"
    INFERENCE = "INFERENCE"
    PREDICTION = "PREDICTION"
    SUMMARIZATION = "SUMMARIZATION"
    VOCABULARY_CONTEXT = "VOCABULARY_CONTEXT"
    AUTHORS_PURPOSE = "AUTHORS_PURPOSE"


class DyslexiaLessonType(str, Enum):
    PHONOLOGICAL_AWARENESS = "PHONOLOGICAL_AWARENESS"
    PHONICS_DECODING = "PHONICS_DECODING"
    FLUENCY = "FLUENCY"
    VOCABULARY = "VOCABULARY"
    COMPREHENSION = "COMPREHENSION"
    SPELLING = "SPELLING"
    WRITING = "WRITING"
    MULTISENSORY_REVIEW = "MULTISENSORY_REVIEW"


class SensoryModality(str, Enum):
    VISUAL = "VISUAL"
    AUDITORY = "AUDITORY"
    KINESTHETIC = "KINESTHETIC"
    TACTILE = "TACTILE"
    VISUAL_AUDITORY = "VISUAL_AUDITORY"
    VISUAL_KINESTHETIC = "VISUAL_KINESTHETIC"
    AUDITORY_KINESTHETIC = "AUDITORY_KINESTHETIC"
    MULTISENSORY_VAKT = "MULTISENSORY_VAKT"


# ==========================================
# DYSLEXIA PROFILE SCHEMAS
# ==========================================

class DyslexiaProfileBase(BaseModel):
    severity: DyslexiaSeverity = DyslexiaSeverity.MODERATE
    subtypes: List[DyslexiaSubtype] = []
    diagnosis_date: Optional[datetime] = None
    diagnosing_professional: Optional[str] = None
    diagnosis_notes: Optional[str] = None
    current_reading_level: Optional[str] = None
    grade_equivalent: Optional[float] = None
    lexile_level: Optional[int] = None
    target_reading_level: Optional[str] = None
    intervention_program: str = "Orton-Gillingham"
    current_phonics_level: int = 1
    sessions_per_week: int = 3
    session_duration_minutes: int = 45
    preferred_modalities: List[SensoryModality] = []
    accommodations: Optional[Dict[str, Any]] = None
    assistive_technology: List[str] = []


class DyslexiaProfileCreate(DyslexiaProfileBase):
    learner_id: str


class DyslexiaProfileUpdate(BaseModel):
    severity: Optional[DyslexiaSeverity] = None
    subtypes: Optional[List[DyslexiaSubtype]] = None
    diagnosis_date: Optional[datetime] = None
    diagnosing_professional: Optional[str] = None
    diagnosis_notes: Optional[str] = None
    current_reading_level: Optional[str] = None
    grade_equivalent: Optional[float] = None
    lexile_level: Optional[int] = None
    target_reading_level: Optional[str] = None
    intervention_program: Optional[str] = None
    current_phonics_level: Optional[int] = None
    sessions_per_week: Optional[int] = None
    session_duration_minutes: Optional[int] = None
    preferred_modalities: Optional[List[SensoryModality]] = None
    accommodations: Optional[Dict[str, Any]] = None
    assistive_technology: Optional[List[str]] = None
    last_assessment_date: Optional[datetime] = None
    next_assessment_date: Optional[datetime] = None
    overall_progress: Optional[float] = None
    is_active: Optional[bool] = None


class DyslexiaProfileResponse(DyslexiaProfileBase):
    id: str
    learner_id: str
    last_assessment_date: Optional[datetime] = None
    next_assessment_date: Optional[datetime] = None
    overall_progress: float = 0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# PHONOLOGICAL AWARENESS SCHEMAS
# ==========================================

class PhonologicalSkillBase(BaseModel):
    skill_type: PhonologicalSkillType
    mastery_level: PhonicsMasteryLevel = PhonicsMasteryLevel.NOT_INTRODUCED
    accuracy_percent: float = 0
    assessment_notes: Optional[str] = None
    target_mastery: PhonicsMasteryLevel = PhonicsMasteryLevel.MASTERED
    target_date: Optional[datetime] = None


class PhonologicalSkillCreate(PhonologicalSkillBase):
    learner_id: str


class PhonologicalSkillUpdate(BaseModel):
    mastery_level: Optional[PhonicsMasteryLevel] = None
    accuracy_percent: Optional[float] = None
    last_assessed_at: Optional[datetime] = None
    assessment_notes: Optional[str] = None
    total_attempts: Optional[int] = None
    correct_attempts: Optional[int] = None
    practice_minutes: Optional[int] = None
    target_mastery: Optional[PhonicsMasteryLevel] = None
    target_date: Optional[datetime] = None


class PhonologicalSkillResponse(PhonologicalSkillBase):
    id: str
    learner_id: str
    last_assessed_at: Optional[datetime] = None
    total_attempts: int = 0
    correct_attempts: int = 0
    practice_minutes: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# PHONICS SKILL SCHEMAS
# ==========================================

class PhonicsSkillBase(BaseModel):
    category: PhonicsCategory
    level: int = 1
    pattern: str
    pattern_name: str
    example_words: List[str] = []
    mastery_level: PhonicsMasteryLevel = PhonicsMasteryLevel.NOT_INTRODUCED
    og_sequence_number: Optional[int] = None
    prerequisite_ids: List[str] = []


class PhonicsSkillCreate(PhonicsSkillBase):
    learner_id: str


class PhonicsSkillUpdate(BaseModel):
    mastery_level: Optional[PhonicsMasteryLevel] = None
    introduced_at: Optional[datetime] = None
    mastered_at: Optional[datetime] = None
    reading_accuracy: Optional[float] = None
    spelling_accuracy: Optional[float] = None
    total_exposures: Optional[int] = None
    correct_readings: Optional[int] = None
    correct_spellings: Optional[int] = None


class PhonicsSkillResponse(PhonicsSkillBase):
    id: str
    learner_id: str
    introduced_at: Optional[datetime] = None
    mastered_at: Optional[datetime] = None
    reading_accuracy: float = 0
    spelling_accuracy: float = 0
    total_exposures: int = 0
    correct_readings: int = 0
    correct_spellings: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# DECODING SESSION SCHEMAS
# ==========================================

class WordAttempt(BaseModel):
    word: str
    correct: bool
    errors: List[str] = []
    time_ms: Optional[int] = None


class DecodingSessionBase(BaseModel):
    duration_minutes: int
    word_list_type: str
    words_attempted: List[WordAttempt]
    total_words: int
    correct_words: int
    accuracy: float
    error_types: Optional[Dict[str, int]] = None
    common_patterns: List[str] = []
    words_per_minute: Optional[float] = None
    self_corrections: int = 0
    teacher_notes: Optional[str] = None
    focus_for_next: List[str] = []


class DecodingSessionCreate(DecodingSessionBase):
    learner_id: str
    session_date: Optional[datetime] = None


class DecodingSessionResponse(DecodingSessionBase):
    id: str
    learner_id: str
    session_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# SIGHT WORD PROGRESS SCHEMAS
# ==========================================

class SightWordProgressBase(BaseModel):
    total_words_learned: int = 0
    total_words_automatic: int = 0
    dolch_progress: Optional[Dict[str, Any]] = None
    fry_progress: Optional[Dict[str, Any]] = None
    custom_words: Optional[Dict[str, Any]] = None
    current_list: SightWordListType = SightWordListType.DOLCH_PRE_PRIMER
    current_focus_words: List[str] = []


class SightWordProgressCreate(SightWordProgressBase):
    learner_id: str


class SightWordProgressUpdate(BaseModel):
    total_words_learned: Optional[int] = None
    total_words_automatic: Optional[int] = None
    dolch_progress: Optional[Dict[str, Any]] = None
    fry_progress: Optional[Dict[str, Any]] = None
    custom_words: Optional[Dict[str, Any]] = None
    current_list: Optional[SightWordListType] = None
    current_focus_words: Optional[List[str]] = None
    total_practice_minutes: Optional[int] = None
    last_practice_date: Optional[datetime] = None
    streak: Optional[int] = None


class SightWordProgressResponse(SightWordProgressBase):
    id: str
    learner_id: str
    total_practice_minutes: int = 0
    last_practice_date: Optional[datetime] = None
    streak: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# FLUENCY ASSESSMENT SCHEMAS
# ==========================================

class FluencyAssessmentBase(BaseModel):
    passage_title: str
    passage_level: str
    passage_word_count: int
    words_correct_per_minute: float
    total_words_read: int
    errors_count: int
    accuracy: float
    reading_time_seconds: int
    expression_score: Optional[int] = Field(None, ge=1, le=4)
    phrasing_score: Optional[int] = Field(None, ge=1, le=4)
    smoothness_score: Optional[int] = Field(None, ge=1, le=4)
    pace_score: Optional[int] = Field(None, ge=1, le=4)
    prosody_total: Optional[int] = None
    comprehension_questions: Optional[int] = None
    comprehension_correct: Optional[int] = None
    comprehension_percent: Optional[float] = None
    substitutions: int = 0
    omissions: int = 0
    insertions: int = 0
    self_corrections: int = 0
    teacher_notes: Optional[str] = None
    areas_for_improvement: List[str] = []


class FluencyAssessmentCreate(FluencyAssessmentBase):
    learner_id: str
    assessment_date: Optional[datetime] = None


class FluencyAssessmentResponse(FluencyAssessmentBase):
    id: str
    learner_id: str
    assessment_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# COMPREHENSION SKILL SCHEMAS
# ==========================================

class ComprehensionSkillBase(BaseModel):
    skill_type: ComprehensionSkillType
    mastery_level: PhonicsMasteryLevel = PhonicsMasteryLevel.NOT_INTRODUCED
    accuracy_percent: float = 0
    strategies_introduced: List[str] = []
    preferred_strategies: List[str] = []
    target_mastery: PhonicsMasteryLevel = PhonicsMasteryLevel.MASTERED
    target_date: Optional[datetime] = None
    notes: Optional[str] = None


class ComprehensionSkillCreate(ComprehensionSkillBase):
    learner_id: str


class ComprehensionSkillUpdate(BaseModel):
    mastery_level: Optional[PhonicsMasteryLevel] = None
    accuracy_percent: Optional[float] = None
    total_assessments: Optional[int] = None
    correct_responses: Optional[int] = None
    last_assessed_at: Optional[datetime] = None
    strategies_introduced: Optional[List[str]] = None
    preferred_strategies: Optional[List[str]] = None
    target_mastery: Optional[PhonicsMasteryLevel] = None
    target_date: Optional[datetime] = None
    notes: Optional[str] = None


class ComprehensionSkillResponse(ComprehensionSkillBase):
    id: str
    learner_id: str
    total_assessments: int = 0
    correct_responses: int = 0
    last_assessed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# SPELLING PATTERN SCHEMAS
# ==========================================

class SpellingPatternBase(BaseModel):
    pattern: str
    category: PhonicsCategory
    rule: Optional[str] = None
    example_words: List[str] = []
    exception_words: List[str] = []
    mastery_level: PhonicsMasteryLevel = PhonicsMasteryLevel.NOT_INTRODUCED


class SpellingPatternCreate(SpellingPatternBase):
    learner_id: str


class SpellingPatternUpdate(BaseModel):
    mastery_level: Optional[PhonicsMasteryLevel] = None
    introduced_at: Optional[datetime] = None
    mastered_at: Optional[datetime] = None
    total_attempts: Optional[int] = None
    correct_attempts: Optional[int] = None
    accuracy: Optional[float] = None
    frequent_errors: Optional[Dict[str, int]] = None


class SpellingPatternResponse(SpellingPatternBase):
    id: str
    learner_id: str
    introduced_at: Optional[datetime] = None
    mastered_at: Optional[datetime] = None
    total_attempts: int = 0
    correct_attempts: int = 0
    accuracy: float = 0
    frequent_errors: Optional[Dict[str, int]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# DYSLEXIA LESSON SCHEMAS
# ==========================================

class DyslexiaLessonBase(BaseModel):
    lesson_type: DyslexiaLessonType
    duration_minutes: int
    title: str
    objectives: List[str] = []
    materials_used: List[str] = []
    review_component: Optional[Dict[str, Any]] = None
    new_teaching_component: Optional[Dict[str, Any]] = None
    practice_component: Optional[Dict[str, Any]] = None
    phonics_focus: List[str] = []
    sight_words_focus: List[str] = []
    student_response: Optional[str] = None
    mastery_demonstrated: bool = False
    accuracy_percent: Optional[float] = None
    next_steps: List[str] = []
    home_practice: List[str] = []
    teacher_notes: Optional[str] = None
    parent_communication: Optional[str] = None


class DyslexiaLessonCreate(DyslexiaLessonBase):
    learner_id: str
    lesson_date: Optional[datetime] = None


class DyslexiaLessonResponse(DyslexiaLessonBase):
    id: str
    learner_id: str
    lesson_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# MULTISENSORY ACTIVITY SCHEMAS
# ==========================================

class MultisensoryActivityBase(BaseModel):
    name: str
    description: str
    category: Optional[PhonicsCategory] = None
    target_skills: List[str] = []
    primary_modality: SensoryModality
    modalities: List[SensoryModality] = []
    instructions: str
    materials: List[str] = []
    setup_time_minutes: int = 5
    activity_minutes: int = 10
    difficulty_level: int = Field(1, ge=1, le=5)
    grade_range: List[str] = []
    phonics_levels: List[int] = []
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    printable_url: Optional[str] = None
    variations: Optional[List[Dict[str, Any]]] = None
    adaptations: Optional[Dict[str, Any]] = None


class MultisensoryActivityCreate(MultisensoryActivityBase):
    learner_id: Optional[str] = None


class MultisensoryActivityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[PhonicsCategory] = None
    target_skills: Optional[List[str]] = None
    primary_modality: Optional[SensoryModality] = None
    modalities: Optional[List[SensoryModality]] = None
    instructions: Optional[str] = None
    materials: Optional[List[str]] = None
    setup_time_minutes: Optional[int] = None
    activity_minutes: Optional[int] = None
    difficulty_level: Optional[int] = None
    grade_range: Optional[List[str]] = None
    phonics_levels: Optional[List[int]] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    printable_url: Optional[str] = None
    variations: Optional[List[Dict[str, Any]]] = None
    adaptations: Optional[Dict[str, Any]] = None
    usage_count: Optional[int] = None
    avg_rating: Optional[float] = None
    is_active: Optional[bool] = None


class MultisensoryActivityResponse(MultisensoryActivityBase):
    id: str
    learner_id: Optional[str] = None
    usage_count: int = 0
    avg_rating: Optional[float] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# PARENT DYSLEXIA SUPPORT SCHEMAS
# ==========================================

class ParentDyslexiaSupportBase(BaseModel):
    practice_type: str
    duration_minutes: int
    activities_completed: List[str] = []
    words_reviewed: List[str] = []
    patterns_focused: List[str] = []
    engagement_level: Optional[int] = Field(None, ge=1, le=5)
    frustration_level: Optional[int] = Field(None, ge=1, le=5)
    success_level: Optional[int] = Field(None, ge=1, le=5)
    what_worked_well: Optional[str] = None
    challenges: Optional[str] = None
    questions_for_teacher: Optional[str] = None
    materials_used: List[str] = []
    games_played: List[str] = []
    best_time_of_day: Optional[str] = None
    best_location: Optional[str] = None
    distractions_noted: List[str] = []


class ParentDyslexiaSupportCreate(ParentDyslexiaSupportBase):
    learner_id: str
    practice_date: Optional[datetime] = None


class ParentDyslexiaSupportResponse(ParentDyslexiaSupportBase):
    id: str
    learner_id: str
    practice_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# ORTON-GILLINGHAM SCOPE & SEQUENCE
# ==========================================

class OGPhonicsLevel(BaseModel):
    """Orton-Gillingham phonics progression level"""
    level: int
    name: str
    patterns: List[str]
    example_words: List[str]
    skills: List[str]
    prerequisites: List[int] = []


# Complete OG Scope & Sequence
OG_SCOPE_AND_SEQUENCE: List[OGPhonicsLevel] = [
    OGPhonicsLevel(
        level=1,
        name="Single Consonants & Short Vowels",
        patterns=["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w", "x", "y", "z", "a", "e", "i", "o", "u"],
        example_words=["cat", "bed", "pig", "dog", "sun"],
        skills=["Letter-sound correspondence", "CVC blending", "Segmenting"]
    ),
    OGPhonicsLevel(
        level=2,
        name="Consonant Digraphs",
        patterns=["sh", "ch", "th", "wh", "ck", "ng"],
        example_words=["ship", "chin", "thin", "when", "duck", "ring"],
        skills=["Digraph recognition", "Digraph blending"],
        prerequisites=[1]
    ),
    OGPhonicsLevel(
        level=3,
        name="Consonant Blends",
        patterns=["bl", "cl", "fl", "gl", "pl", "sl", "br", "cr", "dr", "fr", "gr", "pr", "tr", "sc", "sk", "sm", "sn", "sp", "st", "sw"],
        example_words=["black", "crab", "stop", "swim"],
        skills=["Blend recognition", "CCVC and CVCC patterns"],
        prerequisites=[1]
    ),
    OGPhonicsLevel(
        level=4,
        name="Long Vowels - Silent E (CVCe)",
        patterns=["a_e", "i_e", "o_e", "u_e", "e_e"],
        example_words=["cake", "bike", "home", "cute", "Pete"],
        skills=["Magic e rule", "Vowel comparison"],
        prerequisites=[1, 2]
    ),
    OGPhonicsLevel(
        level=5,
        name="Vowel Teams - Part 1",
        patterns=["ai", "ay", "ee", "ea", "oa", "ow"],
        example_words=["rain", "play", "tree", "read", "boat", "snow"],
        skills=["Two vowels together", "Position rules"],
        prerequisites=[4]
    ),
    OGPhonicsLevel(
        level=6,
        name="Vowel Teams - Part 2",
        patterns=["oo", "ou", "oi", "oy", "au", "aw"],
        example_words=["moon", "book", "cloud", "coin", "boy", "saw"],
        skills=["Diphthongs", "Variant vowels"],
        prerequisites=[5]
    ),
    OGPhonicsLevel(
        level=7,
        name="R-Controlled Vowels",
        patterns=["ar", "or", "er", "ir", "ur"],
        example_words=["car", "horn", "her", "bird", "fur"],
        skills=["Bossy R patterns"],
        prerequisites=[4]
    ),
    OGPhonicsLevel(
        level=8,
        name="Complex Consonants",
        patterns=["ph", "gh", "kn", "wr", "gn", "mb", "-dge", "-tch"],
        example_words=["phone", "knight", "write", "gnome", "lamb", "bridge", "catch"],
        skills=["Silent letters", "Less common spellings"],
        prerequisites=[2, 3]
    ),
    OGPhonicsLevel(
        level=9,
        name="Advanced Vowel Patterns",
        patterns=["igh", "eigh", "ie", "ei", "ey", "ew", "ue"],
        example_words=["night", "weigh", "field", "receive", "key", "flew", "blue"],
        skills=["Multiple spellings for same sound"],
        prerequisites=[5, 6]
    ),
    OGPhonicsLevel(
        level=10,
        name="Multisyllabic Words - Closed & Open",
        patterns=["VC/CV", "V/CV", "VC/V"],
        example_words=["rabbit", "open", "cabin", "robot"],
        skills=["Syllable division", "Syllable types"],
        prerequisites=[1, 4]
    ),
    OGPhonicsLevel(
        level=11,
        name="Multisyllabic Words - Advanced",
        patterns=["Consonant-le", "V/V", "Stable final syllables"],
        example_words=["table", "create", "-tion", "-sion", "-ture"],
        skills=["Complex syllable patterns"],
        prerequisites=[10]
    ),
    OGPhonicsLevel(
        level=12,
        name="Morphology",
        patterns=["Prefixes", "Suffixes", "Roots", "Compound words"],
        example_words=["unhappy", "reading", "transport", "sunshine"],
        skills=["Word parts", "Meaning connections"],
        prerequisites=[10, 11]
    )
]


# ==========================================
# DASHBOARD & ANALYTICS SCHEMAS
# ==========================================

class DyslexiaProgressSummary(BaseModel):
    """Summary of learner's dyslexia intervention progress"""
    learner_id: str
    profile: Optional[DyslexiaProfileResponse] = None
    
    # Phonological Awareness
    phonological_skills_count: int = 0
    phonological_mastered_count: int = 0
    phonological_avg_accuracy: float = 0
    
    # Phonics
    phonics_skills_count: int = 0
    phonics_mastered_count: int = 0
    current_phonics_level: int = 1
    phonics_avg_reading_accuracy: float = 0
    phonics_avg_spelling_accuracy: float = 0
    
    # Sight Words
    sight_words_learned: int = 0
    sight_words_automatic: int = 0
    current_sight_word_list: Optional[str] = None
    
    # Fluency
    latest_wcpm: Optional[float] = None
    fluency_trend: Optional[str] = None  # "improving", "stable", "declining"
    latest_prosody_score: Optional[int] = None
    
    # Comprehension
    comprehension_skills_mastered: int = 0
    comprehension_avg_accuracy: float = 0
    
    # Recent Activity
    total_lessons: int = 0
    lessons_this_week: int = 0
    total_practice_minutes: int = 0
    last_session_date: Optional[datetime] = None


class DyslexiaDashboardData(BaseModel):
    """Complete dashboard data for dyslexia intervention"""
    summary: DyslexiaProgressSummary
    recent_lessons: List[DyslexiaLessonResponse] = []
    recent_decoding_sessions: List[DecodingSessionResponse] = []
    recent_fluency_assessments: List[FluencyAssessmentResponse] = []
    phonics_progression: List[PhonicsSkillResponse] = []
    recommended_activities: List[MultisensoryActivityResponse] = []
    og_scope_sequence: List[OGPhonicsLevel] = OG_SCOPE_AND_SEQUENCE
