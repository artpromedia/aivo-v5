"""
Speech Analysis API Routes
Author: artpromedia
Date: 2025-01-26

Provides AI-powered speech analysis endpoints for:
- Articulation assessment
- Fluency analysis
- Prosody evaluation
- Speech pattern recognition
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime

from db.database import get_db
from db.models.user import User
from api.dependencies.auth import get_current_user
from core.logging import setup_logging
from services.speech_analysis import (
    analyze_articulation,
    analyze_fluency,
    analyze_prosody,
    generate_speech_feedback,
)

router = APIRouter(prefix="/speech", tags=["Speech Analysis"])
logger = setup_logging(__name__)


# ===== Request/Response Models =====

class SpeechAnalysisRequest(BaseModel):
    """Request model for speech analysis"""
    audioBase64: str = Field(..., description="Base64 encoded audio data")
    sampleRate: int = Field(default=16000, description="Audio sample rate in Hz")
    childAge: int = Field(..., ge=1, le=21, description="Child's age in years")
    taskType: Literal["articulation", "fluency", "conversation", "reading"] = Field(
        ..., description="Type of speech analysis task"
    )
    targetText: Optional[str] = Field(None, description="Expected text for reading/articulation tasks")
    learnerId: Optional[str] = Field(None, description="Learner ID for tracking")


class ArticulationResult(BaseModel):
    """Articulation analysis result"""
    phoneme: str
    position: str  # initial, medial, final
    expected: str
    produced: str
    isCorrect: bool
    errorType: Optional[str] = None  # substitution, omission, distortion, addition
    confidence: float


class FluencyResult(BaseModel):
    """Fluency analysis result"""
    totalSyllables: int
    disfluencies: int
    percentDisfluent: float
    stutteringEvents: List[dict]
    speechRate: float  # syllables per minute
    pauseDuration: float  # average pause duration in seconds


class ProsodyResult(BaseModel):
    """Prosody analysis result"""
    pitchVariation: float
    volumeVariation: float
    speechRate: float
    intonationScore: float
    stressPatternScore: float
    overallProsodyScore: float


class SpeechAnalysisResponse(BaseModel):
    """Response model for speech analysis"""
    analysisId: str
    taskType: str
    timestamp: datetime
    articulation: Optional[List[ArticulationResult]] = None
    fluency: Optional[FluencyResult] = None
    prosody: Optional[ProsodyResult] = None
    overallScore: float
    feedback: List[str]
    recommendations: List[str]
    processingTimeMs: int


class SpeechFeedbackRequest(BaseModel):
    """Request for generating personalized feedback"""
    learnerId: str
    analysisHistory: List[dict]
    currentGoals: Optional[List[str]] = None
    preferenceLanguage: str = "en"


class SpeechFeedbackResponse(BaseModel):
    """Personalized feedback response"""
    summary: str
    strengths: List[str]
    areasForImprovement: List[str]
    practiceActivities: List[dict]
    parentTips: List[str]
    progressNote: str


# ===== Endpoints =====

@router.post("/analyze", response_model=SpeechAnalysisResponse)
async def analyze_speech(
    request: SpeechAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze speech recording using AI
    
    Supports multiple analysis types:
    - articulation: Phoneme-level accuracy assessment
    - fluency: Stuttering/disfluency detection
    - conversation: Natural speech analysis
    - reading: Reading accuracy and prosody
    """
    import time
    import uuid
    
    start_time = time.time()
    
    try:
        analysis_id = str(uuid.uuid4())
        
        # Initialize results
        articulation_results = None
        fluency_results = None
        prosody_results = None
        feedback = []
        recommendations = []
        overall_score = 0.0
        
        # Perform task-specific analysis
        if request.taskType == "articulation":
            articulation_results = await analyze_articulation(
                audio_base64=request.audioBase64,
                sample_rate=request.sampleRate,
                target_text=request.targetText,
                child_age=request.childAge,
            )
            
            if articulation_results:
                correct = sum(1 for r in articulation_results if r.get("isCorrect", False))
                total = len(articulation_results)
                overall_score = (correct / total * 100) if total > 0 else 0
                
                # Generate feedback for articulation
                error_phonemes = [r["phoneme"] for r in articulation_results if not r.get("isCorrect", False)]
                if error_phonemes:
                    feedback.append(f"Focus areas: {', '.join(set(error_phonemes))}")
                    recommendations.append("Practice target sounds in isolation before words")
                else:
                    feedback.append("Excellent articulation accuracy!")
                    recommendations.append("Progress to more complex word positions")
        
        elif request.taskType == "fluency":
            fluency_results = await analyze_fluency(
                audio_base64=request.audioBase64,
                sample_rate=request.sampleRate,
                child_age=request.childAge,
            )
            
            if fluency_results:
                # Score based on percentage of fluent speech
                overall_score = max(0, 100 - fluency_results.get("percentDisfluent", 0))
                
                if fluency_results.get("percentDisfluent", 0) < 5:
                    feedback.append("Fluent speech observed")
                else:
                    feedback.append(f"Disfluency rate: {fluency_results.get('percentDisfluent', 0):.1f}%")
                    recommendations.append("Practice slow, easy speech techniques")
        
        elif request.taskType in ["conversation", "reading"]:
            # Analyze prosody for conversation and reading
            prosody_results = await analyze_prosody(
                audio_base64=request.audioBase64,
                sample_rate=request.sampleRate,
                target_text=request.targetText if request.taskType == "reading" else None,
            )
            
            if prosody_results:
                overall_score = prosody_results.get("overallProsodyScore", 0) * 100
                
                if overall_score >= 80:
                    feedback.append("Natural, expressive speech")
                else:
                    feedback.append("Work on varying pitch and rhythm")
                    recommendations.append("Practice reading with expression")
        
        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Log analysis
        logger.info(f"Speech analysis completed: {analysis_id}, task: {request.taskType}, score: {overall_score}")
        
        return SpeechAnalysisResponse(
            analysisId=analysis_id,
            taskType=request.taskType,
            timestamp=datetime.utcnow(),
            articulation=[ArticulationResult(**r) for r in articulation_results] if articulation_results else None,
            fluency=FluencyResult(**fluency_results) if fluency_results else None,
            prosody=ProsodyResult(**prosody_results) if prosody_results else None,
            overallScore=overall_score,
            feedback=feedback or ["Analysis completed"],
            recommendations=recommendations or ["Continue practicing regularly"],
            processingTimeMs=processing_time_ms,
        )
        
    except Exception as e:
        logger.error(f"Speech analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech analysis failed: {str(e)}"
        )


@router.post("/feedback", response_model=SpeechFeedbackResponse)
async def generate_personalized_feedback(
    request: SpeechFeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate personalized speech therapy feedback using AI
    
    Analyzes history and goals to provide:
    - Progress summary
    - Strengths identification
    - Targeted recommendations
    - Home practice activities
    - Parent guidance tips
    """
    try:
        feedback = await generate_speech_feedback(
            learner_id=request.learnerId,
            analysis_history=request.analysisHistory,
            current_goals=request.currentGoals,
            language=request.preferenceLanguage,
        )
        
        return SpeechFeedbackResponse(
            summary=feedback.get("summary", "Speech therapy progress review"),
            strengths=feedback.get("strengths", []),
            areasForImprovement=feedback.get("areasForImprovement", []),
            practiceActivities=feedback.get("practiceActivities", []),
            parentTips=feedback.get("parentTips", []),
            progressNote=feedback.get("progressNote", "Continue regular practice"),
        )
        
    except Exception as e:
        logger.error(f"Feedback generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Feedback generation failed: {str(e)}"
        )


@router.get("/history/{learner_id}")
async def get_speech_analysis_history(
    learner_id: str,
    limit: int = 10,
    task_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get speech analysis history for a learner"""
    from sqlalchemy import select, desc
    
    try:
        # Query speech analysis records
        from db.models.slp import SpeechAnalysisRecord
        
        query = select(SpeechAnalysisRecord).where(
            SpeechAnalysisRecord.learner_id == learner_id
        )
        
        if task_type:
            query = query.where(SpeechAnalysisRecord.task_type == task_type)
        
        query = query.order_by(desc(SpeechAnalysisRecord.created_at)).limit(limit)
        
        result = await db.execute(query)
        records = result.scalars().all()
        
        return [
            {
                "analysisId": str(record.id),
                "taskType": record.task_type,
                "overallScore": record.overall_score,
                "timestamp": record.created_at.isoformat(),
            }
            for record in records
        ]
        
    except Exception as e:
        logger.error(f"Error fetching speech history: {e}")
        # Return empty list if model doesn't exist yet
        return []
