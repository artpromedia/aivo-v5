"""
ILS Goals API Routes
Independent Living Skills goal management
Author: artpromedia
Date: 2025-11-29
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from typing import List, Optional
from datetime import datetime

from db.database import get_db
from db.models.user import User
from api.schemas.ils import (
    IndependentLivingDomain, ILSGoalStatus,
    ILSGoalCreate, ILSGoalUpdate, ILSGoalResponse, ILSGoalListResponse,
    ILSGoalObjectiveCreate, ILSGoalObjectiveUpdate, ILSGoalObjectiveResponse,
    ProgressNote,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter()
logger = setup_logging(__name__)


# ==========================================
# ILS GOALS ENDPOINTS
# ==========================================

@router.get("/learner/{learner_id}", response_model=ILSGoalListResponse)
async def get_learner_goals(
    learner_id: str,
    domain: Optional[IndependentLivingDomain] = None,
    status: Optional[ILSGoalStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all ILS goals for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = select(ILSGoal).where(ILSGoal.learner_id == learner_id)
    
    if domain:
        query = query.where(ILSGoal.domain == domain)
    
    if status:
        query = query.where(ILSGoal.status == status)
    
    query = query.options(selectinload(ILSGoal.objectives))
    query = query.order_by(ILSGoal.domain, desc(ILSGoal.created_at))
    
    result = await db.execute(query)
    goals = result.scalars().all()
    
    # Calculate stats
    active = sum(1 for g in goals if g.status == ILSGoalStatus.ACTIVE)
    achieved = sum(1 for g in goals if g.status == ILSGoalStatus.ACHIEVED)
    
    by_domain = {}
    for g in goals:
        by_domain[g.domain] = by_domain.get(g.domain, 0) + 1
    
    return ILSGoalListResponse(
        goals=goals,
        total=len(goals),
        active=active,
        achieved=achieved,
        by_domain=by_domain
    )


@router.get("/{goal_id}", response_model=ILSGoalResponse)
async def get_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific ILS goal with objectives"""
    result = await db.execute(
        select(ILSGoal)
        .where(ILSGoal.id == goal_id)
        .options(selectinload(ILSGoal.objectives))
    )
    goal = result.scalar_one_or_none()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if not await verify_learner_access(current_user, goal.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return goal


@router.post("/learner/{learner_id}", response_model=ILSGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    learner_id: str,
    data: ILSGoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new ILS goal"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    db_goal = ILSGoal(
        learner_id=learner_id,
        domain=data.domain,
        goal_statement=data.goal_statement,
        rationale=data.rationale,
        start_date=data.start_date or datetime.now(),
        target_date=data.target_date,
        baseline_description=data.baseline_description,
        baseline_date=data.baseline_date,
        baseline_performance=data.baseline_performance,
        linked_iep_goal_id=data.linked_iep_goal_id,
        review_schedule=data.review_schedule,
    )
    
    db.add(db_goal)
    await db.flush()
    
    # Create objectives
    for obj_data in data.objectives:
        db_obj = ILSGoalObjective(
            goal_id=db_goal.id,
            skill_id=obj_data.skill_id,
            objective_number=obj_data.objective_number,
            objective_statement=obj_data.objective_statement,
            target_criteria=obj_data.target_criteria,
        )
        db.add(db_obj)
    
    await db.commit()
    await db.refresh(db_goal)
    
    logger.info(f"Created ILS goal {db_goal.id} for learner {learner_id}")
    return db_goal


@router.patch("/{goal_id}", response_model=ILSGoalResponse)
async def update_goal(
    goal_id: str,
    data: ILSGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an ILS goal"""
    result = await db.execute(
        select(ILSGoal).where(ILSGoal.id == goal_id)
    )
    db_goal = result.scalar_one_or_none()
    
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if not await verify_learner_access(current_user, db_goal.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_goal, field, value)
    
    await db.commit()
    await db.refresh(db_goal)
    
    logger.info(f"Updated ILS goal {goal_id}")
    return db_goal


@router.post("/{goal_id}/progress-note", response_model=ILSGoalResponse)
async def add_progress_note(
    goal_id: str,
    note: str,
    performance: Optional[float] = Query(None, ge=0, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a progress note to a goal"""
    result = await db.execute(
        select(ILSGoal).where(ILSGoal.id == goal_id)
    )
    db_goal = result.scalar_one_or_none()
    
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if not await verify_learner_access(current_user, db_goal.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Add progress note
    progress_notes = db_goal.progress_notes or []
    progress_notes.append({
        "date": datetime.now().isoformat(),
        "note": note,
        "performance": performance
    })
    db_goal.progress_notes = progress_notes
    db_goal.last_progress_date = datetime.now()
    
    if performance:
        db_goal.current_performance = performance
    
    await db.commit()
    await db.refresh(db_goal)
    
    logger.info(f"Added progress note to goal {goal_id}")
    return db_goal


@router.post("/{goal_id}/activate", response_model=ILSGoalResponse)
async def activate_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Activate a draft goal"""
    result = await db.execute(
        select(ILSGoal).where(ILSGoal.id == goal_id)
    )
    db_goal = result.scalar_one_or_none()
    
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if not await verify_learner_access(current_user, db_goal.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if db_goal.status != ILSGoalStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only draft goals can be activated")
    
    db_goal.status = ILSGoalStatus.ACTIVE
    db_goal.start_date = datetime.now()
    
    await db.commit()
    await db.refresh(db_goal)
    
    logger.info(f"Activated goal {goal_id}")
    return db_goal


@router.post("/{goal_id}/complete", response_model=ILSGoalResponse)
async def complete_goal(
    goal_id: str,
    achieved: bool = True,
    completion_notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a goal as completed"""
    result = await db.execute(
        select(ILSGoal).where(ILSGoal.id == goal_id)
    )
    db_goal = result.scalar_one_or_none()
    
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if not await verify_learner_access(current_user, db_goal.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    db_goal.status = ILSGoalStatus.ACHIEVED if achieved else ILSGoalStatus.NOT_ACHIEVED
    db_goal.completed_date = datetime.now()
    db_goal.completion_notes = completion_notes
    
    await db.commit()
    await db.refresh(db_goal)
    
    logger.info(f"Completed goal {goal_id} - achieved: {achieved}")
    return db_goal


# ==========================================
# OBJECTIVE ENDPOINTS
# ==========================================

@router.post("/{goal_id}/objectives", response_model=ILSGoalObjectiveResponse, status_code=status.HTTP_201_CREATED)
async def add_objective(
    goal_id: str,
    data: ILSGoalObjectiveCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add an objective to a goal"""
    result = await db.execute(
        select(ILSGoal).where(ILSGoal.id == goal_id)
    )
    db_goal = result.scalar_one_or_none()
    
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if not await verify_learner_access(current_user, db_goal.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    db_obj = ILSGoalObjective(
        goal_id=goal_id,
        skill_id=data.skill_id,
        objective_number=data.objective_number,
        objective_statement=data.objective_statement,
        target_criteria=data.target_criteria,
    )
    
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    
    logger.info(f"Added objective {db_obj.id} to goal {goal_id}")
    return db_obj


@router.patch("/{goal_id}/objectives/{objective_id}", response_model=ILSGoalObjectiveResponse)
async def update_objective(
    goal_id: str,
    objective_id: str,
    data: ILSGoalObjectiveUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an objective"""
    result = await db.execute(
        select(ILSGoalObjective).where(
            ILSGoalObjective.id == objective_id,
            ILSGoalObjective.goal_id == goal_id
        )
    )
    db_obj = result.scalar_one_or_none()
    
    if not db_obj:
        raise HTTPException(status_code=404, detail="Objective not found")
    
    # Verify access through goal
    goal_result = await db.execute(
        select(ILSGoal).where(ILSGoal.id == goal_id)
    )
    db_goal = goal_result.scalar_one_or_none()
    
    if not await verify_learner_access(current_user, db_goal.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    await db.commit()
    await db.refresh(db_obj)
    
    logger.info(f"Updated objective {objective_id}")
    return db_obj


@router.post("/{goal_id}/objectives/{objective_id}/complete", response_model=ILSGoalObjectiveResponse)
async def complete_objective(
    goal_id: str,
    objective_id: str,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark an objective as completed"""
    result = await db.execute(
        select(ILSGoalObjective).where(
            ILSGoalObjective.id == objective_id,
            ILSGoalObjective.goal_id == goal_id
        )
    )
    db_obj = result.scalar_one_or_none()
    
    if not db_obj:
        raise HTTPException(status_code=404, detail="Objective not found")
    
    # Verify access
    goal_result = await db.execute(
        select(ILSGoal).where(ILSGoal.id == goal_id)
    )
    db_goal = goal_result.scalar_one_or_none()
    
    if not await verify_learner_access(current_user, db_goal.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    db_obj.is_completed = True
    db_obj.completed_date = datetime.now()
    if notes:
        db_obj.notes = notes
    
    await db.commit()
    await db.refresh(db_obj)
    
    logger.info(f"Completed objective {objective_id}")
    return db_obj


# Placeholder classes
class ILSGoal:
    pass

class ILSGoalObjective:
    pass

def selectinload(*args):
    pass
