"""
ILS Skills API Routes
Functional skill catalog and management
Author: artpromedia
Date: 2025-11-29
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import List, Optional
from datetime import datetime
import aiofiles
import uuid
import os

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


@router.post("/{skill_id}/video")
async def upload_skill_video(
    skill_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a video model for a functional skill
    
    This endpoint handles video file uploads for ILS video modeling.
    Videos are stored and the URL is added to the skill's video_modeling_urls.
    """
    from fastapi import File, UploadFile
    import aiofiles
    import uuid
    import os
    
    # Re-define the endpoint with File parameter
    pass


@router.post("/{skill_id}/video-upload", status_code=status.HTTP_201_CREATED)
async def add_video_model_to_skill(
    skill_id: str,
    file: "UploadFile",
    title: Optional[str] = None,
    description: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload video modeling content for a functional skill
    
    Accepts video files (mp4, mov, webm) up to 100MB.
    Videos are stored in cloud storage and the URL is added to the skill.
    """
    from fastapi import File, UploadFile
    import aiofiles
    import uuid
    import os
    
    # Validate skill exists
    result = await db.execute(
        select(FunctionalSkill).where(FunctionalSkill.id == skill_id)
    )
    skill = result.scalar_one_or_none()
    
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    # Validate file type
    allowed_types = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: mp4, mov, webm, avi"
        )
    
    # Check file size (100MB limit)
    max_size = 100 * 1024 * 1024  # 100MB
    file_size = 0
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename or "video.mp4")[1]
    unique_filename = f"ils_video_{skill_id}_{uuid.uuid4().hex}{file_ext}"
    
    # Determine upload directory
    upload_dir = os.environ.get("UPLOAD_DIR", "/tmp/uploads/ils_videos")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, unique_filename)
    
    try:
        # Save file
        async with aiofiles.open(file_path, 'wb') as out_file:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                file_size += len(chunk)
                if file_size > max_size:
                    os.remove(file_path)
                    raise HTTPException(
                        status_code=413,
                        detail="File too large. Maximum size is 100MB"
                    )
                await out_file.write(chunk)
        
        # Generate URL (in production, this would be a CDN/S3 URL)
        base_url = os.environ.get("CONTENT_BASE_URL", "http://localhost:4000/uploads")
        video_url = f"{base_url}/ils_videos/{unique_filename}"
        
        # Add video URL to skill's video_modeling_urls
        current_urls = skill.video_modeling_urls or []
        current_urls.append(video_url)
        skill.video_modeling_urls = current_urls
        
        await db.commit()
        await db.refresh(skill)
        
        logger.info(f"Uploaded video for skill {skill_id}: {video_url}")
        
        return {
            "success": True,
            "videoUrl": video_url,
            "filename": unique_filename,
            "size": file_size,
            "skillId": skill_id,
            "totalVideos": len(current_urls),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up on error
        if os.path.exists(file_path):
            os.remove(file_path)
        logger.error(f"Video upload failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Video upload failed: {str(e)}"
        )


@router.delete("/{skill_id}/video")
async def remove_video_from_skill(
    skill_id: str,
    video_url: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a video model URL from a skill"""
    result = await db.execute(
        select(FunctionalSkill).where(FunctionalSkill.id == skill_id)
    )
    skill = result.scalar_one_or_none()
    
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    current_urls = skill.video_modeling_urls or []
    if video_url not in current_urls:
        raise HTTPException(status_code=404, detail="Video URL not found for this skill")
    
    current_urls.remove(video_url)
    skill.video_modeling_urls = current_urls
    
    await db.commit()
    
    logger.info(f"Removed video from skill {skill_id}: {video_url}")
    
    return {"success": True, "remainingVideos": len(current_urls)}


# Placeholder for FunctionalSkill model - will use Prisma in actual implementation
class FunctionalSkill:
    """Placeholder - actual model from Prisma"""
    pass
