"""
Speech-Language Pathology (SLP) Pydantic Schemas
Therapy management, trial data collection, and IEP progress tracking
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

class SLPDiagnosis(str, Enum):
    ARTICULATION = "ARTICULATION"
    FLUENCY = "FLUENCY"
    RECEPTIVE_LANGUAGE = "RECEPTIVE_LANGUAGE"
    EXPRESSIVE_LANGUAGE = "EXPRESSIVE_LANGUAGE"
    PRAGMATIC_LANGUAGE = "PRAGMATIC_LANGUAGE"
    VOICE = "VOICE"
    APRAXIA = "APRAXIA"
    DYSARTHRIA = "DYSARTHRIA"


class SLPSeverity(str, Enum):
    MILD = "MILD"
    MODERATE = "MODERATE"
    SEVERE = "SEVERE"
    PROFOUND = "PROFOUND"


class PhonemePosition(str, Enum):
    INITIAL = "INITIAL"
    MEDIAL = "MEDIAL"
    FINAL = "FINAL"
    BLENDS = "BLENDS"
    ALL_POSITIONS = "ALL_POSITIONS"


class ArticulationLevel(str, Enum):
    ISOLATION = "ISOLATION"
    SYLLABLE = "SYLLABLE"
    WORD = "WORD"
    PHRASE = "PHRASE"
    SENTENCE = "SENTENCE"
    CONVERSATION = "CONVERSATION"
    GENERALIZATION = "GENERALIZATION"


class ArticulationErrorType(str, Enum):
    SUBSTITUTION = "SUBSTITUTION"
    OMISSION = "OMISSION"
    DISTORTION = "DISTORTION"
    ADDITION = "ADDITION"


class PromptLevelSLP(str, Enum):
    NONE = "NONE"
    VISUAL = "VISUAL"
    VERBAL = "VERBAL"
    MODEL = "MODEL"
    TACTILE = "TACTILE"


class StutteringType(str, Enum):
    REPETITION = "REPETITION"
    PROLONGATION = "PROLONGATION"
    BLOCK = "BLOCK"
    INTERJECTION = "INTERJECTION"


class SecondaryBehavior(str, Enum):
    EYE_BLINK = "EYE_BLINK"
    HEAD_NOD = "HEAD_NOD"
    FILLER_WORDS = "FILLER_WORDS"
    JAW_TENSION = "JAW_TENSION"
    FACIAL_GRIMACE = "FACIAL_GRIMACE"
    BODY_MOVEMENT = "BODY_MOVEMENT"


class FluencyTaskType(str, Enum):
    READING = "READING"
    MONOLOGUE = "MONOLOGUE"
    CONVERSATION = "CONVERSATION"
    STRUCTURED = "STRUCTURED"
    SPONTANEOUS = "SPONTANEOUS"


class PragmaticSkillType(str, Enum):
    TURN_TAKING = "TURN_TAKING"
    TOPIC_MAINTENANCE = "TOPIC_MAINTENANCE"
    INITIATING = "INITIATING"
    RESPONDING = "RESPONDING"
    CLARIFYING = "CLARIFYING"
    NONVERBAL = "NONVERBAL"
    PERSPECTIVE_TAKING = "PERSPECTIVE_TAKING"
    HUMOR = "HUMOR"
    SARCASM = "SARCASM"
    PERSONAL_SPACE = "PERSONAL_SPACE"
    EYE_CONTACT = "EYE_CONTACT"


class PragmaticSettingType(str, Enum):
    STRUCTURED = "STRUCTURED"
    UNSTRUCTURED = "UNSTRUCTURED"
    PEER = "PEER"
    ADULT = "ADULT"
    GROUP = "GROUP"
    ONE_ON_ONE = "ONE_ON_ONE"


class SkillRating(str, Enum):
    NOT_OBSERVED = "NOT_OBSERVED"
    EMERGING = "EMERGING"
    DEVELOPING = "DEVELOPING"
    PROFICIENT = "PROFICIENT"
    MASTERED = "MASTERED"


class VoicePitch(str, Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"


class VoiceLoudness(str, Enum):
    SOFT = "SOFT"
    NORMAL = "NORMAL"
    LOUD = "LOUD"


class VoiceQuality(str, Enum):
    CLEAR = "CLEAR"
    HOARSE = "HOARSE"
    BREATHY = "BREATHY"
    STRAINED = "STRAINED"
    NASAL = "NASAL"
    HARSH = "HARSH"


class VoiceResonance(str, Enum):
    NORMAL = "NORMAL"
    HYPONASAL = "HYPONASAL"
    HYPERNASAL = "HYPERNASAL"
    MIXED = "MIXED"


class SLPSessionType(str, Enum):
    ARTICULATION = "ARTICULATION"
    FLUENCY = "FLUENCY"
    LANGUAGE = "LANGUAGE"
    PRAGMATIC = "PRAGMATIC"
    VOICE = "VOICE"
    MIXED = "MIXED"
    EVALUATION = "EVALUATION"


class SLPGoalDomain(str, Enum):
    ARTICULATION = "ARTICULATION"
    FLUENCY = "FLUENCY"
    RECEPTIVE_LANGUAGE = "RECEPTIVE_LANGUAGE"
    EXPRESSIVE_LANGUAGE = "EXPRESSIVE_LANGUAGE"
    PRAGMATICS = "PRAGMATICS"
    VOICE = "VOICE"
    ORAL_MOTOR = "ORAL_MOTOR"


class SLPGoalStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ON_HOLD = "ON_HOLD"
    ACHIEVED = "ACHIEVED"
    NOT_ACHIEVED = "NOT_ACHIEVED"
    DISCONTINUED = "DISCONTINUED"


# ==========================================
# SLP PROFILE SCHEMAS
# ==========================================

class SLPProfileBase(BaseModel):
    """Base schema for SLP profile"""
    primaryDiagnosis: SLPDiagnosis
    secondaryDiagnoses: List[SLPDiagnosis] = Field(default=[])
    severity: SLPSeverity
    therapyFrequency: str = Field(..., min_length=1, description="e.g., '2x weekly'")
    sessionDuration: int = Field(..., ge=15, le=120, description="minutes")
    serviceSetting: str = Field(..., min_length=1, description="e.g., 'Pull-out'")
    medicalHistory: Optional[str] = None
    hearingStatus: Optional[str] = None
    oralMotorNotes: Optional[str] = None


class SLPProfileCreate(SLPProfileBase):
    """Schema for creating SLP profile"""
    pass


class SLPProfileUpdate(BaseModel):
    """Schema for updating SLP profile"""
    primaryDiagnosis: Optional[SLPDiagnosis] = None
    secondaryDiagnoses: Optional[List[SLPDiagnosis]] = None
    severity: Optional[SLPSeverity] = None
    therapyFrequency: Optional[str] = None
    sessionDuration: Optional[int] = Field(None, ge=15, le=120)
    serviceSetting: Optional[str] = None
    medicalHistory: Optional[str] = None
    hearingStatus: Optional[str] = None
    oralMotorNotes: Optional[str] = None
    isActive: Optional[bool] = None


class SLPProfileResponse(SLPProfileBase):
    """Schema for SLP profile response"""
    id: str
    learnerId: str
    isActive: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ==========================================
# ARTICULATION TARGET SCHEMAS
# ==========================================

class ArticulationTargetBase(BaseModel):
    """Base schema for articulation target"""
    phoneme: str = Field(..., min_length=1, description="e.g., '/r/', '/s/'")
    position: PhonemePosition
    targetLevel: ArticulationLevel = Field(default=ArticulationLevel.ISOLATION)
    currentAccuracy: float = Field(default=0, ge=0, le=100)
    targetAccuracy: float = Field(default=80, ge=0, le=100)
    practiceWords: List[str] = Field(default=[])


class ArticulationTargetCreate(ArticulationTargetBase):
    """Schema for creating articulation target"""
    pass


class ArticulationTargetUpdate(BaseModel):
    """Schema for updating articulation target"""
    position: Optional[PhonemePosition] = None
    targetLevel: Optional[ArticulationLevel] = None
    currentAccuracy: Optional[float] = Field(None, ge=0, le=100)
    targetAccuracy: Optional[float] = Field(None, ge=0, le=100)
    practiceWords: Optional[List[str]] = None
    isActive: Optional[bool] = None


class ArticulationTargetResponse(ArticulationTargetBase):
    """Schema for articulation target response"""
    id: str
    learnerId: str
    isActive: bool
    masteredAt: Optional[datetime]
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class ArticulationTargetListResponse(BaseModel):
    """List of articulation targets"""
    targets: List[ArticulationTargetResponse]
    total: int
    activeCount: int
    masteredCount: int


# ==========================================
# ARTICULATION TRIAL SCHEMAS
# ==========================================

class ArticulationTrialBase(BaseModel):
    """Base schema for articulation trial"""
    word: str = Field(..., min_length=1)
    position: PhonemePosition
    wasCorrect: bool
    errorType: Optional[ArticulationErrorType] = None
    substitutedSound: Optional[str] = None
    promptLevel: PromptLevelSLP = Field(default=PromptLevelSLP.NONE)
    notes: Optional[str] = None


class ArticulationTrialCreate(ArticulationTrialBase):
    """Schema for creating articulation trial"""
    targetId: str
    sessionId: Optional[str] = None


class ArticulationTrialBatchCreate(BaseModel):
    """Schema for batch creating trials"""
    targetId: str
    sessionId: Optional[str] = None
    trials: List[ArticulationTrialBase]


class ArticulationTrialResponse(ArticulationTrialBase):
    """Schema for articulation trial response"""
    id: str
    targetId: str
    sessionId: Optional[str]
    timestamp: datetime
    createdAt: datetime

    class Config:
        from_attributes = True


class ArticulationTrialListResponse(BaseModel):
    """List of articulation trials with stats"""
    trials: List[ArticulationTrialResponse]
    total: int
    correct: int
    incorrect: int
    accuracyPercent: float


class ArticulationAccuracyDataPoint(BaseModel):
    """Single data point for accuracy chart"""
    date: datetime
    accuracy: float
    trialsCount: int
    level: ArticulationLevel


class ArticulationAccuracyOverTime(BaseModel):
    """Accuracy over time for a target"""
    targetId: str
    phoneme: str
    position: PhonemePosition
    dataPoints: List[ArticulationAccuracyDataPoint]
    overallAccuracy: float
    trendDirection: str  # "improving", "declining", "stable"


# ==========================================
# FLUENCY PROFILE SCHEMAS
# ==========================================

class FluencyProfileBase(BaseModel):
    """Base schema for fluency profile"""
    stutteringTypes: List[StutteringType] = Field(default=[])
    secondaryBehaviors: List[SecondaryBehavior] = Field(default=[])
    averageSyllablesPerMinute: Optional[float] = None
    percentageDisfluency: Optional[float] = Field(None, ge=0, le=100)
    situationalTriggers: List[str] = Field(default=[])
    copingStrategies: List[str] = Field(default=[])


class FluencyProfileCreate(FluencyProfileBase):
    """Schema for creating fluency profile"""
    pass


class FluencyProfileUpdate(BaseModel):
    """Schema for updating fluency profile"""
    stutteringTypes: Optional[List[StutteringType]] = None
    secondaryBehaviors: Optional[List[SecondaryBehavior]] = None
    averageSyllablesPerMinute: Optional[float] = None
    percentageDisfluency: Optional[float] = Field(None, ge=0, le=100)
    situationalTriggers: Optional[List[str]] = None
    copingStrategies: Optional[List[str]] = None


class FluencyProfileResponse(FluencyProfileBase):
    """Schema for fluency profile response"""
    id: str
    learnerId: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ==========================================
# FLUENCY SESSION SCHEMAS
# ==========================================

class FluencySessionBase(BaseModel):
    """Base schema for fluency session"""
    taskType: FluencyTaskType
    totalSyllables: int = Field(..., ge=1)
    disfluencies: int = Field(..., ge=0)
    stutteringCounts: Dict[str, int] = Field(default={})
    secondaryBehaviors: List[SecondaryBehavior] = Field(default=[])
    strategiesUsed: List[str] = Field(default=[])
    strategyEffectiveness: Optional[Dict[str, int]] = None
    notes: Optional[str] = None


class FluencySessionCreate(FluencySessionBase):
    """Schema for creating fluency session"""
    profileId: str
    sessionId: Optional[str] = None


class FluencySessionResponse(FluencySessionBase):
    """Schema for fluency session response"""
    id: str
    profileId: str
    sessionId: Optional[str]
    date: datetime
    percentDisfluent: float
    createdAt: datetime

    class Config:
        from_attributes = True


class FluencySessionListResponse(BaseModel):
    """List of fluency sessions"""
    sessions: List[FluencySessionResponse]
    total: int
    averagePercentDisfluent: float
    averageSyllablesPerMinute: Optional[float]


# ==========================================
# RECEPTIVE LANGUAGE SCHEMAS
# ==========================================

class ReceptiveLanguageBase(BaseModel):
    """Base schema for receptive language assessment"""
    oneStepDirections: Optional[float] = Field(None, ge=0, le=100)
    twoStepDirections: Optional[float] = Field(None, ge=0, le=100)
    threeStepDirections: Optional[float] = Field(None, ge=0, le=100)
    vocabularyComprehension: Optional[float] = None
    grammarComprehension: Optional[float] = None
    inferencing: Optional[float] = None
    listeningComprehension: Optional[float] = None
    strengthAreas: List[str] = Field(default=[])
    targetAreas: List[str] = Field(default=[])
    recommendations: Optional[str] = None


class ReceptiveLanguageCreate(ReceptiveLanguageBase):
    """Schema for creating receptive assessment"""
    pass


class ReceptiveLanguageUpdate(ReceptiveLanguageBase):
    """Schema for updating receptive assessment"""
    pass


class ReceptiveLanguageResponse(ReceptiveLanguageBase):
    """Schema for receptive assessment response"""
    id: str
    learnerId: str
    assessmentDate: datetime
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ==========================================
# EXPRESSIVE LANGUAGE SCHEMAS
# ==========================================

class ExpressiveLanguageBase(BaseModel):
    """Base schema for expressive language assessment"""
    meanLengthUtterance: Optional[float] = None
    vocabularyDiversity: Optional[float] = None
    grammarAccuracy: Optional[float] = Field(None, ge=0, le=100)
    narrativeSkills: Optional[float] = None
    wordFinding: Optional[float] = None
    strengthAreas: List[str] = Field(default=[])
    targetAreas: List[str] = Field(default=[])
    recommendations: Optional[str] = None


class ExpressiveLanguageCreate(ExpressiveLanguageBase):
    """Schema for creating expressive assessment"""
    pass


class ExpressiveLanguageUpdate(ExpressiveLanguageBase):
    """Schema for updating expressive assessment"""
    pass


class ExpressiveLanguageResponse(ExpressiveLanguageBase):
    """Schema for expressive assessment response"""
    id: str
    learnerId: str
    assessmentDate: datetime
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ==========================================
# PRAGMATIC LANGUAGE SCHEMAS
# ==========================================

class PragmaticSkillBase(BaseModel):
    """Base schema for pragmatic skill"""
    skill: PragmaticSkillType
    setting: PragmaticSettingType
    rating: SkillRating = Field(default=SkillRating.NOT_OBSERVED)
    observations: List[str] = Field(default=[])
    interventions: List[str] = Field(default=[])


class PragmaticSkillCreate(PragmaticSkillBase):
    """Schema for creating pragmatic skill"""
    pass


class PragmaticSkillUpdate(BaseModel):
    """Schema for updating pragmatic skill"""
    rating: Optional[SkillRating] = None
    observations: Optional[List[str]] = None
    interventions: Optional[List[str]] = None


class PragmaticSkillResponse(PragmaticSkillBase):
    """Schema for pragmatic skill response"""
    id: str
    learnerId: str
    lastAssessed: datetime
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class PragmaticSkillsMatrix(BaseModel):
    """Matrix of all pragmatic skills × settings"""
    learnerId: str
    skills: Dict[str, Dict[str, PragmaticSkillResponse]]  # skill -> setting -> response
    skillSummary: Dict[str, float]  # Average rating per skill
    settingSummary: Dict[str, float]  # Average rating per setting


# ==========================================
# VOICE ASSESSMENT SCHEMAS
# ==========================================

class VoiceAssessmentBase(BaseModel):
    """Base schema for voice assessment"""
    pitch: VoicePitch = Field(default=VoicePitch.NORMAL)
    pitchVariability: Optional[str] = None
    loudness: VoiceLoudness = Field(default=VoiceLoudness.NORMAL)
    loudnessControl: Optional[str] = None
    quality: VoiceQuality = Field(default=VoiceQuality.CLEAR)
    qualityNotes: Optional[str] = None
    resonance: VoiceResonance = Field(default=VoiceResonance.NORMAL)
    vocalAbuse: List[str] = Field(default=[])
    recommendations: List[str] = Field(default=[])
    referrals: Optional[str] = None


class VoiceAssessmentCreate(VoiceAssessmentBase):
    """Schema for creating voice assessment"""
    pass


class VoiceAssessmentUpdate(VoiceAssessmentBase):
    """Schema for updating voice assessment"""
    pass


class VoiceAssessmentResponse(VoiceAssessmentBase):
    """Schema for voice assessment response"""
    id: str
    learnerId: str
    assessmentDate: datetime
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ==========================================
# SLP SESSION SCHEMAS
# ==========================================

class SLPSessionBase(BaseModel):
    """Base schema for SLP session"""
    duration: int = Field(..., ge=1, le=180, description="minutes")
    sessionType: SLPSessionType
    activities: List[str] = Field(default=[])
    materialsUsed: List[str] = Field(default=[])
    progress: Optional[str] = None
    challenges: Optional[str] = None
    nextSteps: Optional[str] = None
    parentHomework: List[str] = Field(default=[])
    parentNotes: Optional[str] = None


class SLPSessionCreate(SLPSessionBase):
    """Schema for creating SLP session"""
    therapistId: str
    date: Optional[datetime] = None


class SLPSessionUpdate(BaseModel):
    """Schema for updating SLP session"""
    duration: Optional[int] = Field(None, ge=1, le=180)
    sessionType: Optional[SLPSessionType] = None
    activities: Optional[List[str]] = None
    materialsUsed: Optional[List[str]] = None
    progress: Optional[str] = None
    challenges: Optional[str] = None
    nextSteps: Optional[str] = None
    parentHomework: Optional[List[str]] = None
    parentNotes: Optional[str] = None


class SLPSessionResponse(SLPSessionBase):
    """Schema for SLP session response"""
    id: str
    learnerId: str
    therapistId: str
    date: datetime
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class SLPSessionListResponse(BaseModel):
    """List of SLP sessions"""
    sessions: List[SLPSessionResponse]
    total: int
    bySessionType: Dict[str, int]


# ==========================================
# SLP GOAL SCHEMAS
# ==========================================

class SLPObjectiveBase(BaseModel):
    """Base schema for SLP objective"""
    objectiveNumber: int = Field(..., ge=1)
    objectiveText: str = Field(..., min_length=10)
    targetCriteria: str = Field(..., min_length=5)


class SLPObjectiveCreate(SLPObjectiveBase):
    """Schema for creating SLP objective"""
    pass


class SLPObjectiveUpdate(BaseModel):
    """Schema for updating SLP objective"""
    objectiveText: Optional[str] = None
    targetCriteria: Optional[str] = None
    currentProgress: Optional[float] = Field(None, ge=0, le=100)
    isAchieved: Optional[bool] = None
    notes: Optional[str] = None


class SLPObjectiveResponse(SLPObjectiveBase):
    """Schema for SLP objective response"""
    id: str
    goalId: str
    currentProgress: Optional[float]
    isAchieved: bool
    achievedDate: Optional[datetime]
    notes: Optional[str]
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class SLPGoalBase(BaseModel):
    """Base schema for SLP goal"""
    domain: SLPGoalDomain
    goalText: str = Field(..., min_length=20)
    baseline: float = Field(..., ge=0, le=100)
    target: float = Field(..., ge=0, le=100)
    measurementMethod: str = Field(..., min_length=10)
    targetDate: Optional[datetime] = None


class SLPGoalCreate(SLPGoalBase):
    """Schema for creating SLP goal"""
    objectives: List[SLPObjectiveCreate] = Field(default=[])


class SLPGoalUpdate(BaseModel):
    """Schema for updating SLP goal"""
    goalText: Optional[str] = None
    target: Optional[float] = Field(None, ge=0, le=100)
    measurementMethod: Optional[str] = None
    currentProgress: Optional[float] = Field(None, ge=0, le=100)
    status: Optional[SLPGoalStatus] = None
    targetDate: Optional[datetime] = None


class SLPGoalDataPoint(BaseModel):
    """Single data point for goal progress"""
    date: datetime
    value: float
    notes: Optional[str] = None


class SLPGoalResponse(SLPGoalBase):
    """Schema for SLP goal response"""
    id: str
    learnerId: str
    dataPoints: Optional[List[SLPGoalDataPoint]]
    currentProgress: Optional[float]
    status: SLPGoalStatus
    startDate: datetime
    achievedDate: Optional[datetime]
    shortTermObjectives: List[SLPObjectiveResponse] = Field(default=[])
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class SLPGoalListResponse(BaseModel):
    """List of SLP goals"""
    goals: List[SLPGoalResponse]
    total: int
    activeCount: int
    achievedCount: int
    byDomain: Dict[str, int]


class SLPGoalProgressUpdate(BaseModel):
    """Schema for adding progress data point"""
    value: float = Field(..., ge=0, le=100)
    notes: Optional[str] = None


# ==========================================
# PARENT HOMEWORK SCHEMAS
# ==========================================

class ParentHomeworkBase(BaseModel):
    """Base schema for parent homework"""
    activity: str = Field(..., min_length=5)
    targetSkill: str = Field(..., min_length=3)
    instructions: str = Field(..., min_length=10)
    practiceWords: List[str] = Field(default=[])
    practiceMinutes: int = Field(default=10, ge=1, le=60)
    dueDate: Optional[datetime] = None


class ParentHomeworkCreate(ParentHomeworkBase):
    """Schema for creating parent homework"""
    pass


class ParentHomeworkUpdate(BaseModel):
    """Schema for updating parent homework"""
    activity: Optional[str] = None
    targetSkill: Optional[str] = None
    instructions: Optional[str] = None
    practiceWords: Optional[List[str]] = None
    practiceMinutes: Optional[int] = Field(None, ge=1, le=60)
    dueDate: Optional[datetime] = None


class ParentHomeworkComplete(BaseModel):
    """Schema for parent completing homework"""
    parentNotes: Optional[str] = None
    difficultyRating: Optional[int] = Field(None, ge=1, le=5)


class ParentHomeworkReview(BaseModel):
    """Schema for therapist reviewing homework"""
    therapistFeedback: str


class ParentHomeworkResponse(ParentHomeworkBase):
    """Schema for parent homework response"""
    id: str
    learnerId: str
    assignedDate: datetime
    parentCompleted: bool
    completedDate: Optional[datetime]
    parentNotes: Optional[str]
    difficultyRating: Optional[int]
    therapistReviewed: bool
    therapistFeedback: Optional[str]
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class ParentHomeworkListResponse(BaseModel):
    """List of parent homework"""
    homework: List[ParentHomeworkResponse]
    total: int
    pending: int
    completed: int
    reviewed: int


# ==========================================
# PROGRESS REPORT SCHEMAS
# ==========================================

class ArticulationProgressSummary(BaseModel):
    """Articulation progress for report"""
    phoneme: str
    position: PhonemePosition
    level: ArticulationLevel
    baselineAccuracy: float
    currentAccuracy: float
    change: float
    trialsCompleted: int
    isMastered: bool


class FluencyProgressSummary(BaseModel):
    """Fluency progress for report"""
    baselinePercentDisfluent: float
    currentPercentDisfluent: float
    change: float
    sessionsCompleted: int
    strategiesLearned: List[str]


class LanguageProgressSummary(BaseModel):
    """Language progress for report"""
    domain: str  # receptive or expressive
    areasImproved: List[str]
    currentStrengths: List[str]
    continuedTargets: List[str]


class GoalProgressSummary(BaseModel):
    """Goal progress for report"""
    goalId: str
    goalText: str
    domain: SLPGoalDomain
    baseline: float
    target: float
    currentProgress: float
    percentToGoal: float
    status: SLPGoalStatus
    objectivesAchieved: int
    totalObjectives: int


class SLPProgressReportRequest(BaseModel):
    """Request for progress report"""
    learnerId: str
    startDate: datetime
    endDate: datetime
    includeDomains: Optional[List[SLPGoalDomain]] = None
    includeTrialData: bool = Field(default=True)
    includeGoals: bool = Field(default=True)
    includeHomework: bool = Field(default=True)


class SLPProgressReportResponse(BaseModel):
    """Comprehensive SLP progress report"""
    learnerId: str
    learnerName: str
    reportPeriod: Dict[str, datetime]
    generatedAt: datetime
    
    # Profile Summary
    primaryDiagnosis: SLPDiagnosis
    severity: SLPSeverity
    serviceSummary: str
    
    # Session Summary
    totalSessions: int
    totalMinutes: int
    sessionBreakdown: Dict[str, int]  # By type
    
    # Domain Progress
    articulationProgress: Optional[List[ArticulationProgressSummary]]
    fluencyProgress: Optional[FluencyProgressSummary]
    languageProgress: Optional[List[LanguageProgressSummary]]
    pragmaticProgress: Optional[Dict[str, Dict[str, str]]]  # skill -> setting -> rating
    voiceSummary: Optional[Dict[str, str]]
    
    # Goals
    goalsProgress: Optional[List[GoalProgressSummary]]
    
    # Homework
    homeworkCompliance: Optional[float]  # Percentage completed
    
    # Recommendations
    recommendations: List[str]
    nextSteps: List[str]


# ==========================================
# DASHBOARD SCHEMAS
# ==========================================

class SLPDashboardResponse(BaseModel):
    """SLP dashboard for a learner"""
    learnerId: str
    learnerName: str
    profile: Optional[SLPProfileResponse]
    
    # Quick Stats
    activeTargets: int
    upcomingHomework: int
    sessionsThisMonth: int
    goalsOnTrack: int
    
    # Recent Activity
    lastSessionDate: Optional[datetime]
    recentAccuracy: Optional[float]
    
    # Alerts
    alerts: List[str]  # e.g., "Homework overdue", "Goal review needed"
