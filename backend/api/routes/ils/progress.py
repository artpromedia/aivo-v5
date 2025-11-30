"""
ILS Progress API Routes
Learner skill progress tracking and data collection
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
    IndependentLivingDomain, SkillMasteryLevel, PromptLevel, SettingType,
    LearnerSkillProgressCreate, LearnerSkillProgressUpdate, LearnerSkillProgressResponse,
    LearnerSkillProgressListResponse,
    SkillDataPointCreate, SkillDataPointResponse, SkillDataPointListResponse,
    GeneralizationRecordCreate, GeneralizationRecordUpdate, GeneralizationRecordResponse,
    GeneralizationMatrixResponse,
    BulkSkillAssignRequest, BulkDataPointCreate,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter()
logger = setup_logging(__name__)


# ==========================================
# LEARNER SKILL PROGRESS ENDPOINTS
# ==========================================

@router.get("/learner/{learner_id}", response_model=LearnerSkillProgressListResponse)
async def get_learner_progress(
    learner_id: str,
    domain: Optional[IndependentLivingDomain] = None,
    mastery_level: Optional[SkillMasteryLevel] = None,
    is_active: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all skill progress for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = select(LearnerSkillProgress).where(
        LearnerSkillProgress.learner_id == learner_id,
        LearnerSkillProgress.is_active == is_active
    )
    
    if mastery_level:
        query = query.where(LearnerSkillProgress.mastery_level == mastery_level)
    
    # Join with skill for domain filtering
    if domain:
        query = query.join(FunctionalSkill).where(FunctionalSkill.domain == domain)
    
    result = await db.execute(query)
    progress_list = result.scalars().all()
    
    # Calculate aggregations
    by_domain = {}
    by_mastery = {}
    for p in progress_list:
        # Count by domain
        skill_domain = p.skill.domain if p.skill else "UNKNOWN"
        by_domain[skill_domain] = by_domain.get(skill_domain, 0) + 1
        # Count by mastery level
        by_mastery[p.mastery_level] = by_mastery.get(p.mastery_level, 0) + 1
    
    return LearnerSkillProgressListResponse(
        progress=progress_list,
        total=len(progress_list),
        by_domain=by_domain,
        by_mastery_level=by_mastery
    )


@router.get("/learner/{learner_id}/skill/{skill_id}", response_model=LearnerSkillProgressResponse)
async def get_learner_skill_progress(
    learner_id: str,
    skill_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get progress for a specific skill for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.execute(
        select(LearnerSkillProgress)
        .where(
            LearnerSkillProgress.learner_id == learner_id,
            LearnerSkillProgress.skill_id == skill_id
        )
        .options(joinedload(LearnerSkillProgress.skill))
    )
    progress = result.scalar_one_or_none()
    
    if not progress:
        raise HTTPException(status_code=404, detail="Progress record not found")
    
    return progress


@router.post("/learner/{learner_id}/assign", response_model=LearnerSkillProgressResponse, status_code=status.HTTP_201_CREATED)
async def assign_skill_to_learner(
    learner_id: str,
    data: LearnerSkillProgressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Assign a skill to a learner for tracking"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if already assigned
    existing = await db.execute(
        select(LearnerSkillProgress).where(
            LearnerSkillProgress.learner_id == learner_id,
            LearnerSkillProgress.skill_id == data.skill_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Skill already assigned to learner")
    
    # Verify skill exists
    skill_result = await db.execute(
        select(FunctionalSkill).where(FunctionalSkill.id == data.skill_id)
    )
    skill = skill_result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    db_progress = LearnerSkillProgress(
        learner_id=learner_id,
        skill_id=data.skill_id,
        baseline_date=data.baseline_date,
        baseline_score=data.baseline_score,
        target_mastery_date=data.target_mastery_date,
        teacher_notes=data.teacher_notes,
    )
    
    db.add(db_progress)
    await db.commit()
    await db.refresh(db_progress)
    
    logger.info(f"Assigned skill {data.skill_id} to learner {learner_id}")
    return db_progress


@router.post("/learner/{learner_id}/bulk-assign", response_model=List[LearnerSkillProgressResponse])
async def bulk_assign_skills(
    learner_id: str,
    data: BulkSkillAssignRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Assign multiple skills to a learner at once"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    created = []
    for skill_id in data.skill_ids:
        # Skip if already assigned
        existing = await db.execute(
            select(LearnerSkillProgress).where(
                LearnerSkillProgress.learner_id == learner_id,
                LearnerSkillProgress.skill_id == skill_id
            )
        )
        if existing.scalar_one_or_none():
            continue
        
        db_progress = LearnerSkillProgress(
            learner_id=learner_id,
            skill_id=skill_id,
            target_mastery_date=data.target_mastery_date,
        )
        db.add(db_progress)
        created.append(db_progress)
    
    await db.commit()
    for p in created:
        await db.refresh(p)
    
    logger.info(f"Bulk assigned {len(created)} skills to learner {learner_id}")
    return created


@router.patch("/learner/{learner_id}/skill/{skill_id}", response_model=LearnerSkillProgressResponse)
async def update_learner_skill_progress(
    learner_id: str,
    skill_id: str,
    data: LearnerSkillProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update progress for a skill"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.execute(
        select(LearnerSkillProgress).where(
            LearnerSkillProgress.learner_id == learner_id,
            LearnerSkillProgress.skill_id == skill_id
        )
    )
    db_progress = result.scalar_one_or_none()
    
    if not db_progress:
        raise HTTPException(status_code=404, detail="Progress record not found")
    
    update_data = data.model_dump(exclude_unset=True)
    
    # Track prompt fading
    if "current_prompt_level" in update_data:
        old_level = db_progress.current_prompt_level
        new_level = update_data["current_prompt_level"]
        if old_level != new_level:
            history = db_progress.prompt_fading_history or []
            history.append({
                "date": datetime.now().isoformat(),
                "fromLevel": old_level,
                "toLevel": new_level
            })
            db_progress.prompt_fading_history = history
    
    for field, value in update_data.items():
        setattr(db_progress, field, value)
    
    await db.commit()
    await db.refresh(db_progress)
    
    logger.info(f"Updated progress for skill {skill_id} for learner {learner_id}")
    return db_progress


# ==========================================
# DATA POINT ENDPOINTS
# ==========================================

@router.get("/learner/{learner_id}/data-points", response_model=SkillDataPointListResponse)
async def get_learner_data_points(
    learner_id: str,
    skill_id: Optional[str] = None,
    setting: Optional[SettingType] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get data points for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = select(SkillDataPoint).where(SkillDataPoint.learner_id == learner_id)
    
    if skill_id:
        query = query.where(SkillDataPoint.skill_id == skill_id)
    
    if setting:
        query = query.where(SkillDataPoint.setting == setting)
    
    if start_date:
        query = query.where(SkillDataPoint.session_date >= start_date)
    
    if end_date:
        query = query.where(SkillDataPoint.session_date <= end_date)
    
    query = query.order_by(desc(SkillDataPoint.session_date)).limit(limit)
    
    result = await db.execute(query)
    data_points = result.scalars().all()
    
    # Calculate aggregations
    total = len(data_points)
    avg_accuracy = None
    avg_independence = None
    
    accuracy_values = [dp.accuracy_percent for dp in data_points if dp.accuracy_percent is not None]
    independence_values = [dp.independence_percent for dp in data_points if dp.independence_percent is not None]
    
    if accuracy_values:
        avg_accuracy = sum(accuracy_values) / len(accuracy_values)
    if independence_values:
        avg_independence = sum(independence_values) / len(independence_values)
    
    # Count sessions this week/month
    now = datetime.now()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    sessions_this_week = sum(1 for dp in data_points if dp.session_date >= week_ago)
    sessions_this_month = sum(1 for dp in data_points if dp.session_date >= month_ago)
    
    return SkillDataPointListResponse(
        data_points=data_points,
        total=total,
        average_accuracy=avg_accuracy,
        average_independence=avg_independence,
        sessions_this_week=sessions_this_week,
        sessions_this_month=sessions_this_month
    )


@router.post("/learner/{learner_id}/data-point", response_model=SkillDataPointResponse, status_code=status.HTTP_201_CREATED)
async def record_data_point(
    learner_id: str,
    data: SkillDataPointCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record a new data point for a skill session"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Calculate accuracy and independence if task analysis data provided
    accuracy = data.accuracy_percent
    independence = data.independence_percent
    
    if data.step_by_step_data and not accuracy:
        completed = sum(1 for s in data.step_by_step_data if s.completed)
        total = len(data.step_by_step_data)
        accuracy = (completed / total * 100) if total > 0 else 0
    
    if data.step_by_step_data and not independence:
        independent = sum(1 for s in data.step_by_step_data 
                        if s.completed and s.prompt_level == PromptLevel.INDEPENDENT)
        total = len(data.step_by_step_data)
        independence = (independent / total * 100) if total > 0 else 0
    
    db_data_point = SkillDataPoint(
        skill_id=data.skill_id,
        learner_id=learner_id,
        session_date=data.session_date or datetime.now(),
        setting=data.setting,
        duration=data.duration,
        instructor=data.instructor,
        collection_method=data.collection_method,
        steps_attempted=data.steps_attempted,
        steps_completed=data.steps_completed,
        step_by_step_data=[s.model_dump() for s in data.step_by_step_data] if data.step_by_step_data else None,
        frequency=data.frequency,
        duration_seconds=data.duration_seconds,
        latency_seconds=data.latency_seconds,
        highest_prompt_used=data.highest_prompt_used,
        lowest_prompt_used=data.lowest_prompt_used,
        accuracy_percent=accuracy,
        independence_percent=independence,
        behavior_notes=data.behavior_notes,
        antecedents=data.antecedents,
        consequences=data.consequences,
        environmental_factors=data.environmental_factors.model_dump() if data.environmental_factors else None,
    )
    
    db.add(db_data_point)
    
    # Update learner progress
    progress_result = await db.execute(
        select(LearnerSkillProgress).where(
            LearnerSkillProgress.learner_id == learner_id,
            LearnerSkillProgress.skill_id == data.skill_id
        )
    )
    progress = progress_result.scalar_one_or_none()
    
    if progress:
        progress.last_practice_date = db_data_point.session_date
        progress.total_practice_minutes += data.duration or 0
        
        # Update mastery percent if accuracy improved
        if accuracy and accuracy > progress.percent_mastered:
            progress.percent_mastered = accuracy
            progress.current_streak += 1
            
            # Auto-update mastery level based on percent
            if accuracy >= 90:
                progress.mastery_level = SkillMasteryLevel.MASTERED
            elif accuracy >= 80:
                progress.mastery_level = SkillMasteryLevel.INDEPENDENT
            elif accuracy >= 60:
                progress.mastery_level = SkillMasteryLevel.PRACTICING
            elif accuracy >= 40:
                progress.mastery_level = SkillMasteryLevel.DEVELOPING
            elif accuracy >= 20:
                progress.mastery_level = SkillMasteryLevel.EMERGING
        else:
            progress.current_streak = 0
    
    await db.commit()
    await db.refresh(db_data_point)
    
    logger.info(f"Recorded data point for skill {data.skill_id} for learner {learner_id}")
    return db_data_point


@router.post("/learner/{learner_id}/bulk-data-points", response_model=List[SkillDataPointResponse])
async def record_bulk_data_points(
    learner_id: str,
    data: BulkDataPointCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record data points for multiple skills in one session"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    created = []
    for dp_data in data.data_points:
        db_data_point = SkillDataPoint(
            skill_id=dp_data.skill_id,
            learner_id=learner_id,
            session_date=data.session_date,
            setting=data.setting,
            instructor=data.instructor,
            collection_method=dp_data.collection_method,
            steps_attempted=dp_data.steps_attempted,
            steps_completed=dp_data.steps_completed,
            accuracy_percent=dp_data.accuracy_percent,
            independence_percent=dp_data.independence_percent,
        )
        db.add(db_data_point)
        created.append(db_data_point)
    
    await db.commit()
    for dp in created:
        await db.refresh(dp)
    
    logger.info(f"Recorded {len(created)} data points for learner {learner_id}")
    return created


# ==========================================
# GENERALIZATION ENDPOINTS
# ==========================================

@router.get("/learner/{learner_id}/generalization/{skill_id}", response_model=GeneralizationMatrixResponse)
async def get_generalization_matrix(
    learner_id: str,
    skill_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get generalization matrix for a skill across all settings"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get skill info
    skill_result = await db.execute(
        select(FunctionalSkill).where(FunctionalSkill.id == skill_id)
    )
    skill = skill_result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    # Get generalization records
    result = await db.execute(
        select(GeneralizationRecord).where(
            GeneralizationRecord.learner_id == learner_id,
            GeneralizationRecord.skill_id == skill_id
        )
    )
    records = result.scalars().all()
    
    # Build matrix
    settings_dict = {r.setting: r for r in records}
    total_target_settings = len(skill.target_settings)
    mastered_count = sum(1 for r in records if r.is_mastered)
    introduced_count = sum(1 for r in records if r.is_introduced)
    
    generalization_percent = (mastered_count / total_target_settings * 100) if total_target_settings > 0 else 0
    
    return GeneralizationMatrixResponse(
        skill_id=skill_id,
        skill_name=skill.name,
        settings=settings_dict,
        total_settings=total_target_settings,
        mastered_settings=mastered_count,
        introduced_settings=introduced_count,
        generalization_percent=generalization_percent
    )


@router.post("/learner/{learner_id}/generalization", response_model=GeneralizationRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_generalization_record(
    learner_id: str,
    data: GeneralizationRecordCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a generalization record for a new setting"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check for existing
    existing = await db.execute(
        select(GeneralizationRecord).where(
            GeneralizationRecord.learner_id == learner_id,
            GeneralizationRecord.skill_id == data.skill_id,
            GeneralizationRecord.setting == data.setting
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Generalization record already exists for this setting")
    
    db_record = GeneralizationRecord(
        learner_id=learner_id,
        skill_id=data.skill_id,
        setting=data.setting,
        location_name=data.location_name,
        notes=data.notes,
    )
    
    db.add(db_record)
    await db.commit()
    await db.refresh(db_record)
    
    logger.info(f"Created generalization record for skill {data.skill_id} in {data.setting}")
    return db_record


@router.patch("/learner/{learner_id}/generalization/{record_id}", response_model=GeneralizationRecordResponse)
async def update_generalization_record(
    learner_id: str,
    record_id: str,
    data: GeneralizationRecordUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a generalization record"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.execute(
        select(GeneralizationRecord).where(
            GeneralizationRecord.id == record_id,
            GeneralizationRecord.learner_id == learner_id
        )
    )
    db_record = result.scalar_one_or_none()
    
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    update_data = data.model_dump(exclude_unset=True)
    
    # Calculate success rate if trials updated
    if "trials_successful" in update_data or "trials_attempted" in update_data:
        attempted = update_data.get("trials_attempted", db_record.trials_attempted) or 0
        successful = update_data.get("trials_successful", db_record.trials_successful) or 0
        if attempted > 0:
            update_data["success_rate"] = (successful / attempted) * 100
    
    for field, value in update_data.items():
        setattr(db_record, field, value)
    
    await db.commit()
    await db.refresh(db_record)
    
    logger.info(f"Updated generalization record {record_id}")
    return db_record


# Placeholder classes - actual models from Prisma
class LearnerSkillProgress:
    pass

class FunctionalSkill:
    pass

class SkillDataPoint:
    pass

class GeneralizationRecord:
    pass

def joinedload(*args):
    pass
