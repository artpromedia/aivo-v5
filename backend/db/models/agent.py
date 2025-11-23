"""
AI Agent Models
Author: artpromedia
Date: 2025-11-23
"""

from sqlalchemy import (
    Column, String, Integer, DateTime, JSON, ForeignKey, Text, Float
)
from sqlalchemy.orm import relationship
from datetime import datetime

from db.database import Base


class AgentState(Base):
    __tablename__ = "agent_states"
    
    id = Column(String, primary_key=True)
    learner_id = Column(String, ForeignKey("learners.id"), nullable=False)
    brain_id = Column(String, nullable=False)
    
    # Cognitive State
    cognitive_load = Column(Float, default=0.5)
    engagement = Column(Float, default=1.0)
    frustration = Column(Float, default=0.0)
    fatigue = Column(Float, default=0.0)
    confidence = Column(Float, default=0.7)
    motivation = Column(Float, default=0.8)
    
    # Performance State
    accuracy = Column(Float, default=0.5)
    speed = Column(Float, default=1.0)
    consistency = Column(Float, default=1.0)
    improvement_rate = Column(Float, default=0.0)
    
    # Session State
    current_activity = Column(String)
    session_id = Column(String)
    activities_completed = Column(Integer, default=0)
    last_break = Column(DateTime)
    
    # Full State Data
    state_data = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


class AgentMemory(Base):
    __tablename__ = "agent_memories"
    
    id = Column(String, primary_key=True)
    learner_id = Column(String, ForeignKey("learners.id"), nullable=False)
    brain_id = Column(String, nullable=False)
    
    # Memory Info
    type = Column(String)
    category = Column(String)
    importance = Column(Float, default=0.5)
    
    # Content
    content = Column(JSON)
    summary = Column(Text)
    embeddings = Column(JSON)  # Vector embeddings
    
    # Context
    context = Column(JSON)
    related_memories = Column(JSON, default=list)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    accessed_at = Column(DateTime)
    access_count = Column(Integer, default=0)


class Adaptation(Base):
    __tablename__ = "adaptations"
    
    id = Column(String, primary_key=True)
    learner_id = Column(String, ForeignKey("learners.id"), nullable=False)
    session_id = Column(String)
    
    # Adaptation Info
    type = Column(String)
    trigger = Column(String)
    trigger_value = Column(Float)
    
    # Original Content
    original_content = Column(JSON)
    
    # Adapted Content
    adapted_content = Column(JSON)
    adaptation_details = Column(JSON)
    
    # Effectiveness
    effectiveness_score = Column(Float)
    learner_feedback = Column(String)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
