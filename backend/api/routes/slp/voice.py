"""
Voice Therapy Routes
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
    VoiceAssessmentCreate,
    VoiceAssessmentUpdate,
    VoiceAssessmentResponse,
    VoiceProgressResponse,
    PitchLevel,
    LoudnessLevel,
    VoiceQuality,
    Resonance,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter(prefix="/slp/voice", tags=["SLP Voice"])
logger = setup_logging(__name__)


@router.post("/assessments", response_model=VoiceAssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_voice_assessment(
    assessment: VoiceAssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a voice assessment"""
    if not await verify_learner_access(current_user, assessment.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        from db.models.slp import VoiceAssessment
        
        db_assessment = VoiceAssessment(
            learner_id=assessment.learnerId,
            session_id=assessment.sessionId,
            assessment_type=assessment.assessmentType,
            pitch_level=assessment.pitchLevel,
            loudness_level=assessment.loudnessLevel,
            voice_quality=assessment.voiceQuality,
            resonance=assessment.resonance,
            maximum_phonation_time=assessment.maximumPhonationTime,
            s_z_ratio=assessment.szRatio,
            habitual_pitch_hz=assessment.habitualPitchHz,
            pitch_range_low_hz=assessment.pitchRangeLowHz,
            pitch_range_high_hz=assessment.pitchRangeHighHz,
            jitter_percent=assessment.jitterPercent,
            shimmer_percent=assessment.shimmerPercent,
            harmonic_noise_ratio=assessment.harmonicNoiseRatio,
            vocal_abuse_behaviors=assessment.vocalAbuseBehaviors or [],
            hydration_rating=assessment.hydrationRating,
            vocal_hygiene_compliance=assessment.vocalHygieneCompliance,
            strain_rating=assessment.strainRating,
            breathiness_rating=assessment.breathinessRating,
            hoarseness_rating=assessment.hoarsenessRating,
            therapist_notes=assessment.therapistNotes,
            assessed_at=assessment.assessedAt or datetime.utcnow(),
        )
        
        db.add(db_assessment)
        await db.commit()
        await db.refresh(db_assessment)
        
        logger.info(f"Created voice assessment for learner {assessment.learnerId}")
        return _to_assessment_response(db_assessment)
        
    except Exception as e:
        logger.error(f"Error creating voice assessment: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/assessments/{learner_id}", response_model=List[VoiceAssessmentResponse])
async def get_voice_assessments(
    learner_id: str,
    assessment_type: Optional[str] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get voice assessments for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import VoiceAssessment
    
    query = select(VoiceAssessment).where(VoiceAssessment.learner_id == learner_id)
    
    if assessment_type:
        query = query.where(VoiceAssessment.assessment_type == assessment_type)
    if from_date:
        query = query.where(VoiceAssessment.assessed_at >= from_date)
    if to_date:
        query = query.where(VoiceAssessment.assessed_at <= to_date)
    
    result = await db.execute(
        query.order_by(VoiceAssessment.assessed_at.desc()).limit(limit)
    )
    assessments = result.scalars().all()
    
    return [_to_assessment_response(a) for a in assessments]


@router.get("/assessments/{learner_id}/latest", response_model=VoiceAssessmentResponse)
async def get_latest_voice_assessment(
    learner_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the most recent voice assessment for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import VoiceAssessment
    
    result = await db.execute(
        select(VoiceAssessment)
        .where(VoiceAssessment.learner_id == learner_id)
        .order_by(VoiceAssessment.assessed_at.desc())
        .limit(1)
    )
    assessment = result.scalar_one_or_none()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No voice assessments found"
        )
    
    return _to_assessment_response(assessment)


@router.put("/assessments/{assessment_id}", response_model=VoiceAssessmentResponse)
async def update_voice_assessment(
    assessment_id: str,
    update: VoiceAssessmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a voice assessment"""
    from db.models.slp import VoiceAssessment
    
    result = await db.execute(
        select(VoiceAssessment).where(VoiceAssessment.id == assessment_id)
    )
    assessment = result.scalar_one_or_none()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Voice assessment not found"
        )
    
    if not await verify_learner_access(current_user, assessment.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        update_data = update.model_dump(exclude_unset=True)
        
        field_mapping = {
            "pitchLevel": "pitch_level",
            "loudnessLevel": "loudness_level",
            "voiceQuality": "voice_quality",
            "maximumPhonationTime": "maximum_phonation_time",
            "szRatio": "s_z_ratio",
            "habitualPitchHz": "habitual_pitch_hz",
            "pitchRangeLowHz": "pitch_range_low_hz",
            "pitchRangeHighHz": "pitch_range_high_hz",
            "jitterPercent": "jitter_percent",
            "shimmerPercent": "shimmer_percent",
            "harmonicNoiseRatio": "harmonic_noise_ratio",
            "vocalAbuseBehaviors": "vocal_abuse_behaviors",
            "hydrationRating": "hydration_rating",
            "vocalHygieneCompliance": "vocal_hygiene_compliance",
            "strainRating": "strain_rating",
            "breathinessRating": "breathiness_rating",
            "hoarsenessRating": "hoarseness_rating",
            "therapistNotes": "therapist_notes",
        }
        
        for camel_key, snake_key in field_mapping.items():
            if camel_key in update_data:
                setattr(assessment, snake_key, update_data[camel_key])
        
        # Handle direct fields
        if "resonance" in update_data:
            assessment.resonance = update_data["resonance"]
        
        await db.commit()
        await db.refresh(assessment)
        
        logger.info(f"Updated voice assessment {assessment_id}")
        return _to_assessment_response(assessment)
        
    except Exception as e:
        logger.error(f"Error updating voice assessment: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/progress/{learner_id}", response_model=VoiceProgressResponse)
async def get_voice_progress(
    learner_id: str,
    days: int = Query(30, description="Number of days to include"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get voice therapy progress summary"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import VoiceAssessment
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    result = await db.execute(
        select(VoiceAssessment).where(
            and_(
                VoiceAssessment.learner_id == learner_id,
                VoiceAssessment.assessed_at >= cutoff_date
            )
        ).order_by(VoiceAssessment.assessed_at)
    )
    assessments = result.scalars().all()
    
    if not assessments:
        return VoiceProgressResponse(
            learnerId=learner_id,
            periodDays=days,
            totalAssessments=0,
            mptTrend=[],
            qualityTrend=[],
            vocalAbuseSummary={},
            hygieneCompliance=None,
        )
    
    # MPT trend
    mpt_trend = [
        {
            "date": a.assessed_at.date().isoformat(),
            "mpt": a.maximum_phonation_time,
        }
        for a in assessments if a.maximum_phonation_time
    ]
    
    # Quality ratings trend
    quality_trend = [
        {
            "date": a.assessed_at.date().isoformat(),
            "strain": a.strain_rating,
            "breathiness": a.breathiness_rating,
            "hoarseness": a.hoarseness_rating,
        }
        for a in assessments
    ]
    
    # Vocal abuse summary
    abuse_counts = {}
    for a in assessments:
        for behavior in (a.vocal_abuse_behaviors or []):
            abuse_counts[behavior] = abuse_counts.get(behavior, 0) + 1
    
    # Average hygiene compliance
    hygiene_scores = [a.vocal_hygiene_compliance for a in assessments if a.vocal_hygiene_compliance]
    avg_hygiene = round(sum(hygiene_scores) / len(hygiene_scores), 1) if hygiene_scores else None
    
    # Acoustic measures summary (latest)
    latest = assessments[-1] if assessments else None
    acoustic_summary = None
    if latest:
        acoustic_summary = {
            "habitualPitchHz": latest.habitual_pitch_hz,
            "pitchRangeLowHz": latest.pitch_range_low_hz,
            "pitchRangeHighHz": latest.pitch_range_high_hz,
            "jitterPercent": latest.jitter_percent,
            "shimmerPercent": latest.shimmer_percent,
            "harmonicNoiseRatio": latest.harmonic_noise_ratio,
            "szRatio": latest.s_z_ratio,
        }
    
    return VoiceProgressResponse(
        learnerId=learner_id,
        periodDays=days,
        totalAssessments=len(assessments),
        mptTrend=mpt_trend,
        qualityTrend=quality_trend,
        vocalAbuseSummary=abuse_counts,
        hygieneCompliance=avg_hygiene,
        acousticSummary=acoustic_summary,
    )


def _to_assessment_response(assessment) -> VoiceAssessmentResponse:
    """Convert database model to response schema"""
    return VoiceAssessmentResponse(
        id=assessment.id,
        learnerId=assessment.learner_id,
        sessionId=assessment.session_id,
        assessmentType=assessment.assessment_type,
        pitchLevel=assessment.pitch_level,
        loudnessLevel=assessment.loudness_level,
        voiceQuality=assessment.voice_quality,
        resonance=assessment.resonance,
        maximumPhonationTime=assessment.maximum_phonation_time,
        szRatio=assessment.s_z_ratio,
        habitualPitchHz=assessment.habitual_pitch_hz,
        pitchRangeLowHz=assessment.pitch_range_low_hz,
        pitchRangeHighHz=assessment.pitch_range_high_hz,
        jitterPercent=assessment.jitter_percent,
        shimmerPercent=assessment.shimmer_percent,
        harmonicNoiseRatio=assessment.harmonic_noise_ratio,
        vocalAbuseBehaviors=assessment.vocal_abuse_behaviors or [],
        hydrationRating=assessment.hydration_rating,
        vocalHygieneCompliance=assessment.vocal_hygiene_compliance,
        strainRating=assessment.strain_rating,
        breathinessRating=assessment.breathiness_rating,
        hoarsenessRating=assessment.hoarseness_rating,
        therapistNotes=assessment.therapist_notes,
        assessedAt=assessment.assessed_at,
        createdAt=assessment.created_at,
        updatedAt=assessment.updated_at,
    )
