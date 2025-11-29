"""
AAC (Augmentative & Alternative Communication) Schemas
Author: artpromedia
Date: 2025-01-13
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum


# ===== Enums =====

class AACSystemType(str, Enum):
    PECS = "PECS"  # Picture Exchange Communication System
    SGD = "SGD"    # Speech Generating Device
    COMMUNICATION_BOARD = "COMMUNICATION_BOARD"
    HYBRID = "HYBRID"


class AACAccessMethod(str, Enum):
    DIRECT_SELECT = "DIRECT_SELECT"  # Touch/click
    SWITCH_SCANNING = "SWITCH_SCANNING"
    EYE_GAZE = "EYE_GAZE"
    HEAD_TRACKING = "HEAD_TRACKING"


class AACSymbolCategory(str, Enum):
    CORE = "CORE"
    FRINGE = "FRINGE"
    SOCIAL = "SOCIAL"
    ACADEMIC = "ACADEMIC"
    DAILY_LIVING = "DAILY_LIVING"
    EMOTIONS = "EMOTIONS"
    ACTIONS = "ACTIONS"
    DESCRIPTORS = "DESCRIPTORS"
    QUESTIONS = "QUESTIONS"
    PLACES = "PLACES"
    PEOPLE = "PEOPLE"
    FOOD = "FOOD"
    ACTIVITIES = "ACTIVITIES"


class AACBoardType(str, Enum):
    MAIN = "MAIN"
    CATEGORY = "CATEGORY"
    ACTIVITY = "ACTIVITY"
    CUSTOM = "CUSTOM"


class AACCommunicativeFunction(str, Enum):
    REQUESTING = "REQUESTING"
    REJECTING = "REJECTING"
    COMMENTING = "COMMENTING"
    QUESTIONING = "QUESTIONING"
    GREETING = "GREETING"
    RESPONDING = "RESPONDING"
    LABELING = "LABELING"
    EXPRESSING_FEELINGS = "EXPRESSING_FEELINGS"


class AACMasteryLevel(str, Enum):
    NOT_INTRODUCED = "NOT_INTRODUCED"
    EMERGING = "EMERGING"
    DEVELOPING = "DEVELOPING"
    MASTERED = "MASTERED"


# ===== Symbol Schemas =====

class AACSymbolBase(BaseModel):
    label: str
    category: AACSymbolCategory
    imageUrl: str
    symbolSet: str = "PCS"
    isCore: bool = False
    displayOrder: int = 0
    backgroundColor: Optional[str] = None
    textColor: Optional[str] = None
    borderColor: Optional[str] = None
    audioUrl: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AACSymbolCreate(AACSymbolBase):
    pass


class AACSymbolUpdate(BaseModel):
    label: Optional[str] = None
    category: Optional[AACSymbolCategory] = None
    imageUrl: Optional[str] = None
    symbolSet: Optional[str] = None
    isCore: Optional[bool] = None
    displayOrder: Optional[int] = None
    backgroundColor: Optional[str] = None
    textColor: Optional[str] = None
    borderColor: Optional[str] = None
    audioUrl: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AACSymbolResponse(AACSymbolBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ===== Board Symbol (Junction) Schemas =====

class AACBoardSymbolBase(BaseModel):
    symbolId: str
    row: int
    column: int
    customLabel: Optional[str] = None
    customImageUrl: Optional[str] = None
    isHidden: bool = False


class AACBoardSymbolCreate(AACBoardSymbolBase):
    pass


class AACBoardSymbolUpdate(BaseModel):
    row: Optional[int] = None
    column: Optional[int] = None
    customLabel: Optional[str] = None
    customImageUrl: Optional[str] = None
    isHidden: Optional[bool] = None


class AACBoardSymbolResponse(AACBoardSymbolBase):
    id: str
    boardId: str
    symbol: Optional[AACSymbolResponse] = None

    class Config:
        from_attributes = True


# ===== Board Schemas =====

class AACBoardBase(BaseModel):
    name: str
    boardType: AACBoardType = AACBoardType.CUSTOM
    rows: int = 4
    columns: int = 5
    backgroundColor: str = "#FFFFFF"
    isDefault: bool = False
    displayOrder: int = 0


class AACBoardCreate(AACBoardBase):
    learnerId: str
    symbols: Optional[List[AACBoardSymbolCreate]] = None


class AACBoardUpdate(BaseModel):
    name: Optional[str] = None
    boardType: Optional[AACBoardType] = None
    rows: Optional[int] = None
    columns: Optional[int] = None
    backgroundColor: Optional[str] = None
    isDefault: Optional[bool] = None
    displayOrder: Optional[int] = None


class AACBoardResponse(AACBoardBase):
    id: str
    learnerId: str
    symbols: List[AACBoardSymbolResponse] = []
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ===== System Schemas =====

class AACSystemBase(BaseModel):
    systemType: AACSystemType = AACSystemType.COMMUNICATION_BOARD
    accessMethod: AACAccessMethod = AACAccessMethod.DIRECT_SELECT
    gridSize: int = 20
    vocabularySize: int = 200
    voiceId: Optional[str] = None
    speechRate: float = 1.0
    scanSpeed: float = 1.0
    dwellTime: float = 1.0
    highContrastMode: bool = False
    largeTargets: bool = False
    auditoryFeedback: bool = True
    visualFeedback: bool = True
    settings: Optional[Dict[str, Any]] = None


class AACSystemCreate(AACSystemBase):
    learnerId: str


class AACSystemUpdate(BaseModel):
    systemType: Optional[AACSystemType] = None
    accessMethod: Optional[AACAccessMethod] = None
    gridSize: Optional[int] = None
    vocabularySize: Optional[int] = None
    voiceId: Optional[str] = None
    speechRate: Optional[float] = None
    scanSpeed: Optional[float] = None
    dwellTime: Optional[float] = None
    highContrastMode: Optional[bool] = None
    largeTargets: Optional[bool] = None
    auditoryFeedback: Optional[bool] = None
    visualFeedback: Optional[bool] = None
    settings: Optional[Dict[str, Any]] = None


class AACSystemResponse(AACSystemBase):
    id: str
    learnerId: str
    isActive: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ===== Usage Log Schemas =====

class AACUsageLogBase(BaseModel):
    symbolId: str
    boardId: Optional[str] = None
    communicativeFunction: AACCommunicativeFunction
    contextActivity: Optional[str] = None
    wasPrompted: bool = False
    promptLevel: Optional[str] = None
    responseLatency: Optional[float] = None
    wasSuccessful: bool = True
    partnerResponse: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AACUsageLogCreate(AACUsageLogBase):
    learnerId: str


class AACUsageLogResponse(AACUsageLogBase):
    id: str
    learnerId: str
    timestamp: datetime

    class Config:
        from_attributes = True


# ===== Vocabulary Goal Schemas =====

class AACVocabularyGoalBase(BaseModel):
    symbolId: str
    targetMastery: AACMasteryLevel = AACMasteryLevel.MASTERED
    targetTrials: int = 10
    targetAccuracy: float = 0.8
    contextDescription: Optional[str] = None
    notes: Optional[str] = None


class AACVocabularyGoalCreate(AACVocabularyGoalBase):
    learnerId: str


class AACVocabularyGoalUpdate(BaseModel):
    currentMastery: Optional[AACMasteryLevel] = None
    targetMastery: Optional[AACMasteryLevel] = None
    completedTrials: Optional[int] = None
    targetTrials: Optional[int] = None
    successRate: Optional[float] = None
    targetAccuracy: Optional[float] = None
    contextDescription: Optional[str] = None
    notes: Optional[str] = None
    isAchieved: Optional[bool] = None


class AACVocabularyGoalResponse(AACVocabularyGoalBase):
    id: str
    learnerId: str
    currentMastery: AACMasteryLevel
    completedTrials: int
    successRate: float
    isAchieved: bool
    achievedAt: Optional[datetime] = None
    symbol: Optional[AACSymbolResponse] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ===== Progress Report Schemas =====

class AACProgressReportBase(BaseModel):
    reportType: str = "weekly"
    periodStart: datetime
    periodEnd: datetime
    totalUtterances: int = 0
    uniqueSymbolsUsed: int = 0
    averageUtteranceLength: float = 0.0
    mostUsedSymbols: List[str] = []
    communicativeFunctions: Dict[str, int] = {}
    promptingData: Dict[str, Any] = {}
    goalsProgress: List[Dict[str, Any]] = []
    recommendations: List[str] = []
    notes: Optional[str] = None


class AACProgressReportCreate(AACProgressReportBase):
    learnerId: str


class AACProgressReportResponse(AACProgressReportBase):
    id: str
    learnerId: str
    createdAt: datetime

    class Config:
        from_attributes = True


# ===== Aggregated/Utility Schemas =====

class AACDashboardStats(BaseModel):
    totalSymbolsAvailable: int
    symbolsUsedToday: int
    symbolsUsedThisWeek: int
    averageUtterancesPerDay: float
    goalsInProgress: int
    goalsAchieved: int
    mostUsedSymbols: List[Dict[str, Any]]
    communicativeFunctionBreakdown: Dict[str, int]
    recentActivity: List[AACUsageLogResponse]


class AACRecommendation(BaseModel):
    type: str  # "new_symbol", "goal_suggestion", "board_update", "access_adjustment"
    priority: str  # "high", "medium", "low"
    title: str
    description: str
    symbolId: Optional[str] = None
    actionData: Optional[Dict[str, Any]] = None


class AACSymbolSearch(BaseModel):
    query: Optional[str] = None
    category: Optional[AACSymbolCategory] = None
    isCore: Optional[bool] = None
    symbolSet: Optional[str] = None
    limit: int = 50
    offset: int = 0


class AACBulkSymbolAdd(BaseModel):
    boardId: str
    symbols: List[AACBoardSymbolCreate]


class AACUtterance(BaseModel):
    """Represents a multi-symbol utterance"""
    learnerId: str
    symbolIds: List[str]
    boardId: Optional[str] = None
    communicativeFunction: AACCommunicativeFunction
    contextActivity: Optional[str] = None
    wasPrompted: bool = False
    promptLevel: Optional[str] = None


class AACAnalyticsRequest(BaseModel):
    learnerId: str
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    groupBy: str = "day"  # "day", "week", "month"


class AACAnalyticsResponse(BaseModel):
    learnerId: str
    period: Dict[str, str]
    totalUtterances: int
    uniqueSymbols: int
    averageUtteranceLength: float
    symbolUsageByCategory: Dict[str, int]
    communicativeFunctionUsage: Dict[str, int]
    dailyTrends: List[Dict[str, Any]]
    topSymbols: List[Dict[str, Any]]
    progressOverTime: List[Dict[str, Any]]
