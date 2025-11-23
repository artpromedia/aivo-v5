"""
Learner Database Model
Author: artpromedia
Date: 2025-11-23
"""

from sqlalchemy import Column, String, Integer, Boolean, JSON, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
import uuid

from db.models.base import Base


class Learner(Base):
    """
    Learner model representing a student in the AIVO Learning system
    """
    __tablename__ = "learners"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Personal information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    age = Column(Integer, nullable=False)
    grade_level = Column(String(50), nullable=False)
    date_of_birth = Column(DateTime, nullable=True)
    
    # Learning profile
    learning_style = Column(
        String(50),
        nullable=False,
        default="multimodal"
    )
    preferred_language = Column(String(10), default="en")
    timezone = Column(String(50), default="UTC")
    
    # Special needs and accommodations
    diagnoses = Column(ARRAY(String), default=[])
    accommodations = Column(ARRAY(String), default=[])
    iep_goals = Column(JSON, default=[])
    
    # Strengths and challenges
    strengths = Column(ARRAY(String), default=[])
    challenges = Column(ARRAY(String), default=[])
    interests = Column(ARRAY(String), default=[])
    
    # Learning preferences
    preferred_difficulty = Column(Float, default=0.5)
    preferred_pace = Column(String(20), default="moderate")
    
    # Virtual Brain settings
    virtual_brain_enabled = Column(Boolean, default=True)
    virtual_brain_temperature = Column(Float, default=0.7)
    
    # Relationships and associations
    parent_id = Column(UUID(as_uuid=True), nullable=True)
    teacher_id = Column(UUID(as_uuid=True), nullable=True)
    school_id = Column(UUID(as_uuid=True), nullable=True)
    district_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    enrollment_status = Column(String(50), default="active")
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Learner {self.first_name} {self.last_name} (ID: {self.id})>"
    
    def to_dict(self):
        """Convert learner to dictionary"""
        return {
            "id": str(self.id),
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "age": self.age,
            "grade_level": self.grade_level,
            "learning_style": self.learning_style,
            "diagnoses": self.diagnoses or [],
            "accommodations": self.accommodations or [],
            "iep_goals": self.iep_goals or [],
            "strengths": self.strengths or [],
            "challenges": self.challenges or [],
            "interests": self.interests or [],
            "preferred_difficulty": self.preferred_difficulty,
            "preferred_pace": self.preferred_pace,
            "language": self.preferred_language,
            "timezone": self.timezone,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
