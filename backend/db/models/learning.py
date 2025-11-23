"""
Learning Activity Models
Author: artpromedia
Date: 2025-11-23
"""

from sqlalchemy import (
    Column, String, Integer, DateTime, Boolean, Float, JSON, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from datetime import datetime

from db.database import Base


class LearningSession(Base):
    __tablename__ = "learning_sessions"
    
    id = Column(String, primary_key=True)
    learner_id = Column(String, ForeignKey("learners.id"), nullable=False)
    
    # Session Info
    subject = Column(String, nullable=False)
    topic = Column(String)
    skill = Column(String)
    
    # Timing
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    duration_minutes = Column(Integer)
    break_count = Column(Integer, default=0)
    break_duration = Column(Integer, default=0)
    
    # Performance
    activities_completed = Column(Integer, default=0)
    accuracy_rate = Column(Float)
    engagement_score = Column(Float)
    frustration_score = Column(Float)
    
    # AI Metrics
    adaptations_made = Column(Integer, default=0)
    difficulty_adjustments = Column(JSON, default=list)
    virtual_brain_state = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    learner = relationship("Learner", back_populates="sessions")
    activities = relationship(
        "Activity",
        back_populates="session",
        cascade="all, delete-orphan"
    )


class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(String, primary_key=True)
    session_id = Column(
        String,
        ForeignKey("learning_sessions.id"),
        nullable=False
    )
    learner_id = Column(String, ForeignKey("learners.id"), nullable=False)
    
    # Activity Info
    type = Column(String, nullable=False)
    content_id = Column(String)
    question = Column(Text)
    correct_answer = Column(Text)
    learner_answer = Column(Text)
    
    # Performance
    is_correct = Column(Boolean)
    attempts = Column(Integer, default=1)
    time_spent = Column(Integer)  # in seconds
    hints_used = Column(Integer, default=0)
    
    # AI Data
    difficulty_level = Column(Float)
    adaptation_applied = Column(JSON)
    ai_feedback = Column(Text)
    
    # Timestamps
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("LearningSession", back_populates="activities")


class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(String, primary_key=True)
    learner_id = Column(String, ForeignKey("learners.id"), nullable=False)
    
    # Assessment Info
    type = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    grade_level = Column(String)
    
    # Results
    total_questions = Column(Integer)
    correct_answers = Column(Integer)
    score = Column(Float)
    percentile = Column(Float)
    grade_equivalent = Column(String)
    age_equivalent = Column(String)
    
    # Detailed Results
    results = Column(JSON, default=dict)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)
    
    # Administration
    administered_by = Column(String)
    administered_at = Column(DateTime)
    duration_minutes = Column(Integer)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    learner = relationship("Learner", back_populates="assessments")


class SkillProgress(Base):
    __tablename__ = "skill_progress"
    
    id = Column(String, primary_key=True)
    learner_id = Column(String, ForeignKey("learners.id"), nullable=False)
    
    # Skill Info
    skill_id = Column(String, nullable=False)
    skill_name = Column(String, nullable=False)
    category = Column(String)
    subject = Column(String)
    
    # Progress Metrics
    mastery_level = Column(Float, default=0.0)  # 0-1
    accuracy = Column(Float)
    speed = Column(Float)
    consistency = Column(Float)
    
    # Practice Stats
    total_attempts = Column(Integer, default=0)
    successful_attempts = Column(Integer, default=0)
    last_practiced = Column(DateTime)
    practice_streak = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    learner = relationship("Learner", back_populates="skill_progress")


class Diagnosis(Base):
    __tablename__ = "diagnoses"
    
    id = Column(String, primary_key=True)
    learner_id = Column(String, ForeignKey("learners.id"), nullable=False)
    
    type = Column(String, nullable=False)
    severity = Column(String)
    diagnosed_date = Column(DateTime)
    diagnosed_by = Column(String)
    documentation_url = Column(String)
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    learner = relationship("Learner", back_populates="diagnoses")


class Accommodation(Base):
    __tablename__ = "accommodations"
    
    id = Column(String, primary_key=True)
    learner_id = Column(String, ForeignKey("learners.id"), nullable=False)
    
    type = Column(String, nullable=False)
    category = Column(String)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    
    # Settings
    settings = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    learner = relationship("Learner", back_populates="accommodations")
