"""
Language Assessment Routes (Receptive & Expressive)
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
    ReceptiveLanguageAssessmentCreate,
    ReceptiveLanguageAssessmentResponse,
    ExpressiveLanguageAssessmentCreate,
    ExpressiveLanguageAssessmentResponse,
    LanguageProgressResponse,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter(prefix="/slp/language", tags=["SLP Language"])
logger = setup_logging(__name__)


# ===== Receptive Language Assessments =====

@router.post("/receptive", response_model=ReceptiveLanguageAssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_receptive_assessment(
    assessment: ReceptiveLanguageAssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a receptive language assessment"""
    if not await verify_learner_access(current_user, assessment.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        from db.models.slp import ReceptiveLanguageAssessment
        
        db_assessment = ReceptiveLanguageAssessment(
            learner_id=assessment.learnerId,
            session_id=assessment.sessionId,
            assessment_type=assessment.assessmentType,
            skill_area=assessment.skillArea,
            task_description=assessment.taskDescription,
            stimulus_type=assessment.stimulusType,
            total_items=assessment.totalItems,
            correct_items=assessment.correctItems,
            accuracy_percentage=round(
                assessment.correctItems / assessment.totalItems * 100, 1
            ) if assessment.totalItems > 0 else 0,
            response_latency_avg_ms=assessment.responseLatencyAvgMs,
            comprehension_level=assessment.comprehensionLevel,
            supports_needed=assessment.supportsNeeded or [],
            error_patterns=assessment.errorPatterns or [],
            therapist_notes=assessment.therapistNotes,
            assessed_at=assessment.assessedAt or datetime.utcnow(),
        )
        
        db.add(db_assessment)
        await db.commit()
        await db.refresh(db_assessment)
        
        logger.info(f"Created receptive language assessment for learner {assessment.learnerId}")
        return _to_receptive_response(db_assessment)
        
    except Exception as e:
        logger.error(f"Error creating receptive assessment: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/receptive/{learner_id}", response_model=List[ReceptiveLanguageAssessmentResponse])
async def get_receptive_assessments(
    learner_id: str,
    skill_area: Optional[str] = Query(None, description="Filter by skill area"),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get receptive language assessments for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import ReceptiveLanguageAssessment
    
    query = select(ReceptiveLanguageAssessment).where(
        ReceptiveLanguageAssessment.learner_id == learner_id
    )
    
    if skill_area:
        query = query.where(ReceptiveLanguageAssessment.skill_area == skill_area)
    if from_date:
        query = query.where(ReceptiveLanguageAssessment.assessed_at >= from_date)
    if to_date:
        query = query.where(ReceptiveLanguageAssessment.assessed_at <= to_date)
    
    result = await db.execute(
        query.order_by(ReceptiveLanguageAssessment.assessed_at.desc()).limit(limit)
    )
    assessments = result.scalars().all()
    
    return [_to_receptive_response(a) for a in assessments]


# ===== Expressive Language Assessments =====

@router.post("/expressive", response_model=ExpressiveLanguageAssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_expressive_assessment(
    assessment: ExpressiveLanguageAssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create an expressive language assessment"""
    if not await verify_learner_access(current_user, assessment.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        from db.models.slp import ExpressiveLanguageAssessment
        
        # Calculate MLU if utterances provided
        mlu = None
        if assessment.sampleUtterances:
            total_morphemes = sum(
                len(u.split()) for u in assessment.sampleUtterances
            )
            mlu = round(total_morphemes / len(assessment.sampleUtterances), 2)
        
        db_assessment = ExpressiveLanguageAssessment(
            learner_id=assessment.learnerId,
            session_id=assessment.sessionId,
            assessment_type=assessment.assessmentType,
            skill_area=assessment.skillArea,
            task_description=assessment.taskDescription,
            sample_utterances=assessment.sampleUtterances or [],
            mean_length_utterance=mlu or assessment.meanLengthUtterance,
            vocabulary_diversity=assessment.vocabularyDiversity,
            grammatical_accuracy=assessment.grammaticalAccuracy,
            morpheme_usage=assessment.morphemeUsage or {},
            sentence_structures_used=assessment.sentenceStructuresUsed or [],
            word_finding_difficulties=assessment.wordFindingDifficulties or 0,
            self_corrections=assessment.selfCorrections or 0,
            prompts_needed=assessment.promptsNeeded or 0,
            communication_effectiveness=assessment.communicationEffectiveness,
            therapist_notes=assessment.therapistNotes,
            assessed_at=assessment.assessedAt or datetime.utcnow(),
        )
        
        db.add(db_assessment)
        await db.commit()
        await db.refresh(db_assessment)
        
        logger.info(f"Created expressive language assessment for learner {assessment.learnerId}")
        return _to_expressive_response(db_assessment)
        
    except Exception as e:
        logger.error(f"Error creating expressive assessment: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/expressive/{learner_id}", response_model=List[ExpressiveLanguageAssessmentResponse])
async def get_expressive_assessments(
    learner_id: str,
    skill_area: Optional[str] = Query(None, description="Filter by skill area"),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get expressive language assessments for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import ExpressiveLanguageAssessment
    
    query = select(ExpressiveLanguageAssessment).where(
        ExpressiveLanguageAssessment.learner_id == learner_id
    )
    
    if skill_area:
        query = query.where(ExpressiveLanguageAssessment.skill_area == skill_area)
    if from_date:
        query = query.where(ExpressiveLanguageAssessment.assessed_at >= from_date)
    if to_date:
        query = query.where(ExpressiveLanguageAssessment.assessed_at <= to_date)
    
    result = await db.execute(
        query.order_by(ExpressiveLanguageAssessment.assessed_at.desc()).limit(limit)
    )
    assessments = result.scalars().all()
    
    return [_to_expressive_response(a) for a in assessments]


# ===== Language Progress =====

@router.get("/progress/{learner_id}", response_model=LanguageProgressResponse)
async def get_language_progress(
    learner_id: str,
    days: int = Query(30, description="Number of days to include"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get combined language progress for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    from db.models.slp import ReceptiveLanguageAssessment, ExpressiveLanguageAssessment
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get receptive assessments
    receptive_result = await db.execute(
        select(ReceptiveLanguageAssessment).where(
            and_(
                ReceptiveLanguageAssessment.learner_id == learner_id,
                ReceptiveLanguageAssessment.assessed_at >= cutoff_date
            )
        ).order_by(ReceptiveLanguageAssessment.assessed_at)
    )
    receptive_assessments = receptive_result.scalars().all()
    
    # Get expressive assessments
    expressive_result = await db.execute(
        select(ExpressiveLanguageAssessment).where(
            and_(
                ExpressiveLanguageAssessment.learner_id == learner_id,
                ExpressiveLanguageAssessment.assessed_at >= cutoff_date
            )
        ).order_by(ExpressiveLanguageAssessment.assessed_at)
    )
    expressive_assessments = expressive_result.scalars().all()
    
    # Calculate receptive stats
    receptive_by_skill = {}
    for a in receptive_assessments:
        skill = a.skill_area or "general"
        if skill not in receptive_by_skill:
            receptive_by_skill[skill] = {"total": 0, "correct": 0, "assessments": 0}
        receptive_by_skill[skill]["total"] += a.total_items
        receptive_by_skill[skill]["correct"] += a.correct_items
        receptive_by_skill[skill]["assessments"] += 1
    
    receptive_progress = [
        {
            "skillArea": skill,
            "totalItems": stats["total"],
            "correctItems": stats["correct"],
            "accuracy": round(stats["correct"] / stats["total"] * 100, 1) if stats["total"] > 0 else 0,
            "assessmentCount": stats["assessments"],
        }
        for skill, stats in receptive_by_skill.items()
    ]
    
    # Calculate expressive stats
    expressive_by_skill = {}
    mlu_trend = []
    for a in expressive_assessments:
        skill = a.skill_area or "general"
        if skill not in expressive_by_skill:
            expressive_by_skill[skill] = {"mlu_sum": 0, "vocab_sum": 0, "grammar_sum": 0, "count": 0}
        if a.mean_length_utterance:
            expressive_by_skill[skill]["mlu_sum"] += a.mean_length_utterance
        if a.vocabulary_diversity:
            expressive_by_skill[skill]["vocab_sum"] += a.vocabulary_diversity
        if a.grammatical_accuracy:
            expressive_by_skill[skill]["grammar_sum"] += a.grammatical_accuracy
        expressive_by_skill[skill]["count"] += 1
        
        if a.mean_length_utterance:
            mlu_trend.append({
                "date": a.assessed_at.date().isoformat(),
                "mlu": a.mean_length_utterance,
            })
    
    expressive_progress = [
        {
            "skillArea": skill,
            "averageMlu": round(stats["mlu_sum"] / stats["count"], 2) if stats["count"] > 0 and stats["mlu_sum"] > 0 else None,
            "averageVocabularyDiversity": round(stats["vocab_sum"] / stats["count"], 1) if stats["count"] > 0 and stats["vocab_sum"] > 0 else None,
            "averageGrammaticalAccuracy": round(stats["grammar_sum"] / stats["count"], 1) if stats["count"] > 0 and stats["grammar_sum"] > 0 else None,
            "assessmentCount": stats["count"],
        }
        for skill, stats in expressive_by_skill.items()
    ]
    
    return LanguageProgressResponse(
        learnerId=learner_id,
        periodDays=days,
        receptiveAssessments=len(receptive_assessments),
        expressiveAssessments=len(expressive_assessments),
        receptiveProgress=receptive_progress,
        expressiveProgress=expressive_progress,
        mluTrend=mlu_trend,
    )


def _to_receptive_response(assessment) -> ReceptiveLanguageAssessmentResponse:
    """Convert database model to response schema"""
    return ReceptiveLanguageAssessmentResponse(
        id=assessment.id,
        learnerId=assessment.learner_id,
        sessionId=assessment.session_id,
        assessmentType=assessment.assessment_type,
        skillArea=assessment.skill_area,
        taskDescription=assessment.task_description,
        stimulusType=assessment.stimulus_type,
        totalItems=assessment.total_items,
        correctItems=assessment.correct_items,
        accuracyPercentage=assessment.accuracy_percentage,
        responseLatencyAvgMs=assessment.response_latency_avg_ms,
        comprehensionLevel=assessment.comprehension_level,
        supportsNeeded=assessment.supports_needed or [],
        errorPatterns=assessment.error_patterns or [],
        therapistNotes=assessment.therapist_notes,
        assessedAt=assessment.assessed_at,
        createdAt=assessment.created_at,
    )


def _to_expressive_response(assessment) -> ExpressiveLanguageAssessmentResponse:
    """Convert database model to response schema"""
    return ExpressiveLanguageAssessmentResponse(
        id=assessment.id,
        learnerId=assessment.learner_id,
        sessionId=assessment.session_id,
        assessmentType=assessment.assessment_type,
        skillArea=assessment.skill_area,
        taskDescription=assessment.task_description,
        sampleUtterances=assessment.sample_utterances or [],
        meanLengthUtterance=assessment.mean_length_utterance,
        vocabularyDiversity=assessment.vocabulary_diversity,
        grammaticalAccuracy=assessment.grammatical_accuracy,
        morphemeUsage=assessment.morpheme_usage or {},
        sentenceStructuresUsed=assessment.sentence_structures_used or [],
        wordFindingDifficulties=assessment.word_finding_difficulties,
        selfCorrections=assessment.self_corrections,
        promptsNeeded=assessment.prompts_needed,
        communicationEffectiveness=assessment.communication_effectiveness,
        therapistNotes=assessment.therapist_notes,
        assessedAt=assessment.assessed_at,
        createdAt=assessment.created_at,
    )
