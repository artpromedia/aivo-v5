"""
SLP Profile Routes
Author: artpromedia
Date: 2025-01-14
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime

from db.database import get_db
from db.models.user import User
from api.schemas.slp import (
    SLPProfileCreate,
    SLPProfileUpdate,
    SLPProfileResponse,
    SLPDiagnosis,
    SLPSeverity,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter(prefix="/slp/profiles", tags=["SLP Profiles"])
logger = setup_logging(__name__)


@router.post("", response_model=SLPProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_slp_profile(
    profile: SLPProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create an SLP profile for a learner"""
    if not await verify_learner_access(current_user, profile.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        # Check if profile already exists
        from db.models.slp import SLPProfile
        result = await db.execute(
            select(SLPProfile).where(SLPProfile.learner_id == profile.learnerId)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="SLP profile already exists for this learner"
            )
        
        db_profile = SLPProfile(
            learner_id=profile.learnerId,
            slp_id=profile.slpId,
            primary_diagnosis=profile.primaryDiagnosis,
            secondary_diagnoses=profile.secondaryDiagnoses or [],
            severity=profile.severity,
            iep_eligibility_category=profile.iepEligibilityCategory,
            service_minutes_per_week=profile.serviceMinutesPerWeek,
            service_setting=profile.serviceSetting,
            communication_mode=profile.communicationMode,
            augmentative_system=profile.augmentativeSystem,
            hearing_status=profile.hearingStatus,
            oral_motor_notes=profile.oralMotorNotes,
            medical_considerations=profile.medicalConsiderations,
        )
        
        db.add(db_profile)
        await db.commit()
        await db.refresh(db_profile)
        
        logger.info(f"Created SLP profile for learner {profile.learnerId}")
        return _to_profile_response(db_profile)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating SLP profile: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{learner_id}", response_model=SLPProfileResponse)
async def get_slp_profile(
    learner_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get SLP profile for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import SLPProfile
    result = await db.execute(
        select(SLPProfile).where(SLPProfile.learner_id == learner_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SLP profile not found"
        )
    
    return _to_profile_response(profile)


@router.put("/{learner_id}", response_model=SLPProfileResponse)
async def update_slp_profile(
    learner_id: str,
    update: SLPProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update SLP profile for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import SLPProfile
    result = await db.execute(
        select(SLPProfile).where(SLPProfile.learner_id == learner_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SLP profile not found"
        )
    
    try:
        update_data = update.model_dump(exclude_unset=True)
        
        # Map camelCase to snake_case
        field_mapping = {
            "slpId": "slp_id",
            "primaryDiagnosis": "primary_diagnosis",
            "secondaryDiagnoses": "secondary_diagnoses",
            "iepEligibilityCategory": "iep_eligibility_category",
            "serviceMinutesPerWeek": "service_minutes_per_week",
            "serviceSetting": "service_setting",
            "communicationMode": "communication_mode",
            "augmentativeSystem": "augmentative_system",
            "hearingStatus": "hearing_status",
            "oralMotorNotes": "oral_motor_notes",
            "medicalConsiderations": "medical_considerations",
        }
        
        for camel_key, snake_key in field_mapping.items():
            if camel_key in update_data:
                setattr(profile, snake_key, update_data[camel_key])
        
        # Handle direct fields
        if "severity" in update_data:
            profile.severity = update_data["severity"]
        
        await db.commit()
        await db.refresh(profile)
        
        logger.info(f"Updated SLP profile for learner {learner_id}")
        return _to_profile_response(profile)
        
    except Exception as e:
        logger.error(f"Error updating SLP profile: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/{learner_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_slp_profile(
    learner_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete SLP profile for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import SLPProfile
    result = await db.execute(
        select(SLPProfile).where(SLPProfile.learner_id == learner_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SLP profile not found"
        )
    
    try:
        await db.delete(profile)
        await db.commit()
        logger.info(f"Deleted SLP profile for learner {learner_id}")
    except Exception as e:
        logger.error(f"Error deleting SLP profile: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


def _to_profile_response(profile) -> SLPProfileResponse:
    """Convert database model to response schema"""
    return SLPProfileResponse(
        id=profile.id,
        learnerId=profile.learner_id,
        slpId=profile.slp_id,
        primaryDiagnosis=profile.primary_diagnosis,
        secondaryDiagnoses=profile.secondary_diagnoses or [],
        severity=profile.severity,
        iepEligibilityCategory=profile.iep_eligibility_category,
        serviceMinutesPerWeek=profile.service_minutes_per_week,
        serviceSetting=profile.service_setting,
        communicationMode=profile.communication_mode,
        augmentativeSystem=profile.augmentative_system,
        hearingStatus=profile.hearing_status,
        oralMotorNotes=profile.oral_motor_notes,
        medicalConsiderations=profile.medical_considerations,
        createdAt=profile.created_at,
        updatedAt=profile.updated_at,
    )
