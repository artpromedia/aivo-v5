"""
Fluency Therapy Routes
Author: artpromedia
Date: 2025-01-14
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import datetime, timedelta

from db.database import get_db
from db.models.user import User
from api.schemas.slp import (
    FluencyProfileCreate,
    FluencyProfileUpdate,
    FluencyProfileResponse,
    FluencySessionCreate,
    FluencySessionResponse,
    FluencyProgressResponse,
    StutteringType,
    SecondaryBehavior,
    FluencyTaskType,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter(prefix="/slp/fluency", tags=["SLP Fluency"])
logger = setup_logging(__name__)


# ===== Fluency Profiles =====

@router.post("/profiles", response_model=FluencyProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_fluency_profile(
    profile: FluencyProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a fluency profile for a learner (stuttering evaluation)"""
    if not await verify_learner_access(current_user, profile.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        from db.models.slp import FluencyProfile
        
        # Check if profile already exists
        result = await db.execute(
            select(FluencyProfile).where(FluencyProfile.learner_id == profile.learnerId)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Fluency profile already exists for this learner"
            )
        
        db_profile = FluencyProfile(
            learner_id=profile.learnerId,
            primary_stuttering_types=profile.primaryStutteringTypes or [],
            secondary_behaviors=profile.secondaryBehaviors or [],
            baseline_stuttering_frequency=profile.baselineStutteringFrequency,
            current_stuttering_frequency=profile.baselineStutteringFrequency,
            goal_stuttering_frequency=profile.goalStutteringFrequency,
            awareness_level=profile.awarenessLevel,
            uses_fluency_techniques=profile.usesFluencyTechniques or [],
            speaking_situations_hierarchy=profile.speakingSituationsHierarchy or [],
            avoidance_behaviors=profile.avoidanceBehaviors or [],
            emotional_impact_score=profile.emotionalImpactScore,
        )
        
        db.add(db_profile)
        await db.commit()
        await db.refresh(db_profile)
        
        logger.info(f"Created fluency profile for learner {profile.learnerId}")
        return _to_fluency_profile_response(db_profile)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating fluency profile: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/profiles/{learner_id}", response_model=FluencyProfileResponse)
async def get_fluency_profile(
    learner_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get fluency profile for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import FluencyProfile
    result = await db.execute(
        select(FluencyProfile).where(FluencyProfile.learner_id == learner_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fluency profile not found"
        )
    
    return _to_fluency_profile_response(profile)


@router.put("/profiles/{learner_id}", response_model=FluencyProfileResponse)
async def update_fluency_profile(
    learner_id: str,
    update: FluencyProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update fluency profile for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import FluencyProfile
    result = await db.execute(
        select(FluencyProfile).where(FluencyProfile.learner_id == learner_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fluency profile not found"
        )
    
    try:
        update_data = update.model_dump(exclude_unset=True)
        
        field_mapping = {
            "primaryStutteringTypes": "primary_stuttering_types",
            "secondaryBehaviors": "secondary_behaviors",
            "currentStutteringFrequency": "current_stuttering_frequency",
            "goalStutteringFrequency": "goal_stuttering_frequency",
            "awarenessLevel": "awareness_level",
            "usesFluencyTechniques": "uses_fluency_techniques",
            "speakingSituationsHierarchy": "speaking_situations_hierarchy",
            "avoidanceBehaviors": "avoidance_behaviors",
            "emotionalImpactScore": "emotional_impact_score",
        }
        
        for camel_key, snake_key in field_mapping.items():
            if camel_key in update_data:
                setattr(profile, snake_key, update_data[camel_key])
        
        await db.commit()
        await db.refresh(profile)
        
        logger.info(f"Updated fluency profile for learner {learner_id}")
        return _to_fluency_profile_response(profile)
        
    except Exception as e:
        logger.error(f"Error updating fluency profile: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ===== Fluency Sessions =====

@router.post("/sessions", response_model=FluencySessionResponse, status_code=status.HTTP_201_CREATED)
async def create_fluency_session(
    session: FluencySessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record a fluency therapy session with disfluency counts"""
    if not await verify_learner_access(current_user, session.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        from db.models.slp import FluencySession, FluencyProfile
        
        # Calculate stuttering frequency
        total_syllables = session.totalSyllables or 0
        total_disfluencies = (
            (session.repetitionCount or 0) +
            (session.prolongationCount or 0) +
            (session.blockCount or 0) +
            (session.interjectionCount or 0)
        )
        stuttering_frequency = (
            (total_disfluencies / total_syllables * 100) if total_syllables > 0 else 0
        )
        
        db_session = FluencySession(
            learner_id=session.learnerId,
            slp_session_id=session.slpSessionId,
            task_type=session.taskType,
            task_description=session.taskDescription,
            duration_seconds=session.durationSeconds,
            total_syllables=total_syllables,
            total_words=session.totalWords,
            repetition_count=session.repetitionCount or 0,
            prolongation_count=session.prolongationCount or 0,
            block_count=session.blockCount or 0,
            interjection_count=session.interjectionCount or 0,
            stuttering_frequency=round(stuttering_frequency, 2),
            techniques_used=session.techniquesUsed or [],
            technique_success_ratings=session.techniqueSuccessRatings or {},
            secondary_behaviors_observed=session.secondaryBehaviorsObserved or [],
            situation_difficulty_rating=session.situationDifficultyRating,
            self_rating=session.selfRating,
            therapist_notes=session.therapistNotes,
            recorded_at=session.recordedAt or datetime.utcnow(),
        )
        
        db.add(db_session)
        
        # Update profile's current frequency
        profile_result = await db.execute(
            select(FluencyProfile).where(FluencyProfile.learner_id == session.learnerId)
        )
        profile = profile_result.scalar_one_or_none()
        if profile:
            profile.current_stuttering_frequency = stuttering_frequency
        
        await db.commit()
        await db.refresh(db_session)
        
        logger.info(f"Created fluency session for learner {session.learnerId}")
        return _to_fluency_session_response(db_session)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating fluency session: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/sessions/{learner_id}", response_model=List[FluencySessionResponse])
async def get_fluency_sessions(
    learner_id: str,
    task_type: Optional[FluencyTaskType] = Query(None, description="Filter by task type"),
    from_date: Optional[datetime] = Query(None, description="Filter from date"),
    to_date: Optional[datetime] = Query(None, description="Filter to date"),
    limit: int = Query(50, le=200, description="Max sessions to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get fluency sessions for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import FluencySession
    
    query = select(FluencySession).where(FluencySession.learner_id == learner_id)
    
    if task_type:
        query = query.where(FluencySession.task_type == task_type)
    if from_date:
        query = query.where(FluencySession.recorded_at >= from_date)
    if to_date:
        query = query.where(FluencySession.recorded_at <= to_date)
    
    result = await db.execute(
        query.order_by(FluencySession.recorded_at.desc()).limit(limit)
    )
    sessions = result.scalars().all()
    
    return [_to_fluency_session_response(s) for s in sessions]


@router.get("/progress/{learner_id}", response_model=FluencyProgressResponse)
async def get_fluency_progress(
    learner_id: str,
    days: int = Query(30, description="Number of days to include"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get fluency progress summary for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import FluencySession, FluencyProfile
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get profile
    profile_result = await db.execute(
        select(FluencyProfile).where(FluencyProfile.learner_id == learner_id)
    )
    profile = profile_result.scalar_one_or_none()
    
    # Get sessions in date range
    result = await db.execute(
        select(FluencySession).where(
            and_(
                FluencySession.learner_id == learner_id,
                FluencySession.recorded_at >= cutoff_date
            )
        ).order_by(FluencySession.recorded_at)
    )
    sessions = result.scalars().all()
    
    if not sessions:
        return FluencyProgressResponse(
            learnerId=learner_id,
            periodDays=days,
            totalSessions=0,
            baselineFrequency=profile.baseline_stuttering_frequency if profile else None,
            currentFrequency=profile.current_stuttering_frequency if profile else None,
            goalFrequency=profile.goal_stuttering_frequency if profile else None,
            averageFrequency=None,
            frequencyTrend=[],
            disfluencyBreakdown={},
            techniqueUsage={},
        )
    
    # Calculate statistics
    total_sessions = len(sessions)
    avg_frequency = sum(s.stuttering_frequency for s in sessions) / total_sessions
    
    # Frequency trend by date
    frequency_trend = [
        {
            "date": s.recorded_at.date().isoformat(),
            "frequency": s.stuttering_frequency,
            "taskType": s.task_type,
        }
        for s in sessions
    ]
    
    # Disfluency breakdown
    total_reps = sum(s.repetition_count for s in sessions)
    total_prols = sum(s.prolongation_count for s in sessions)
    total_blocks = sum(s.block_count for s in sessions)
    total_interj = sum(s.interjection_count for s in sessions)
    total_all = total_reps + total_prols + total_blocks + total_interj
    
    disfluency_breakdown = {
        "repetitions": total_reps,
        "prolongations": total_prols,
        "blocks": total_blocks,
        "interjections": total_interj,
        "percentages": {
            "repetitions": round(total_reps / total_all * 100, 1) if total_all > 0 else 0,
            "prolongations": round(total_prols / total_all * 100, 1) if total_all > 0 else 0,
            "blocks": round(total_blocks / total_all * 100, 1) if total_all > 0 else 0,
            "interjections": round(total_interj / total_all * 100, 1) if total_all > 0 else 0,
        }
    }
    
    # Technique usage
    technique_counts = {}
    for s in sessions:
        for technique in (s.techniques_used or []):
            technique_counts[technique] = technique_counts.get(technique, 0) + 1
    
    return FluencyProgressResponse(
        learnerId=learner_id,
        periodDays=days,
        totalSessions=total_sessions,
        baselineFrequency=profile.baseline_stuttering_frequency if profile else None,
        currentFrequency=sessions[-1].stuttering_frequency if sessions else None,
        goalFrequency=profile.goal_stuttering_frequency if profile else None,
        averageFrequency=round(avg_frequency, 2),
        frequencyTrend=frequency_trend,
        disfluencyBreakdown=disfluency_breakdown,
        techniqueUsage=technique_counts,
    )


def _to_fluency_profile_response(profile) -> FluencyProfileResponse:
    """Convert database model to response schema"""
    return FluencyProfileResponse(
        id=profile.id,
        learnerId=profile.learner_id,
        primaryStutteringTypes=profile.primary_stuttering_types or [],
        secondaryBehaviors=profile.secondary_behaviors or [],
        baselineStutteringFrequency=profile.baseline_stuttering_frequency,
        currentStutteringFrequency=profile.current_stuttering_frequency,
        goalStutteringFrequency=profile.goal_stuttering_frequency,
        awarenessLevel=profile.awareness_level,
        usesFluencyTechniques=profile.uses_fluency_techniques or [],
        speakingSituationsHierarchy=profile.speaking_situations_hierarchy or [],
        avoidanceBehaviors=profile.avoidance_behaviors or [],
        emotionalImpactScore=profile.emotional_impact_score,
        createdAt=profile.created_at,
        updatedAt=profile.updated_at,
    )


def _to_fluency_session_response(session) -> FluencySessionResponse:
    """Convert database model to response schema"""
    return FluencySessionResponse(
        id=session.id,
        learnerId=session.learner_id,
        slpSessionId=session.slp_session_id,
        taskType=session.task_type,
        taskDescription=session.task_description,
        durationSeconds=session.duration_seconds,
        totalSyllables=session.total_syllables,
        totalWords=session.total_words,
        repetitionCount=session.repetition_count,
        prolongationCount=session.prolongation_count,
        blockCount=session.block_count,
        interjectionCount=session.interjection_count,
        stutteringFrequency=session.stuttering_frequency,
        techniquesUsed=session.techniques_used or [],
        techniqueSuccessRatings=session.technique_success_ratings or {},
        secondaryBehaviorsObserved=session.secondary_behaviors_observed or [],
        situationDifficultyRating=session.situation_difficulty_rating,
        selfRating=session.self_rating,
        therapistNotes=session.therapist_notes,
        recordedAt=session.recorded_at,
        createdAt=session.created_at,
    )
