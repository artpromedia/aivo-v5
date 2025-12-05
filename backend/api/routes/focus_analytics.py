"""
Focus Analytics API Routes

Privacy-first focus monitoring endpoints.
Only receives aggregated metrics - no raw interaction data.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

from core.logging import setup_logging
from db.repositories.focus_repository import FocusAnalyticsRepository
from db.database import get_async_session

logger = setup_logging(__name__)

router = APIRouter(prefix="/focus", tags=["Focus Analytics"])


async def get_repository():
    """Dependency to get Focus Analytics repository with session."""
    async with get_async_session() as session:
        yield FocusAnalyticsRepository(session)


# ============================================================================
# Schemas
# ============================================================================

class FocusGameType(str, Enum):
    """Types of focus break games"""
    MEMORY = "memory"
    QUICK_MATH = "quick_math"
    WORD_SCRAMBLE = "word_scramble"
    MOVEMENT = "movement"
    BREATHING = "breathing"


class FocusMetricsSubmission(BaseModel):
    """Aggregated focus metrics from a session (privacy-first)"""
    learner_id: str
    session_id: Optional[str] = None
    
    # Aggregated metrics only - no raw interaction data
    average_focus_score: float = Field(..., ge=0, le=100)
    min_focus_score: float = Field(..., ge=0, le=100)
    max_focus_score: float = Field(..., ge=0, le=100)
    
    # Break statistics
    breaks_suggested: int = Field(default=0, ge=0)
    breaks_taken: int = Field(default=0, ge=0)
    breaks_dismissed: int = Field(default=0, ge=0)
    
    # Session duration in minutes
    total_session_minutes: int = Field(..., ge=0)
    active_minutes: int = Field(..., ge=0)
    
    # Timestamp
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "learner_id": "learner-123",
                "session_id": "session-456",
                "average_focus_score": 72.5,
                "min_focus_score": 45.0,
                "max_focus_score": 95.0,
                "breaks_suggested": 3,
                "breaks_taken": 2,
                "breaks_dismissed": 1,
                "total_session_minutes": 45,
                "active_minutes": 38
            }
        }


class FocusBreakCompleted(BaseModel):
    """Record of a completed focus break game"""
    learner_id: str
    game_type: FocusGameType
    duration_seconds: int = Field(..., ge=0)
    completed: bool = True
    
    # Game-specific results (optional)
    score: Optional[int] = None
    
    # Context
    focus_score_before: Optional[float] = Field(None, ge=0, le=100)
    session_id: Optional[str] = None
    
    # Timestamp
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "learner_id": "learner-123",
                "game_type": "memory",
                "duration_seconds": 120,
                "completed": True,
                "score": 8,
                "focus_score_before": 35.0,
                "session_id": "session-456"
            }
        }


class FocusInsight(BaseModel):
    """Personalized focus insight for a learner"""
    insight_type: str
    message: str
    recommendation: Optional[str] = None
    confidence: float = Field(..., ge=0, le=1)


class FocusInsightsResponse(BaseModel):
    """Focus insights response"""
    learner_id: str
    insights: List[FocusInsight]
    preferred_break_types: List[FocusGameType]
    optimal_session_length_minutes: int
    generated_at: datetime


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/metrics")
async def submit_focus_metrics(
    metrics: FocusMetricsSubmission,
    repo: FocusAnalyticsRepository = Depends(get_repository),
):
    """
    Submit aggregated focus metrics from a learning session.
    
    Privacy Note: Only accepts aggregated metrics.
    Raw interaction data stays on-device.
    """
    logger.info(
        f"Focus metrics received for learner {metrics.learner_id}: "
        f"avg_score={metrics.average_focus_score:.1f}, "
        f"breaks_taken={metrics.breaks_taken}/{metrics.breaks_suggested}"
    )
    
    # Store in database
    saved = await repo.save_focus_metrics(
        learner_id=metrics.learner_id,
        session_id=metrics.session_id,
        focus_score=metrics.average_focus_score,
        distractions=metrics.breaks_dismissed,  # Dismissed breaks indicate distraction
        metrics={
            "min_focus_score": metrics.min_focus_score,
            "max_focus_score": metrics.max_focus_score,
            "breaks_suggested": metrics.breaks_suggested,
            "breaks_taken": metrics.breaks_taken,
            "breaks_dismissed": metrics.breaks_dismissed,
            "total_session_minutes": metrics.total_session_minutes,
            "active_minutes": metrics.active_minutes,
        }
    )
    
    return {
        "status": "received",
        "id": saved.get("id"),
        "learner_id": metrics.learner_id,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/break-completed")
async def record_focus_break(
    break_data: FocusBreakCompleted,
    repo: FocusAnalyticsRepository = Depends(get_repository),
):
    """
    Record a completed focus break game.
    
    Used to learn preferred break types and optimal timing.
    """
    logger.info(
        f"Focus break completed for learner {break_data.learner_id}: "
        f"game={break_data.game_type.value}, "
        f"duration={break_data.duration_seconds}s, "
        f"completed={break_data.completed}"
    )
    
    # Store in database
    saved = await repo.save_game_session(
        learner_id=break_data.learner_id,
        game_type=break_data.game_type.value.upper(),
        duration=break_data.duration_seconds,
        completed=break_data.completed,
        score=break_data.score,
        triggered_by="focus_break",
    )
    
    return {
        "status": "recorded",
        "id": saved.get("id"),
        "learner_id": break_data.learner_id,
        "game_type": break_data.game_type.value,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/insights/{learner_id}", response_model=FocusInsightsResponse)
async def get_focus_insights(
    learner_id: str,
    repo: FocusAnalyticsRepository = Depends(get_repository),
):
    """
    Get personalized focus insights for a learner.
    
    Based on aggregated focus patterns and break preferences.
    """
    # Get aggregated data
    aggregates = await repo.get_focus_aggregates(learner_id, days=30)
    preferred_breaks = await repo.get_preferred_break_types(learner_id, days=30)
    optimal_length = await repo.get_optimal_session_length(learner_id, days=30)
    
    # Generate insights based on data
    insights = []
    
    if aggregates["sessionCount"] > 0:
        avg_score = aggregates["averageScore"]
        
        if avg_score >= 75:
            insights.append(FocusInsight(
                insight_type="focus_strength",
                message=f"Great focus! Your average focus score is {avg_score:.0f}%.",
                recommendation="Keep up the excellent work!",
                confidence=0.9
            ))
        elif avg_score >= 50:
            insights.append(FocusInsight(
                insight_type="focus_improvement",
                message=f"Your average focus score is {avg_score:.0f}%. There's room to improve.",
                recommendation="Try taking more frequent breaks to maintain focus.",
                confidence=0.8
            ))
        else:
            insights.append(FocusInsight(
                insight_type="focus_challenge",
                message=f"Focus seems challenging. Average score is {avg_score:.0f}%.",
                recommendation="Consider shorter learning sessions with movement breaks.",
                confidence=0.75
            ))
        
        if aggregates["totalDistractions"] > aggregates["sessionCount"] * 2:
            insights.append(FocusInsight(
                insight_type="distraction_pattern",
                message="You often dismiss break suggestions.",
                recommendation="Taking suggested breaks can help maintain focus longer.",
                confidence=0.7
            ))
    else:
        # No data yet
        insights = [
            FocusInsight(
                insight_type="getting_started",
                message="We're learning your focus patterns.",
                recommendation="Complete a few learning sessions to get personalized insights.",
                confidence=0.5
            )
        ]
    
    # Add optimal timing insight
    insights.append(FocusInsight(
        insight_type="optimal_timing",
        message=f"Your optimal session length appears to be around {optimal_length} minutes.",
        recommendation=f"Try {optimal_length}-minute focused work periods with breaks.",
        confidence=0.7
    ))
    
    # Map preferred breaks to enum
    preferred_types = []
    for b in preferred_breaks:
        try:
            preferred_types.append(FocusGameType(b.lower()))
        except ValueError:
            preferred_types.append(FocusGameType.MOVEMENT)
    
    if not preferred_types:
        preferred_types = [FocusGameType.MOVEMENT, FocusGameType.BREATHING]
    
    return FocusInsightsResponse(
        learner_id=learner_id,
        insights=insights,
        preferred_break_types=preferred_types,
        optimal_session_length_minutes=optimal_length,
        generated_at=datetime.utcnow()
    )


@router.get("/health")
async def focus_health():
    """Health check for focus analytics service"""
    return {
        "status": "healthy",
        "service": "focus_analytics",
        "timestamp": datetime.utcnow().isoformat()
    }
