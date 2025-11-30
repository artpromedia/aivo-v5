"""
Articulation Therapy Routes
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
    ArticulationTargetCreate,
    ArticulationTargetUpdate,
    ArticulationTargetResponse,
    ArticulationTrialCreate,
    ArticulationTrialResponse,
    ArticulationProgressResponse,
    PhonemePosition,
    ArticulationLevel,
    ArticulationErrorType,
    PromptLevel,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter(prefix="/slp/articulation", tags=["SLP Articulation"])
logger = setup_logging(__name__)


# ===== Articulation Targets =====

@router.post("/targets", response_model=ArticulationTargetResponse, status_code=status.HTTP_201_CREATED)
async def create_articulation_target(
    target: ArticulationTargetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create an articulation target (phoneme/sound to work on)"""
    if not await verify_learner_access(current_user, target.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        from db.models.slp import ArticulationTarget
        
        db_target = ArticulationTarget(
            learner_id=target.learnerId,
            phoneme=target.phoneme,
            position=target.position,
            current_level=target.currentLevel,
            target_level=target.targetLevel,
            baseline_accuracy=target.baselineAccuracy,
            current_accuracy=target.baselineAccuracy,  # Start at baseline
            goal_accuracy=target.goalAccuracy,
            exemplar_words=target.exemplarWords or [],
            is_active=True,
        )
        
        db.add(db_target)
        await db.commit()
        await db.refresh(db_target)
        
        logger.info(f"Created articulation target {target.phoneme} for learner {target.learnerId}")
        return _to_target_response(db_target)
        
    except Exception as e:
        logger.error(f"Error creating articulation target: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/targets/{learner_id}", response_model=List[ArticulationTargetResponse])
async def get_articulation_targets(
    learner_id: str,
    active_only: bool = Query(True, description="Filter to active targets only"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all articulation targets for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import ArticulationTarget
    
    query = select(ArticulationTarget).where(ArticulationTarget.learner_id == learner_id)
    if active_only:
        query = query.where(ArticulationTarget.is_active == True)
    
    result = await db.execute(query.order_by(ArticulationTarget.created_at.desc()))
    targets = result.scalars().all()
    
    return [_to_target_response(t) for t in targets]


@router.put("/targets/{target_id}", response_model=ArticulationTargetResponse)
async def update_articulation_target(
    target_id: str,
    update: ArticulationTargetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an articulation target"""
    from db.models.slp import ArticulationTarget
    
    result = await db.execute(
        select(ArticulationTarget).where(ArticulationTarget.id == target_id)
    )
    target = result.scalar_one_or_none()
    
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Articulation target not found"
        )
    
    if not await verify_learner_access(current_user, target.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        update_data = update.model_dump(exclude_unset=True)
        
        field_mapping = {
            "currentLevel": "current_level",
            "targetLevel": "target_level",
            "currentAccuracy": "current_accuracy",
            "goalAccuracy": "goal_accuracy",
            "exemplarWords": "exemplar_words",
            "isActive": "is_active",
            "masteredAt": "mastered_at",
        }
        
        for camel_key, snake_key in field_mapping.items():
            if camel_key in update_data:
                setattr(target, snake_key, update_data[camel_key])
        
        await db.commit()
        await db.refresh(target)
        
        logger.info(f"Updated articulation target {target_id}")
        return _to_target_response(target)
        
    except Exception as e:
        logger.error(f"Error updating articulation target: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ===== Articulation Trials =====

@router.post("/trials", response_model=ArticulationTrialResponse, status_code=status.HTTP_201_CREATED)
async def record_articulation_trial(
    trial: ArticulationTrialCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record an articulation trial (single attempt at a word/sound)"""
    if not await verify_learner_access(current_user, trial.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        from db.models.slp import ArticulationTrial, ArticulationTarget
        
        # Verify target exists
        if trial.targetId:
            result = await db.execute(
                select(ArticulationTarget).where(ArticulationTarget.id == trial.targetId)
            )
            target = result.scalar_one_or_none()
            if not target:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Articulation target not found"
                )
        
        db_trial = ArticulationTrial(
            learner_id=trial.learnerId,
            target_id=trial.targetId,
            session_id=trial.sessionId,
            phoneme=trial.phoneme,
            position=trial.position,
            stimulus_word=trial.stimulusWord,
            level=trial.level,
            is_correct=trial.isCorrect,
            error_type=trial.errorType,
            prompt_level=trial.promptLevel,
            response_time_ms=trial.responseTimeMs,
            audio_recording_url=trial.audioRecordingUrl,
            therapist_notes=trial.therapistNotes,
            recorded_at=trial.recordedAt or datetime.utcnow(),
        )
        
        db.add(db_trial)
        
        # Update target accuracy if linked to a target
        if trial.targetId:
            await _update_target_accuracy(db, trial.targetId)
        
        await db.commit()
        await db.refresh(db_trial)
        
        logger.info(f"Recorded articulation trial for learner {trial.learnerId}")
        return _to_trial_response(db_trial)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording articulation trial: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/trials/batch", response_model=List[ArticulationTrialResponse], status_code=status.HTTP_201_CREATED)
async def record_articulation_trials_batch(
    trials: List[ArticulationTrialCreate],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record multiple articulation trials at once (for session data entry)"""
    if not trials:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No trials provided"
        )
    
    # Verify access to learner
    learner_id = trials[0].learnerId
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        from db.models.slp import ArticulationTrial
        
        db_trials = []
        target_ids = set()
        
        for trial in trials:
            if trial.learnerId != learner_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="All trials must be for the same learner"
                )
            
            db_trial = ArticulationTrial(
                learner_id=trial.learnerId,
                target_id=trial.targetId,
                session_id=trial.sessionId,
                phoneme=trial.phoneme,
                position=trial.position,
                stimulus_word=trial.stimulusWord,
                level=trial.level,
                is_correct=trial.isCorrect,
                error_type=trial.errorType,
                prompt_level=trial.promptLevel,
                response_time_ms=trial.responseTimeMs,
                audio_recording_url=trial.audioRecordingUrl,
                therapist_notes=trial.therapistNotes,
                recorded_at=trial.recordedAt or datetime.utcnow(),
            )
            
            db.add(db_trial)
            db_trials.append(db_trial)
            
            if trial.targetId:
                target_ids.add(trial.targetId)
        
        # Update target accuracies
        for target_id in target_ids:
            await _update_target_accuracy(db, target_id)
        
        await db.commit()
        
        for db_trial in db_trials:
            await db.refresh(db_trial)
        
        logger.info(f"Recorded {len(db_trials)} articulation trials for learner {learner_id}")
        return [_to_trial_response(t) for t in db_trials]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording articulation trials batch: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/trials/{learner_id}", response_model=List[ArticulationTrialResponse])
async def get_articulation_trials(
    learner_id: str,
    target_id: Optional[str] = Query(None, description="Filter by target"),
    session_id: Optional[str] = Query(None, description="Filter by session"),
    from_date: Optional[datetime] = Query(None, description="Filter from date"),
    to_date: Optional[datetime] = Query(None, description="Filter to date"),
    limit: int = Query(100, le=500, description="Max trials to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get articulation trials for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import ArticulationTrial
    
    query = select(ArticulationTrial).where(ArticulationTrial.learner_id == learner_id)
    
    if target_id:
        query = query.where(ArticulationTrial.target_id == target_id)
    if session_id:
        query = query.where(ArticulationTrial.session_id == session_id)
    if from_date:
        query = query.where(ArticulationTrial.recorded_at >= from_date)
    if to_date:
        query = query.where(ArticulationTrial.recorded_at <= to_date)
    
    result = await db.execute(
        query.order_by(ArticulationTrial.recorded_at.desc()).limit(limit)
    )
    trials = result.scalars().all()
    
    return [_to_trial_response(t) for t in trials]


@router.get("/progress/{learner_id}", response_model=ArticulationProgressResponse)
async def get_articulation_progress(
    learner_id: str,
    target_id: Optional[str] = Query(None, description="Filter by target"),
    days: int = Query(30, description="Number of days to include"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get articulation progress summary for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import ArticulationTrial, ArticulationTarget
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get trials in date range
    query = select(ArticulationTrial).where(
        and_(
            ArticulationTrial.learner_id == learner_id,
            ArticulationTrial.recorded_at >= cutoff_date
        )
    )
    if target_id:
        query = query.where(ArticulationTrial.target_id == target_id)
    
    result = await db.execute(query)
    trials = result.scalars().all()
    
    # Get active targets
    targets_query = select(ArticulationTarget).where(
        and_(
            ArticulationTarget.learner_id == learner_id,
            ArticulationTarget.is_active == True
        )
    )
    targets_result = await db.execute(targets_query)
    targets = targets_result.scalars().all()
    
    # Calculate statistics
    total_trials = len(trials)
    correct_trials = sum(1 for t in trials if t.is_correct)
    overall_accuracy = (correct_trials / total_trials * 100) if total_trials > 0 else 0
    
    # Group by phoneme
    phoneme_stats = {}
    for trial in trials:
        key = f"{trial.phoneme}_{trial.position}"
        if key not in phoneme_stats:
            phoneme_stats[key] = {"total": 0, "correct": 0, "phoneme": trial.phoneme, "position": trial.position}
        phoneme_stats[key]["total"] += 1
        if trial.is_correct:
            phoneme_stats[key]["correct"] += 1
    
    phoneme_progress = [
        {
            "phoneme": stats["phoneme"],
            "position": stats["position"],
            "totalTrials": stats["total"],
            "correctTrials": stats["correct"],
            "accuracy": round(stats["correct"] / stats["total"] * 100, 1) if stats["total"] > 0 else 0
        }
        for stats in phoneme_stats.values()
    ]
    
    # Group by date for trend
    daily_stats = {}
    for trial in trials:
        date_key = trial.recorded_at.date().isoformat()
        if date_key not in daily_stats:
            daily_stats[date_key] = {"total": 0, "correct": 0}
        daily_stats[date_key]["total"] += 1
        if trial.is_correct:
            daily_stats[date_key]["correct"] += 1
    
    daily_progress = [
        {
            "date": date,
            "totalTrials": stats["total"],
            "correctTrials": stats["correct"],
            "accuracy": round(stats["correct"] / stats["total"] * 100, 1) if stats["total"] > 0 else 0
        }
        for date, stats in sorted(daily_stats.items())
    ]
    
    return ArticulationProgressResponse(
        learnerId=learner_id,
        periodDays=days,
        totalTrials=total_trials,
        correctTrials=correct_trials,
        overallAccuracy=round(overall_accuracy, 1),
        activeTargets=len(targets),
        masteredTargets=sum(1 for t in targets if t.mastered_at is not None),
        phonemeProgress=phoneme_progress,
        dailyProgress=daily_progress,
    )


async def _update_target_accuracy(db: AsyncSession, target_id: str):
    """Update target accuracy based on recent trials"""
    from db.models.slp import ArticulationTrial, ArticulationTarget
    
    # Get last 20 trials for this target
    result = await db.execute(
        select(ArticulationTrial)
        .where(ArticulationTrial.target_id == target_id)
        .order_by(ArticulationTrial.recorded_at.desc())
        .limit(20)
    )
    recent_trials = result.scalars().all()
    
    if recent_trials:
        correct = sum(1 for t in recent_trials if t.is_correct)
        accuracy = round(correct / len(recent_trials) * 100, 1)
        
        # Update target
        target_result = await db.execute(
            select(ArticulationTarget).where(ArticulationTarget.id == target_id)
        )
        target = target_result.scalar_one_or_none()
        
        if target:
            target.current_accuracy = accuracy
            
            # Check if mastered (80%+ accuracy on 3 consecutive sessions)
            if accuracy >= target.goal_accuracy and target.mastered_at is None:
                # Simplified mastery check - could be more sophisticated
                target.mastered_at = datetime.utcnow()


def _to_target_response(target) -> ArticulationTargetResponse:
    """Convert database model to response schema"""
    return ArticulationTargetResponse(
        id=target.id,
        learnerId=target.learner_id,
        phoneme=target.phoneme,
        position=target.position,
        currentLevel=target.current_level,
        targetLevel=target.target_level,
        baselineAccuracy=target.baseline_accuracy,
        currentAccuracy=target.current_accuracy,
        goalAccuracy=target.goal_accuracy,
        exemplarWords=target.exemplar_words or [],
        isActive=target.is_active,
        masteredAt=target.mastered_at,
        createdAt=target.created_at,
        updatedAt=target.updated_at,
    )


def _to_trial_response(trial) -> ArticulationTrialResponse:
    """Convert database model to response schema"""
    return ArticulationTrialResponse(
        id=trial.id,
        learnerId=trial.learner_id,
        targetId=trial.target_id,
        sessionId=trial.session_id,
        phoneme=trial.phoneme,
        position=trial.position,
        stimulusWord=trial.stimulus_word,
        level=trial.level,
        isCorrect=trial.is_correct,
        errorType=trial.error_type,
        promptLevel=trial.prompt_level,
        responseTimeMs=trial.response_time_ms,
        audioRecordingUrl=trial.audio_recording_url,
        therapistNotes=trial.therapist_notes,
        recordedAt=trial.recorded_at,
        createdAt=trial.created_at,
    )
