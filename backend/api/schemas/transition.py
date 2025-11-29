"""
Transition Services Pydantic Schemas
IDEA-mandated transition planning for students 14+
Author: artpromedia
Date: 2025-11-29
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


# ==========================================
# ENUMS
# ==========================================

class TransitionPlanStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    UNDER_REVIEW = "UNDER_REVIEW"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class PostSecondaryGoalCategory(str, Enum):
    EDUCATION = "EDUCATION"
    EMPLOYMENT = "EMPLOYMENT"
    INDEPENDENT_LIVING = "INDEPENDENT_LIVING"


class CollegeApplicationStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    WAITLISTED = "WAITLISTED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    ENROLLED = "ENROLLED"
    DEFERRED = "DEFERRED"


class AccommodationRequestStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    DENIED = "DENIED"
    NEEDS_INFO = "NEEDS_INFO"


class WorkExperienceType(str, Enum):
    JOB_SHADOWING = "JOB_SHADOWING"
    INTERNSHIP = "INTERNSHIP"
    PAID_EMPLOYMENT = "PAID_EMPLOYMENT"
    VOLUNTEER = "VOLUNTEER"
    APPRENTICESHIP = "APPRENTICESHIP"
    WORK_STUDY = "WORK_STUDY"


class TradeType(str, Enum):
    CNA = "CNA"
    HVAC = "HVAC"
    AUTOMOTIVE = "AUTOMOTIVE"
    WELDING = "WELDING"
    COSMETOLOGY = "COSMETOLOGY"
    ELECTRICAL = "ELECTRICAL"
    CULINARY = "CULINARY"
    CDL = "CDL"
    PLUMBING = "PLUMBING"
    IT_SUPPORT = "IT_SUPPORT"
    MEDICAL_ASSISTANT = "MEDICAL_ASSISTANT"
    PHLEBOTOMY = "PHLEBOTOMY"
    PHARMACY_TECH = "PHARMACY_TECH"
    DENTAL_ASSISTANT = "DENTAL_ASSISTANT"
    EMT = "EMT"
    FIREFIGHTER = "FIREFIGHTER"
    CARPENTRY = "CARPENTRY"
    MACHINIST = "MACHINIST"
    DIESEL_TECH = "DIESEL_TECH"
    REAL_ESTATE = "REAL_ESTATE"
    GRAPHIC_DESIGN = "GRAPHIC_DESIGN"
    WEB_DEVELOPMENT = "WEB_DEVELOPMENT"
    CYBERSECURITY = "CYBERSECURITY"
    PARALEGAL = "PARALEGAL"
    EARLY_CHILDHOOD = "EARLY_CHILDHOOD"
    VETERINARY_TECH = "VETERINARY_TECH"
    MASSAGE_THERAPY = "MASSAGE_THERAPY"
    PERSONAL_TRAINING = "PERSONAL_TRAINING"
    SOLAR_TECH = "SOLAR_TECH"
    WIND_TECH = "WIND_TECH"


class ProgramApplicationStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    ENROLLED = "ENROLLED"
    WITHDRAWN = "WITHDRAWN"


class TransitionGoalCategory(str, Enum):
    POST_SECONDARY_EDUCATION = "POST_SECONDARY_EDUCATION"
    EMPLOYMENT = "EMPLOYMENT"
    INDEPENDENT_LIVING = "INDEPENDENT_LIVING"
    COMMUNITY_PARTICIPATION = "COMMUNITY_PARTICIPATION"
    SELF_ADVOCACY = "SELF_ADVOCACY"
    HEALTH_WELLNESS = "HEALTH_WELLNESS"
    FINANCIAL_LITERACY = "FINANCIAL_LITERACY"
    TRANSPORTATION = "TRANSPORTATION"
    SOCIAL_RELATIONSHIPS = "SOCIAL_RELATIONSHIPS"
    RECREATION_LEISURE = "RECREATION_LEISURE"


class IDEARequirementCategory(str, Enum):
    AGE_APPROPRIATE_ASSESSMENTS = "AGE_APPROPRIATE_ASSESSMENTS"
    MEASURABLE_GOALS = "MEASURABLE_GOALS"
    COURSE_OF_STUDY = "COURSE_OF_STUDY"
    AGENCY_INVOLVEMENT = "AGENCY_INVOLVEMENT"
    STUDENT_PARTICIPATION = "STUDENT_PARTICIPATION"
    ANNUAL_UPDATE = "ANNUAL_UPDATE"
    TRANSFER_OF_RIGHTS = "TRANSFER_OF_RIGHTS"


# ==========================================
# TRANSITION PLAN SCHEMAS
# ==========================================

class TransitionPlanBase(BaseModel):
    projectedGraduationDate: datetime
    primaryEducationGoal: Optional[str] = None
    primaryEmploymentGoal: Optional[str] = None
    primaryLivingGoal: Optional[str] = None
    ageOfMajority: Optional[datetime] = None
    transferOfRightsDate: Optional[datetime] = None


class TransitionPlanCreate(TransitionPlanBase):
    learnerId: str


class TransitionPlanUpdate(BaseModel):
    status: Optional[TransitionPlanStatus] = None
    projectedGraduationDate: Optional[datetime] = None
    primaryEducationGoal: Optional[str] = None
    primaryEmploymentGoal: Optional[str] = None
    primaryLivingGoal: Optional[str] = None
    ideaRequirementsChecklist: Optional[Dict[str, Any]] = None
    lastAnnualReviewDate: Optional[datetime] = None
    nextAnnualReviewDate: Optional[datetime] = None


class TransitionPlanResponse(TransitionPlanBase):
    id: str
    learnerId: str
    status: TransitionPlanStatus
    startDate: datetime
    ideaRequirementsChecklist: Optional[Dict[str, Any]] = None
    lastAnnualReviewDate: Optional[datetime] = None
    nextAnnualReviewDate: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class TransitionPlanWithDetails(TransitionPlanResponse):
    postSecondaryGoals: List["PostSecondaryGoalResponse"] = []
    collegeApplicationsCount: int = 0
    workExperiencesCount: int = 0
    certificationsCount: int = 0


# ==========================================
# POST-SECONDARY GOAL SCHEMAS
# ==========================================

class PostSecondaryGoalBase(BaseModel):
    category: PostSecondaryGoalCategory
    goalStatement: str
    currentLevel: Optional[str] = None
    assessmentBasis: Optional[str] = None
    targetDate: datetime
    alignedIEPGoalIds: List[str] = []


class PostSecondaryGoalCreate(PostSecondaryGoalBase):
    transitionPlanId: str


class PostSecondaryGoalUpdate(BaseModel):
    goalStatement: Optional[str] = None
    currentLevel: Optional[str] = None
    progress: Optional[int] = None
    progressNotes: Optional[List[Dict[str, Any]]] = None
    isActive: Optional[bool] = None


class PostSecondaryGoalResponse(PostSecondaryGoalBase):
    id: str
    transitionPlanId: str
    progress: int
    progressNotes: Optional[List[Dict[str, Any]]] = None
    isActive: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ==========================================
# COLLEGE PREP SCHEMAS
# ==========================================

class SavedCollegeBase(BaseModel):
    collegeName: str
    collegeType: str
    state: str
    city: str
    website: Optional[str] = None
    disabilityServicesRating: Optional[int] = Field(None, ge=1, le=5)
    disabilityServicesNotes: Optional[str] = None
    hasDisabilityServices: bool = True
    acceptanceRate: Optional[float] = None
    tuitionInState: Optional[float] = None
    tuitionOutOfState: Optional[float] = None
    averageFinancialAid: Optional[float] = None
    graduationRate: Optional[float] = None
    interestedPrograms: List[str] = []
    notes: Optional[str] = None
    pros: List[str] = []
    cons: List[str] = []
    isFavorite: bool = False


class SavedCollegeCreate(SavedCollegeBase):
    transitionPlanId: str


class SavedCollegeUpdate(BaseModel):
    disabilityServicesRating: Optional[int] = Field(None, ge=1, le=5)
    disabilityServicesNotes: Optional[str] = None
    interestedPrograms: Optional[List[str]] = None
    notes: Optional[str] = None
    pros: Optional[List[str]] = None
    cons: Optional[List[str]] = None
    isFavorite: Optional[bool] = None


class SavedCollegeResponse(SavedCollegeBase):
    id: str
    transitionPlanId: str
    savedAt: datetime

    class Config:
        from_attributes = True


class CollegeSearchFilters(BaseModel):
    state: Optional[str] = None
    collegeType: Optional[str] = None
    hasDisabilityServices: Optional[bool] = True
    minDisabilityServicesRating: Optional[int] = None
    maxTuition: Optional[float] = None
    minAcceptanceRate: Optional[float] = None
    programs: Optional[List[str]] = None


class CollegeApplicationBase(BaseModel):
    collegeName: str
    collegeType: str
    applicationUrl: Optional[str] = None
    applicationType: Optional[str] = None
    applicationDeadline: Optional[datetime] = None
    financialAidDeadline: Optional[datetime] = None
    commitmentDeadline: Optional[datetime] = None


class CollegeApplicationCreate(CollegeApplicationBase):
    transitionPlanId: str


class CollegeApplicationUpdate(BaseModel):
    status: Optional[CollegeApplicationStatus] = None
    applicationDeadline: Optional[datetime] = None
    submittedDate: Optional[datetime] = None
    decisionDate: Optional[datetime] = None
    commonAppComplete: Optional[bool] = None
    essaysComplete: Optional[bool] = None
    recommendationsRequested: Optional[int] = None
    recommendationsReceived: Optional[int] = None
    transcriptSent: Optional[bool] = None
    testScoresSent: Optional[bool] = None
    essays: Optional[List[Dict[str, Any]]] = None
    fafsaSubmitted: Optional[bool] = None
    financialAidOffered: Optional[float] = None
    notes: Optional[str] = None


class CollegeApplicationResponse(CollegeApplicationBase):
    id: str
    transitionPlanId: str
    status: CollegeApplicationStatus
    submittedDate: Optional[datetime] = None
    decisionDate: Optional[datetime] = None
    commonAppComplete: bool
    essaysComplete: bool
    recommendationsRequested: int
    recommendationsReceived: int
    transcriptSent: bool
    testScoresSent: bool
    essays: Optional[List[Dict[str, Any]]] = None
    fafsaSubmitted: bool
    financialAidOffered: Optional[float] = None
    scholarshipsApplied: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class AccommodationRequestBase(BaseModel):
    collegeName: str
    disabilityOfficeContact: Optional[str] = None
    disabilityOfficeEmail: Optional[str] = None
    disabilityOfficePhone: Optional[str] = None
    accommodationsRequested: List[Dict[str, Any]]


class AccommodationRequestCreate(AccommodationRequestBase):
    transitionPlanId: str


class AccommodationRequestUpdate(BaseModel):
    status: Optional[AccommodationRequestStatus] = None
    submittedDate: Optional[datetime] = None
    responseDate: Optional[datetime] = None
    accommodationsApproved: Optional[List[Dict[str, Any]]] = None
    documentationSubmitted: Optional[List[Dict[str, Any]]] = None
    iepProvided: Optional[bool] = None
    medicalDocsProvided: Optional[bool] = None
    psychEdReportProvided: Optional[bool] = None
    meetingScheduled: Optional[datetime] = None
    meetingNotes: Optional[str] = None
    notes: Optional[str] = None


class AccommodationRequestResponse(AccommodationRequestBase):
    id: str
    transitionPlanId: str
    status: AccommodationRequestStatus
    submittedDate: Optional[datetime] = None
    responseDate: Optional[datetime] = None
    accommodationsApproved: Optional[List[Dict[str, Any]]] = None
    documentationSubmitted: Optional[List[Dict[str, Any]]] = None
    iepProvided: bool
    medicalDocsProvided: bool
    psychEdReportProvided: bool
    meetingScheduled: Optional[datetime] = None
    meetingNotes: Optional[str] = None
    notes: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ==========================================
# WORK-BASED LEARNING SCHEMAS
# ==========================================

class EmployerPartnerBase(BaseModel):
    name: str
    industry: str
    contactName: Optional[str] = None
    contactEmail: Optional[str] = None
    contactPhone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    opportunityTypes: List[WorkExperienceType] = []
    disabilityFriendly: bool = True
    accommodationsOffered: List[str] = []


class EmployerPartnerCreate(EmployerPartnerBase):
    pass


class EmployerPartnerUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    contactName: Optional[str] = None
    contactEmail: Optional[str] = None
    contactPhone: Optional[str] = None
    disabilityFriendly: Optional[bool] = None
    accommodationsOffered: Optional[List[str]] = None
    isActive: Optional[bool] = None


class EmployerPartnerResponse(EmployerPartnerBase):
    id: str
    totalStudentsHosted: int
    averageRating: Optional[float] = None
    isActive: bool
    partnerSince: datetime
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class JobShadowingBase(BaseModel):
    employerName: str
    date: datetime
    duration: int  # hours
    industry: str
    jobTitle: str
    tasksObserved: List[str] = []
    skillsObserved: List[str] = []


class JobShadowingCreate(JobShadowingBase):
    transitionPlanId: str
    employerId: Optional[str] = None


class JobShadowingUpdate(BaseModel):
    questionsAsked: Optional[List[str]] = None
    reflection: Optional[str] = None
    whatLiked: Optional[str] = None
    whatDisliked: Optional[str] = None
    careerInterestLevel: Optional[int] = Field(None, ge=1, le=5)
    wouldPursue: Optional[bool] = None
    supervisorName: Optional[str] = None
    supervisorFeedback: Optional[str] = None
    completed: Optional[bool] = None


class JobShadowingResponse(JobShadowingBase):
    id: str
    transitionPlanId: str
    employerId: Optional[str] = None
    questionsAsked: List[str]
    reflection: Optional[str] = None
    whatLiked: Optional[str] = None
    whatDisliked: Optional[str] = None
    careerInterestLevel: Optional[int] = None
    wouldPursue: Optional[bool] = None
    supervisorName: Optional[str] = None
    supervisorFeedback: Optional[str] = None
    completed: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class InternshipBase(BaseModel):
    employerName: str
    position: str
    department: Optional[str] = None
    industry: str
    startDate: datetime
    endDate: Optional[datetime] = None
    hoursPerWeek: int
    isPaid: bool = False
    hourlyRate: Optional[float] = None
    supervisorName: str
    supervisorEmail: Optional[str] = None
    supervisorPhone: Optional[str] = None
    learningObjectives: List[str] = []
    skillsTargeted: List[str] = []


class InternshipCreate(InternshipBase):
    transitionPlanId: str
    employerId: Optional[str] = None


class InternshipUpdate(BaseModel):
    totalHoursCompleted: Optional[int] = None
    skillsGained: Optional[List[str]] = None
    tasksPerformed: Optional[List[str]] = None
    evaluations: Optional[List[Dict[str, Any]]] = None
    midtermEvaluation: Optional[Dict[str, Any]] = None
    finalEvaluation: Optional[Dict[str, Any]] = None
    accommodationsProvided: Optional[List[str]] = None
    status: Optional[str] = None
    completionCertificate: Optional[bool] = None


class InternshipResponse(InternshipBase):
    id: str
    transitionPlanId: str
    employerId: Optional[str] = None
    totalHoursCompleted: int
    skillsGained: List[str]
    tasksPerformed: List[str]
    evaluations: Optional[List[Dict[str, Any]]] = None
    midtermEvaluation: Optional[Dict[str, Any]] = None
    finalEvaluation: Optional[Dict[str, Any]] = None
    accommodationsProvided: List[str]
    status: str
    completionCertificate: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class WorkExperienceBase(BaseModel):
    employerName: str
    experienceType: WorkExperienceType
    position: str
    industry: str
    startDate: datetime
    endDate: Optional[datetime] = None
    isCurrent: bool = False
    hoursPerWeek: Optional[int] = None
    hourlyWage: Optional[float] = None


class WorkExperienceCreate(WorkExperienceBase):
    transitionPlanId: str
    employerId: Optional[str] = None


class WorkExperienceUpdate(BaseModel):
    endDate: Optional[datetime] = None
    isCurrent: Optional[bool] = None
    totalHoursWorked: Optional[int] = None
    responsibilities: Optional[List[str]] = None
    skillsGained: Optional[List[str]] = None
    accomplishments: Optional[List[str]] = None
    supervisorName: Optional[str] = None
    supervisorContact: Optional[str] = None
    canUseAsReference: Optional[bool] = None
    reflection: Optional[str] = None
    careerRelevance: Optional[str] = None


class WorkExperienceResponse(WorkExperienceBase):
    id: str
    transitionPlanId: str
    employerId: Optional[str] = None
    totalHoursWorked: int
    responsibilities: List[str]
    skillsGained: List[str]
    accomplishments: List[str]
    supervisorName: Optional[str] = None
    supervisorContact: Optional[str] = None
    canUseAsReference: bool
    reflection: Optional[str] = None
    careerRelevance: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ==========================================
# VOCATIONAL PATHWAY SCHEMAS
# ==========================================

class TradeProgramBase(BaseModel):
    name: str
    trade: TradeType
    provider: str
    providerType: str
    city: Optional[str] = None
    state: Optional[str] = None
    isOnline: bool = False
    isHybrid: bool = False
    description: Optional[str] = None
    duration: int  # weeks
    totalHours: Optional[int] = None
    tuition: float
    booksAndSupplies: Optional[float] = None
    financialAidAvailable: bool = True
    scholarshipsAvailable: bool = False
    jobPlacementRate: Optional[float] = None
    averageStartingSalary: Optional[float] = None
    medianSalary: Optional[float] = None
    certificationsEarned: List[str] = []
    prerequisites: List[str] = []


class TradeProgramCreate(TradeProgramBase):
    pass


class TradeProgramUpdate(BaseModel):
    description: Optional[str] = None
    tuition: Optional[float] = None
    jobPlacementRate: Optional[float] = None
    averageStartingSalary: Optional[float] = None
    disabilityServicesAvailable: Optional[bool] = None
    accommodationsOffered: Optional[List[str]] = None
    isActive: Optional[bool] = None


class TradeProgramResponse(TradeProgramBase):
    id: str
    salaryRange: Optional[Dict[str, float]] = None
    employmentGrowth: Optional[float] = None
    creditsEarned: Optional[int] = None
    industryRecognized: bool
    minimumAge: Optional[int] = None
    physicalRequirements: List[str]
    disabilityServicesAvailable: bool
    accommodationsOffered: List[str]
    accessibilityNotes: Optional[str] = None
    contactEmail: Optional[str] = None
    contactPhone: Optional[str] = None
    website: Optional[str] = None
    isActive: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class TradeProgramSearchFilters(BaseModel):
    trade: Optional[TradeType] = None
    state: Optional[str] = None
    maxTuition: Optional[float] = None
    minPlacementRate: Optional[float] = None
    minSalary: Optional[float] = None
    isOnline: Optional[bool] = None
    disabilityServicesAvailable: Optional[bool] = True
    maxDuration: Optional[int] = None  # weeks


class TradeProgramApplicationBase(BaseModel):
    applicationUrl: Optional[str] = None
    applicationDeadline: Optional[datetime] = None
    startDate: Optional[datetime] = None


class TradeProgramApplicationCreate(TradeProgramApplicationBase):
    transitionPlanId: str
    programId: str


class TradeProgramApplicationUpdate(BaseModel):
    status: Optional[ProgramApplicationStatus] = None
    submittedDate: Optional[datetime] = None
    decisionDate: Optional[datetime] = None
    applicationComplete: Optional[bool] = None
    transcriptSent: Optional[bool] = None
    recommendationsComplete: Optional[bool] = None
    entranceExamComplete: Optional[bool] = None
    entranceExamScore: Optional[float] = None
    interviewComplete: Optional[bool] = None
    documentsRequired: Optional[List[Dict[str, Any]]] = None
    documentsSubmitted: Optional[List[Dict[str, Any]]] = None
    financialAidApplied: Optional[bool] = None
    financialAidAwarded: Optional[float] = None
    notes: Optional[str] = None


class TradeProgramApplicationResponse(TradeProgramApplicationBase):
    id: str
    transitionPlanId: str
    programId: str
    status: ProgramApplicationStatus
    submittedDate: Optional[datetime] = None
    decisionDate: Optional[datetime] = None
    applicationComplete: bool
    transcriptSent: bool
    recommendationsComplete: bool
    entranceExamComplete: bool
    entranceExamScore: Optional[float] = None
    interviewComplete: bool
    documentsRequired: Optional[List[Dict[str, Any]]] = None
    documentsSubmitted: Optional[List[Dict[str, Any]]] = None
    financialAidApplied: bool
    financialAidAwarded: Optional[float] = None
    notes: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    
    # Include program details
    program: Optional[TradeProgramResponse] = None

    class Config:
        from_attributes = True


class ApprenticeshipBase(BaseModel):
    trade: TradeType
    programName: str
    sponsorOrganization: str
    startDate: datetime
    expectedEndDate: Optional[datetime] = None
    totalHoursRequired: int
    classroomHoursRequired: Optional[int] = None
    startingWage: float
    currentWage: float
    journeymanWage: Optional[float] = None
    totalLevels: int


class ApprenticeshipCreate(ApprenticeshipBase):
    transitionPlanId: str
    employerId: Optional[str] = None


class ApprenticeshipUpdate(BaseModel):
    hoursCompleted: Optional[int] = None
    classroomHoursCompleted: Optional[int] = None
    currentWage: Optional[float] = None
    wageProgressions: Optional[List[Dict[str, Any]]] = None
    mentorName: Optional[str] = None
    mentorContact: Optional[str] = None
    currentLevel: Optional[int] = None
    competenciesCompleted: Optional[List[str]] = None
    competenciesRemaining: Optional[List[str]] = None
    certificationsEarned: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None
    completionDate: Optional[datetime] = None


class ApprenticeshipResponse(ApprenticeshipBase):
    id: str
    transitionPlanId: str
    employerId: Optional[str] = None
    hoursCompleted: int
    classroomHoursCompleted: int
    wageProgressions: Optional[List[Dict[str, Any]]] = None
    mentorName: Optional[str] = None
    mentorContact: Optional[str] = None
    currentLevel: int
    competenciesCompleted: List[str]
    competenciesRemaining: List[str]
    certificationsEarned: Optional[List[Dict[str, Any]]] = None
    status: str
    actualEndDate: Optional[datetime] = None
    completionDate: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class IndustryCertificationBase(BaseModel):
    name: str
    issuingOrganization: str
    industry: Optional[str] = None
    earnedDate: datetime
    expirationDate: Optional[datetime] = None
    isLifetime: bool = False
    credentialId: Optional[str] = None
    verificationUrl: Optional[str] = None


class IndustryCertificationCreate(IndustryCertificationBase):
    transitionPlanId: str


class IndustryCertificationUpdate(BaseModel):
    expirationDate: Optional[datetime] = None
    credentialId: Optional[str] = None
    verificationUrl: Optional[str] = None
    renewalRequired: Optional[bool] = None
    renewalRequirements: Optional[str] = None
    ceuRequired: Optional[int] = None
    ceuCompleted: Optional[int] = None
    salaryImpact: Optional[float] = None
    jobsRequiring: Optional[List[str]] = None


class IndustryCertificationResponse(IndustryCertificationBase):
    id: str
    transitionPlanId: str
    renewalRequired: bool
    renewalRequirements: Optional[str] = None
    ceuRequired: Optional[int] = None
    ceuCompleted: int
    salaryImpact: Optional[float] = None
    jobsRequiring: List[str]
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ==========================================
# SELF-DETERMINATION SCHEMAS
# ==========================================

class SelfDeterminationAssessmentBase(BaseModel):
    assessmentType: str = "ARC_SDS"
    assessor: Optional[str] = None
    # 11 domains (1-5 scale)
    selfAwareness: int = Field(..., ge=1, le=5)
    selfKnowledge: int = Field(..., ge=1, le=5)
    choiceMaking: int = Field(..., ge=1, le=5)
    decisionMaking: int = Field(..., ge=1, le=5)
    goalSetting: int = Field(..., ge=1, le=5)
    planning: int = Field(..., ge=1, le=5)
    problemSolving: int = Field(..., ge=1, le=5)
    selfAdvocacy: int = Field(..., ge=1, le=5)
    selfRegulation: int = Field(..., ge=1, le=5)
    selfEvaluation: int = Field(..., ge=1, le=5)
    selfReinforcement: int = Field(..., ge=1, le=5)


class SelfDeterminationAssessmentCreate(SelfDeterminationAssessmentBase):
    transitionPlanId: str
    strengths: List[str] = []
    areasForGrowth: List[str] = []
    recommendations: List[str] = []
    studentReflection: Optional[str] = None


class SelfDeterminationAssessmentResponse(SelfDeterminationAssessmentBase):
    id: str
    transitionPlanId: str
    assessmentDate: datetime
    # Composite scores
    totalScore: Optional[int] = None
    autonomyScore: Optional[int] = None
    selfRegulationScore: Optional[int] = None
    empowermentScore: Optional[int] = None
    selfRealizationScore: Optional[int] = None
    # Qualitative
    strengths: List[str]
    areasForGrowth: List[str]
    recommendations: List[str]
    studentReflection: Optional[str] = None
    previousAssessmentId: Optional[str] = None
    improvementAreas: List[str]
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class PersonCenteredPlanBase(BaseModel):
    dreams: List[str] = []
    nightmares: List[str] = []
    importantTo: List[str] = []
    importantFor: List[str] = []
    strengths: List[str] = []
    gifts: List[str] = []
    talents: List[str] = []
    interests: List[str] = []


class PersonCenteredPlanCreate(PersonCenteredPlanBase):
    transitionPlanId: str


class PersonCenteredPlanUpdate(BaseModel):
    dreams: Optional[List[str]] = None
    nightmares: Optional[List[str]] = None
    importantTo: Optional[List[str]] = None
    importantFor: Optional[List[str]] = None
    strengths: Optional[List[str]] = None
    gifts: Optional[List[str]] = None
    talents: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    supportNeeds: Optional[Dict[str, Any]] = None
    importantPeople: Optional[List[Dict[str, Any]]] = None
    supportCircle: Optional[List[Dict[str, Any]]] = None
    communicationPreferences: Optional[List[str]] = None
    learningPreferences: Optional[List[str]] = None
    environmentPreferences: Optional[List[str]] = None
    positiveExperiences: Optional[List[str]] = None
    negativeExperiences: Optional[List[str]] = None
    actionItems: Optional[List[Dict[str, Any]]] = None
    meetingDate: Optional[datetime] = None
    facilitator: Optional[str] = None
    participants: Optional[List[str]] = None
    meetingNotes: Optional[str] = None


class PersonCenteredPlanResponse(PersonCenteredPlanBase):
    id: str
    transitionPlanId: str
    supportNeeds: Optional[Dict[str, Any]] = None
    importantPeople: Optional[List[Dict[str, Any]]] = None
    supportCircle: Optional[List[Dict[str, Any]]] = None
    communicationPreferences: List[str]
    learningPreferences: List[str]
    environmentPreferences: List[str]
    positiveExperiences: List[str]
    negativeExperiences: List[str]
    actionItems: Optional[List[Dict[str, Any]]] = None
    meetingDate: Optional[datetime] = None
    facilitator: Optional[str] = None
    participants: List[str]
    meetingNotes: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class TransitionGoalBase(BaseModel):
    category: TransitionGoalCategory
    goalText: str
    specific: Optional[str] = None
    measurable: Optional[str] = None
    achievable: Optional[str] = None
    relevant: Optional[str] = None
    timeBound: Optional[datetime] = None
    targetDate: datetime
    alignedIEPGoalIds: List[str] = []


class TransitionGoalCreate(TransitionGoalBase):
    transitionPlanId: str
    activities: Optional[List[Dict[str, Any]]] = None
    milestones: Optional[List[Dict[str, Any]]] = None


class TransitionGoalUpdate(BaseModel):
    goalText: Optional[str] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[str] = None
    activities: Optional[List[Dict[str, Any]]] = None
    milestones: Optional[List[Dict[str, Any]]] = None
    progressNotes: Optional[List[Dict[str, Any]]] = None
    isActive: Optional[bool] = None


class TransitionGoalResponse(TransitionGoalBase):
    id: str
    transitionPlanId: str
    progress: int
    status: str
    activities: Optional[List[Dict[str, Any]]] = None
    milestones: Optional[List[Dict[str, Any]]] = None
    progressNotes: Optional[List[Dict[str, Any]]] = None
    isActive: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ==========================================
# AGENCY & REPORT SCHEMAS
# ==========================================

class AgencyInvolvementBase(BaseModel):
    agencyName: str
    agencyType: str
    contactName: Optional[str] = None
    contactEmail: Optional[str] = None
    contactPhone: Optional[str] = None
    servicesProvided: List[str] = []
    servicesNeeded: List[str] = []


class AgencyInvolvementCreate(AgencyInvolvementBase):
    transitionPlanId: str


class AgencyInvolvementUpdate(BaseModel):
    contactName: Optional[str] = None
    contactEmail: Optional[str] = None
    contactPhone: Optional[str] = None
    servicesProvided: Optional[List[str]] = None
    servicesNeeded: Optional[List[str]] = None
    referralDate: Optional[datetime] = None
    referralStatus: Optional[str] = None
    eligibilityStatus: Optional[str] = None
    caseNumber: Optional[str] = None
    caseManagerName: Optional[str] = None
    fundingProvided: Optional[List[str]] = None
    fundingAmount: Optional[float] = None
    notes: Optional[str] = None
    isActive: Optional[bool] = None


class AgencyInvolvementResponse(AgencyInvolvementBase):
    id: str
    transitionPlanId: str
    referralDate: Optional[datetime] = None
    referralStatus: Optional[str] = None
    eligibilityStatus: Optional[str] = None
    caseNumber: Optional[str] = None
    caseManagerName: Optional[str] = None
    fundingProvided: List[str]
    fundingAmount: Optional[float] = None
    notes: Optional[str] = None
    isActive: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class TransitionReadinessReportCreate(BaseModel):
    transitionPlanId: str
    reportType: str = "ANNUAL"
    overallScore: int = Field(..., ge=0, le=100)
    educationReadiness: int = Field(..., ge=0, le=100)
    employmentReadiness: int = Field(..., ge=0, le=100)
    independentLivingReadiness: int = Field(..., ge=0, le=100)
    selfDeterminationReadiness: int = Field(..., ge=0, le=100)
    academicSkills: Optional[Dict[str, Any]] = None
    employabilitySkills: Optional[Dict[str, Any]] = None
    dailyLivingSkills: Optional[Dict[str, Any]] = None
    socialSkills: Optional[Dict[str, Any]] = None
    ideaRequirementsMet: Optional[Dict[str, bool]] = None
    complianceNotes: Optional[str] = None
    recommendations: List[str] = []
    priorityAreas: List[str] = []
    strengthAreas: List[str] = []
    nextSteps: Optional[List[Dict[str, Any]]] = None
    preparedBy: Optional[str] = None


class TransitionReadinessReportResponse(BaseModel):
    id: str
    transitionPlanId: str
    reportDate: datetime
    reportType: str
    overallScore: int
    educationReadiness: int
    employmentReadiness: int
    independentLivingReadiness: int
    selfDeterminationReadiness: int
    academicSkills: Optional[Dict[str, Any]] = None
    employabilitySkills: Optional[Dict[str, Any]] = None
    dailyLivingSkills: Optional[Dict[str, Any]] = None
    socialSkills: Optional[Dict[str, Any]] = None
    ideaRequirementsMet: Optional[Dict[str, bool]] = None
    complianceNotes: Optional[str] = None
    recommendations: List[str]
    priorityAreas: List[str]
    strengthAreas: List[str]
    nextSteps: Optional[List[Dict[str, Any]]] = None
    preparedBy: Optional[str] = None
    reviewedBy: Optional[str] = None
    approvedDate: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ==========================================
# DASHBOARD & ANALYTICS SCHEMAS
# ==========================================

class TransitionDashboardStats(BaseModel):
    learnerId: str
    learnerName: str
    currentAge: int
    gradeLevel: int
    projectedGraduationDate: datetime
    daysUntilGraduation: int
    planStatus: TransitionPlanStatus
    
    # Goal progress
    totalGoals: int
    goalsCompleted: int
    goalsInProgress: int
    
    # College prep
    collegesSaved: int
    applicationsInProgress: int
    applicationsSubmitted: int
    acceptances: int
    
    # Work experience
    totalWorkHours: int
    jobShadowingCount: int
    internshipsCompleted: int
    
    # Vocational
    tradeProgramsExplored: int
    certificationsEarned: int
    apprenticeshipProgress: Optional[float] = None
    
    # Self-determination
    latestSelfDeterminationScore: Optional[int] = None
    selfDeterminationTrend: Optional[str] = None  # "improving", "stable", "declining"
    
    # IDEA compliance
    ideaRequirementsMet: int
    ideaRequirementsTotal: int
    nextAnnualReviewDate: Optional[datetime] = None


class IDEARequirementsChecklist(BaseModel):
    learnerId: str
    planId: str
    
    # Age-appropriate transition assessments
    ageAppropriateAssessmentsCompleted: bool
    assessmentTypes: List[str]
    lastAssessmentDate: Optional[datetime] = None
    
    # Measurable postsecondary goals
    hasEducationGoal: bool
    hasEmploymentGoal: bool
    hasIndependentLivingGoal: bool
    goalsAreMeasurable: bool
    
    # Transition services
    servicesAlignWithGoals: bool
    courseOfStudyDefined: bool
    
    # Agency involvement
    relevantAgenciesInvited: bool
    agencyConsentsObtained: bool
    
    # Student participation
    studentInvitedToMeetings: bool
    studentPreferencesDocumented: bool
    
    # Annual updates
    annualReviewScheduled: bool
    lastAnnualReviewDate: Optional[datetime] = None
    
    # Transfer of rights
    transferOfRightsNotificationDate: Optional[datetime] = None
    transferOfRightsCompleted: bool
    
    overallCompliance: bool
    compliancePercentage: int
    missingRequirements: List[str]


class TransitionTimelineMilestone(BaseModel):
    id: str
    date: datetime
    title: str
    description: str
    category: str  # "education", "employment", "assessment", "deadline", "meeting"
    status: str  # "completed", "upcoming", "overdue", "in-progress"
    relatedRecordId: Optional[str] = None
    relatedRecordType: Optional[str] = None


class TransitionTimelineResponse(BaseModel):
    learnerId: str
    milestones: List[TransitionTimelineMilestone]
    upcomingDeadlines: List[TransitionTimelineMilestone]
    recentCompletions: List[TransitionTimelineMilestone]
