"""
SLP Goals Routes
Author: artpromedia
Date: 2025-01-14
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import datetime

from db.database import get_db
from db.models.user import User
from api.schemas.slp import (
    SLPGoalCreate,
    SLPGoalUpdate,
    SLPGoalResponse,
    SLPGoalProgressResponse,
    SLPGoalStatus,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter(prefix="/slp/goals", tags=["SLP Goals"])
logger = setup_logging(__name__)


@router.post("", response_model=SLPGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_slp_goal(
    goal: SLPGoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create an SLP IEP goal"""
    if not await verify_learner_access(current_user, goal.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        from db.models.slp import SLPGoal
        
        db_goal = SLPGoal(
            learner_id=goal.learnerId,
            goal_area=goal.goalArea,
            annual_goal=goal.annualGoal,
            short_term_objectives=goal.shortTermObjectives or [],
            baseline_performance=goal.baselinePerformance,
            current_performance=goal.baselinePerformance,
            target_performance=goal.targetPerformance,
            measurement_method=goal.measurementMethod,
            measurement_criteria=goal.measurementCriteria,
            data_collection_frequency=goal.dataCollectionFrequency,
            status=goal.status or SLPGoalStatus.NOT_STARTED,
            target_date=goal.targetDate,
            iep_id=goal.iepId,
        )
        
        db.add(db_goal)
        await db.commit()
        await db.refresh(db_goal)
        
        logger.info(f"Created SLP goal for learner {goal.learnerId}")
        return _to_goal_response(db_goal)
        
    except Exception as e:
        logger.error(f"Error creating SLP goal: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{learner_id}", response_model=List[SLPGoalResponse])
async def get_slp_goals(
    learner_id: str,
    status_filter: Optional[SLPGoalStatus] = Query(None, alias="status"),
    goal_area: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get SLP goals for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import SLPGoal
    
    query = select(SLPGoal).where(SLPGoal.learner_id == learner_id)
    
    if status_filter:
        query = query.where(SLPGoal.status == status_filter)
    if goal_area:
        query = query.where(SLPGoal.goal_area == goal_area)
    
    result = await db.execute(query.order_by(SLPGoal.created_at.desc()))
    goals = result.scalars().all()
    
    return [_to_goal_response(g) for g in goals]


@router.get("/detail/{goal_id}", response_model=SLPGoalResponse)
async def get_slp_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific SLP goal"""
    from db.models.slp import SLPGoal
    
    result = await db.execute(
        select(SLPGoal).where(SLPGoal.id == goal_id)
    )
    goal = result.scalar_one_or_none()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SLP goal not found"
        )
    
    if not await verify_learner_access(current_user, goal.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    return _to_goal_response(goal)


@router.put("/{goal_id}", response_model=SLPGoalResponse)
async def update_slp_goal(
    goal_id: str,
    update: SLPGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an SLP goal"""
    from db.models.slp import SLPGoal
    
    result = await db.execute(
        select(SLPGoal).where(SLPGoal.id == goal_id)
    )
    goal = result.scalar_one_or_none()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SLP goal not found"
        )
    
    if not await verify_learner_access(current_user, goal.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        update_data = update.model_dump(exclude_unset=True)
        
        field_mapping = {
            "goalArea": "goal_area",
            "annualGoal": "annual_goal",
            "shortTermObjectives": "short_term_objectives",
            "baselinePerformance": "baseline_performance",
            "currentPerformance": "current_performance",
            "targetPerformance": "target_performance",
            "measurementMethod": "measurement_method",
            "measurementCriteria": "measurement_criteria",
            "dataCollectionFrequency": "data_collection_frequency",
            "targetDate": "target_date",
            "masteredDate": "mastered_date",
            "iepId": "iep_id",
        }
        
        for camel_key, snake_key in field_mapping.items():
            if camel_key in update_data:
                setattr(goal, snake_key, update_data[camel_key])
        
        if "status" in update_data:
            goal.status = update_data["status"]
            if update_data["status"] == SLPGoalStatus.MASTERED and not goal.mastered_date:
                goal.mastered_date = datetime.utcnow()
        
        await db.commit()
        await db.refresh(goal)
        
        logger.info(f"Updated SLP goal {goal_id}")
        return _to_goal_response(goal)
        
    except Exception as e:
        logger.error(f"Error updating SLP goal: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/{goal_id}/progress", response_model=SLPGoalResponse)
async def record_goal_progress(
    goal_id: str,
    current_performance: float,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record progress toward an SLP goal"""
    from db.models.slp import SLPGoal
    
    result = await db.execute(
        select(SLPGoal).where(SLPGoal.id == goal_id)
    )
    goal = result.scalar_one_or_none()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SLP goal not found"
        )
    
    if not await verify_learner_access(current_user, goal.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        goal.current_performance = current_performance
        
        # Auto-update status based on performance
        if current_performance >= goal.target_performance:
            goal.status = SLPGoalStatus.MASTERED
            if not goal.mastered_date:
                goal.mastered_date = datetime.utcnow()
        elif goal.status == SLPGoalStatus.NOT_STARTED:
            goal.status = SLPGoalStatus.IN_PROGRESS
        
        await db.commit()
        await db.refresh(goal)
        
        logger.info(f"Recorded progress for SLP goal {goal_id}: {current_performance}")
        return _to_goal_response(goal)
        
    except Exception as e:
        logger.error(f"Error recording goal progress: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/progress/{learner_id}", response_model=SLPGoalProgressResponse)
async def get_goals_progress_summary(
    learner_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get overall SLP goals progress summary for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import SLPGoal
    
    result = await db.execute(
        select(SLPGoal).where(SLPGoal.learner_id == learner_id)
    )
    goals = result.scalars().all()
    
    # Calculate summary stats
    total_goals = len(goals)
    status_counts = {
        "NOT_STARTED": 0,
        "IN_PROGRESS": 0,
        "MASTERED": 0,
        "DISCONTINUED": 0,
        "MODIFIED": 0,
    }
    
    goal_summaries = []
    for goal in goals:
        status_counts[goal.status] = status_counts.get(goal.status, 0) + 1
        
        # Calculate progress percentage
        progress_pct = 0
        if goal.target_performance and goal.baseline_performance is not None:
            if goal.target_performance != goal.baseline_performance:
                progress_pct = round(
                    (goal.current_performance - goal.baseline_performance) /
                    (goal.target_performance - goal.baseline_performance) * 100,
                    1
                )
                progress_pct = max(0, min(100, progress_pct))
        
        goal_summaries.append({
            "id": goal.id,
            "goalArea": goal.goal_area,
            "annualGoal": goal.annual_goal[:100] + "..." if len(goal.annual_goal) > 100 else goal.annual_goal,
            "status": goal.status,
            "baselinePerformance": goal.baseline_performance,
            "currentPerformance": goal.current_performance,
            "targetPerformance": goal.target_performance,
            "progressPercentage": progress_pct,
            "targetDate": goal.target_date.isoformat() if goal.target_date else None,
            "masteredDate": goal.mastered_date.isoformat() if goal.mastered_date else None,
        })
    
    # By goal area
    by_area = {}
    for goal in goals:
        area = goal.goal_area or "Other"
        if area not in by_area:
            by_area[area] = {"total": 0, "mastered": 0, "in_progress": 0}
        by_area[area]["total"] += 1
        if goal.status == SLPGoalStatus.MASTERED:
            by_area[area]["mastered"] += 1
        elif goal.status == SLPGoalStatus.IN_PROGRESS:
            by_area[area]["in_progress"] += 1
    
    return SLPGoalProgressResponse(
        learnerId=learner_id,
        totalGoals=total_goals,
        statusCounts=status_counts,
        goalSummaries=goal_summaries,
        byGoalArea=by_area,
        overallMasteryRate=round(status_counts["MASTERED"] / total_goals * 100, 1) if total_goals > 0 else 0,
    )


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_slp_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an SLP goal"""
    from db.models.slp import SLPGoal
    
    result = await db.execute(
        select(SLPGoal).where(SLPGoal.id == goal_id)
    )
    goal = result.scalar_one_or_none()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SLP goal not found"
        )
    
    if not await verify_learner_access(current_user, goal.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        await db.delete(goal)
        await db.commit()
        logger.info(f"Deleted SLP goal {goal_id}")
    except Exception as e:
        logger.error(f"Error deleting SLP goal: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


def _to_goal_response(goal) -> SLPGoalResponse:
    """Convert database model to response schema"""
    return SLPGoalResponse(
        id=goal.id,
        learnerId=goal.learner_id,
        goalArea=goal.goal_area,
        annualGoal=goal.annual_goal,
        shortTermObjectives=goal.short_term_objectives or [],
        baselinePerformance=goal.baseline_performance,
        currentPerformance=goal.current_performance,
        targetPerformance=goal.target_performance,
        measurementMethod=goal.measurement_method,
        measurementCriteria=goal.measurement_criteria,
        dataCollectionFrequency=goal.data_collection_frequency,
        status=goal.status,
        targetDate=goal.target_date,
        masteredDate=goal.mastered_date,
        iepId=goal.iep_id,
        createdAt=goal.created_at,
        updatedAt=goal.updated_at,
    )
