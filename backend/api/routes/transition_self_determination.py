"""
Transition Services API Routes - Part 4
Self-Determination & Dashboard endpoints
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
    SelfDeterminationAssessmentCreate, SelfDeterminationAssessmentResponse,
    PersonCenteredPlanCreate, PersonCenteredPlanUpdate, PersonCenteredPlanResponse,
    TransitionGoalCreate, TransitionGoalUpdate, TransitionGoalResponse,
    TransitionGoalCategory,
    AgencyInvolvementCreate, AgencyInvolvementUpdate, AgencyInvolvementResponse,
    TransitionReadinessReportCreate, TransitionReadinessReportResponse,
    TransitionDashboardStats, IDEARequirementsChecklist,
    TransitionTimelineResponse, TransitionTimelineMilestone,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter()
logger = setup_logging(__name__)


# ==========================================
# SELF-DETERMINATION ASSESSMENTS
# ==========================================

@router.post("/self-determination/assessment", response_model=SelfDeterminationAssessmentResponse, status_code=201)
async def create_self_determination_assessment(
    assessment: SelfDeterminationAssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a self-determination assessment (11 domains)"""
    # Calculate composite scores
    total_score = (
        assessment.selfAwareness + assessment.selfKnowledge +
        assessment.choiceMaking + assessment.decisionMaking +
        assessment.goalSetting + assessment.planning +
        assessment.problemSolving + assessment.selfAdvocacy +
        assessment.selfRegulation + assessment.selfEvaluation +
        assessment.selfReinforcement
    )
    
    autonomy_score = assessment.choiceMaking + assessment.decisionMaking + assessment.goalSetting
    self_reg_score = assessment.selfRegulation + assessment.selfEvaluation + assessment.selfReinforcement
    empowerment_score = assessment.selfAwareness + assessment.selfKnowledge + assessment.selfAdvocacy
    self_realization_score = assessment.problemSolving + assessment.planning
    
    # Get previous assessment for comparison
    prev_result = await db.execute(
        select(SelfDeterminationAssessment)
        .where(SelfDeterminationAssessment.transition_plan_id == assessment.transitionPlanId)
        .order_by(SelfDeterminationAssessment.assessment_date.desc())
        .limit(1)
    )
    previous = prev_result.scalar_one_or_none()
    
    improvement_areas = []
    if previous:
        if assessment.selfAwareness > previous.self_awareness:
            improvement_areas.append("self_awareness")
        if assessment.selfKnowledge > previous.self_knowledge:
            improvement_areas.append("self_knowledge")
        if assessment.selfAdvocacy > previous.self_advocacy:
            improvement_areas.append("self_advocacy")
        # ... compare other domains
    
    db_assessment = SelfDeterminationAssessment(
        transition_plan_id=assessment.transitionPlanId,
        assessment_type=assessment.assessmentType,
        assessor=assessment.assessor,
        self_awareness=assessment.selfAwareness,
        self_knowledge=assessment.selfKnowledge,
        choice_making=assessment.choiceMaking,
        decision_making=assessment.decisionMaking,
        goal_setting=assessment.goalSetting,
        planning=assessment.planning,
        problem_solving=assessment.problemSolving,
        self_advocacy=assessment.selfAdvocacy,
        self_regulation=assessment.selfRegulation,
        self_evaluation=assessment.selfEvaluation,
        self_reinforcement=assessment.selfReinforcement,
        total_score=total_score,
        autonomy_score=autonomy_score,
        self_regulation_score=self_reg_score,
        empowerment_score=empowerment_score,
        self_realization_score=self_realization_score,
        strengths=assessment.strengths,
        areas_for_growth=assessment.areasForGrowth,
        recommendations=assessment.recommendations,
        student_reflection=assessment.studentReflection,
        previous_assessment_id=previous.id if previous else None,
        improvement_areas=improvement_areas,
    )
    db.add(db_assessment)
    await db.commit()
    await db.refresh(db_assessment)
    return db_assessment


@router.get("/self-determination/assessment/{plan_id}", response_model=List[SelfDeterminationAssessmentResponse])
async def get_self_determination_assessments(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all self-determination assessments for a plan"""
    result = await db.execute(
        select(SelfDeterminationAssessment)
        .where(SelfDeterminationAssessment.transition_plan_id == plan_id)
        .order_by(SelfDeterminationAssessment.assessment_date.desc())
    )
    return result.scalars().all()


@router.get("/self-determination/assessment/{plan_id}/latest", response_model=SelfDeterminationAssessmentResponse)
async def get_latest_assessment(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the most recent self-determination assessment"""
    result = await db.execute(
        select(SelfDeterminationAssessment)
        .where(SelfDeterminationAssessment.transition_plan_id == plan_id)
        .order_by(SelfDeterminationAssessment.assessment_date.desc())
        .limit(1)
    )
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="No assessments found")
    return assessment


# ==========================================
# PERSON-CENTERED PLAN
# ==========================================

@router.post("/person-centered-plan", response_model=PersonCenteredPlanResponse, status_code=201)
async def create_person_centered_plan(
    plan: PersonCenteredPlanCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a person-centered plan (dreams, strengths, supports)"""
    # Check if one already exists
    existing = await db.execute(
        select(PersonCenteredPlan).where(
            PersonCenteredPlan.transition_plan_id == plan.transitionPlanId
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Person-centered plan already exists")
    
    db_plan = PersonCenteredPlan(
        transition_plan_id=plan.transitionPlanId,
        dreams=plan.dreams,
        nightmares=plan.nightmares,
        important_to=plan.importantTo,
        important_for=plan.importantFor,
        strengths=plan.strengths,
        gifts=plan.gifts,
        talents=plan.talents,
        interests=plan.interests,
    )
    db.add(db_plan)
    await db.commit()
    await db.refresh(db_plan)
    return db_plan


@router.get("/person-centered-plan/{plan_id}", response_model=PersonCenteredPlanResponse)
async def get_person_centered_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get person-centered plan for a transition plan"""
    result = await db.execute(
        select(PersonCenteredPlan).where(
            PersonCenteredPlan.transition_plan_id == plan_id
        )
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Person-centered plan not found")
    return plan


@router.patch("/person-centered-plan/{plan_id}", response_model=PersonCenteredPlanResponse)
async def update_person_centered_plan(
    plan_id: str,
    updates: PersonCenteredPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update person-centered plan"""
    result = await db.execute(
        select(PersonCenteredPlan).where(
            PersonCenteredPlan.transition_plan_id == plan_id
        )
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Person-centered plan not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)
    
    await db.commit()
    await db.refresh(plan)
    return plan


# ==========================================
# TRANSITION GOALS
# ==========================================

@router.post("/goals", response_model=TransitionGoalResponse, status_code=201)
async def create_transition_goal(
    goal: TransitionGoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a SMART transition goal"""
    db_goal = TransitionGoal(
        transition_plan_id=goal.transitionPlanId,
        category=goal.category.value,
        goal_text=goal.goalText,
        specific=goal.specific,
        measurable=goal.measurable,
        achievable=goal.achievable,
        relevant=goal.relevant,
        time_bound=goal.timeBound,
        target_date=goal.targetDate,
        aligned_iep_goal_ids=goal.alignedIEPGoalIds,
        activities=goal.activities,
        milestones=goal.milestones,
    )
    db.add(db_goal)
    await db.commit()
    await db.refresh(db_goal)
    return db_goal


@router.get("/goals/{plan_id}", response_model=List[TransitionGoalResponse])
async def get_transition_goals(
    plan_id: str,
    category: Optional[TransitionGoalCategory] = None,
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all transition goals for a plan"""
    query = select(TransitionGoal).where(TransitionGoal.transition_plan_id == plan_id)
    
    if category:
        query = query.where(TransitionGoal.category == category.value)
    if active_only:
        query = query.where(TransitionGoal.is_active == True)
    
    result = await db.execute(query.order_by(TransitionGoal.target_date))
    return result.scalars().all()


@router.patch("/goals/{goal_id}", response_model=TransitionGoalResponse)
async def update_transition_goal(
    goal_id: str,
    updates: TransitionGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update transition goal progress"""
    result = await db.execute(
        select(TransitionGoal).where(TransitionGoal.id == goal_id)
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


@router.post("/goals/{goal_id}/progress-note")
async def add_goal_progress_note(
    goal_id: str,
    note: str,
    progress: int = Query(..., ge=0, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a progress note to a goal"""
    result = await db.execute(
        select(TransitionGoal).where(TransitionGoal.id == goal_id)
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    notes = goal.progress_notes or []
    notes.append({
        "date": datetime.utcnow().isoformat(),
        "note": note,
        "progress": progress,
        "addedBy": current_user.id
    })
    goal.progress_notes = notes
    goal.progress = progress
    
    if progress >= 100:
        goal.status = "COMPLETED"
    elif progress > 0:
        goal.status = "IN_PROGRESS"
    
    await db.commit()
    return {"message": "Progress note added", "currentProgress": progress}


# ==========================================
# AGENCY INVOLVEMENT
# ==========================================

@router.post("/agencies", response_model=AgencyInvolvementResponse, status_code=201)
async def create_agency_involvement(
    agency: AgencyInvolvementCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record agency involvement (VR, DD Services, etc.)"""
    db_agency = AgencyInvolvement(
        transition_plan_id=agency.transitionPlanId,
        agency_name=agency.agencyName,
        agency_type=agency.agencyType,
        contact_name=agency.contactName,
        contact_email=agency.contactEmail,
        contact_phone=agency.contactPhone,
        services_provided=agency.servicesProvided,
        services_needed=agency.servicesNeeded,
    )
    db.add(db_agency)
    await db.commit()
    await db.refresh(db_agency)
    return db_agency


@router.get("/agencies/{plan_id}", response_model=List[AgencyInvolvementResponse])
async def get_agency_involvements(
    plan_id: str,
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all agency involvements for a plan"""
    query = select(AgencyInvolvement).where(
        AgencyInvolvement.transition_plan_id == plan_id
    )
    if active_only:
        query = query.where(AgencyInvolvement.is_active == True)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/agencies/{agency_id}", response_model=AgencyInvolvementResponse)
async def update_agency_involvement(
    agency_id: str,
    updates: AgencyInvolvementUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update agency involvement details"""
    result = await db.execute(
        select(AgencyInvolvement).where(AgencyInvolvement.id == agency_id)
    )
    agency = result.scalar_one_or_none()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agency, field, value)
    
    await db.commit()
    await db.refresh(agency)
    return agency


# ==========================================
# READINESS REPORTS
# ==========================================

@router.post("/reports/readiness", response_model=TransitionReadinessReportResponse, status_code=201)
async def create_readiness_report(
    report: TransitionReadinessReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a transition readiness report"""
    db_report = TransitionReadinessReport(
        transition_plan_id=report.transitionPlanId,
        report_type=report.reportType,
        overall_score=report.overallScore,
        education_readiness=report.educationReadiness,
        employment_readiness=report.employmentReadiness,
        independent_living_readiness=report.independentLivingReadiness,
        self_determination_readiness=report.selfDeterminationReadiness,
        academic_skills=report.academicSkills,
        employability_skills=report.employabilitySkills,
        daily_living_skills=report.dailyLivingSkills,
        social_skills=report.socialSkills,
        idea_requirements_met=report.ideaRequirementsMet,
        compliance_notes=report.complianceNotes,
        recommendations=report.recommendations,
        priority_areas=report.priorityAreas,
        strength_areas=report.strengthAreas,
        next_steps=report.nextSteps,
        prepared_by=report.preparedBy,
    )
    db.add(db_report)
    await db.commit()
    await db.refresh(db_report)
    return db_report


@router.get("/reports/readiness/{plan_id}", response_model=List[TransitionReadinessReportResponse])
async def get_readiness_reports(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all readiness reports for a plan"""
    result = await db.execute(
        select(TransitionReadinessReport)
        .where(TransitionReadinessReport.transition_plan_id == plan_id)
        .order_by(TransitionReadinessReport.report_date.desc())
    )
    return result.scalars().all()


@router.get("/reports/readiness/{plan_id}/latest", response_model=TransitionReadinessReportResponse)
async def get_latest_readiness_report(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the most recent readiness report"""
    result = await db.execute(
        select(TransitionReadinessReport)
        .where(TransitionReadinessReport.transition_plan_id == plan_id)
        .order_by(TransitionReadinessReport.report_date.desc())
        .limit(1)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="No reports found")
    return report


# ==========================================
# DASHBOARD & TIMELINE
# ==========================================

@router.get("/dashboard/{learner_id}", response_model=TransitionDashboardStats)
async def get_transition_dashboard(
    learner_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive transition dashboard statistics"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get learner info
    learner_result = await db.execute(
        select(Learner).where(Learner.id == learner_id)
    )
    learner = learner_result.scalar_one_or_none()
    if not learner:
        raise HTTPException(status_code=404, detail="Learner not found")
    
    # Get transition plan
    plan_result = await db.execute(
        select(TransitionPlan).where(TransitionPlan.learner_id == learner_id)
    )
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Transition plan not found")
    
    # Calculate age
    age = (datetime.utcnow().date() - learner.date_of_birth).days // 365
    
    # Days until graduation
    days_until = (plan.projected_graduation_date.date() - datetime.utcnow().date()).days
    
    # Goals
    goals_result = await db.execute(
        select(
            func.count(TransitionGoal.id).label('total'),
            func.sum(case((TransitionGoal.status == 'COMPLETED', 1), else_=0)).label('completed'),
            func.sum(case((TransitionGoal.status == 'IN_PROGRESS', 1), else_=0)).label('in_progress'),
        ).where(TransitionGoal.transition_plan_id == plan.id)
    )
    goals = goals_result.one()
    
    # Colleges
    colleges_result = await db.execute(
        select(
            func.count(SavedCollege.id).label('saved'),
        ).where(SavedCollege.transition_plan_id == plan.id)
    )
    
    apps_result = await db.execute(
        select(
            func.count(CollegeApplication.id).filter(CollegeApplication.status == 'IN_PROGRESS').label('in_progress'),
            func.count(CollegeApplication.id).filter(CollegeApplication.status == 'SUBMITTED').label('submitted'),
            func.count(CollegeApplication.id).filter(CollegeApplication.status == 'ACCEPTED').label('accepted'),
        ).where(CollegeApplication.transition_plan_id == plan.id)
    )
    
    # Work hours
    work_result = await db.execute(
        select(func.sum(WorkExperience.total_hours_worked))
        .where(WorkExperience.transition_plan_id == plan.id)
    )
    work_hours = work_result.scalar() or 0
    
    intern_result = await db.execute(
        select(func.sum(Internship.total_hours_completed))
        .where(Internship.transition_plan_id == plan.id)
    )
    intern_hours = intern_result.scalar() or 0
    
    # Job shadowing
    js_result = await db.execute(
        select(func.count(JobShadowing.id))
        .where(JobShadowing.transition_plan_id == plan.id)
    )
    
    # Certifications
    certs_result = await db.execute(
        select(func.count(IndustryCertification.id))
        .where(IndustryCertification.transition_plan_id == plan.id)
    )
    
    # Self-determination
    sd_result = await db.execute(
        select(SelfDeterminationAssessment.total_score)
        .where(SelfDeterminationAssessment.transition_plan_id == plan.id)
        .order_by(SelfDeterminationAssessment.assessment_date.desc())
        .limit(1)
    )
    sd_score = sd_result.scalar()
    
    # IDEA compliance (simplified)
    idea_met = 5  # Placeholder
    idea_total = 7
    
    return TransitionDashboardStats(
        learnerId=learner_id,
        learnerName=f"{learner.first_name} {learner.last_name}",
        currentAge=age,
        gradeLevel=learner.grade_level,
        projectedGraduationDate=plan.projected_graduation_date,
        daysUntilGraduation=max(0, days_until),
        planStatus=plan.status,
        totalGoals=goals.total or 0,
        goalsCompleted=goals.completed or 0,
        goalsInProgress=goals.in_progress or 0,
        collegesSaved=colleges_result.scalar() or 0,
        applicationsInProgress=apps_result.one().in_progress or 0,
        applicationsSubmitted=apps_result.one().submitted or 0,
        acceptances=apps_result.one().accepted or 0,
        totalWorkHours=work_hours + intern_hours,
        jobShadowingCount=js_result.scalar() or 0,
        internshipsCompleted=0,  # Would need proper query
        tradeProgramsExplored=0,
        certificationsEarned=certs_result.scalar() or 0,
        latestSelfDeterminationScore=sd_score,
        ideaRequirementsMet=idea_met,
        ideaRequirementsTotal=idea_total,
        nextAnnualReviewDate=plan.next_annual_review_date,
    )


@router.get("/timeline/{plan_id}", response_model=TransitionTimelineResponse)
async def get_transition_timeline(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get timeline milestones for a transition plan"""
    milestones = []
    
    # Get plan
    plan_result = await db.execute(
        select(TransitionPlan).where(TransitionPlan.id == plan_id)
    )
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Add graduation milestone
    milestones.append(TransitionTimelineMilestone(
        id="graduation",
        date=plan.projected_graduation_date,
        title="Projected Graduation",
        description="High school graduation date",
        category="milestone",
        status="upcoming" if plan.projected_graduation_date > datetime.utcnow() else "completed"
    ))
    
    # Add application deadlines
    apps_result = await db.execute(
        select(CollegeApplication)
        .where(CollegeApplication.transition_plan_id == plan_id)
        .where(CollegeApplication.application_deadline.isnot(None))
    )
    for app in apps_result.scalars().all():
        status = "completed" if app.status in ['SUBMITTED', 'ACCEPTED'] else \
                 "overdue" if app.application_deadline < datetime.utcnow() else "upcoming"
        milestones.append(TransitionTimelineMilestone(
            id=f"app-{app.id}",
            date=app.application_deadline,
            title=f"{app.college_name} Application Due",
            description=f"Application deadline for {app.college_name}",
            category="deadline",
            status=status,
            relatedRecordId=app.id,
            relatedRecordType="CollegeApplication"
        ))
    
    # Add assessments
    assessments_result = await db.execute(
        select(SelfDeterminationAssessment)
        .where(SelfDeterminationAssessment.transition_plan_id == plan_id)
    )
    for assessment in assessments_result.scalars().all():
        milestones.append(TransitionTimelineMilestone(
            id=f"assess-{assessment.id}",
            date=assessment.assessment_date,
            title="Self-Determination Assessment",
            description=f"Score: {assessment.total_score}/55",
            category="assessment",
            status="completed",
            relatedRecordId=assessment.id,
            relatedRecordType="SelfDeterminationAssessment"
        ))
    
    # Sort milestones by date
    milestones.sort(key=lambda m: m.date)
    
    # Split into upcoming and completed
    now = datetime.utcnow()
    upcoming = [m for m in milestones if m.date > now][:10]
    recent = [m for m in milestones if m.date <= now][-10:]
    
    return TransitionTimelineResponse(
        learnerId=plan.learner_id,
        milestones=milestones,
        upcomingDeadlines=upcoming,
        recentCompletions=recent
    )


@router.get("/idea-checklist/{plan_id}", response_model=IDEARequirementsChecklist)
async def get_idea_requirements_checklist(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get IDEA transition requirements compliance checklist"""
    plan_result = await db.execute(
        select(TransitionPlan).where(TransitionPlan.id == plan_id)
    )
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Check for assessments
    assess_result = await db.execute(
        select(func.count(SelfDeterminationAssessment.id))
        .where(SelfDeterminationAssessment.transition_plan_id == plan_id)
    )
    has_assessments = (assess_result.scalar() or 0) > 0
    
    # Check for goals in each category
    ed_goal = await db.execute(
        select(PostSecondaryGoal)
        .where(PostSecondaryGoal.transition_plan_id == plan_id)
        .where(PostSecondaryGoal.category == 'EDUCATION')
        .limit(1)
    )
    has_ed_goal = ed_goal.scalar_one_or_none() is not None
    
    emp_goal = await db.execute(
        select(PostSecondaryGoal)
        .where(PostSecondaryGoal.transition_plan_id == plan_id)
        .where(PostSecondaryGoal.category == 'EMPLOYMENT')
        .limit(1)
    )
    has_emp_goal = emp_goal.scalar_one_or_none() is not None
    
    living_goal = await db.execute(
        select(PostSecondaryGoal)
        .where(PostSecondaryGoal.transition_plan_id == plan_id)
        .where(PostSecondaryGoal.category == 'INDEPENDENT_LIVING')
        .limit(1)
    )
    has_living_goal = living_goal.scalar_one_or_none() is not None
    
    # Check for agency involvement
    agency_result = await db.execute(
        select(func.count(AgencyInvolvement.id))
        .where(AgencyInvolvement.transition_plan_id == plan_id)
    )
    has_agencies = (agency_result.scalar() or 0) > 0
    
    # Calculate missing requirements
    missing = []
    if not has_assessments:
        missing.append("Age-appropriate transition assessments")
    if not has_ed_goal:
        missing.append("Measurable post-secondary education goal")
    if not has_emp_goal:
        missing.append("Measurable employment goal")
    if not has_living_goal:
        missing.append("Independent living goal (if appropriate)")
    if not has_agencies:
        missing.append("Agency involvement documentation")
    if not plan.next_annual_review_date:
        missing.append("Annual review scheduled")
    
    total_reqs = 7
    met_reqs = total_reqs - len(missing)
    
    return IDEARequirementsChecklist(
        learnerId=plan.learner_id,
        planId=plan_id,
        ageAppropriateAssessmentsCompleted=has_assessments,
        assessmentTypes=["Self-Determination Assessment"] if has_assessments else [],
        hasEducationGoal=has_ed_goal,
        hasEmploymentGoal=has_emp_goal,
        hasIndependentLivingGoal=has_living_goal,
        goalsAreMeasurable=has_ed_goal or has_emp_goal,
        servicesAlignWithGoals=True,  # Would need more complex check
        courseOfStudyDefined=True,
        relevantAgenciesInvited=has_agencies,
        agencyConsentsObtained=has_agencies,
        studentInvitedToMeetings=True,
        studentPreferencesDocumented=True,
        annualReviewScheduled=plan.next_annual_review_date is not None,
        lastAnnualReviewDate=plan.last_annual_review_date,
        transferOfRightsNotificationDate=plan.transfer_of_rights_date,
        transferOfRightsCompleted=plan.transfer_of_rights_date is not None and plan.transfer_of_rights_date <= datetime.utcnow(),
        overallCompliance=len(missing) == 0,
        compliancePercentage=int((met_reqs / total_reqs) * 100),
        missingRequirements=missing
    )
