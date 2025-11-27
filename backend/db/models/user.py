"""
User and Authentication Models
Author: artpromedia
Date: 2025-11-23
"""

from sqlalchemy import (
    Column, String, Integer, DateTime, Boolean, Enum as SQLEnum, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from db.database import Base


class UserRole(str, enum.Enum):
    # Platform-level roles
    SUPER_ADMIN = "super_admin"
    GLOBAL_ADMIN = "global_admin"
    FINANCE_ADMIN = "finance_admin"
    TECH_SUPPORT = "tech_support"
    LEGAL_COMPLIANCE = "legal_compliance"
    
    # Organizational roles
    DISTRICT_ADMIN = "district_admin"
    SCHOOL_ADMIN = "school_admin"
    
    # Educational roles
    TEACHER = "teacher"
    THERAPIST = "therapist"
    PARENT = "parent"
    LEARNER = "learner"


class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.PARENT)
    
    # Profile
    phone = Column(String)
    avatar_url = Column(String)
    timezone = Column(String, default="UTC")
    language = Column(String, default="en")
    
    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime)
    
    # OAuth
    oauth_provider = Column(String)
    oauth_id = Column(String)
    
    # Subscription
    subscription_tier = Column(String, default="free")
    subscription_expires = Column(DateTime)
    stripe_customer_id = Column(String)
    
    # Metadata
    last_login = Column(DateTime)
    login_count = Column(Integer, default=0)
    preferences = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    learners = relationship(
        "Learner",
        back_populates="parent",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role.value if self.role else None,
            "phone": self.phone,
            "avatar_url": self.avatar_url,
            "timezone": self.timezone,
            "language": self.language,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "subscription_tier": self.subscription_tier,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
