"""
Pydantic schemas for IEP Upload & Extraction System.
Handles document upload, OCR processing, AI extraction, and verification.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator


# ==========================================
# ENUMS
# ==========================================

class IEPDocumentStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    EXTRACTED = "EXTRACTED"
    FAILED = "FAILED"
    REVIEWED = "REVIEWED"
    APPROVED = "APPROVED"


class VirusScanStatus(str, Enum):
    PENDING = "PENDING"
    CLEAN = "CLEAN"
    INFECTED = "INFECTED"
    ERROR = "ERROR"


class IEPGoalDomain(str, Enum):
    READING = "READING"
    MATH = "MATH"
    WRITING = "WRITING"
    BEHAVIOR = "BEHAVIOR"
    SOCIAL = "SOCIAL"
    COMMUNICATION = "COMMUNICATION"
    MOTOR = "MOTOR"
    ADAPTIVE = "ADAPTIVE"
    TRANSITION = "TRANSITION"
    EXECUTIVE_FUNCTION = "EXECUTIVE_FUNCTION"
    SELF_ADVOCACY = "SELF_ADVOCACY"
    OTHER = "OTHER"


class IEPServiceType(str, Enum):
    SPEECH = "SPEECH"
    OT = "OT"
    PT = "PT"
    COUNSELING = "COUNSELING"
    RESOURCE = "RESOURCE"
    SPECIALIZED_INSTRUCTION = "SPECIALIZED_INSTRUCTION"
    BEHAVIOR_SUPPORT = "BEHAVIOR_SUPPORT"
    VISION = "VISION"
    HEARING = "HEARING"
    ASSISTIVE_TECH = "ASSISTIVE_TECH"
    SOCIAL_WORK = "SOCIAL_WORK"
    NURSING = "NURSING"
    TRANSPORTATION = "TRANSPORTATION"
    ESY = "ESY"
    OTHER = "OTHER"


class AccommodationCategory(str, Enum):
    PRESENTATION = "PRESENTATION"
    RESPONSE = "RESPONSE"
    SETTING = "SETTING"
    TIMING = "TIMING"
    BEHAVIORAL = "BEHAVIORAL"
    ASSISTIVE_TECH = "ASSISTIVE_TECH"
    ORGANIZATIONAL = "ORGANIZATIONAL"
    SOCIAL_EMOTIONAL = "SOCIAL_EMOTIONAL"


class AccommodationScope(str, Enum):
    CLASSROOM = "CLASSROOM"
    TESTING = "TESTING"
    HOMEWORK = "HOMEWORK"
    ALL = "ALL"


# ==========================================
# BOUNDING BOX & LOCATION
# ==========================================

class BoundingBox(BaseModel):
    """Location of extracted text in the PDF"""
    x: float = Field(..., description="X coordinate (percentage)")
    y: float = Field(..., description="Y coordinate (percentage)")
    width: float = Field(..., description="Width (percentage)")
    height: float = Field(..., description="Height (percentage)")


# ==========================================
# SMART CRITERIA ANALYSIS
# ==========================================

class SMARTCriterion(BaseModel):
    """Analysis of a single SMART criterion"""
    met: bool = Field(..., description="Whether the criterion is met")
    score: float = Field(..., ge=0, le=100, description="Score 0-100")
    feedback: str = Field(..., description="Feedback or suggestion")
    evidence: Optional[str] = Field(None, description="Text evidence from goal")


class SMARTAnalysis(BaseModel):
    """Full SMART criteria analysis for a goal"""
    specific: SMARTCriterion
    measurable: SMARTCriterion
    achievable: SMARTCriterion
    relevant: SMARTCriterion
    time_bound: SMARTCriterion
    overall_score: float = Field(..., ge=0, le=100)
    is_compliant: bool = Field(..., description="Meets minimum SMART requirements")
    suggestions: List[str] = Field(default_factory=list)


# ==========================================
# DOCUMENT SCHEMAS
# ==========================================

class IEPDocumentBase(BaseModel):
    """Base schema for IEP document"""
    file_name: str
    mime_type: str = "application/pdf"


class IEPDocumentCreate(IEPDocumentBase):
    """Schema for creating IEP document record"""
    learner_id: str
    uploaded_by_id: str
    file_url: str
    file_size: int


class IEPDocumentUpdate(BaseModel):
    """Schema for updating IEP document"""
    status: Optional[IEPDocumentStatus] = None
    virus_scan_status: Optional[VirusScanStatus] = None
    processing_error: Optional[str] = None
    ocr_confidence: Optional[float] = None
    extracted_data: Optional[Dict[str, Any]] = None
    page_count: Optional[int] = None
    reviewed_by_id: Optional[str] = None
    review_notes: Optional[str] = None
    iep_start_date: Optional[datetime] = None
    iep_end_date: Optional[datetime] = None
    school_year: Optional[str] = None


class IEPDocumentResponse(IEPDocumentBase):
    """Schema for IEP document response"""
    id: str
    learner_id: str
    uploaded_by_id: str
    file_url: str
    file_size: int
    page_count: Optional[int]
    status: IEPDocumentStatus
    virus_scan_status: VirusScanStatus
    processing_error: Optional[str]
    ocr_confidence: Optional[float]
    reviewed_by_id: Optional[str]
    reviewed_at: Optional[datetime]
    review_notes: Optional[str]
    iep_start_date: Optional[datetime]
    iep_end_date: Optional[datetime]
    school_year: Optional[str]
    uploaded_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IEPDocumentSummary(BaseModel):
    """Summary of IEP document for list view"""
    id: str
    file_name: str
    status: IEPDocumentStatus
    uploaded_at: datetime
    ocr_confidence: Optional[float]
    goal_count: int = 0
    service_count: int = 0
    accommodation_count: int = 0
    present_level_count: int = 0

    class Config:
        from_attributes = True


# ==========================================
# EXTRACTED GOAL SCHEMAS
# ==========================================

class ExtractedGoalBase(BaseModel):
    """Base schema for extracted goal"""
    domain: IEPGoalDomain
    goal_number: Optional[str] = None
    goal_text: str
    baseline: Optional[str] = None
    target_criteria: Optional[str] = None
    measurement_method: Optional[str] = None
    frequency: Optional[str] = None


class ExtractedGoalCreate(ExtractedGoalBase):
    """Schema for creating extracted goal"""
    document_id: str
    learner_id: str
    confidence: float = Field(..., ge=0, le=100)
    page_number: Optional[int] = None
    bounding_box: Optional[BoundingBox] = None
    smart_analysis: Optional[SMARTAnalysis] = None


class ExtractedGoalUpdate(BaseModel):
    """Schema for updating extracted goal"""
    domain: Optional[IEPGoalDomain] = None
    goal_text: Optional[str] = None
    baseline: Optional[str] = None
    target_criteria: Optional[str] = None
    measurement_method: Optional[str] = None
    frequency: Optional[str] = None
    is_verified: Optional[bool] = None
    verified_by_id: Optional[str] = None


class ExtractedGoalResponse(ExtractedGoalBase):
    """Schema for extracted goal response"""
    id: str
    document_id: str
    learner_id: str
    confidence: float
    page_number: Optional[int]
    bounding_box: Optional[Dict[str, Any]]
    smart_analysis: Optional[Dict[str, Any]]
    is_verified: bool
    verified_by_id: Optional[str]
    verified_at: Optional[datetime]
    linked_iep_goal_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# EXTRACTED SERVICE SCHEMAS
# ==========================================

class ExtractedServiceBase(BaseModel):
    """Base schema for extracted service"""
    service_type: IEPServiceType
    description: str
    frequency: Optional[str] = None
    duration: Optional[str] = None
    location: Optional[str] = None
    provider: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ExtractedServiceCreate(ExtractedServiceBase):
    """Schema for creating extracted service"""
    document_id: str
    learner_id: str
    confidence: float = Field(..., ge=0, le=100)
    page_number: Optional[int] = None
    bounding_box: Optional[BoundingBox] = None


class ExtractedServiceUpdate(BaseModel):
    """Schema for updating extracted service"""
    service_type: Optional[IEPServiceType] = None
    description: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    location: Optional[str] = None
    provider: Optional[str] = None
    is_verified: Optional[bool] = None
    verified_by_id: Optional[str] = None


class ExtractedServiceResponse(ExtractedServiceBase):
    """Schema for extracted service response"""
    id: str
    document_id: str
    learner_id: str
    confidence: float
    page_number: Optional[int]
    bounding_box: Optional[Dict[str, Any]]
    is_verified: bool
    verified_by_id: Optional[str]
    verified_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# EXTRACTED ACCOMMODATION SCHEMAS
# ==========================================

class ExtractedAccommodationBase(BaseModel):
    """Base schema for extracted accommodation"""
    category: AccommodationCategory
    description: str
    details: Optional[str] = None
    applies_to: List[AccommodationScope] = Field(default_factory=lambda: [AccommodationScope.ALL])


class ExtractedAccommodationCreate(ExtractedAccommodationBase):
    """Schema for creating extracted accommodation"""
    document_id: str
    learner_id: str
    confidence: float = Field(..., ge=0, le=100)
    page_number: Optional[int] = None
    bounding_box: Optional[BoundingBox] = None


class ExtractedAccommodationUpdate(BaseModel):
    """Schema for updating extracted accommodation"""
    category: Optional[AccommodationCategory] = None
    description: Optional[str] = None
    details: Optional[str] = None
    applies_to: Optional[List[AccommodationScope]] = None
    is_verified: Optional[bool] = None
    verified_by_id: Optional[str] = None


class ExtractedAccommodationResponse(ExtractedAccommodationBase):
    """Schema for extracted accommodation response"""
    id: str
    document_id: str
    learner_id: str
    confidence: float
    page_number: Optional[int]
    bounding_box: Optional[Dict[str, Any]]
    is_verified: bool
    verified_by_id: Optional[str]
    verified_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# EXTRACTED PRESENT LEVEL SCHEMAS
# ==========================================

class ExtractedPresentLevelBase(BaseModel):
    """Base schema for extracted present level (PLAAFP)"""
    domain: IEPGoalDomain
    current_performance: str
    strengths: List[str] = Field(default_factory=list)
    needs: List[str] = Field(default_factory=list)
    parent_input: Optional[str] = None
    how_disability_affects: Optional[str] = None
    educational_implications: Optional[str] = None


class ExtractedPresentLevelCreate(ExtractedPresentLevelBase):
    """Schema for creating extracted present level"""
    document_id: str
    learner_id: str
    confidence: float = Field(..., ge=0, le=100)
    page_number: Optional[int] = None
    bounding_box: Optional[BoundingBox] = None


class ExtractedPresentLevelUpdate(BaseModel):
    """Schema for updating extracted present level"""
    current_performance: Optional[str] = None
    strengths: Optional[List[str]] = None
    needs: Optional[List[str]] = None
    parent_input: Optional[str] = None
    how_disability_affects: Optional[str] = None
    is_verified: Optional[bool] = None
    verified_by_id: Optional[str] = None


class ExtractedPresentLevelResponse(ExtractedPresentLevelBase):
    """Schema for extracted present level response"""
    id: str
    document_id: str
    learner_id: str
    confidence: float
    page_number: Optional[int]
    bounding_box: Optional[Dict[str, Any]]
    is_verified: bool
    verified_by_id: Optional[str]
    verified_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# GOAL TEMPLATE SCHEMAS
# ==========================================

class GoalTemplateBase(BaseModel):
    """Base schema for goal template"""
    domain: IEPGoalDomain
    category: str
    template_text: str = Field(..., description="Template with {{placeholders}}")
    measurement_options: List[str] = Field(default_factory=list)
    frequency_options: List[str] = Field(default_factory=list)
    baseline_prompts: List[str] = Field(default_factory=list)
    criteria_examples: List[str] = Field(default_factory=list)


class GoalTemplateCreate(GoalTemplateBase):
    """Schema for creating goal template"""
    grade_level: Optional[int] = None
    grade_levels: List[int] = Field(default_factory=list)
    smart_guidance: Optional[Dict[str, Any]] = None
    source: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class GoalTemplateUpdate(BaseModel):
    """Schema for updating goal template"""
    template_text: Optional[str] = None
    measurement_options: Optional[List[str]] = None
    frequency_options: Optional[List[str]] = None
    is_active: Optional[bool] = None


class GoalTemplateResponse(GoalTemplateBase):
    """Schema for goal template response"""
    id: str
    grade_level: Optional[int]
    grade_levels: List[int]
    smart_guidance: Optional[Dict[str, Any]]
    is_active: bool
    usage_count: int
    rating: Optional[float]
    source: Optional[str]
    tags: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# EXTRACTION RESPONSE SCHEMAS
# ==========================================

class FullExtractionResponse(BaseModel):
    """Complete extraction response with all data"""
    document: IEPDocumentResponse
    goals: List[ExtractedGoalResponse]
    services: List[ExtractedServiceResponse]
    accommodations: List[ExtractedAccommodationResponse]
    present_levels: List[ExtractedPresentLevelResponse]
    extraction_summary: Dict[str, Any]


class ExtractionSummary(BaseModel):
    """Summary of extraction results"""
    total_goals: int
    total_services: int
    total_accommodations: int
    total_present_levels: int
    average_confidence: float
    low_confidence_items: int = Field(..., description="Items with confidence < 70")
    verified_items: int
    pending_review: int


# ==========================================
# PROCESSING STATUS SCHEMAS
# ==========================================

class ProcessingStatus(BaseModel):
    """Real-time processing status"""
    document_id: str
    status: IEPDocumentStatus
    virus_scan_status: VirusScanStatus
    current_step: str
    progress_percent: float = Field(..., ge=0, le=100)
    steps_completed: List[str]
    steps_remaining: List[str]
    estimated_time_remaining: Optional[int] = Field(None, description="Seconds remaining")
    error_message: Optional[str] = None


# ==========================================
# UPLOAD & APPROVAL SCHEMAS
# ==========================================

class UploadResponse(BaseModel):
    """Response after successful upload"""
    document_id: str
    file_name: str
    status: IEPDocumentStatus
    message: str


class VerifyItemRequest(BaseModel):
    """Request to verify an extracted item"""
    is_verified: bool
    notes: Optional[str] = None


class ApprovalRequest(BaseModel):
    """Request to approve extractions and create IEP goals"""
    goal_ids: List[str] = Field(..., description="IDs of extracted goals to approve")
    service_ids: List[str] = Field(default_factory=list)
    accommodation_ids: List[str] = Field(default_factory=list)
    present_level_ids: List[str] = Field(default_factory=list)
    review_notes: Optional[str] = None


class ApprovalResponse(BaseModel):
    """Response after approval"""
    document_id: str
    created_goals: int
    created_services: int
    created_accommodations: int
    created_present_levels: int
    message: str


# ==========================================
# AI EXTRACTION REQUEST/RESPONSE
# ==========================================

class AIExtractionRequest(BaseModel):
    """Request for AI extraction"""
    document_id: str
    page_images: List[str] = Field(..., description="Base64 encoded page images")
    ocr_text: str
    extraction_config: Optional[Dict[str, Any]] = None


class AIExtractionResult(BaseModel):
    """Result from AI extraction"""
    goals: List[ExtractedGoalCreate]
    services: List[ExtractedServiceCreate]
    accommodations: List[ExtractedAccommodationCreate]
    present_levels: List[ExtractedPresentLevelCreate]
    iep_metadata: Dict[str, Any]
    processing_notes: List[str]
