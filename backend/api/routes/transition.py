"""
Transition Services API Routes - Part 1
IDEA-mandated transition planning for students 14+
Plans, Goals, and College Prep endpoints
Author: artpromedia
Date: 2025-11-29
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta

from db.database import get_db
from db.models.user import User
from api.schemas.transition import (
    # Plan
    TransitionPlanCreate, TransitionPlanUpdate, TransitionPlanResponse,
    TransitionPlanWithDetails, TransitionPlanStatus,
    # Post-Secondary Goals
    PostSecondaryGoalCreate, PostSecondaryGoalUpdate, PostSecondaryGoalResponse,
    PostSecondaryGoalCategory,
    # College
    SavedCollegeCreate, SavedCollegeUpdate, SavedCollegeResponse,
    CollegeSearchFilters,
    CollegeApplicationCreate, CollegeApplicationUpdate, CollegeApplicationResponse,
    CollegeApplicationStatus,
    AccommodationRequestCreate, AccommodationRequestUpdate, AccommodationRequestResponse,
    # Work
    EmployerPartnerCreate, EmployerPartnerUpdate, EmployerPartnerResponse,
    JobShadowingCreate, JobShadowingUpdate, JobShadowingResponse,
    InternshipCreate, InternshipUpdate, InternshipResponse,
    WorkExperienceCreate, WorkExperienceUpdate, WorkExperienceResponse,
    WorkExperienceType,
    # Vocational
    TradeProgramCreate, TradeProgramUpdate, TradeProgramResponse,
    TradeProgramSearchFilters, TradeType,
    TradeProgramApplicationCreate, TradeProgramApplicationUpdate, TradeProgramApplicationResponse,
    ApprenticeshipCreate, ApprenticeshipUpdate, ApprenticeshipResponse,
    IndustryCertificationCreate, IndustryCertificationUpdate, IndustryCertificationResponse,
    # Self-Determination
    SelfDeterminationAssessmentCreate, SelfDeterminationAssessmentResponse,
    PersonCenteredPlanCreate, PersonCenteredPlanUpdate, PersonCenteredPlanResponse,
    TransitionGoalCreate, TransitionGoalUpdate, TransitionGoalResponse,
    TransitionGoalCategory,
    # Agency & Reports
    AgencyInvolvementCreate, AgencyInvolvementUpdate, AgencyInvolvementResponse,
    TransitionReadinessReportCreate, TransitionReadinessReportResponse,
    # Dashboard
    TransitionDashboardStats, IDEARequirementsChecklist,
    TransitionTimelineResponse, TransitionTimelineMilestone,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter()
logger = setup_logging(__name__)


# ==========================================
# TRANSITION PLAN ENDPOINTS
# ==========================================

@router.post("/plans", response_model=TransitionPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_transition_plan(
    plan: TransitionPlanCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a transition plan for a learner (IDEA requires at age 14+)"""
    if not await verify_learner_access(current_user, plan.learnerId, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if plan already exists
    result = await db.execute(
        select(TransitionPlan).where(TransitionPlan.learner_id == plan.learnerId)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Transition plan already exists")
    
    db_plan = TransitionPlan(
        learner_id=plan.learnerId,
        projected_graduation_date=plan.projectedGraduationDate,
        primary_education_goal=plan.primaryEducationGoal,
        primary_employment_goal=plan.primaryEmploymentGoal,
        primary_living_goal=plan.primaryLivingGoal,
        age_of_majority=plan.ageOfMajority,
        transfer_of_rights_date=plan.transferOfRightsDate,
    )
    db.add(db_plan)
    await db.commit()
    await db.refresh(db_plan)
    
    logger.info(f"Created transition plan {db_plan.id} for learner {plan.learnerId}")
    return db_plan


@router.get("/plans/{learner_id}", response_model=TransitionPlanWithDetails)
async def get_transition_plan(
    learner_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get transition plan for a learner with summary counts"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.execute(
        select(TransitionPlan).where(TransitionPlan.learner_id == learner_id)
    )
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Transition plan not found")
    
    # Get counts
    goals_result = await db.execute(
        select(func.count(PostSecondaryGoal.id))
        .where(PostSecondaryGoal.transition_plan_id == plan.id)
    )
    
    apps_result = await db.execute(
        select(func.count(CollegeApplication.id))
        .where(CollegeApplication.transition_plan_id == plan.id)
    )
    
    work_result = await db.execute(
        select(func.count(WorkExperience.id))
        .where(WorkExperience.transition_plan_id == plan.id)
    )
    
    certs_result = await db.execute(
        select(func.count(IndustryCertification.id))
        .where(IndustryCertification.transition_plan_id == plan.id)
    )
    
    return {
        **plan.__dict__,
        "collegeApplicationsCount": apps_result.scalar() or 0,
        "workExperiencesCount": work_result.scalar() or 0,
        "certificationsCount": certs_result.scalar() or 0,
    }


@router.patch("/plans/{plan_id}", response_model=TransitionPlanResponse)
async def update_transition_plan(
    plan_id: str,
    updates: TransitionPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a transition plan"""
    result = await db.execute(
        select(TransitionPlan).where(TransitionPlan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if not await verify_learner_access(current_user, plan.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)
    
    await db.commit()
    await db.refresh(plan)
    return plan


# ==========================================
# POST-SECONDARY GOALS ENDPOINTS
# ==========================================

@router.post("/goals/post-secondary", response_model=PostSecondaryGoalResponse, status_code=201)
async def create_post_secondary_goal(
    goal: PostSecondaryGoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a measurable post-secondary goal (IDEA requirement)"""
    # Verify plan access
    result = await db.execute(
        select(TransitionPlan).where(TransitionPlan.id == goal.transitionPlanId)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if not await verify_learner_access(current_user, plan.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    db_goal = PostSecondaryGoal(
        transition_plan_id=goal.transitionPlanId,
        category=goal.category.value,
        goal_statement=goal.goalStatement,
        current_level=goal.currentLevel,
        assessment_basis=goal.assessmentBasis,
        target_date=goal.targetDate,
        aligned_iep_goal_ids=goal.alignedIEPGoalIds,
    )
    db.add(db_goal)
    await db.commit()
    await db.refresh(db_goal)
    return db_goal


@router.get("/goals/post-secondary/{plan_id}", response_model=List[PostSecondaryGoalResponse])
async def get_post_secondary_goals(
    plan_id: str,
    category: Optional[PostSecondaryGoalCategory] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all post-secondary goals for a transition plan"""
    query = select(PostSecondaryGoal).where(
        PostSecondaryGoal.transition_plan_id == plan_id
    )
    if category:
        query = query.where(PostSecondaryGoal.category == category.value)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/goals/post-secondary/{goal_id}", response_model=PostSecondaryGoalResponse)
async def update_post_secondary_goal(
    goal_id: str,
    updates: PostSecondaryGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update progress on a post-secondary goal"""
    result = await db.execute(
        select(PostSecondaryGoal).where(PostSecondaryGoal.id == goal_id)
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)
    
    await db.commit()
    await db.refresh(goal)
    return goal


# ==========================================
# COLLEGE SEARCH & SAVED COLLEGES
# ==========================================

@router.get("/colleges/search", response_model=List[SavedCollegeResponse])
async def search_colleges(
    state: Optional[str] = None,
    college_type: Optional[str] = None,
    has_disability_services: bool = True,
    min_disability_rating: Optional[int] = Query(None, ge=1, le=5),
    max_tuition: Optional[float] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Search colleges with disability services filtering"""
    # In production, this would query an external college database
    # For now, return saved colleges matching criteria
    query = select(SavedCollege)
    
    if state:
        query = query.where(SavedCollege.state == state)
    if college_type:
        query = query.where(SavedCollege.college_type == college_type)
    if has_disability_services:
        query = query.where(SavedCollege.has_disability_services == True)
    if min_disability_rating:
        query = query.where(SavedCollege.disability_services_rating >= min_disability_rating)
    if max_tuition:
        query = query.where(SavedCollege.tuition_in_state <= max_tuition)
    
    result = await db.execute(query.limit(50))
    return result.scalars().all()


@router.post("/colleges/saved", response_model=SavedCollegeResponse, status_code=201)
async def save_college(
    college: SavedCollegeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Save a college to learner's research list"""
    db_college = SavedCollege(**college.model_dump())
    db.add(db_college)
    await db.commit()
    await db.refresh(db_college)
    return db_college


@router.get("/colleges/saved/{plan_id}", response_model=List[SavedCollegeResponse])
async def get_saved_colleges(
    plan_id: str,
    favorites_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get saved colleges for a transition plan"""
    query = select(SavedCollege).where(SavedCollege.transition_plan_id == plan_id)
    if favorites_only:
        query = query.where(SavedCollege.is_favorite == True)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/colleges/saved/{college_id}", response_model=SavedCollegeResponse)
async def update_saved_college(
    college_id: str,
    updates: SavedCollegeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update saved college notes/rating"""
    result = await db.execute(
        select(SavedCollege).where(SavedCollege.id == college_id)
    )
    college = result.scalar_one_or_none()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(college, field, value)
    
    await db.commit()
    await db.refresh(college)
    return college


@router.delete("/colleges/saved/{college_id}", status_code=204)
async def remove_saved_college(
    college_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a saved college"""
    result = await db.execute(
        select(SavedCollege).where(SavedCollege.id == college_id)
    )
    college = result.scalar_one_or_none()
    if college:
        await db.delete(college)
        await db.commit()


# ==========================================
# COLLEGE APPLICATIONS
# ==========================================

@router.post("/colleges/applications", response_model=CollegeApplicationResponse, status_code=201)
async def create_college_application(
    application: CollegeApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start tracking a college application"""
    db_app = CollegeApplication(**application.model_dump())
    db.add(db_app)
    await db.commit()
    await db.refresh(db_app)
    return db_app


@router.get("/colleges/applications/{plan_id}", response_model=List[CollegeApplicationResponse])
async def get_college_applications(
    plan_id: str,
    status: Optional[CollegeApplicationStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all college applications for a plan"""
    query = select(CollegeApplication).where(
        CollegeApplication.transition_plan_id == plan_id
    )
    if status:
        query = query.where(CollegeApplication.status == status.value)
    
    result = await db.execute(query.order_by(CollegeApplication.application_deadline))
    return result.scalars().all()


@router.patch("/colleges/applications/{app_id}", response_model=CollegeApplicationResponse)
async def update_college_application(
    app_id: str,
    updates: CollegeApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update college application progress"""
    result = await db.execute(
        select(CollegeApplication).where(CollegeApplication.id == app_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(value, 'value'):
            value = value.value
        setattr(app, field, value)
    
    await db.commit()
    await db.refresh(app)
    return app


# ==========================================
# ACCOMMODATION REQUESTS
# ==========================================

@router.post("/colleges/accommodations", response_model=AccommodationRequestResponse, status_code=201)
async def create_accommodation_request(
    request: AccommodationRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create accommodation request for a college"""
    db_request = CollegeAccommodationRequest(**request.model_dump())
    db.add(db_request)
    await db.commit()
    await db.refresh(db_request)
    return db_request


@router.get("/colleges/accommodations/{plan_id}", response_model=List[AccommodationRequestResponse])
async def get_accommodation_requests(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all accommodation requests for a plan"""
    result = await db.execute(
        select(CollegeAccommodationRequest).where(
            CollegeAccommodationRequest.transition_plan_id == plan_id
        )
    )
    return result.scalars().all()


@router.patch("/colleges/accommodations/{request_id}", response_model=AccommodationRequestResponse)
async def update_accommodation_request(
    request_id: str,
    updates: AccommodationRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update accommodation request status"""
    result = await db.execute(
        select(CollegeAccommodationRequest).where(CollegeAccommodationRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(value, 'value'):
            value = value.value
        setattr(request, field, value)
    
    await db.commit()
    await db.refresh(request)
    return request
