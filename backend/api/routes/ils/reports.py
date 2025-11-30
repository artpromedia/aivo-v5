"""
ILS Reports API Routes
Progress reports and dashboard data
Author: artpromedia
Date: 2025-11-29
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from typing import List, Optional
from datetime import datetime, timedelta

from db.database import get_db
from db.models.user import User
from api.schemas.ils import (
    IndependentLivingDomain, SkillMasteryLevel, CBIStatus,
    ILSDashboardResponse, DomainSummary,
    ILSProgressReportRequest, ILSProgressReportResponse, SkillProgressSummary,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter()
logger = setup_logging(__name__)


# ==========================================
# DASHBOARD ENDPOINTS
# ==========================================

@router.get("/dashboard/{learner_id}", response_model=ILSDashboardResponse)
async def get_ils_dashboard(
    learner_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive ILS dashboard for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get learner info
    learner_result = await db.execute(
        select(Learner).where(Learner.id == learner_id)
    )
    learner = learner_result.scalar_one_or_none()
    if not learner:
        raise HTTPException(status_code=404, detail="Learner not found")
    
    learner_name = f"{learner.first_name} {learner.last_name}"
    
    # Get all skill progress for learner
    progress_result = await db.execute(
        select(LearnerSkillProgress)
        .where(LearnerSkillProgress.learner_id == learner_id)
        .where(LearnerSkillProgress.is_active == True)
        .options(joinedload(LearnerSkillProgress.skill))
    )
    all_progress = progress_result.scalars().all()
    
    # Calculate overall stats
    total_skills = len(all_progress)
    mastered = sum(1 for p in all_progress if p.mastery_level == SkillMasteryLevel.MASTERED)
    generalized = sum(1 for p in all_progress if p.mastery_level == SkillMasteryLevel.GENERALIZED)
    
    avg_mastery = 0
    if all_progress:
        avg_mastery = sum(p.percent_mastered for p in all_progress) / len(all_progress)
    
    # Calculate by domain
    domain_summaries = []
    for domain in IndependentLivingDomain:
        domain_progress = [p for p in all_progress if p.skill and p.skill.domain == domain]
        
        if not domain_progress:
            continue
        
        domain_total = len(domain_progress)
        domain_introduced = sum(1 for p in domain_progress 
                               if p.mastery_level != SkillMasteryLevel.NOT_INTRODUCED)
        domain_mastered = sum(1 for p in domain_progress 
                             if p.mastery_level == SkillMasteryLevel.MASTERED)
        domain_generalized = sum(1 for p in domain_progress 
                                if p.mastery_level == SkillMasteryLevel.GENERALIZED)
        domain_avg = sum(p.percent_mastered for p in domain_progress) / len(domain_progress)
        
        # Count active goals in domain
        goals_result = await db.execute(
            select(func.count())
            .where(ILSGoal.learner_id == learner_id)
            .where(ILSGoal.domain == domain)
            .where(ILSGoal.status == "ACTIVE")
        )
        active_goals = goals_result.scalar() or 0
        
        # Count recent data points
        week_ago = datetime.now() - timedelta(days=7)
        dp_result = await db.execute(
            select(func.count())
            .select_from(SkillDataPoint)
            .join(FunctionalSkill)
            .where(SkillDataPoint.learner_id == learner_id)
            .where(FunctionalSkill.domain == domain)
            .where(SkillDataPoint.session_date >= week_ago)
        )
        recent_dp = dp_result.scalar() or 0
        
        # Get readable domain name
        domain_names = {
            IndependentLivingDomain.MONEY_MANAGEMENT: "Money Management",
            IndependentLivingDomain.COOKING_NUTRITION: "Cooking & Nutrition",
            IndependentLivingDomain.TRANSPORTATION: "Transportation",
            IndependentLivingDomain.HOUSING_HOME_CARE: "Housing & Home Care",
            IndependentLivingDomain.HEALTH_SAFETY: "Health & Safety",
            IndependentLivingDomain.COMMUNITY_RESOURCES: "Community Resources",
        }
        
        domain_summaries.append(DomainSummary(
            domain=domain,
            domain_name=domain_names.get(domain, domain.value),
            total_skills=domain_total,
            skills_introduced=domain_introduced,
            skills_mastered=domain_mastered,
            skills_generalized=domain_generalized,
            average_mastery_percent=domain_avg,
            active_goals=active_goals,
            recent_data_points=recent_dp
        ))
    
    # Recent activity
    week_ago = datetime.now() - timedelta(days=7)
    
    recent_dp_result = await db.execute(
        select(func.count())
        .where(SkillDataPoint.learner_id == learner_id)
        .where(SkillDataPoint.session_date >= week_ago)
    )
    recent_data_points = recent_dp_result.scalar() or 0
    
    recent_cbi_result = await db.execute(
        select(func.count())
        .where(CommunityBasedInstruction.learner_id == learner_id)
        .where(CommunityBasedInstruction.scheduled_date >= week_ago)
    )
    recent_cbi = recent_cbi_result.scalar() or 0
    
    # Last activity
    last_dp = await db.execute(
        select(SkillDataPoint.session_date)
        .where(SkillDataPoint.learner_id == learner_id)
        .order_by(desc(SkillDataPoint.session_date))
        .limit(1)
    )
    last_activity = last_dp.scalar_one_or_none()
    
    # Goals stats
    active_goals_result = await db.execute(
        select(func.count())
        .where(ILSGoal.learner_id == learner_id)
        .where(ILSGoal.status == "ACTIVE")
    )
    active_goals = active_goals_result.scalar() or 0
    
    year_start = datetime(datetime.now().year, 1, 1)
    achieved_result = await db.execute(
        select(func.count())
        .where(ILSGoal.learner_id == learner_id)
        .where(ILSGoal.status == "ACHIEVED")
        .where(ILSGoal.completed_date >= year_start)
    )
    goals_achieved = achieved_result.scalar() or 0
    
    # Priority skills (lowest mastery, critical safety first)
    priority_result = await db.execute(
        select(LearnerSkillProgress)
        .where(LearnerSkillProgress.learner_id == learner_id)
        .where(LearnerSkillProgress.is_active == True)
        .where(LearnerSkillProgress.mastery_level != SkillMasteryLevel.MASTERED)
        .options(joinedload(LearnerSkillProgress.skill))
        .order_by(LearnerSkillProgress.percent_mastered)
        .limit(5)
    )
    priority_progress = priority_result.scalars().all()
    priority_skills = [p.skill_id for p in priority_progress]
    
    # Upcoming CBIs
    upcoming_cbi_result = await db.execute(
        select(CommunityBasedInstruction)
        .where(CommunityBasedInstruction.learner_id == learner_id)
        .where(CommunityBasedInstruction.scheduled_date >= datetime.now())
        .where(CommunityBasedInstruction.status == CBIStatus.PLANNED)
        .order_by(CommunityBasedInstruction.scheduled_date)
        .limit(3)
    )
    upcoming_cbis = upcoming_cbi_result.scalars().all()
    
    return ILSDashboardResponse(
        learner_id=learner_id,
        learner_name=learner_name,
        total_skills_tracked=total_skills,
        skills_mastered=mastered,
        skills_generalized=generalized,
        overall_mastery_percent=avg_mastery,
        domain_summaries=domain_summaries,
        recent_data_points=recent_data_points,
        recent_cbi_sessions=recent_cbi,
        last_activity_date=last_activity,
        active_goals=active_goals,
        goals_achieved_this_year=goals_achieved,
        priority_skills=priority_skills,
        upcoming_cbis=upcoming_cbis
    )


# ==========================================
# PROGRESS REPORT ENDPOINTS
# ==========================================

@router.post("/progress-report", response_model=ILSProgressReportResponse)
async def generate_progress_report(
    request: ILSProgressReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a progress report for a date range"""
    if not await verify_learner_access(current_user, request.learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get learner info
    learner_result = await db.execute(
        select(Learner).where(Learner.id == request.learner_id)
    )
    learner = learner_result.scalar_one_or_none()
    if not learner:
        raise HTTPException(status_code=404, detail="Learner not found")
    
    learner_name = f"{learner.first_name} {learner.last_name}"
    
    # Get skill progress with filtering
    progress_query = select(LearnerSkillProgress).where(
        LearnerSkillProgress.learner_id == request.learner_id,
        LearnerSkillProgress.is_active == True
    ).options(joinedload(LearnerSkillProgress.skill))
    
    if request.domains:
        progress_query = progress_query.join(FunctionalSkill).where(
            FunctionalSkill.domain.in_(request.domains)
        )
    
    progress_result = await db.execute(progress_query)
    all_progress = progress_result.scalars().all()
    
    # Build skill progress summaries
    skill_summaries = []
    skills_improved = 0
    skills_mastered = 0
    total_growth = 0
    
    for progress in all_progress:
        # Get data points in range
        dp_result = await db.execute(
            select(SkillDataPoint)
            .where(SkillDataPoint.learner_id == request.learner_id)
            .where(SkillDataPoint.skill_id == progress.skill_id)
            .where(SkillDataPoint.session_date >= request.start_date)
            .where(SkillDataPoint.session_date <= request.end_date)
            .order_by(SkillDataPoint.session_date)
        )
        data_points = dp_result.scalars().all()
        
        if not data_points:
            continue
        
        # Calculate start and end performance
        first_dp = data_points[0]
        last_dp = data_points[-1]
        
        start_percent = first_dp.accuracy_percent or 0
        end_percent = last_dp.accuracy_percent or progress.percent_mastered
        growth = end_percent - start_percent
        
        if growth > 0:
            skills_improved += 1
            total_growth += growth
        
        if progress.mastery_level in [SkillMasteryLevel.MASTERED, SkillMasteryLevel.GENERALIZED]:
            skills_mastered += 1
        
        # Get unique settings practiced
        settings = list(set(dp.setting for dp in data_points))
        
        skill_summaries.append(SkillProgressSummary(
            skill_id=progress.skill_id,
            skill_name=progress.skill.name if progress.skill else "Unknown",
            domain=progress.skill.domain if progress.skill else IndependentLivingDomain.MONEY_MANAGEMENT,
            start_mastery_level=SkillMasteryLevel.NOT_INTRODUCED,  # Would need historical data
            end_mastery_level=progress.mastery_level,
            start_percent=start_percent,
            end_percent=end_percent,
            growth=growth,
            data_points_collected=len(data_points),
            settings_practiced=settings
        ))
    
    # Calculate average growth
    average_growth = total_growth / len(skill_summaries) if skill_summaries else 0
    
    # Goals summary
    goals_summary = None
    if request.include_goals:
        goals_result = await db.execute(
            select(ILSGoal)
            .where(ILSGoal.learner_id == request.learner_id)
            .where(or_(
                ILSGoal.status == "ACTIVE",
                and_(
                    ILSGoal.completed_date >= request.start_date,
                    ILSGoal.completed_date <= request.end_date
                )
            ))
        )
        goals = goals_result.scalars().all()
        
        goals_summary = {
            "total": len(goals),
            "active": sum(1 for g in goals if g.status == "ACTIVE"),
            "achieved": sum(1 for g in goals if g.status == "ACHIEVED"),
            "not_achieved": sum(1 for g in goals if g.status == "NOT_ACHIEVED"),
        }
    
    # CBI summary
    cbi_summary = None
    if request.include_cbi:
        cbi_result = await db.execute(
            select(CommunityBasedInstruction)
            .where(CommunityBasedInstruction.learner_id == request.learner_id)
            .where(CommunityBasedInstruction.scheduled_date >= request.start_date)
            .where(CommunityBasedInstruction.scheduled_date <= request.end_date)
        )
        cbis = cbi_result.scalars().all()
        
        completed = [c for c in cbis if c.status == CBIStatus.COMPLETED]
        avg_rating = sum(c.overall_success_rating or 0 for c in completed) / len(completed) if completed else 0
        
        cbi_summary = {
            "total_sessions": len(cbis),
            "completed": len(completed),
            "average_success_rating": avg_rating,
            "settings_visited": list(set(c.setting_type for c in cbis))
        }
    
    # Generalization summary
    gen_summary = None
    if request.include_generalization:
        gen_result = await db.execute(
            select(GeneralizationRecord)
            .where(GeneralizationRecord.learner_id == request.learner_id)
        )
        records = gen_result.scalars().all()
        
        gen_summary = {
            "total_settings_tracked": len(records),
            "settings_mastered": sum(1 for r in records if r.is_mastered),
            "settings_in_progress": sum(1 for r in records if r.is_introduced and not r.is_mastered),
            "average_success_rate": sum(r.success_rate or 0 for r in records) / len(records) if records else 0
        }
    
    # Generate recommendations
    recommendations = []
    next_steps = []
    
    if skills_improved < len(skill_summaries) / 2:
        recommendations.append("Consider increasing practice frequency for skills showing limited progress")
    
    if cbi_summary and cbi_summary["completed"] < 2:
        recommendations.append("Schedule more community-based instruction opportunities")
    
    if gen_summary and gen_summary["settings_mastered"] < gen_summary["total_settings_tracked"] / 2:
        recommendations.append("Focus on generalizing mastered skills to new settings")
    
    # Priority next steps
    low_progress_skills = [s for s in skill_summaries if s.growth < 10][:3]
    for skill in low_progress_skills:
        next_steps.append(f"Review teaching strategies for {skill.skill_name}")
    
    return ILSProgressReportResponse(
        learner_id=request.learner_id,
        learner_name=learner_name,
        report_period_start=request.start_date,
        report_period_end=request.end_date,
        generated_at=datetime.now(),
        skills_tracked=len(skill_summaries),
        skills_improved=skills_improved,
        skills_mastered=skills_mastered,
        average_growth=average_growth,
        skill_progress=skill_summaries,
        goals_summary=goals_summary,
        cbi_summary=cbi_summary,
        generalization_summary=gen_summary,
        recommendations=recommendations,
        next_steps=next_steps
    )


@router.get("/domain-breakdown/{learner_id}")
async def get_domain_breakdown(
    learner_id: str,
    domain: IndependentLivingDomain,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed breakdown for a specific domain"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all skills in domain
    skills_result = await db.execute(
        select(FunctionalSkill)
        .where(FunctionalSkill.domain == domain)
        .where(FunctionalSkill.is_active == True)
    )
    all_skills = skills_result.scalars().all()
    
    # Get learner's progress on these skills
    progress_result = await db.execute(
        select(LearnerSkillProgress)
        .where(LearnerSkillProgress.learner_id == learner_id)
        .where(LearnerSkillProgress.skill_id.in_([s.id for s in all_skills]))
    )
    progress_map = {p.skill_id: p for p in progress_result.scalars().all()}
    
    # Build breakdown
    skills_breakdown = []
    for skill in all_skills:
        progress = progress_map.get(skill.id)
        skills_breakdown.append({
            "skill_id": skill.id,
            "skill_name": skill.name,
            "is_assigned": progress is not None,
            "mastery_level": progress.mastery_level if progress else None,
            "percent_mastered": progress.percent_mastered if progress else 0,
            "is_critical_safety": skill.is_critical_safety,
            "total_steps": skill.total_steps,
        })
    
    # Sort by assignment status, then by mastery
    skills_breakdown.sort(key=lambda x: (not x["is_assigned"], -(x["percent_mastered"] or 0)))
    
    return {
        "domain": domain,
        "total_skills_available": len(all_skills),
        "skills_assigned": sum(1 for s in skills_breakdown if s["is_assigned"]),
        "skills_mastered": sum(1 for s in skills_breakdown if s.get("mastery_level") == SkillMasteryLevel.MASTERED),
        "skills": skills_breakdown
    }


# Placeholder classes
class Learner:
    pass

class LearnerSkillProgress:
    pass

class FunctionalSkill:
    pass

class SkillDataPoint:
    pass

class ILSGoal:
    pass

class CommunityBasedInstruction:
    pass

class GeneralizationRecord:
    pass

def joinedload(*args):
    pass
