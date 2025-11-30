"""
ILS Skills API Routes
Functional skill catalog and management
Author: artpromedia
Date: 2025-11-29
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import List, Optional
from datetime import datetime

from db.database import get_db
from db.models.user import User
from api.schemas.ils import (
    IndependentLivingDomain,
    FunctionalSkillCreate, FunctionalSkillUpdate, FunctionalSkillResponse,
    FunctionalSkillListResponse,
)
from api.dependencies.auth import get_current_user
from core.logging import setup_logging

router = APIRouter()
logger = setup_logging(__name__)


# ==========================================
# FUNCTIONAL SKILLS ENDPOINTS
# ==========================================

@router.get("", response_model=FunctionalSkillListResponse)
async def list_functional_skills(
    domain: Optional[IndependentLivingDomain] = None,
    search: Optional[str] = None,
    is_critical_safety: Optional[bool] = None,
    min_age: Optional[int] = Query(None, ge=5, le=26),
    max_age: Optional[int] = Query(None, ge=5, le=26),
    min_grade: Optional[int] = Query(None, ge=0, le=12),
    max_grade: Optional[int] = Query(None, ge=0, le=12),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List functional skills with filtering and pagination"""
    query = select(FunctionalSkill).where(FunctionalSkill.is_active == True)
    
    if domain:
        query = query.where(FunctionalSkill.domain == domain)
    
    if search:
        search_filter = or_(
            FunctionalSkill.name.ilike(f"%{search}%"),
            FunctionalSkill.description.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
    
    if is_critical_safety is not None:
        query = query.where(FunctionalSkill.is_critical_safety == is_critical_safety)
    
    if min_age:
        query = query.where(
            or_(FunctionalSkill.min_age == None, FunctionalSkill.min_age <= min_age)
        )
    
    if max_age:
        query = query.where(
            or_(FunctionalSkill.max_age == None, FunctionalSkill.max_age >= max_age)
        )
    
    if min_grade:
        query = query.where(
            or_(FunctionalSkill.min_grade_level == None, FunctionalSkill.min_grade_level <= min_grade)
        )
    
    if max_grade:
        query = query.where(
            or_(FunctionalSkill.max_grade_level == None, FunctionalSkill.max_grade_level >= max_grade)
        )
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(FunctionalSkill.domain, FunctionalSkill.name)
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    skills = result.scalars().all()
    
    return FunctionalSkillListResponse(
        skills=skills,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/by-domain/{domain}", response_model=List[FunctionalSkillResponse])
async def get_skills_by_domain(
    domain: IndependentLivingDomain,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all skills for a specific domain"""
    result = await db.execute(
        select(FunctionalSkill)
        .where(FunctionalSkill.domain == domain)
        .where(FunctionalSkill.is_active == True)
        .order_by(FunctionalSkill.name)
    )
    return result.scalars().all()


@router.get("/{skill_id}", response_model=FunctionalSkillResponse)
async def get_functional_skill(
    skill_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific functional skill with full task analysis"""
    result = await db.execute(
        select(FunctionalSkill).where(FunctionalSkill.id == skill_id)
    )
    skill = result.scalar_one_or_none()
    
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    return skill


@router.post("", response_model=FunctionalSkillResponse, status_code=status.HTTP_201_CREATED)
async def create_functional_skill(
    skill: FunctionalSkillCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new functional skill (admin only)"""
    # Check for duplicate
    result = await db.execute(
        select(FunctionalSkill).where(
            and_(
                FunctionalSkill.domain == skill.domain,
                FunctionalSkill.name == skill.name
            )
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Skill with this name already exists in domain")
    
    db_skill = FunctionalSkill(
        domain=skill.domain,
        name=skill.name,
        description=skill.description,
        task_steps=skill.task_steps,
        total_steps=skill.total_steps,
        prerequisite_skill_ids=skill.prerequisite_skill_ids,
        scaffolding_notes=skill.scaffolding_notes,
        min_age=skill.min_age,
        max_age=skill.max_age,
        min_grade_level=skill.min_grade_level,
        max_grade_level=skill.max_grade_level,
        materials_needed=skill.materials_needed,
        visual_supports=skill.visual_supports,
        video_modeling_urls=skill.video_modeling_urls,
        social_story_url=skill.social_story_url,
        target_settings=skill.target_settings,
        mastery_threshold=skill.mastery_threshold,
        data_collection_method=skill.data_collection_method,
        min_trials_for_mastery=skill.min_trials_for_mastery,
        is_critical_safety=skill.is_critical_safety,
        community_relevance=skill.community_relevance,
        employment_relevance=skill.employment_relevance,
    )
    
    db.add(db_skill)
    await db.commit()
    await db.refresh(db_skill)
    
    logger.info(f"Created functional skill: {db_skill.id} - {db_skill.name}")
    return db_skill


@router.patch("/{skill_id}", response_model=FunctionalSkillResponse)
async def update_functional_skill(
    skill_id: str,
    skill: FunctionalSkillUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a functional skill"""
    result = await db.execute(
        select(FunctionalSkill).where(FunctionalSkill.id == skill_id)
    )
    db_skill = result.scalar_one_or_none()
    
    if not db_skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    update_data = skill.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_skill, field, value)
    
    await db.commit()
    await db.refresh(db_skill)
    
    logger.info(f"Updated functional skill: {skill_id}")
    return db_skill


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_functional_skill(
    skill_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a functional skill"""
    result = await db.execute(
        select(FunctionalSkill).where(FunctionalSkill.id == skill_id)
    )
    db_skill = result.scalar_one_or_none()
    
    if not db_skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    db_skill.is_active = False
    await db.commit()
    
    logger.info(f"Soft deleted functional skill: {skill_id}")


@router.get("/{skill_id}/prerequisites", response_model=List[FunctionalSkillResponse])
async def get_skill_prerequisites(
    skill_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get prerequisite skills for a skill"""
    result = await db.execute(
        select(FunctionalSkill).where(FunctionalSkill.id == skill_id)
    )
    skill = result.scalar_one_or_none()
    
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    if not skill.prerequisite_skill_ids:
        return []
    
    prereq_result = await db.execute(
        select(FunctionalSkill).where(
            FunctionalSkill.id.in_(skill.prerequisite_skill_ids)
        )
    )
    return prereq_result.scalars().all()


# Placeholder for FunctionalSkill model - will use Prisma in actual implementation
class FunctionalSkill:
    """Placeholder - actual model from Prisma"""
    pass
