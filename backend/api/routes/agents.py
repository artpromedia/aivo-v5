"""
AI Agent API Routes
Author: artpromedia
Date: 2025-11-23
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from db.database import get_db
from db.models.user import User
from api.schemas.agent import (
    AgentInteraction,
    AgentResponse,
    AgentState,
    AdaptationRequest,
    AdaptationResponse,
    SessionSummary
)
from api.dependencies.auth import get_current_user, verify_learner_access
from agents.agent_manager import agent_manager
from core.logging import setup_logging

router = APIRouter()
logger = setup_logging(__name__)


@router.post("/interact", response_model=AgentResponse)
async def interact_with_virtual_brain(
    interaction: AgentInteraction,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Process an interaction with the learner's Virtual Brain
    """
    # Verify access to learner
    if not await verify_learner_access(current_user, interaction.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        # Get or create Virtual Brain for learner
        virtual_brain = await agent_manager.get_or_create_virtual_brain(
            interaction.learner_id,
            db
        )
        
        # Process interaction
        result = await virtual_brain.process_interaction(
            interaction_type=interaction.type,
            content=interaction.content,
            learner_response=interaction.response,
            context=interaction.context
        )
        
        # Log interaction in background
        background_tasks.add_task(
            log_interaction,
            interaction.learner_id,
            interaction.type,
            result
        )
        
        return AgentResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in Virtual Brain interaction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Virtual Brain error: {str(e)}"
        )


@router.get("/state/{learner_id}", response_model=AgentState)
async def get_virtual_brain_state(
    learner_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current state of learner's Virtual Brain
    """
    # Verify access
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        virtual_brain = await agent_manager.get_virtual_brain(learner_id)
        
        if not virtual_brain:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Virtual Brain not found for this learner"
            )
        
        return AgentState(
            brain_id=virtual_brain.id,
            learner_id=learner_id,
            cognitive_state=virtual_brain.cognitive_state.dict(),
            performance_metrics=virtual_brain.performance_metrics,
            current_session=virtual_brain.current_session,
            initialized=virtual_brain.initialized
        )
        
    except Exception as e:
        logger.error(f"Error getting Virtual Brain state: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving state: {str(e)}"
        )


@router.post("/adapt-content", response_model=AdaptationResponse)
async def adapt_content_for_learner(
    request: AdaptationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Adapt content specifically for a learner using their Virtual Brain
    """
    # Verify access
    if not await verify_learner_access(current_user, request.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        virtual_brain = await agent_manager.get_or_create_virtual_brain(
            request.learner_id,
            db
        )
        
        # Use adaptation engine
        adapted_content = await virtual_brain.adaptation_engine.adapt(
            content=request.content,
            profile=virtual_brain.profile,
            state=virtual_brain.cognitive_state,
            performance=virtual_brain.performance_metrics
        )
        
        adaptations = adapted_content.get("adaptations", {}).get("applied", [])
        
        return AdaptationResponse(
            original_content=request.content,
            adapted_content=adapted_content,
            adaptations_applied=adaptations,
            learner_id=request.learner_id
        )
        
    except Exception as e:
        logger.error(f"Error adapting content: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Content adaptation error: {str(e)}"
        )


@router.post("/session/end/{learner_id}", response_model=SessionSummary)
async def end_learning_session(
    learner_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    End the current learning session and get summary
    """
    # Verify access
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        virtual_brain = await agent_manager.get_virtual_brain(learner_id)
        
        if not virtual_brain:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active session for this learner"
            )
        
        # End session and get summary
        summary = await virtual_brain.end_session()
        
        return SessionSummary(**summary)
        
    except Exception as e:
        logger.error(f"Error ending session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Session end error: {str(e)}"
        )


@router.get("/recommendations/{learner_id}")
async def get_learning_recommendations(
    learner_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get personalized learning recommendations from Virtual Brain
    """
    # Verify access
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        virtual_brain = await agent_manager.get_or_create_virtual_brain(
            learner_id,
            db
        )
        
        # Generate recommendations based on current state
        from datetime import datetime
        recommendations = await virtual_brain._generate_recommendations(
            virtual_brain.cognitive_state.dict(),
            virtual_brain.performance_metrics
        )
        
        return {
            "learner_id": learner_id,
            "recommendations": recommendations,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendation error: {str(e)}"
        )


# Helper function for background logging
async def log_interaction(
    learner_id: str,
    interaction_type: str,
    result: Dict[str, Any]
):
    """Log interaction to database in background"""
    try:
        logger.info(
            f"Interaction logged for learner {learner_id}: {interaction_type}"
        )
    except Exception as e:
        logger.error(f"Failed to log interaction: {str(e)}")
