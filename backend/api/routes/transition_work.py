"""
Transition Services API Routes - Part 2
Work-Based Learning endpoints
Author: artpromedia
Date: 2025-11-29
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime

from db.database import get_db
from db.models.user import User
from api.schemas.transition import (
    EmployerPartnerCreate, EmployerPartnerUpdate, EmployerPartnerResponse,
    JobShadowingCreate, JobShadowingUpdate, JobShadowingResponse,
    InternshipCreate, InternshipUpdate, InternshipResponse,
    WorkExperienceCreate, WorkExperienceUpdate, WorkExperienceResponse,
    WorkExperienceType,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter()
logger = setup_logging(__name__)


# ==========================================
# EMPLOYER PARTNERS
# ==========================================

@router.post("/work/employers", response_model=EmployerPartnerResponse, status_code=201)
async def create_employer_partner(
    employer: EmployerPartnerCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Register a new employer partner"""
    db_employer = EmployerPartner(**employer.model_dump())
    db.add(db_employer)
    await db.commit()
    await db.refresh(db_employer)
    logger.info(f"Created employer partner: {db_employer.name}")
    return db_employer


@router.get("/work/employers", response_model=List[EmployerPartnerResponse])
async def get_employer_partners(
    industry: Optional[str] = None,
    disability_friendly: Optional[bool] = None,
    opportunity_type: Optional[WorkExperienceType] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Search employer partners with filters"""
    query = select(EmployerPartner).where(EmployerPartner.is_active == True)
    
    if industry:
        query = query.where(EmployerPartner.industry == industry)
    if disability_friendly is not None:
        query = query.where(EmployerPartner.disability_friendly == disability_friendly)
    if city:
        query = query.where(EmployerPartner.city == city)
    if state:
        query = query.where(EmployerPartner.state == state)
    
    result = await db.execute(query.order_by(EmployerPartner.name))
    return result.scalars().all()


@router.get("/work/employers/{employer_id}", response_model=EmployerPartnerResponse)
async def get_employer_partner(
    employer_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get employer partner details"""
    result = await db.execute(
        select(EmployerPartner).where(EmployerPartner.id == employer_id)
    )
    employer = result.scalar_one_or_none()
    if not employer:
        raise HTTPException(status_code=404, detail="Employer not found")
    return employer


@router.patch("/work/employers/{employer_id}", response_model=EmployerPartnerResponse)
async def update_employer_partner(
    employer_id: str,
    updates: EmployerPartnerUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update employer partner information"""
    result = await db.execute(
        select(EmployerPartner).where(EmployerPartner.id == employer_id)
    )
    employer = result.scalar_one_or_none()
    if not employer:
        raise HTTPException(status_code=404, detail="Employer not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employer, field, value)
    
    await db.commit()
    await db.refresh(employer)
    return employer


# ==========================================
# JOB SHADOWING
# ==========================================

@router.post("/work/job-shadowing", response_model=JobShadowingResponse, status_code=201)
async def create_job_shadowing(
    shadowing: JobShadowingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a job shadowing experience"""
    db_shadowing = JobShadowing(
        transition_plan_id=shadowing.transitionPlanId,
        employer_id=shadowing.employerId,
        employer_name=shadowing.employerName,
        date=shadowing.date,
        duration=shadowing.duration,
        industry=shadowing.industry,
        job_title=shadowing.jobTitle,
        tasks_observed=shadowing.tasksObserved,
        skills_observed=shadowing.skillsObserved,
    )
    db.add(db_shadowing)
    await db.commit()
    await db.refresh(db_shadowing)
    
    # Update employer stats if linked
    if shadowing.employerId:
        await db.execute(
            f"UPDATE employer_partners SET total_students_hosted = total_students_hosted + 1 WHERE id = '{shadowing.employerId}'"
        )
        await db.commit()
    
    return db_shadowing


@router.get("/work/job-shadowing/{plan_id}", response_model=List[JobShadowingResponse])
async def get_job_shadowings(
    plan_id: str,
    completed: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all job shadowing experiences for a plan"""
    query = select(JobShadowing).where(JobShadowing.transition_plan_id == plan_id)
    if completed is not None:
        query = query.where(JobShadowing.completed == completed)
    
    result = await db.execute(query.order_by(JobShadowing.date.desc()))
    return result.scalars().all()


@router.patch("/work/job-shadowing/{shadowing_id}", response_model=JobShadowingResponse)
async def update_job_shadowing(
    shadowing_id: str,
    updates: JobShadowingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update job shadowing with reflection and feedback"""
    result = await db.execute(
        select(JobShadowing).where(JobShadowing.id == shadowing_id)
    )
    shadowing = result.scalar_one_or_none()
    if not shadowing:
        raise HTTPException(status_code=404, detail="Job shadowing not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(shadowing, field, value)
    
    await db.commit()
    await db.refresh(shadowing)
    return shadowing


@router.delete("/work/job-shadowing/{shadowing_id}", status_code=204)
async def delete_job_shadowing(
    shadowing_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a job shadowing record"""
    result = await db.execute(
        select(JobShadowing).where(JobShadowing.id == shadowing_id)
    )
    shadowing = result.scalar_one_or_none()
    if shadowing:
        await db.delete(shadowing)
        await db.commit()


# ==========================================
# INTERNSHIPS
# ==========================================

@router.post("/work/internships", response_model=InternshipResponse, status_code=201)
async def create_internship(
    internship: InternshipCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create an internship record"""
    db_internship = Internship(
        transition_plan_id=internship.transitionPlanId,
        employer_id=internship.employerId,
        employer_name=internship.employerName,
        position=internship.position,
        department=internship.department,
        industry=internship.industry,
        start_date=internship.startDate,
        end_date=internship.endDate,
        hours_per_week=internship.hoursPerWeek,
        is_paid=internship.isPaid,
        hourly_rate=internship.hourlyRate,
        supervisor_name=internship.supervisorName,
        supervisor_email=internship.supervisorEmail,
        supervisor_phone=internship.supervisorPhone,
        learning_objectives=internship.learningObjectives,
        skills_targeted=internship.skillsTargeted,
    )
    db.add(db_internship)
    await db.commit()
    await db.refresh(db_internship)
    return db_internship


@router.get("/work/internships/{plan_id}", response_model=List[InternshipResponse])
async def get_internships(
    plan_id: str,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all internships for a plan"""
    query = select(Internship).where(Internship.transition_plan_id == plan_id)
    if status:
        query = query.where(Internship.status == status)
    
    result = await db.execute(query.order_by(Internship.start_date.desc()))
    return result.scalars().all()


@router.get("/work/internships/detail/{internship_id}", response_model=InternshipResponse)
async def get_internship(
    internship_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get internship details"""
    result = await db.execute(
        select(Internship).where(Internship.id == internship_id)
    )
    internship = result.scalar_one_or_none()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")
    return internship


@router.patch("/work/internships/{internship_id}", response_model=InternshipResponse)
async def update_internship(
    internship_id: str,
    updates: InternshipUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update internship progress, evaluations, hours"""
    result = await db.execute(
        select(Internship).where(Internship.id == internship_id)
    )
    internship = result.scalar_one_or_none()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(internship, field, value)
    
    await db.commit()
    await db.refresh(internship)
    return internship


@router.post("/work/internships/{internship_id}/evaluation")
async def add_internship_evaluation(
    internship_id: str,
    evaluation: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add an evaluation to internship"""
    result = await db.execute(
        select(Internship).where(Internship.id == internship_id)
    )
    internship = result.scalar_one_or_none()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")
    
    evaluations = internship.evaluations or []
    evaluation['date'] = datetime.utcnow().isoformat()
    evaluations.append(evaluation)
    internship.evaluations = evaluations
    
    await db.commit()
    return {"message": "Evaluation added", "evaluations": evaluations}


# ==========================================
# WORK EXPERIENCES (General)
# ==========================================

@router.post("/work/experiences", response_model=WorkExperienceResponse, status_code=201)
async def create_work_experience(
    experience: WorkExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a work experience record"""
    db_experience = WorkExperience(
        transition_plan_id=experience.transitionPlanId,
        employer_id=experience.employerId,
        employer_name=experience.employerName,
        experience_type=experience.experienceType.value,
        position=experience.position,
        industry=experience.industry,
        start_date=experience.startDate,
        end_date=experience.endDate,
        is_current=experience.isCurrent,
        hours_per_week=experience.hoursPerWeek,
        hourly_wage=experience.hourlyWage,
    )
    db.add(db_experience)
    await db.commit()
    await db.refresh(db_experience)
    return db_experience


@router.get("/work/experiences/{plan_id}", response_model=List[WorkExperienceResponse])
async def get_work_experiences(
    plan_id: str,
    experience_type: Optional[WorkExperienceType] = None,
    current_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all work experiences for a plan"""
    query = select(WorkExperience).where(WorkExperience.transition_plan_id == plan_id)
    
    if experience_type:
        query = query.where(WorkExperience.experience_type == experience_type.value)
    if current_only:
        query = query.where(WorkExperience.is_current == True)
    
    result = await db.execute(query.order_by(WorkExperience.start_date.desc()))
    return result.scalars().all()


@router.patch("/work/experiences/{experience_id}", response_model=WorkExperienceResponse)
async def update_work_experience(
    experience_id: str,
    updates: WorkExperienceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update work experience details"""
    result = await db.execute(
        select(WorkExperience).where(WorkExperience.id == experience_id)
    )
    experience = result.scalar_one_or_none()
    if not experience:
        raise HTTPException(status_code=404, detail="Work experience not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(experience, field, value)
    
    await db.commit()
    await db.refresh(experience)
    return experience


@router.delete("/work/experiences/{experience_id}", status_code=204)
async def delete_work_experience(
    experience_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a work experience"""
    result = await db.execute(
        select(WorkExperience).where(WorkExperience.id == experience_id)
    )
    experience = result.scalar_one_or_none()
    if experience:
        await db.delete(experience)
        await db.commit()


# ==========================================
# WORK SUMMARY
# ==========================================

@router.get("/work/summary/{plan_id}")
async def get_work_summary(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get summary of all work-based learning for a plan"""
    # Job shadowing count
    js_result = await db.execute(
        select(func.count(JobShadowing.id))
        .where(JobShadowing.transition_plan_id == plan_id)
    )
    js_count = js_result.scalar() or 0
    
    # Completed job shadowing
    js_completed = await db.execute(
        select(func.count(JobShadowing.id))
        .where(JobShadowing.transition_plan_id == plan_id)
        .where(JobShadowing.completed == True)
    )
    
    # Internship count and hours
    intern_result = await db.execute(
        select(
            func.count(Internship.id),
            func.sum(Internship.total_hours_completed)
        ).where(Internship.transition_plan_id == plan_id)
    )
    intern_row = intern_result.one()
    
    # Work experience hours
    work_result = await db.execute(
        select(func.sum(WorkExperience.total_hours_worked))
        .where(WorkExperience.transition_plan_id == plan_id)
    )
    work_hours = work_result.scalar() or 0
    
    # Industries explored
    industries_result = await db.execute(
        select(WorkExperience.industry)
        .where(WorkExperience.transition_plan_id == plan_id)
        .distinct()
    )
    industries = [r[0] for r in industries_result.all()]
    
    return {
        "jobShadowingTotal": js_count,
        "jobShadowingCompleted": js_completed.scalar() or 0,
        "internshipsTotal": intern_row[0] or 0,
        "internshipHours": intern_row[1] or 0,
        "workExperienceHours": work_hours,
        "totalWorkHours": (intern_row[1] or 0) + work_hours,
        "industriesExplored": industries,
        "industriesCount": len(industries),
    }
