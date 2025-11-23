"""
AI Agent Schemas
Author: artpromedia  
Date: 2025-11-23
"""

from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime


class AgentInteraction(BaseModel):
    learner_id: str
    type: str
    content: Dict[str, Any]
    response: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class AgentResponse(BaseModel):
    success: bool
    brain_id: str
    adapted_content: Dict[str, Any]
    ai_response: str
    feedback: Optional[Dict[str, Any]] = None
    state: Dict[str, Any]
    performance: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    adaptation_applied: bool
    processing_time: float
    session_id: str


class AgentState(BaseModel):
    brain_id: str
    learner_id: str
    cognitive_state: Dict[str, Any]
    performance_metrics: Dict[str, Any]
    current_session: Dict[str, Any]
    initialized: bool


class AdaptationRequest(BaseModel):
    learner_id: str
    content: Dict[str, Any]


class AdaptationResponse(BaseModel):
    original_content: Dict[str, Any]
    adapted_content: Dict[str, Any]
    adaptations_applied: List[str]
    learner_id: str


class SessionSummary(BaseModel):
    session_id: str
    learner_id: str
    brain_id: str
    start_time: str
    end_time: str
    duration_minutes: float
    interactions_count: int
    adaptations_made: int
    final_state: Dict[str, Any]
    final_performance: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
