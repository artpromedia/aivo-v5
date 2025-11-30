"""
SLP Sessions Routes
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
    SLPSessionCreate,
    SLPSessionUpdate,
    SLPSessionResponse,
    SLPSessionType,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter(prefix="/slp/sessions", tags=["SLP Sessions"])
logger = setup_logging(__name__)


@router.post("", response_model=SLPSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_slp_session(
    session: SLPSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create an SLP therapy session"""
    if not await verify_learner_access(current_user, session.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        from db.models.slp import SLPSession
        
        db_session = SLPSession(
            learner_id=session.learnerId,
            slp_id=session.slpId,
            session_type=session.sessionType,
            session_date=session.sessionDate or datetime.utcnow(),
            duration_minutes=session.durationMinutes,
            location=session.location,
            session_format=session.sessionFormat,
            goals_addressed=session.goalsAddressed or [],
            activities_completed=session.activitiesCompleted or [],
            materials_used=session.materialsUsed or [],
            learner_engagement_rating=session.learnerEngagementRating,
            learner_mood=session.learnerMood,
            progress_notes=session.progressNotes,
            clinical_observations=session.clinicalObservations,
            parent_communication=session.parentCommunication,
            homework_assigned=session.homeworkAssigned,
            next_session_focus=session.nextSessionFocus,
            billing_code=session.billingCode,
            is_billable=session.isBillable if session.isBillable is not None else True,
        )
        
        db.add(db_session)
        await db.commit()
        await db.refresh(db_session)
        
        logger.info(f"Created SLP session for learner {session.learnerId}")
        return _to_session_response(db_session)
        
    except Exception as e:
        logger.error(f"Error creating SLP session: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{learner_id}", response_model=List[SLPSessionResponse])
async def get_slp_sessions(
    learner_id: str,
    session_type: Optional[SLPSessionType] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get SLP sessions for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import SLPSession
    
    query = select(SLPSession).where(SLPSession.learner_id == learner_id)
    
    if session_type:
        query = query.where(SLPSession.session_type == session_type)
    if from_date:
        query = query.where(SLPSession.session_date >= from_date)
    if to_date:
        query = query.where(SLPSession.session_date <= to_date)
    
    result = await db.execute(
        query.order_by(SLPSession.session_date.desc()).limit(limit)
    )
    sessions = result.scalars().all()
    
    return [_to_session_response(s) for s in sessions]


@router.get("/detail/{session_id}", response_model=SLPSessionResponse)
async def get_slp_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific SLP session"""
    from db.models.slp import SLPSession
    
    result = await db.execute(
        select(SLPSession).where(SLPSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SLP session not found"
        )
    
    if not await verify_learner_access(current_user, session.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    return _to_session_response(session)


@router.put("/{session_id}", response_model=SLPSessionResponse)
async def update_slp_session(
    session_id: str,
    update: SLPSessionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an SLP session"""
    from db.models.slp import SLPSession
    
    result = await db.execute(
        select(SLPSession).where(SLPSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SLP session not found"
        )
    
    if not await verify_learner_access(current_user, session.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        update_data = update.model_dump(exclude_unset=True)
        
        field_mapping = {
            "sessionType": "session_type",
            "sessionDate": "session_date",
            "durationMinutes": "duration_minutes",
            "sessionFormat": "session_format",
            "goalsAddressed": "goals_addressed",
            "activitiesCompleted": "activities_completed",
            "materialsUsed": "materials_used",
            "learnerEngagementRating": "learner_engagement_rating",
            "learnerMood": "learner_mood",
            "progressNotes": "progress_notes",
            "clinicalObservations": "clinical_observations",
            "parentCommunication": "parent_communication",
            "homeworkAssigned": "homework_assigned",
            "nextSessionFocus": "next_session_focus",
            "billingCode": "billing_code",
            "isBillable": "is_billable",
        }
        
        for camel_key, snake_key in field_mapping.items():
            if camel_key in update_data:
                setattr(session, snake_key, update_data[camel_key])
        
        if "location" in update_data:
            session.location = update_data["location"]
        
        await db.commit()
        await db.refresh(session)
        
        logger.info(f"Updated SLP session {session_id}")
        return _to_session_response(session)
        
    except Exception as e:
        logger.error(f"Error updating SLP session: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_slp_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an SLP session"""
    from db.models.slp import SLPSession
    
    result = await db.execute(
        select(SLPSession).where(SLPSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SLP session not found"
        )
    
    if not await verify_learner_access(current_user, session.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        await db.delete(session)
        await db.commit()
        logger.info(f"Deleted SLP session {session_id}")
    except Exception as e:
        logger.error(f"Error deleting SLP session: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/stats/{learner_id}")
async def get_session_stats(
    learner_id: str,
    days: int = Query(30, description="Number of days to include"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get session statistics for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import SLPSession
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    result = await db.execute(
        select(SLPSession).where(
            and_(
                SLPSession.learner_id == learner_id,
                SLPSession.session_date >= cutoff_date
            )
        )
    )
    sessions = result.scalars().all()
    
    # Calculate stats
    total_sessions = len(sessions)
    total_minutes = sum(s.duration_minutes or 0 for s in sessions)
    
    # By session type
    by_type = {}
    for s in sessions:
        st = s.session_type or "OTHER"
        if st not in by_type:
            by_type[st] = {"count": 0, "minutes": 0}
        by_type[st]["count"] += 1
        by_type[st]["minutes"] += s.duration_minutes or 0
    
    # Average engagement
    engagement_ratings = [s.learner_engagement_rating for s in sessions if s.learner_engagement_rating]
    avg_engagement = round(sum(engagement_ratings) / len(engagement_ratings), 1) if engagement_ratings else None
    
    # Sessions by week
    weekly_counts = {}
    for s in sessions:
        week_key = s.session_date.strftime("%Y-W%W")
        weekly_counts[week_key] = weekly_counts.get(week_key, 0) + 1
    
    return {
        "learnerId": learner_id,
        "periodDays": days,
        "totalSessions": total_sessions,
        "totalMinutes": total_minutes,
        "averageSessionMinutes": round(total_minutes / total_sessions, 1) if total_sessions > 0 else 0,
        "averageEngagement": avg_engagement,
        "bySessionType": by_type,
        "weeklySessionCounts": weekly_counts,
    }


def _to_session_response(session) -> SLPSessionResponse:
    """Convert database model to response schema"""
    return SLPSessionResponse(
        id=session.id,
        learnerId=session.learner_id,
        slpId=session.slp_id,
        sessionType=session.session_type,
        sessionDate=session.session_date,
        durationMinutes=session.duration_minutes,
        location=session.location,
        sessionFormat=session.session_format,
        goalsAddressed=session.goals_addressed or [],
        activitiesCompleted=session.activities_completed or [],
        materialsUsed=session.materials_used or [],
        learnerEngagementRating=session.learner_engagement_rating,
        learnerMood=session.learner_mood,
        progressNotes=session.progress_notes,
        clinicalObservations=session.clinical_observations,
        parentCommunication=session.parent_communication,
        homeworkAssigned=session.homework_assigned,
        nextSessionFocus=session.next_session_focus,
        billingCode=session.billing_code,
        isBillable=session.is_billable,
        createdAt=session.created_at,
        updatedAt=session.updated_at,
    )
