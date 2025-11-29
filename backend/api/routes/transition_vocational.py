"""
Transition Services API Routes - Part 3
Vocational Pathways endpoints
Author: artpromedia
Date: 2025-11-29
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import datetime

from db.database import get_db
from db.models.user import User
from api.schemas.transition import (
    TradeProgramCreate, TradeProgramUpdate, TradeProgramResponse,
    TradeProgramSearchFilters, TradeType,
    TradeProgramApplicationCreate, TradeProgramApplicationUpdate, TradeProgramApplicationResponse,
    ProgramApplicationStatus,
    ApprenticeshipCreate, ApprenticeshipUpdate, ApprenticeshipResponse,
    IndustryCertificationCreate, IndustryCertificationUpdate, IndustryCertificationResponse,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter()
logger = setup_logging(__name__)


# ==========================================
# TRADE PROGRAMS
# ==========================================

@router.post("/vocational/programs", response_model=TradeProgramResponse, status_code=201)
async def create_trade_program(
    program: TradeProgramCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new trade program (admin only)"""
    db_program = TradeProgram(
        name=program.name,
        trade=program.trade.value,
        provider=program.provider,
        provider_type=program.providerType,
        city=program.city,
        state=program.state,
        is_online=program.isOnline,
        is_hybrid=program.isHybrid,
        description=program.description,
        duration=program.duration,
        total_hours=program.totalHours,
        tuition=program.tuition,
        books_and_supplies=program.booksAndSupplies,
        financial_aid_available=program.financialAidAvailable,
        scholarships_available=program.scholarshipsAvailable,
        job_placement_rate=program.jobPlacementRate,
        average_starting_salary=program.averageStartingSalary,
        median_salary=program.medianSalary,
        certifications_earned=program.certificationsEarned,
        prerequisites=program.prerequisites,
    )
    db.add(db_program)
    await db.commit()
    await db.refresh(db_program)
    logger.info(f"Created trade program: {db_program.name}")
    return db_program


@router.get("/vocational/programs", response_model=List[TradeProgramResponse])
async def search_trade_programs(
    trade: Optional[TradeType] = None,
    state: Optional[str] = None,
    max_tuition: Optional[float] = Query(None, description="Maximum tuition cost"),
    min_placement_rate: Optional[float] = Query(None, ge=0, le=100, description="Minimum job placement rate"),
    min_salary: Optional[float] = Query(None, description="Minimum average starting salary"),
    is_online: Optional[bool] = None,
    disability_services: Optional[bool] = True,
    max_duration: Optional[int] = Query(None, description="Maximum duration in weeks"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Search trade programs with comprehensive filters"""
    query = select(TradeProgram).where(TradeProgram.is_active == True)
    
    if trade:
        query = query.where(TradeProgram.trade == trade.value)
    if state:
        query = query.where(TradeProgram.state == state)
    if max_tuition:
        query = query.where(TradeProgram.tuition <= max_tuition)
    if min_placement_rate:
        query = query.where(TradeProgram.job_placement_rate >= min_placement_rate)
    if min_salary:
        query = query.where(TradeProgram.average_starting_salary >= min_salary)
    if is_online is not None:
        query = query.where(TradeProgram.is_online == is_online)
    if disability_services:
        query = query.where(TradeProgram.disability_services_available == True)
    if max_duration:
        query = query.where(TradeProgram.duration <= max_duration)
    
    result = await db.execute(
        query.order_by(TradeProgram.job_placement_rate.desc().nullslast())
    )
    return result.scalars().all()


@router.get("/vocational/programs/{program_id}", response_model=TradeProgramResponse)
async def get_trade_program(
    program_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed trade program information"""
    result = await db.execute(
        select(TradeProgram).where(TradeProgram.id == program_id)
    )
    program = result.scalar_one_or_none()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


@router.get("/vocational/programs/by-trade/{trade}", response_model=List[TradeProgramResponse])
async def get_programs_by_trade(
    trade: TradeType,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all programs for a specific trade"""
    result = await db.execute(
        select(TradeProgram)
        .where(TradeProgram.trade == trade.value)
        .where(TradeProgram.is_active == True)
        .order_by(TradeProgram.job_placement_rate.desc().nullslast())
    )
    return result.scalars().all()


@router.get("/vocational/trades/summary")
async def get_trades_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get summary stats for each trade type"""
    result = await db.execute(
        select(
            TradeProgram.trade,
            func.count(TradeProgram.id).label('program_count'),
            func.avg(TradeProgram.job_placement_rate).label('avg_placement'),
            func.avg(TradeProgram.average_starting_salary).label('avg_salary'),
            func.min(TradeProgram.tuition).label('min_tuition'),
            func.max(TradeProgram.tuition).label('max_tuition'),
        )
        .where(TradeProgram.is_active == True)
        .group_by(TradeProgram.trade)
    )
    
    trades = []
    for row in result.all():
        trades.append({
            "trade": row.trade,
            "programCount": row.program_count,
            "avgPlacementRate": round(row.avg_placement or 0, 1),
            "avgStartingSalary": round(row.avg_salary or 0, 0),
            "tuitionRange": {
                "min": row.min_tuition,
                "max": row.max_tuition
            }
        })
    
    return trades


# ==========================================
# PROGRAM APPLICATIONS
# ==========================================

@router.post("/vocational/applications", response_model=TradeProgramApplicationResponse, status_code=201)
async def create_program_application(
    application: TradeProgramApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start a trade program application"""
    # Verify program exists
    program_result = await db.execute(
        select(TradeProgram).where(TradeProgram.id == application.programId)
    )
    program = program_result.scalar_one_or_none()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    db_app = TradeProgramApplication(
        transition_plan_id=application.transitionPlanId,
        program_id=application.programId,
        application_url=application.applicationUrl,
        application_deadline=application.applicationDeadline,
        start_date=application.startDate,
    )
    db.add(db_app)
    await db.commit()
    await db.refresh(db_app)
    return db_app


@router.get("/vocational/applications/{plan_id}", response_model=List[TradeProgramApplicationResponse])
async def get_program_applications(
    plan_id: str,
    status: Optional[ProgramApplicationStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all program applications for a transition plan"""
    query = select(TradeProgramApplication).where(
        TradeProgramApplication.transition_plan_id == plan_id
    )
    if status:
        query = query.where(TradeProgramApplication.status == status.value)
    
    result = await db.execute(query.order_by(TradeProgramApplication.created_at.desc()))
    applications = result.scalars().all()
    
    # Enrich with program details
    enriched = []
    for app in applications:
        program_result = await db.execute(
            select(TradeProgram).where(TradeProgram.id == app.program_id)
        )
        program = program_result.scalar_one_or_none()
        app_dict = app.__dict__.copy()
        app_dict['program'] = program
        enriched.append(app_dict)
    
    return enriched


@router.patch("/vocational/applications/{app_id}", response_model=TradeProgramApplicationResponse)
async def update_program_application(
    app_id: str,
    updates: TradeProgramApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update program application progress"""
    result = await db.execute(
        select(TradeProgramApplication).where(TradeProgramApplication.id == app_id)
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(value, 'value'):
            value = value.value
        setattr(application, field, value)
    
    await db.commit()
    await db.refresh(application)
    return application


# ==========================================
# APPRENTICESHIPS
# ==========================================

@router.post("/vocational/apprenticeships", response_model=ApprenticeshipResponse, status_code=201)
async def create_apprenticeship(
    apprenticeship: ApprenticeshipCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create an apprenticeship record"""
    db_apprenticeship = Apprenticeship(
        transition_plan_id=apprenticeship.transitionPlanId,
        trade=apprenticeship.trade.value,
        program_name=apprenticeship.programName,
        sponsor_organization=apprenticeship.sponsorOrganization,
        employer_id=apprenticeship.employerId,
        start_date=apprenticeship.startDate,
        expected_end_date=apprenticeship.expectedEndDate,
        total_hours_required=apprenticeship.totalHoursRequired,
        classroom_hours_required=apprenticeship.classroomHoursRequired,
        starting_wage=apprenticeship.startingWage,
        current_wage=apprenticeship.currentWage,
        journeyman_wage=apprenticeship.journeymanWage,
        total_levels=apprenticeship.totalLevels,
    )
    db.add(db_apprenticeship)
    await db.commit()
    await db.refresh(db_apprenticeship)
    return db_apprenticeship


@router.get("/vocational/apprenticeships/{plan_id}", response_model=List[ApprenticeshipResponse])
async def get_apprenticeships(
    plan_id: str,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all apprenticeships for a plan"""
    query = select(Apprenticeship).where(Apprenticeship.transition_plan_id == plan_id)
    if status:
        query = query.where(Apprenticeship.status == status)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/vocational/apprenticeships/{apprenticeship_id}", response_model=ApprenticeshipResponse)
async def update_apprenticeship(
    apprenticeship_id: str,
    updates: ApprenticeshipUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update apprenticeship progress"""
    result = await db.execute(
        select(Apprenticeship).where(Apprenticeship.id == apprenticeship_id)
    )
    apprenticeship = result.scalar_one_or_none()
    if not apprenticeship:
        raise HTTPException(status_code=404, detail="Apprenticeship not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(apprenticeship, field, value)
    
    await db.commit()
    await db.refresh(apprenticeship)
    return apprenticeship


@router.post("/vocational/apprenticeships/{apprenticeship_id}/wage-progression")
async def add_wage_progression(
    apprenticeship_id: str,
    wage: float,
    percentage: float,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record a wage increase in the apprenticeship"""
    result = await db.execute(
        select(Apprenticeship).where(Apprenticeship.id == apprenticeship_id)
    )
    apprenticeship = result.scalar_one_or_none()
    if not apprenticeship:
        raise HTTPException(status_code=404, detail="Apprenticeship not found")
    
    progressions = apprenticeship.wage_progressions or []
    progressions.append({
        "date": datetime.utcnow().isoformat(),
        "wage": wage,
        "percentage": percentage
    })
    apprenticeship.wage_progressions = progressions
    apprenticeship.current_wage = wage
    
    await db.commit()
    return {"message": "Wage progression recorded", "currentWage": wage}


# ==========================================
# INDUSTRY CERTIFICATIONS
# ==========================================

@router.post("/vocational/certifications", response_model=IndustryCertificationResponse, status_code=201)
async def create_certification(
    certification: IndustryCertificationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record an earned industry certification"""
    db_cert = IndustryCertification(
        transition_plan_id=certification.transitionPlanId,
        name=certification.name,
        issuing_organization=certification.issuingOrganization,
        industry=certification.industry,
        earned_date=certification.earnedDate,
        expiration_date=certification.expirationDate,
        is_lifetime=certification.isLifetime,
        credential_id=certification.credentialId,
        verification_url=certification.verificationUrl,
    )
    db.add(db_cert)
    await db.commit()
    await db.refresh(db_cert)
    return db_cert


@router.get("/vocational/certifications/{plan_id}", response_model=List[IndustryCertificationResponse])
async def get_certifications(
    plan_id: str,
    include_expired: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all certifications for a plan"""
    query = select(IndustryCertification).where(
        IndustryCertification.transition_plan_id == plan_id
    )
    
    if not include_expired:
        query = query.where(
            (IndustryCertification.is_lifetime == True) |
            (IndustryCertification.expiration_date >= datetime.utcnow()) |
            (IndustryCertification.expiration_date.is_(None))
        )
    
    result = await db.execute(query.order_by(IndustryCertification.earned_date.desc()))
    return result.scalars().all()


@router.patch("/vocational/certifications/{cert_id}", response_model=IndustryCertificationResponse)
async def update_certification(
    cert_id: str,
    updates: IndustryCertificationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update certification details (e.g., CEU progress)"""
    result = await db.execute(
        select(IndustryCertification).where(IndustryCertification.id == cert_id)
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cert, field, value)
    
    await db.commit()
    await db.refresh(cert)
    return cert


@router.get("/vocational/certifications/expiring-soon/{plan_id}")
async def get_expiring_certifications(
    plan_id: str,
    days: int = Query(90, description="Days until expiration"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get certifications expiring within specified days"""
    from datetime import timedelta
    
    cutoff = datetime.utcnow() + timedelta(days=days)
    
    result = await db.execute(
        select(IndustryCertification)
        .where(IndustryCertification.transition_plan_id == plan_id)
        .where(IndustryCertification.is_lifetime == False)
        .where(IndustryCertification.expiration_date <= cutoff)
        .where(IndustryCertification.expiration_date >= datetime.utcnow())
        .order_by(IndustryCertification.expiration_date)
    )
    
    return result.scalars().all()
