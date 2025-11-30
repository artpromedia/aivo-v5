"""
Parent Speech Homework Routes
Author: artpromedia
Date: 2025-01-14
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import datetime, timedelta

from db.database import get_db
from db.models.user import User
from api.schemas.slp import (
    ParentSpeechHomeworkCreate,
    ParentSpeechHomeworkUpdate,
    ParentSpeechHomeworkResponse,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter(prefix="/slp/homework", tags=["SLP Homework"])
logger = setup_logging(__name__)


@router.post("", response_model=ParentSpeechHomeworkResponse, status_code=status.HTTP_201_CREATED)
async def create_homework(
    homework: ParentSpeechHomeworkCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Assign speech homework for parent practice"""
    if not await verify_learner_access(current_user, homework.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        from db.models.slp import ParentSpeechHomework
        
        db_homework = ParentSpeechHomework(
            learner_id=homework.learnerId,
            assigned_by_id=homework.assignedById or str(current_user.id),
            session_id=homework.sessionId,
            title=homework.title,
            instructions=homework.instructions,
            target_sounds=homework.targetSounds or [],
            target_words=homework.targetWords or [],
            target_sentences=homework.targetSentences or [],
            activity_type=homework.activityType,
            recommended_minutes_per_day=homework.recommendedMinutesPerDay,
            recommended_days_per_week=homework.recommendedDaysPerWeek,
            due_date=homework.dueDate,
            resources_urls=homework.resourcesUrls or [],
            video_model_url=homework.videoModelUrl,
            is_active=True,
        )
        
        db.add(db_homework)
        await db.commit()
        await db.refresh(db_homework)
        
        logger.info(f"Created speech homework for learner {homework.learnerId}")
        return _to_homework_response(db_homework)
        
    except Exception as e:
        logger.error(f"Error creating speech homework: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{learner_id}", response_model=List[ParentSpeechHomeworkResponse])
async def get_homework(
    learner_id: str,
    active_only: bool = Query(True, description="Filter to active homework only"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get speech homework assignments for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import ParentSpeechHomework
    
    query = select(ParentSpeechHomework).where(ParentSpeechHomework.learner_id == learner_id)
    
    if active_only:
        query = query.where(ParentSpeechHomework.is_active == True)
    
    result = await db.execute(query.order_by(ParentSpeechHomework.created_at.desc()))
    homework_list = result.scalars().all()
    
    return [_to_homework_response(h) for h in homework_list]


@router.get("/detail/{homework_id}", response_model=ParentSpeechHomeworkResponse)
async def get_homework_detail(
    homework_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific homework assignment"""
    from db.models.slp import ParentSpeechHomework
    
    result = await db.execute(
        select(ParentSpeechHomework).where(ParentSpeechHomework.id == homework_id)
    )
    homework = result.scalar_one_or_none()
    
    if not homework:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Homework not found"
        )
    
    if not await verify_learner_access(current_user, homework.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    return _to_homework_response(homework)


@router.put("/{homework_id}", response_model=ParentSpeechHomeworkResponse)
async def update_homework(
    homework_id: str,
    update: ParentSpeechHomeworkUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a homework assignment"""
    from db.models.slp import ParentSpeechHomework
    
    result = await db.execute(
        select(ParentSpeechHomework).where(ParentSpeechHomework.id == homework_id)
    )
    homework = result.scalar_one_or_none()
    
    if not homework:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Homework not found"
        )
    
    if not await verify_learner_access(current_user, homework.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        update_data = update.model_dump(exclude_unset=True)
        
        field_mapping = {
            "targetSounds": "target_sounds",
            "targetWords": "target_words",
            "targetSentences": "target_sentences",
            "activityType": "activity_type",
            "recommendedMinutesPerDay": "recommended_minutes_per_day",
            "recommendedDaysPerWeek": "recommended_days_per_week",
            "dueDate": "due_date",
            "resourcesUrls": "resources_urls",
            "videoModelUrl": "video_model_url",
            "isActive": "is_active",
            "completedAt": "completed_at",
            "parentFeedback": "parent_feedback",
            "practiceLogCount": "practice_log_count",
            "totalPracticeMinutes": "total_practice_minutes",
        }
        
        for camel_key, snake_key in field_mapping.items():
            if camel_key in update_data:
                setattr(homework, snake_key, update_data[camel_key])
        
        # Handle direct fields
        for field in ["title", "instructions"]:
            if field in update_data:
                setattr(homework, field, update_data[field])
        
        await db.commit()
        await db.refresh(homework)
        
        logger.info(f"Updated speech homework {homework_id}")
        return _to_homework_response(homework)
        
    except Exception as e:
        logger.error(f"Error updating speech homework: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/{homework_id}/log-practice", response_model=ParentSpeechHomeworkResponse)
async def log_practice(
    homework_id: str,
    minutes: int = Query(..., ge=1, le=120, description="Practice duration in minutes"),
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Log a parent practice session for homework"""
    from db.models.slp import ParentSpeechHomework
    
    result = await db.execute(
        select(ParentSpeechHomework).where(ParentSpeechHomework.id == homework_id)
    )
    homework = result.scalar_one_or_none()
    
    if not homework:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Homework not found"
        )
    
    if not await verify_learner_access(current_user, homework.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        homework.practice_log_count = (homework.practice_log_count or 0) + 1
        homework.total_practice_minutes = (homework.total_practice_minutes or 0) + minutes
        
        if notes:
            homework.parent_feedback = notes
        
        await db.commit()
        await db.refresh(homework)
        
        logger.info(f"Logged {minutes} min practice for homework {homework_id}")
        return _to_homework_response(homework)
        
    except Exception as e:
        logger.error(f"Error logging practice: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/{homework_id}/complete", response_model=ParentSpeechHomeworkResponse)
async def mark_homework_complete(
    homework_id: str,
    feedback: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark homework as completed"""
    from db.models.slp import ParentSpeechHomework
    
    result = await db.execute(
        select(ParentSpeechHomework).where(ParentSpeechHomework.id == homework_id)
    )
    homework = result.scalar_one_or_none()
    
    if not homework:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Homework not found"
        )
    
    if not await verify_learner_access(current_user, homework.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        homework.completed_at = datetime.utcnow()
        homework.is_active = False
        
        if feedback:
            homework.parent_feedback = feedback
        
        await db.commit()
        await db.refresh(homework)
        
        logger.info(f"Marked homework {homework_id} as complete")
        return _to_homework_response(homework)
        
    except Exception as e:
        logger.error(f"Error completing homework: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/{homework_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_homework(
    homework_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a homework assignment"""
    from db.models.slp import ParentSpeechHomework
    
    result = await db.execute(
        select(ParentSpeechHomework).where(ParentSpeechHomework.id == homework_id)
    )
    homework = result.scalar_one_or_none()
    
    if not homework:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Homework not found"
        )
    
    if not await verify_learner_access(current_user, homework.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        await db.delete(homework)
        await db.commit()
        logger.info(f"Deleted homework {homework_id}")
    except Exception as e:
        logger.error(f"Error deleting homework: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/stats/{learner_id}")
async def get_homework_stats(
    learner_id: str,
    days: int = Query(30, description="Number of days to include"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get homework completion statistics"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import ParentSpeechHomework
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    result = await db.execute(
        select(ParentSpeechHomework).where(
            and_(
                ParentSpeechHomework.learner_id == learner_id,
                ParentSpeechHomework.created_at >= cutoff_date
            )
        )
    )
    homework_list = result.scalars().all()
    
    total_assigned = len(homework_list)
    completed = sum(1 for h in homework_list if h.completed_at)
    active = sum(1 for h in homework_list if h.is_active)
    total_practice_minutes = sum(h.total_practice_minutes or 0 for h in homework_list)
    total_practice_sessions = sum(h.practice_log_count or 0 for h in homework_list)
    
    # Practice compliance
    expected_minutes = sum(
        (h.recommended_minutes_per_day or 0) * (h.recommended_days_per_week or 0) * (days // 7)
        for h in homework_list
    )
    compliance_rate = round(total_practice_minutes / expected_minutes * 100, 1) if expected_minutes > 0 else None
    
    return {
        "learnerId": learner_id,
        "periodDays": days,
        "totalAssigned": total_assigned,
        "completed": completed,
        "active": active,
        "completionRate": round(completed / total_assigned * 100, 1) if total_assigned > 0 else 0,
        "totalPracticeMinutes": total_practice_minutes,
        "totalPracticeSessions": total_practice_sessions,
        "averageMinutesPerSession": round(total_practice_minutes / total_practice_sessions, 1) if total_practice_sessions > 0 else 0,
        "complianceRate": compliance_rate,
    }


def _to_homework_response(homework) -> ParentSpeechHomeworkResponse:
    """Convert database model to response schema"""
    return ParentSpeechHomeworkResponse(
        id=homework.id,
        learnerId=homework.learner_id,
        assignedById=homework.assigned_by_id,
        sessionId=homework.session_id,
        title=homework.title,
        instructions=homework.instructions,
        targetSounds=homework.target_sounds or [],
        targetWords=homework.target_words or [],
        targetSentences=homework.target_sentences or [],
        activityType=homework.activity_type,
        recommendedMinutesPerDay=homework.recommended_minutes_per_day,
        recommendedDaysPerWeek=homework.recommended_days_per_week,
        dueDate=homework.due_date,
        resourcesUrls=homework.resources_urls or [],
        videoModelUrl=homework.video_model_url,
        isActive=homework.is_active,
        completedAt=homework.completed_at,
        parentFeedback=homework.parent_feedback,
        practiceLogCount=homework.practice_log_count,
        totalPracticeMinutes=homework.total_practice_minutes,
        createdAt=homework.created_at,
        updatedAt=homework.updated_at,
    )
