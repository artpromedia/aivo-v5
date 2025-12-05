"""
ML/Adaptive Learning API Routes
Author: artpromedia
Date: 2025-01-26

Exposes ML-powered adaptive learning endpoints:
- Difficulty prediction
- Content adaptation
- Knowledge gap detection
- Learning path generation
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

from db.database import get_db
from db.models.user import User
from api.dependencies.auth import get_current_user
from core.logging import setup_logging
from ml.adaptation.engine import (
    predict_difficulty,
    adapt_content,
    detect_knowledge_gaps,
    generate_learning_path,
    adaptive_engine,
    LearningEvent,
)

router = APIRouter(prefix="/ml", tags=["Machine Learning"])
logger = setup_logging(__name__)


# ===== Request/Response Models =====

class PerformanceRecord(BaseModel):
    """Single performance record"""
    contentId: str
    accuracy: float = Field(ge=0, le=1)
    timeRatio: float = Field(default=1.0, description="Actual/expected time ratio")
    timestamp: Optional[datetime] = None


class DifficultyPredictionRequest(BaseModel):
    """Request for difficulty prediction"""
    learnerId: str
    contentFeatures: Dict[str, Any] = Field(default_factory=dict)
    recentPerformance: Optional[List[PerformanceRecord]] = None


class DifficultyPredictionResponse(BaseModel):
    """Difficulty prediction response"""
    learnerId: str
    predictedDifficulty: float
    difficultyLevel: str
    confidence: float
    adjustmentReason: str
    recommendations: List[str]
    zoneOfProximalDevelopment: Dict[str, float]


class ContentAdaptationRequest(BaseModel):
    """Request for content adaptation"""
    learnerId: str
    content: Dict[str, Any]
    targetDifficulty: Optional[float] = None
    adaptations: Optional[List[str]] = None


class ContentAdaptationResponse(BaseModel):
    """Content adaptation response"""
    originalContentId: Optional[str]
    adaptedContent: Dict[str, Any]
    adaptationsApplied: List[str]
    targetDifficulty: float
    learnerProfile: Dict[str, float]


class TopicPerformance(BaseModel):
    """Performance on a topic"""
    topicId: str
    topicName: str
    accuracy: float
    attempts: int
    prerequisites: Optional[List[str]] = None


class KnowledgeGapRequest(BaseModel):
    """Request for knowledge gap detection"""
    learnerId: str
    topicPerformance: List[TopicPerformance]
    curriculumMap: Optional[Dict[str, Any]] = None


class KnowledgeGapResponse(BaseModel):
    """Knowledge gap detection response"""
    learnerId: str
    identifiedGaps: List[Dict[str, Any]]
    totalGaps: int
    criticalGaps: int
    remediationPlan: List[Dict[str, Any]]
    estimatedRemediationTime: int


class ContentItem(BaseModel):
    """Available content item"""
    id: str
    title: str
    type: str
    difficulty: float = 0.5
    estimatedMinutes: int = 15
    topics: List[str] = Field(default_factory=list)
    prerequisites: List[str] = Field(default_factory=list)
    interactive: bool = False
    modality: str = "text"


class LearningPathRequest(BaseModel):
    """Request for learning path generation"""
    learnerId: str
    targetGoals: List[str]
    availableContent: List[ContentItem]
    constraints: Optional[Dict[str, Any]] = None


class LearningPathResponse(BaseModel):
    """Learning path response"""
    learnerId: str
    targetGoals: List[str]
    learningPath: List[Dict[str, Any]]
    totalItems: int
    estimatedTotalMinutes: int
    estimatedCompletionDays: int
    adaptedForLevel: float


class LearningEventRequest(BaseModel):
    """Learning event for profile update"""
    learnerId: str
    contentId: str
    timeSpentSeconds: int
    correctResponses: int
    totalResponses: int
    difficultyLevel: float
    engagementScore: float = 0.5
    hintsUsed: int = 0
    attempts: int = 1


class ProfileUpdateResponse(BaseModel):
    """Profile update response"""
    learnerId: str
    currentLevel: float
    learningRate: float
    engagement: float
    lastUpdated: datetime


# ===== Endpoints =====

@router.post("/predict/difficulty", response_model=DifficultyPredictionResponse)
async def predict_optimal_difficulty(
    request: DifficultyPredictionRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Predict optimal content difficulty for a learner
    
    Uses learner history and content features to determine
    the ideal difficulty level within the zone of proximal development.
    """
    try:
        recent_perf = None
        if request.recentPerformance:
            recent_perf = [
                {"accuracy": p.accuracy, "timeRatio": p.timeRatio}
                for p in request.recentPerformance
            ]
        
        result = await predict_difficulty(
            learner_id=request.learnerId,
            content_features=request.contentFeatures,
            recent_performance=recent_perf,
        )
        
        return DifficultyPredictionResponse(**result)
        
    except Exception as e:
        logger.error(f"Difficulty prediction error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


@router.post("/adapt/content", response_model=ContentAdaptationResponse)
async def adapt_content_for_learner(
    request: ContentAdaptationRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Adapt content for a specific learner
    
    Applies various adaptations based on learner profile:
    - Language simplification
    - Scaffolding addition
    - Visual supports
    - Interactivity enhancement
    """
    try:
        result = await adapt_content(
            content=request.content,
            learner_id=request.learnerId,
            target_difficulty=request.targetDifficulty,
        )
        
        return ContentAdaptationResponse(
            originalContentId=result.get("originalContentId"),
            adaptedContent=result.get("adaptedContent", {}),
            adaptationsApplied=result.get("adaptationsApplied", []),
            targetDifficulty=result.get("targetDifficulty", 0.5),
            learnerProfile=result.get("learnerProfile", {}),
        )
        
    except Exception as e:
        logger.error(f"Content adaptation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Adaptation failed: {str(e)}"
        )


@router.post("/detect/gaps", response_model=KnowledgeGapResponse)
async def detect_learner_knowledge_gaps(
    request: KnowledgeGapRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Detect knowledge gaps based on performance patterns
    
    Analyzes topic performance to identify:
    - Critical gaps requiring immediate attention
    - Moderate gaps needing review
    - Prerequisite dependencies
    """
    try:
        topic_perf = [
            {
                "topicId": t.topicId,
                "topicName": t.topicName,
                "accuracy": t.accuracy,
                "attempts": t.attempts,
                "prerequisites": t.prerequisites or [],
            }
            for t in request.topicPerformance
        ]
        
        result = await detect_knowledge_gaps(
            learner_id=request.learnerId,
            topic_performance=topic_perf,
        )
        
        return KnowledgeGapResponse(**result)
        
    except Exception as e:
        logger.error(f"Gap detection error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gap detection failed: {str(e)}"
        )


@router.post("/path/generate", response_model=LearningPathResponse)
async def generate_personalized_learning_path(
    request: LearningPathRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generate personalized learning path
    
    Creates optimized content sequence based on:
    - Learner profile and level
    - Target learning goals
    - Content prerequisites
    - Time constraints
    """
    try:
        available = [
            {
                "id": c.id,
                "title": c.title,
                "type": c.type,
                "difficulty": c.difficulty,
                "estimatedMinutes": c.estimatedMinutes,
                "topics": c.topics,
                "prerequisites": c.prerequisites,
                "interactive": c.interactive,
                "modality": c.modality,
            }
            for c in request.availableContent
        ]
        
        result = await generate_learning_path(
            learner_id=request.learnerId,
            target_goals=request.targetGoals,
            available_content=available,
        )
        
        return LearningPathResponse(**result)
        
    except Exception as e:
        logger.error(f"Path generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Path generation failed: {str(e)}"
        )


@router.post("/profile/update", response_model=ProfileUpdateResponse)
async def update_learner_profile(
    request: LearningEventRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Update learner profile with new learning event
    
    Updates profile metrics using exponential moving average:
    - Current level
    - Learning rate
    - Engagement score
    """
    try:
        import uuid
        
        event = LearningEvent(
            event_id=str(uuid.uuid4()),
            learner_id=request.learnerId,
            content_id=request.contentId,
            timestamp=datetime.utcnow(),
            time_spent_seconds=request.timeSpentSeconds,
            correct_responses=request.correctResponses,
            total_responses=request.totalResponses,
            difficulty_level=request.difficultyLevel,
            engagement_score=request.engagementScore,
            hints_used=request.hintsUsed,
            attempts=request.attempts,
        )
        
        profile = adaptive_engine.update_learner_profile(
            learner_id=request.learnerId,
            learning_event=event,
        )
        
        return ProfileUpdateResponse(
            learnerId=profile.learner_id,
            currentLevel=profile.current_level,
            learningRate=profile.learning_rate,
            engagement=profile.engagement,
            lastUpdated=profile.last_updated,
        )
        
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update failed: {str(e)}"
        )


@router.get("/profile/{learner_id}")
async def get_learner_profile(
    learner_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get current learner adaptive learning profile"""
    try:
        profile = adaptive_engine._get_learner_profile(learner_id)
        
        return {
            "learnerId": profile.learner_id,
            "currentLevel": profile.current_level,
            "learningRate": profile.learning_rate,
            "consistency": profile.consistency,
            "engagement": profile.engagement,
            "preferredDifficulty": profile.preferred_difficulty,
            "strengths": profile.strengths,
            "weaknesses": profile.weaknesses,
            "lastUpdated": profile.last_updated.isoformat(),
        }
        
    except Exception as e:
        logger.error(f"Profile fetch error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile fetch failed: {str(e)}"
        )
