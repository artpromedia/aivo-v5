"""
Pragmatic Language Routes
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
    PragmaticLanguageSkillCreate,
    PragmaticLanguageSkillUpdate,
    PragmaticLanguageSkillResponse,
    PragmaticProgressResponse,
    PragmaticSkillType,
    SocialSetting,
    SkillRating,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter(prefix="/slp/pragmatic", tags=["SLP Pragmatic Language"])
logger = setup_logging(__name__)


@router.post("/skills", response_model=PragmaticLanguageSkillResponse, status_code=status.HTTP_201_CREATED)
async def create_pragmatic_skill(
    skill: PragmaticLanguageSkillCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create or update a pragmatic language skill observation"""
    if not await verify_learner_access(current_user, skill.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        from db.models.slp import PragmaticLanguageSkill
        
        db_skill = PragmaticLanguageSkill(
            learner_id=skill.learnerId,
            session_id=skill.sessionId,
            skill_type=skill.skillType,
            skill_name=skill.skillName,
            social_setting=skill.socialSetting,
            baseline_rating=skill.baselineRating,
            current_rating=skill.currentRating or skill.baselineRating,
            goal_rating=skill.goalRating,
            observation_context=skill.observationContext,
            specific_behaviors_observed=skill.specificBehaviorsObserved or [],
            prompts_strategies_used=skill.promptsStrategiesUsed or [],
            generalization_settings=skill.generalizationSettings or [],
            peer_interaction_quality=skill.peerInteractionQuality,
            adult_interaction_quality=skill.adultInteractionQuality,
            therapist_notes=skill.therapistNotes,
            observed_at=skill.observedAt or datetime.utcnow(),
        )
        
        db.add(db_skill)
        await db.commit()
        await db.refresh(db_skill)
        
        logger.info(f"Created pragmatic skill observation for learner {skill.learnerId}")
        return _to_skill_response(db_skill)
        
    except Exception as e:
        logger.error(f"Error creating pragmatic skill: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/skills/{learner_id}", response_model=List[PragmaticLanguageSkillResponse])
async def get_pragmatic_skills(
    learner_id: str,
    skill_type: Optional[PragmaticSkillType] = Query(None),
    social_setting: Optional[SocialSetting] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    limit: int = Query(100, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get pragmatic language skill observations for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import PragmaticLanguageSkill
    
    query = select(PragmaticLanguageSkill).where(
        PragmaticLanguageSkill.learner_id == learner_id
    )
    
    if skill_type:
        query = query.where(PragmaticLanguageSkill.skill_type == skill_type)
    if social_setting:
        query = query.where(PragmaticLanguageSkill.social_setting == social_setting)
    if from_date:
        query = query.where(PragmaticLanguageSkill.observed_at >= from_date)
    if to_date:
        query = query.where(PragmaticLanguageSkill.observed_at <= to_date)
    
    result = await db.execute(
        query.order_by(PragmaticLanguageSkill.observed_at.desc()).limit(limit)
    )
    skills = result.scalars().all()
    
    return [_to_skill_response(s) for s in skills]


@router.get("/skills/{learner_id}/latest", response_model=List[PragmaticLanguageSkillResponse])
async def get_latest_pragmatic_skills(
    learner_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the most recent observation for each pragmatic skill type"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import PragmaticLanguageSkill
    
    # Get all skill types
    skill_types = [st.value for st in PragmaticSkillType]
    
    latest_skills = []
    for skill_type in skill_types:
        result = await db.execute(
            select(PragmaticLanguageSkill).where(
                and_(
                    PragmaticLanguageSkill.learner_id == learner_id,
                    PragmaticLanguageSkill.skill_type == skill_type
                )
            ).order_by(PragmaticLanguageSkill.observed_at.desc()).limit(1)
        )
        skill = result.scalar_one_or_none()
        if skill:
            latest_skills.append(skill)
    
    return [_to_skill_response(s) for s in latest_skills]


@router.put("/skills/{skill_id}", response_model=PragmaticLanguageSkillResponse)
async def update_pragmatic_skill(
    skill_id: str,
    update: PragmaticLanguageSkillUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a pragmatic skill observation"""
    from db.models.slp import PragmaticLanguageSkill
    
    result = await db.execute(
        select(PragmaticLanguageSkill).where(PragmaticLanguageSkill.id == skill_id)
    )
    skill = result.scalar_one_or_none()
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pragmatic skill not found"
        )
    
    if not await verify_learner_access(current_user, skill.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        update_data = update.model_dump(exclude_unset=True)
        
        field_mapping = {
            "currentRating": "current_rating",
            "goalRating": "goal_rating",
            "observationContext": "observation_context",
            "specificBehaviorsObserved": "specific_behaviors_observed",
            "promptsStrategiesUsed": "prompts_strategies_used",
            "generalizationSettings": "generalization_settings",
            "peerInteractionQuality": "peer_interaction_quality",
            "adultInteractionQuality": "adult_interaction_quality",
            "therapistNotes": "therapist_notes",
        }
        
        for camel_key, snake_key in field_mapping.items():
            if camel_key in update_data:
                setattr(skill, snake_key, update_data[camel_key])
        
        await db.commit()
        await db.refresh(skill)
        
        logger.info(f"Updated pragmatic skill {skill_id}")
        return _to_skill_response(skill)
        
    except Exception as e:
        logger.error(f"Error updating pragmatic skill: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/progress/{learner_id}", response_model=PragmaticProgressResponse)
async def get_pragmatic_progress(
    learner_id: str,
    days: int = Query(30, description="Number of days to include"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get pragmatic language progress summary"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import PragmaticLanguageSkill
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all observations in period
    result = await db.execute(
        select(PragmaticLanguageSkill).where(
            and_(
                PragmaticLanguageSkill.learner_id == learner_id,
                PragmaticLanguageSkill.observed_at >= cutoff_date
            )
        ).order_by(PragmaticLanguageSkill.observed_at)
    )
    observations = result.scalars().all()
    
    # Group by skill type
    skill_progress = {}
    for obs in observations:
        skill_type = obs.skill_type
        if skill_type not in skill_progress:
            skill_progress[skill_type] = {
                "observations": [],
                "baseline": None,
                "current": None,
                "goal": None,
            }
        skill_progress[skill_type]["observations"].append({
            "date": obs.observed_at.date().isoformat(),
            "rating": obs.current_rating,
            "setting": obs.social_setting,
        })
        if obs.baseline_rating and not skill_progress[skill_type]["baseline"]:
            skill_progress[skill_type]["baseline"] = obs.baseline_rating
        skill_progress[skill_type]["current"] = obs.current_rating
        if obs.goal_rating:
            skill_progress[skill_type]["goal"] = obs.goal_rating
    
    # Calculate summary by skill type
    skill_summaries = []
    for skill_type, data in skill_progress.items():
        # Map rating to numeric value for progress calculation
        rating_values = {
            "EMERGING": 1,
            "DEVELOPING": 2,
            "PROFICIENT": 3,
            "ADVANCED": 4,
        }
        
        baseline_val = rating_values.get(data["baseline"], 0)
        current_val = rating_values.get(data["current"], 0)
        goal_val = rating_values.get(data["goal"], 4)
        
        progress_pct = 0
        if goal_val > baseline_val:
            progress_pct = round((current_val - baseline_val) / (goal_val - baseline_val) * 100, 1)
        
        skill_summaries.append({
            "skillType": skill_type,
            "baselineRating": data["baseline"],
            "currentRating": data["current"],
            "goalRating": data["goal"],
            "progressPercentage": max(0, min(100, progress_pct)),
            "observationCount": len(data["observations"]),
            "trend": data["observations"],
        })
    
    # Group by social setting
    setting_performance = {}
    for obs in observations:
        setting = obs.social_setting or "UNKNOWN"
        if setting not in setting_performance:
            setting_performance[setting] = {"count": 0, "ratings": []}
        setting_performance[setting]["count"] += 1
        if obs.current_rating:
            rating_values = {"EMERGING": 1, "DEVELOPING": 2, "PROFICIENT": 3, "ADVANCED": 4}
            setting_performance[setting]["ratings"].append(rating_values.get(obs.current_rating, 0))
    
    setting_summaries = [
        {
            "setting": setting,
            "observationCount": data["count"],
            "averageRating": round(sum(data["ratings"]) / len(data["ratings"]), 2) if data["ratings"] else None,
        }
        for setting, data in setting_performance.items()
    ]
    
    return PragmaticProgressResponse(
        learnerId=learner_id,
        periodDays=days,
        totalObservations=len(observations),
        skillProgress=skill_summaries,
        settingPerformance=setting_summaries,
    )


def _to_skill_response(skill) -> PragmaticLanguageSkillResponse:
    """Convert database model to response schema"""
    return PragmaticLanguageSkillResponse(
        id=skill.id,
        learnerId=skill.learner_id,
        sessionId=skill.session_id,
        skillType=skill.skill_type,
        skillName=skill.skill_name,
        socialSetting=skill.social_setting,
        baselineRating=skill.baseline_rating,
        currentRating=skill.current_rating,
        goalRating=skill.goal_rating,
        observationContext=skill.observation_context,
        specificBehaviorsObserved=skill.specific_behaviors_observed or [],
        promptsStrategiesUsed=skill.prompts_strategies_used or [],
        generalizationSettings=skill.generalization_settings or [],
        peerInteractionQuality=skill.peer_interaction_quality,
        adultInteractionQuality=skill.adult_interaction_quality,
        therapistNotes=skill.therapist_notes,
        observedAt=skill.observed_at,
        createdAt=skill.created_at,
        updatedAt=skill.updated_at,
    )
