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

logger = setup_logging(__name__)

router = APIRouter(prefix="/focus", tags=["Focus Analytics"])


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
async def submit_focus_metrics(metrics: FocusMetricsSubmission):
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
    
    # TODO: Store in database when available
    # For now, just log and acknowledge
    
    return {
        "status": "received",
        "learner_id": metrics.learner_id,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/break-completed")
async def record_focus_break(break_data: FocusBreakCompleted):
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
    
    # TODO: Store in database and update learner preferences
    
    return {
        "status": "recorded",
        "learner_id": break_data.learner_id,
        "game_type": break_data.game_type.value,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/insights/{learner_id}", response_model=FocusInsightsResponse)
async def get_focus_insights(learner_id: str):
    """
    Get personalized focus insights for a learner.
    
    Based on aggregated focus patterns and break preferences.
    """
    # TODO: Generate real insights from stored data
    # For now, return sensible defaults
    
    return FocusInsightsResponse(
        learner_id=learner_id,
        insights=[
            FocusInsight(
                insight_type="optimal_timing",
                message="You focus best in shorter sessions with regular breaks.",
                recommendation="Try 15-20 minute focused work periods.",
                confidence=0.7
            ),
            FocusInsight(
                insight_type="preferred_breaks",
                message="Movement breaks help you refocus most effectively.",
                recommendation="Quick stretches between activities boost focus.",
                confidence=0.65
            )
        ],
        preferred_break_types=[FocusGameType.MOVEMENT, FocusGameType.BREATHING],
        optimal_session_length_minutes=20,
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
