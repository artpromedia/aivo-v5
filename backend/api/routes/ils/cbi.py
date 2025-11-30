"""
ILS CBI (Community-Based Instruction) API Routes
Planning and managing community-based learning experiences
Author: artpromedia
Date: 2025-11-29
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from typing import List, Optional
from datetime import datetime, timedelta

from db.database import get_db
from db.models.user import User
from api.schemas.ils import (
    CBIStatus, SettingType,
    CommunityBasedInstructionCreate, CommunityBasedInstructionUpdate,
    CommunityBasedInstructionResponse, CBIListResponse,
    CBIActivityCreate, CBIActivityUpdate, CBIActivityResponse,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter()
logger = setup_logging(__name__)


# ==========================================
# CBI SESSION ENDPOINTS
# ==========================================

@router.get("/learner/{learner_id}", response_model=CBIListResponse)
async def get_learner_cbi_sessions(
    learner_id: str,
    status: Optional[CBIStatus] = None,
    setting: Optional[SettingType] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    include_past: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get CBI sessions for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = select(CommunityBasedInstruction).where(
        CommunityBasedInstruction.learner_id == learner_id
    )
    
    if status:
        query = query.where(CommunityBasedInstruction.status == status)
    
    if setting:
        query = query.where(CommunityBasedInstruction.setting_type == setting)
    
    if start_date:
        query = query.where(CommunityBasedInstruction.scheduled_date >= start_date)
    
    if end_date:
        query = query.where(CommunityBasedInstruction.scheduled_date <= end_date)
    
    if not include_past:
        query = query.where(CommunityBasedInstruction.scheduled_date >= datetime.now())
    
    query = query.order_by(desc(CommunityBasedInstruction.scheduled_date))
    
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    # Calculate stats
    now = datetime.now()
    upcoming = sum(1 for s in sessions if s.scheduled_date > now and s.status == CBIStatus.PLANNED)
    month_ago = now - timedelta(days=30)
    completed_this_month = sum(1 for s in sessions 
                               if s.status == CBIStatus.COMPLETED 
                               and s.scheduled_date >= month_ago)
    
    return CBIListResponse(
        sessions=sessions,
        total=len(sessions),
        upcoming=upcoming,
        completed_this_month=completed_this_month
    )


@router.get("/{cbi_id}", response_model=CommunityBasedInstructionResponse)
async def get_cbi_session(
    cbi_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific CBI session with activities"""
    result = await db.execute(
        select(CommunityBasedInstruction)
        .where(CommunityBasedInstruction.id == cbi_id)
        .options(selectinload(CommunityBasedInstruction.activities))
    )
    cbi = result.scalar_one_or_none()
    
    if not cbi:
        raise HTTPException(status_code=404, detail="CBI session not found")
    
    if not await verify_learner_access(current_user, cbi.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return cbi


@router.post("/learner/{learner_id}", response_model=CommunityBasedInstructionResponse, status_code=status.HTTP_201_CREATED)
async def create_cbi_session(
    learner_id: str,
    data: CommunityBasedInstructionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new CBI session"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    db_cbi = CommunityBasedInstruction(
        learner_id=learner_id,
        scheduled_date=data.scheduled_date,
        start_time=data.start_time,
        end_time=data.end_time,
        location_name=data.location_name,
        location_address=data.location_address,
        setting_type=data.setting_type,
        instructor_name=data.instructor_name,
        staff_ratio=data.staff_ratio,
        additional_staff=data.additional_staff,
        transportation_type=data.transportation_type,
        transportation_notes=data.transportation_notes,
        emergency_contact=data.emergency_contact,
        emergency_phone=data.emergency_phone,
        medical_notes=data.medical_notes,
        pre_teaching_notes=data.pre_teaching_notes,
    )
    
    db.add(db_cbi)
    await db.flush()  # Get the ID
    
    # Create activities
    for activity_data in data.activities:
        db_activity = CBIActivity(
            cbi_id=db_cbi.id,
            skill_id=activity_data.skill_id,
            activity_name=activity_data.activity_name,
            activity_description=activity_data.activity_description,
            order_in_session=activity_data.order_in_session,
            target_steps=activity_data.target_steps,
            target_prompt_level=activity_data.target_prompt_level,
        )
        db.add(db_activity)
    
    await db.commit()
    await db.refresh(db_cbi)
    
    logger.info(f"Created CBI session {db_cbi.id} for learner {learner_id}")
    return db_cbi


@router.patch("/{cbi_id}", response_model=CommunityBasedInstructionResponse)
async def update_cbi_session(
    cbi_id: str,
    data: CommunityBasedInstructionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a CBI session"""
    result = await db.execute(
        select(CommunityBasedInstruction).where(CommunityBasedInstruction.id == cbi_id)
    )
    db_cbi = result.scalar_one_or_none()
    
    if not db_cbi:
        raise HTTPException(status_code=404, detail="CBI session not found")
    
    if not await verify_learner_access(current_user, db_cbi.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_cbi, field, value)
    
    await db.commit()
    await db.refresh(db_cbi)
    
    logger.info(f"Updated CBI session {cbi_id}")
    return db_cbi


@router.delete("/{cbi_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_cbi_session(
    cbi_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a CBI session"""
    result = await db.execute(
        select(CommunityBasedInstruction).where(CommunityBasedInstruction.id == cbi_id)
    )
    db_cbi = result.scalar_one_or_none()
    
    if not db_cbi:
        raise HTTPException(status_code=404, detail="CBI session not found")
    
    if not await verify_learner_access(current_user, db_cbi.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    db_cbi.status = CBIStatus.CANCELLED
    await db.commit()
    
    logger.info(f"Cancelled CBI session {cbi_id}")


@router.post("/{cbi_id}/complete", response_model=CommunityBasedInstructionResponse)
async def complete_cbi_session(
    cbi_id: str,
    overall_success_rating: int = Query(..., ge=1, le=5),
    behavior_notes: Optional[str] = None,
    general_notes: Optional[str] = None,
    follow_up_needed: bool = False,
    follow_up_notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a CBI session as completed with outcomes"""
    result = await db.execute(
        select(CommunityBasedInstruction).where(CommunityBasedInstruction.id == cbi_id)
    )
    db_cbi = result.scalar_one_or_none()
    
    if not db_cbi:
        raise HTTPException(status_code=404, detail="CBI session not found")
    
    if not await verify_learner_access(current_user, db_cbi.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    db_cbi.status = CBIStatus.COMPLETED
    db_cbi.actual_end_time = datetime.now()
    db_cbi.overall_success_rating = overall_success_rating
    db_cbi.behavior_notes = behavior_notes
    db_cbi.general_notes = general_notes
    db_cbi.follow_up_needed = follow_up_needed
    db_cbi.follow_up_notes = follow_up_notes
    
    await db.commit()
    await db.refresh(db_cbi)
    
    logger.info(f"Completed CBI session {cbi_id} with rating {overall_success_rating}")
    return db_cbi


@router.post("/{cbi_id}/grant-permission", response_model=CommunityBasedInstructionResponse)
async def grant_parent_permission(
    cbi_id: str,
    permission_form_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record parent permission for CBI session"""
    result = await db.execute(
        select(CommunityBasedInstruction).where(CommunityBasedInstruction.id == cbi_id)
    )
    db_cbi = result.scalar_one_or_none()
    
    if not db_cbi:
        raise HTTPException(status_code=404, detail="CBI session not found")
    
    if not await verify_learner_access(current_user, db_cbi.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    db_cbi.parent_permission = True
    db_cbi.permission_form_date = permission_form_date or datetime.now()
    
    await db.commit()
    await db.refresh(db_cbi)
    
    logger.info(f"Parent permission granted for CBI session {cbi_id}")
    return db_cbi


# ==========================================
# CBI ACTIVITY ENDPOINTS
# ==========================================

@router.post("/{cbi_id}/activities", response_model=CBIActivityResponse, status_code=status.HTTP_201_CREATED)
async def add_cbi_activity(
    cbi_id: str,
    data: CBIActivityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add an activity to a CBI session"""
    result = await db.execute(
        select(CommunityBasedInstruction).where(CommunityBasedInstruction.id == cbi_id)
    )
    db_cbi = result.scalar_one_or_none()
    
    if not db_cbi:
        raise HTTPException(status_code=404, detail="CBI session not found")
    
    if not await verify_learner_access(current_user, db_cbi.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    db_activity = CBIActivity(
        cbi_id=cbi_id,
        skill_id=data.skill_id,
        activity_name=data.activity_name,
        activity_description=data.activity_description,
        order_in_session=data.order_in_session,
        target_steps=data.target_steps,
        target_prompt_level=data.target_prompt_level,
    )
    
    db.add(db_activity)
    await db.commit()
    await db.refresh(db_activity)
    
    logger.info(f"Added activity {db_activity.id} to CBI session {cbi_id}")
    return db_activity


@router.patch("/{cbi_id}/activities/{activity_id}", response_model=CBIActivityResponse)
async def update_cbi_activity(
    cbi_id: str,
    activity_id: str,
    data: CBIActivityUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a CBI activity"""
    result = await db.execute(
        select(CBIActivity).where(
            CBIActivity.id == activity_id,
            CBIActivity.cbi_id == cbi_id
        )
    )
    db_activity = result.scalar_one_or_none()
    
    if not db_activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Verify access through CBI
    cbi_result = await db.execute(
        select(CommunityBasedInstruction).where(CommunityBasedInstruction.id == cbi_id)
    )
    db_cbi = cbi_result.scalar_one_or_none()
    
    if not await verify_learner_access(current_user, db_cbi.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_activity, field, value)
    
    await db.commit()
    await db.refresh(db_activity)
    
    logger.info(f"Updated activity {activity_id}")
    return db_activity


@router.delete("/{cbi_id}/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_cbi_activity(
    cbi_id: str,
    activity_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove an activity from a CBI session"""
    result = await db.execute(
        select(CBIActivity).where(
            CBIActivity.id == activity_id,
            CBIActivity.cbi_id == cbi_id
        )
    )
    db_activity = result.scalar_one_or_none()
    
    if not db_activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Verify access
    cbi_result = await db.execute(
        select(CommunityBasedInstruction).where(CommunityBasedInstruction.id == cbi_id)
    )
    db_cbi = cbi_result.scalar_one_or_none()
    
    if not await verify_learner_access(current_user, db_cbi.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.delete(db_activity)
    await db.commit()
    
    logger.info(f"Removed activity {activity_id} from CBI session {cbi_id}")


# Placeholder classes
class CommunityBasedInstruction:
    pass

class CBIActivity:
    pass

def selectinload(*args):
    pass
