"""
ADHD/Executive Function Support System API Routes

Endpoints for organizational tools, project breakdown,
daily planning, and EF skill assessment.
"""

from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel

from api.schemas.adhd import (
    # EF Profile
    EFProfileCreate,
    EFProfileUpdate,
    EFProfileResponse,
    # Assignments
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    AssignmentListResponse,
    UrgencyLevel,
    AssignmentStatus,
    # Project Breakdown
    ProjectBreakdownCreate,
    ProjectBreakdownUpdate,
    ProjectBreakdownResponse,
    AIBreakdownRequest,
    AIBreakdownResponse,
    ProjectStep,
    # Daily Plan
    DailyPlanCreate,
    DailyPlanUpdate,
    DailyPlanResponse,
    AIDailyPlanRequest,
    AIDailyPlanResponse,
    TimeBlock,
    TimeBlockCategory,
    # Binder
    BinderOrganizationCreate,
    BinderOrganizationUpdate,
    BinderOrganizationResponse,
    BinderCheckInRequest,
    BinderCheckInRecord,
    CheckInStatus,
    # Study Session
    StudySessionCreate,
    StudySessionUpdate,
    StudySessionResponse,
    RecordIntervalRequest,
    StudyInterval,
    # Reminders
    ReminderCreate,
    ReminderResponse,
    AcknowledgeReminderRequest,
    # Interventions
    EFInterventionCreate,
    EFInterventionUpdate,
    EFInterventionResponse,
    RateInterventionRequest,
    EffectivenessRating,
    AIStrategiesRequest,
    AIStrategiesResponse,
    EFDomain,
    # Self-Monitoring
    SelfMonitoringLogCreate,
    SelfMonitoringLogResponse,
    SelfMonitoringSummary,
    # Parent Dashboard
    ParentDashboardResponse,
    # Urgency
    UrgencyCalculationRequest,
    UrgencyCalculationResponse,
)

router = APIRouter(prefix="/api/adhd", tags=["ADHD/Executive Function Support"])


# ==========================================
# UTILITY FUNCTIONS
# ==========================================

def calculate_urgency(due_date: datetime, estimated_minutes: Optional[int] = None) -> UrgencyLevel:
    """Calculate urgency level based on due date and estimated time."""
    now = datetime.now()
    time_until_due = due_date - now
    hours_until_due = time_until_due.total_seconds() / 3600
    
    # Base urgency on time remaining
    if hours_until_due <= 24:
        base_urgency = UrgencyLevel.CRITICAL
    elif hours_until_due <= 72:  # 3 days
        base_urgency = UrgencyLevel.HIGH
    elif hours_until_due <= 168:  # 7 days
        base_urgency = UrgencyLevel.MEDIUM
    else:
        base_urgency = UrgencyLevel.LOW
    
    # Adjust for estimated time needed
    if estimated_minutes and estimated_minutes > 60:
        hours_needed = estimated_minutes / 60
        # If work takes significant portion of remaining time, bump urgency
        if hours_needed > hours_until_due * 0.3:
            urgency_order = [UrgencyLevel.LOW, UrgencyLevel.MEDIUM, UrgencyLevel.HIGH, UrgencyLevel.CRITICAL]
            current_idx = urgency_order.index(base_urgency)
            if current_idx < len(urgency_order) - 1:
                return urgency_order[current_idx + 1]
    
    return base_urgency


# ==========================================
# EXECUTIVE FUNCTION PROFILE ENDPOINTS
# ==========================================

@router.post("/ef-profile", response_model=EFProfileResponse)
async def create_ef_profile(profile: EFProfileCreate):
    """Create an executive function profile for a learner."""
    # In production, use actual database operations
    return EFProfileResponse(
        id="ef_" + profile.learner_id,
        learner_id=profile.learner_id,
        assessment_date=profile.assessment_date or datetime.now(),
        assessed_by=profile.assessed_by,
        assessment_tool=profile.assessment_tool,
        organization_rating=profile.ratings.organization,
        time_management_rating=profile.ratings.time_management,
        planning_rating=profile.ratings.planning,
        task_initiation_rating=profile.ratings.task_initiation,
        working_memory_rating=profile.ratings.working_memory,
        metacognition_rating=profile.ratings.metacognition,
        emotional_control_rating=profile.ratings.emotional_control,
        flexibility_rating=profile.ratings.flexibility,
        domain_notes=profile.domain_notes,
        strengths=profile.strengths,
        challenges=profile.challenges,
        recommended_strategies=profile.recommended_strategies,
        accommodations=profile.accommodations,
        parent_observations=profile.parent_observations,
        teacher_observations=profile.teacher_observations,
        learner_self_assessment=profile.learner_self_assessment,
        previous_assessments=None,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@router.get("/ef-profile/{learner_id}", response_model=EFProfileResponse)
async def get_ef_profile(learner_id: str):
    """Get executive function profile for a learner."""
    # In production, fetch from database
    raise HTTPException(status_code=404, detail="EF Profile not found")


@router.put("/ef-profile/{learner_id}", response_model=EFProfileResponse)
async def update_ef_profile(learner_id: str, update: EFProfileUpdate):
    """Update executive function profile."""
    # In production, update in database
    raise HTTPException(status_code=404, detail="EF Profile not found")


@router.delete("/ef-profile/{learner_id}")
async def delete_ef_profile(learner_id: str):
    """Delete executive function profile."""
    return {"status": "deleted", "learner_id": learner_id}


# ==========================================
# ASSIGNMENT ENDPOINTS
# ==========================================

@router.post("/assignments", response_model=AssignmentResponse)
async def create_assignment(assignment: AssignmentCreate):
    """Create a new assignment with auto-calculated urgency."""
    urgency = calculate_urgency(assignment.due_date, assignment.estimated_minutes)
    days_until = (assignment.due_date - datetime.now()).days
    
    return AssignmentResponse(
        id="asgn_" + datetime.now().strftime("%Y%m%d%H%M%S"),
        learner_id=assignment.learner_id,
        class_id=assignment.class_id,
        title=assignment.title,
        description=assignment.description,
        subject=assignment.subject,
        instructions=assignment.instructions,
        attachment_urls=assignment.attachment_urls,
        external_url=assignment.external_url,
        due_date=assignment.due_date,
        assigned_date=assignment.assigned_date or datetime.now(),
        estimated_minutes=assignment.estimated_minutes,
        actual_minutes=None,
        urgency_level=urgency,
        status=AssignmentStatus.NOT_STARTED,
        percent_complete=0,
        completed_at=None,
        submitted_at=None,
        parent_visible=assignment.parent_visible,
        teacher_notes=assignment.teacher_notes,
        learner_notes=None,
        reminders_sent=[],
        is_recurring=assignment.is_recurring,
        recurrence_pattern=assignment.recurrence_pattern.dict() if assignment.recurrence_pattern else None,
        points_possible=assignment.points_possible,
        points_earned=None,
        grade=None,
        feedback=None,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        days_until_due=days_until,
        is_overdue=days_until < 0,
        has_breakdown=False,
    )


@router.get("/assignments/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(assignment_id: str):
    """Get a specific assignment."""
    raise HTTPException(status_code=404, detail="Assignment not found")


@router.get("/learners/{learner_id}/assignments", response_model=AssignmentListResponse)
async def get_learner_assignments(
    learner_id: str,
    status: Optional[AssignmentStatus] = None,
    urgency: Optional[UrgencyLevel] = None,
    subject: Optional[str] = None,
    include_completed: bool = False,
    limit: int = Query(default=50, le=100),
):
    """Get all assignments for a learner with filtering."""
    return AssignmentListResponse(
        assignments=[],
        total=0,
        by_urgency={level.value: 0 for level in UrgencyLevel},
        by_status={status.value: 0 for status in AssignmentStatus},
        overdue_count=0,
    )


@router.get("/learners/{learner_id}/assignments/upcoming", response_model=AssignmentListResponse)
async def get_upcoming_assignments(
    learner_id: str,
    days_ahead: int = Query(default=7, le=30),
):
    """Get upcoming assignments sorted by urgency."""
    return AssignmentListResponse(
        assignments=[],
        total=0,
        by_urgency={level.value: 0 for level in UrgencyLevel},
        by_status={status.value: 0 for status in AssignmentStatus},
        overdue_count=0,
    )


@router.put("/assignments/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(assignment_id: str, update: AssignmentUpdate):
    """Update an assignment."""
    raise HTTPException(status_code=404, detail="Assignment not found")


@router.delete("/assignments/{assignment_id}")
async def delete_assignment(assignment_id: str):
    """Delete an assignment."""
    return {"status": "deleted", "assignment_id": assignment_id}


@router.post("/assignments/{assignment_id}/complete")
async def mark_assignment_complete(assignment_id: str, actual_minutes: Optional[int] = None):
    """Mark an assignment as complete."""
    return {
        "assignment_id": assignment_id,
        "status": AssignmentStatus.COMPLETED,
        "completed_at": datetime.now(),
        "actual_minutes": actual_minutes,
    }


# ==========================================
# PROJECT BREAKDOWN ENDPOINTS
# ==========================================

@router.post("/breakdowns", response_model=ProjectBreakdownResponse)
async def create_breakdown(breakdown: ProjectBreakdownCreate):
    """Create a project breakdown manually."""
    total_minutes = sum(s.estimated_minutes or 0 for s in breakdown.steps)
    
    return ProjectBreakdownResponse(
        id="brk_" + datetime.now().strftime("%Y%m%d%H%M%S"),
        assignment_id=breakdown.assignment_id,
        learner_id=breakdown.learner_id,
        project_title=breakdown.project_title,
        final_due_date=breakdown.final_due_date,
        project_notes=breakdown.project_notes,
        steps=breakdown.steps,
        generated_by_ai=breakdown.generated_by_ai,
        ai_prompt=breakdown.ai_prompt,
        was_modified=False,
        total_estimated_minutes=total_minutes,
        actual_time_spent=None,
        completed_steps=0,
        total_steps=len(breakdown.steps),
        completion_percentage=0,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@router.get("/breakdowns/{breakdown_id}", response_model=ProjectBreakdownResponse)
async def get_breakdown(breakdown_id: str):
    """Get a project breakdown."""
    raise HTTPException(status_code=404, detail="Breakdown not found")


@router.get("/assignments/{assignment_id}/breakdown", response_model=ProjectBreakdownResponse)
async def get_assignment_breakdown(assignment_id: str):
    """Get breakdown for an assignment."""
    raise HTTPException(status_code=404, detail="Breakdown not found")


@router.put("/breakdowns/{breakdown_id}", response_model=ProjectBreakdownResponse)
async def update_breakdown(breakdown_id: str, update: ProjectBreakdownUpdate):
    """Update a project breakdown."""
    raise HTTPException(status_code=404, detail="Breakdown not found")


@router.post("/breakdowns/{breakdown_id}/steps/{step_number}/complete")
async def complete_breakdown_step(breakdown_id: str, step_number: int, actual_minutes: Optional[int] = None):
    """Mark a breakdown step as complete."""
    return {
        "breakdown_id": breakdown_id,
        "step_number": step_number,
        "status": AssignmentStatus.COMPLETED,
        "completed_at": datetime.now(),
        "actual_minutes": actual_minutes,
    }


@router.post("/ai/breakdown", response_model=AIBreakdownResponse)
async def generate_ai_breakdown(request: AIBreakdownRequest):
    """Generate an AI-powered project breakdown."""
    from services.adhd_ai import adhd_ai_service
    
    # Call AI service to generate breakdown
    ai_result = await adhd_ai_service.generate_project_breakdown(
        project_title=request.project_title,
        project_description=request.project_description or "",
        subject=request.subject,
        final_due_date=request.final_due_date,
        num_steps=request.num_steps,
        estimated_total_minutes=request.estimated_total_minutes,
        learner_strengths=request.learner_strengths,
        learner_challenges=request.learner_challenges,
        grade_level=request.grade_level,
    )
    
    # Calculate days for scheduling
    days_until_due = max(1, (request.final_due_date - datetime.now()).days)
    
    # Convert AI response to ProjectStep objects
    steps = []
    for step_data in ai_result.get("steps", []):
        step_num = step_data.get("step_number", len(steps) + 1)
        suggested_day = step_data.get("suggested_day", step_num)
        step_due = datetime.now() + timedelta(days=suggested_day)
        
        steps.append(ProjectStep(
            step_number=step_num,
            title=step_data.get("title", f"Step {step_num}"),
            description=step_data.get("description", ""),
            estimated_minutes=step_data.get("estimated_minutes", 30),
            due_date=step_due,
            status=AssignmentStatus.NOT_STARTED,
            adhd_tips=step_data.get("tips"),
        ))
    
    breakdown = ProjectBreakdownResponse(
        id="brk_ai_" + datetime.now().strftime("%Y%m%d%H%M%S"),
        assignment_id=request.assignment_id,
        learner_id=request.learner_id,
        project_title=request.project_title,
        final_due_date=request.final_due_date,
        project_notes=None,
        steps=steps,
        generated_by_ai=True,
        ai_prompt=request.project_description,
        was_modified=False,
        total_estimated_minutes=request.estimated_total_minutes or sum(s.estimated_minutes or 0 for s in steps),
        actual_time_spent=None,
        completed_steps=0,
        total_steps=len(steps),
        completion_percentage=0,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    
    return AIBreakdownResponse(
        breakdown=breakdown,
        ai_explanation=ai_result.get("explanation", "I've broken down your project into manageable steps."),
        suggested_schedule=[
            {"step": s.step_number, "suggested_day": s.due_date.strftime("%A") if s.due_date else "Soon"}
            for s in steps
        ],
        success_strategies=ai_result.get("success_strategies", []),
    )


# ==========================================
# DAILY PLAN ENDPOINTS
# ==========================================

@router.post("/daily-plans", response_model=DailyPlanResponse)
async def create_daily_plan(plan: DailyPlanCreate):
    """Create a daily plan manually."""
    return DailyPlanResponse(
        id="plan_" + plan.date.strftime("%Y%m%d"),
        learner_id=plan.learner_id,
        date=plan.date,
        wake_time=plan.wake_time,
        school_start_time=plan.school_start_time,
        school_end_time=plan.school_end_time,
        bed_time=plan.bed_time,
        time_blocks=plan.time_blocks,
        generated_by_ai=False,
        ai_prompt=None,
        was_modified=False,
        completion_rate=0,
        total_blocks=len(plan.time_blocks),
        completed_blocks=0,
        morning_routine_notes=plan.morning_routine_notes,
        evening_routine_notes=plan.evening_routine_notes,
        parent_notes=None,
        learner_reflection=None,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@router.get("/daily-plans/{learner_id}/{plan_date}", response_model=DailyPlanResponse)
async def get_daily_plan(learner_id: str, plan_date: date):
    """Get daily plan for a specific date."""
    raise HTTPException(status_code=404, detail="Daily plan not found")


@router.put("/daily-plans/{learner_id}/{plan_date}", response_model=DailyPlanResponse)
async def update_daily_plan(learner_id: str, plan_date: date, update: DailyPlanUpdate):
    """Update a daily plan."""
    raise HTTPException(status_code=404, detail="Daily plan not found")


@router.post("/daily-plans/{learner_id}/{plan_date}/blocks/{block_id}/complete")
async def complete_time_block(learner_id: str, plan_date: date, block_id: str):
    """Mark a time block as completed."""
    return {
        "learner_id": learner_id,
        "date": plan_date,
        "block_id": block_id,
        "is_completed": True,
        "completed_at": datetime.now(),
    }


@router.post("/ai/daily-plan", response_model=AIDailyPlanResponse)
async def generate_ai_daily_plan(request: AIDailyPlanRequest):
    """Generate an AI-powered daily plan."""
    from services.adhd_ai import adhd_ai_service
    
    # Prepare assignments data
    assignments_data = [
        {
            "title": a.title if hasattr(a, 'title') else str(a),
            "due_date": a.due_date.isoformat() if hasattr(a, 'due_date') else None,
            "estimated_minutes": a.estimated_minutes if hasattr(a, 'estimated_minutes') else 30,
            "urgency": a.urgency.value if hasattr(a, 'urgency') else "medium",
        }
        for a in (request.assignments or [])
    ]
    
    # Call AI service
    ai_result = await adhd_ai_service.generate_daily_plan(
        learner_id=request.learner_id,
        date=request.date,
        wake_time=request.wake_time,
        bed_time=request.bed_time,
        school_start=request.school_start_time,
        school_end=request.school_end_time,
        assignments=assignments_data,
        preferred_study_times=request.preferred_study_times,
        ef_challenges=request.ef_challenges,
    )
    
    # Convert AI response to TimeBlock objects
    blocks = []
    for i, block_data in enumerate(ai_result.get("time_blocks", [])):
        category_str = block_data.get("category", "break").upper()
        try:
            category = TimeBlockCategory[category_str]
        except KeyError:
            category = TimeBlockCategory.BREAK
        
        start = block_data.get("start_time", "09:00")
        end = block_data.get("end_time", "09:30")
        duration = _time_diff_minutes(start, end)
        
        blocks.append(TimeBlock(
            id=f"block_{i}",
            start_time=start,
            end_time=end,
            duration=duration,
            activity=block_data.get("title", "Activity"),
            description=block_data.get("description"),
            category=category,
            is_flexible=category in [TimeBlockCategory.BREAK, TimeBlockCategory.FREE_TIME],
            assignment_id=block_data.get("related_assignment_id"),
        ))
    
    # If AI returned no blocks, fall back to basic schedule
    if not blocks:
        blocks = _generate_fallback_blocks(request)
    
    plan = DailyPlanResponse(
        id="plan_ai_" + request.date.strftime("%Y%m%d"),
        learner_id=request.learner_id,
        date=request.date,
        wake_time=request.wake_time,
        school_start_time=request.school_start_time,
        school_end_time=request.school_end_time,
        bed_time=request.bed_time,
        time_blocks=blocks,
        generated_by_ai=True,
        ai_prompt=f"Generate plan for {request.date}",
        was_modified=False,
        completion_rate=0,
        total_blocks=len(blocks),
        completed_blocks=0,
        morning_routine_notes="\n".join(ai_result.get("morning_tips", [])),
        evening_routine_notes="\n".join(ai_result.get("evening_tips", [])),
        parent_notes=None,
        learner_reflection=None,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    
    return AIDailyPlanResponse(
        plan=plan,
        ai_explanation="I've created a balanced schedule with breaks and optimal focus times.",
        tips_for_success=ai_result.get("focus_strategies", [
            "Start homework when you're most alert",
            "Use timers for transitions",
            "Take movement breaks every 45 minutes",
        ]),
    )


def _generate_fallback_blocks(request) -> List[TimeBlock]:
    """Generate basic fallback time blocks."""
    blocks = []
    block_id = 0
    
    # Morning routine
    blocks.append(TimeBlock(
        id=f"block_{block_id}",
        start_time=request.wake_time,
        end_time=_add_minutes(request.wake_time, 30),
        duration=30,
        activity="Morning Routine",
        category=TimeBlockCategory.ROUTINE,
        is_flexible=False,
    ))
    block_id += 1
    
    # Breakfast
    blocks.append(TimeBlock(
        id=f"block_{block_id}",
        start_time=_add_minutes(request.wake_time, 30),
        end_time=_add_minutes(request.wake_time, 60),
        duration=30,
        activity="Breakfast",
        category=TimeBlockCategory.MEAL,
        is_flexible=True,
    ))
    block_id += 1
    
    # School blocks
    if request.school_start_time and request.school_end_time:
        school_hours = _time_diff_minutes(request.school_start_time, request.school_end_time)
        blocks.append(TimeBlock(
            id=f"block_{block_id}",
            start_time=request.school_start_time,
            end_time=request.school_end_time,
            duration=school_hours,
            activity="School",
            category=TimeBlockCategory.CLASS,
            is_flexible=False,
        ))
        block_id += 1
        
        # After school break
        blocks.append(TimeBlock(
            id=f"block_{block_id}",
            start_time=request.school_end_time,
            end_time=_add_minutes(request.school_end_time, 30),
            duration=30,
            activity="Snack & Break",
            category=TimeBlockCategory.BREAK,
            is_flexible=True,
        ))
        block_id += 1
        
        # Homework time
        blocks.append(TimeBlock(
            id=f"block_{block_id}",
            start_time=_add_minutes(request.school_end_time, 30),
            end_time=_add_minutes(request.school_end_time, 90),
            duration=60,
            activity="Homework",
            category=TimeBlockCategory.HOMEWORK,
            is_flexible=False,
        ))
    
    return blocks


# Helper functions for time manipulation
def _add_minutes(time_str: str, minutes: int) -> str:
    """Add minutes to a time string."""
    h, m = map(int, time_str.split(":"))
    total_minutes = h * 60 + m + minutes
    new_h = (total_minutes // 60) % 24
    new_m = total_minutes % 60
    return f"{new_h:02d}:{new_m:02d}"


def _time_diff_minutes(start: str, end: str) -> int:
    """Calculate minutes between two time strings."""
    sh, sm = map(int, start.split(":"))
    eh, em = map(int, end.split(":"))
    return (eh * 60 + em) - (sh * 60 + sm)


# ==========================================
# BINDER ORGANIZATION ENDPOINTS
# ==========================================

@router.post("/binders", response_model=BinderOrganizationResponse)
async def create_binder(binder: BinderOrganizationCreate):
    """Create binder organization for a learner."""
    next_check = _calculate_next_checkin(
        binder.check_in_schedule, binder.check_in_day, binder.check_in_time
    )
    
    return BinderOrganizationResponse(
        id="binder_" + binder.learner_id,
        learner_id=binder.learner_id,
        sections=binder.sections,
        check_in_schedule=binder.check_in_schedule,
        check_in_day=binder.check_in_day,
        check_in_time=binder.check_in_time,
        last_check_in=None,
        next_check_in=next_check,
        streak_count=0,
        check_in_history=None,
        custom_tips=binder.custom_tips,
        reminder_phrase=binder.reminder_phrase,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


def _calculate_next_checkin(schedule, day, time_str) -> datetime:
    """Calculate next check-in datetime."""
    from datetime import datetime, timedelta
    now = datetime.now()
    
    if schedule == "DAILY":
        next_date = now + timedelta(days=1)
    elif schedule == "TWICE_WEEKLY":
        next_date = now + timedelta(days=3)
    else:  # WEEKLY
        next_date = now + timedelta(days=7)
    
    if time_str:
        h, m = map(int, time_str.split(":"))
        next_date = next_date.replace(hour=h, minute=m, second=0, microsecond=0)
    
    return next_date


@router.get("/binders/{learner_id}", response_model=BinderOrganizationResponse)
async def get_binder(learner_id: str):
    """Get binder organization for a learner."""
    raise HTTPException(status_code=404, detail="Binder not found")


@router.put("/binders/{learner_id}", response_model=BinderOrganizationResponse)
async def update_binder(learner_id: str, update: BinderOrganizationUpdate):
    """Update binder organization."""
    raise HTTPException(status_code=404, detail="Binder not found")


@router.post("/binders/{learner_id}/check-in")
async def record_binder_checkin(learner_id: str, checkin: BinderCheckInRequest):
    """Record a binder check-in."""
    record = BinderCheckInRecord(
        date=datetime.now(),
        status=checkin.status,
        duration_minutes=checkin.duration_minutes,
        sections_checked=checkin.sections_checked,
        issues_found=checkin.issues_found,
        notes=checkin.notes,
        completed_by=checkin.completed_by,
    )
    
    return {
        "learner_id": learner_id,
        "check_in": record,
        "streak_count": 1,  # In production, calculate from history
        "next_check_in": datetime.now() + timedelta(days=7),
    }


# ==========================================
# STUDY SESSION ENDPOINTS
# ==========================================

@router.post("/study-sessions", response_model=StudySessionResponse)
async def create_study_session(session: StudySessionCreate):
    """Start a new study session."""
    return StudySessionResponse(
        id="study_" + datetime.now().strftime("%Y%m%d%H%M%S"),
        learner_id=session.learner_id,
        assignment_id=session.assignment_id,
        start_time=session.start_time,
        end_time=None,
        planned_duration=session.planned_duration,
        actual_duration=None,
        technique=session.technique,
        pomodoro_settings=session.pomodoro_settings,
        intervals=None,
        distraction_count=None,
        focus_rating=None,
        energy_before=session.energy_before,
        energy_after=None,
        location=session.location,
        music_playing=None,
        noise_level=None,
        people_nearby=None,
        notes=None,
        accomplishments=[],
        blockers=[],
        next_steps=None,
        was_completed=False,
        ended_early=False,
        early_end_reason=None,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@router.get("/study-sessions/{session_id}", response_model=StudySessionResponse)
async def get_study_session(session_id: str):
    """Get a study session."""
    raise HTTPException(status_code=404, detail="Study session not found")


@router.get("/learners/{learner_id}/study-sessions", response_model=List[StudySessionResponse])
async def get_learner_study_sessions(
    learner_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(default=20, le=100),
):
    """Get study sessions for a learner."""
    return []


@router.put("/study-sessions/{session_id}", response_model=StudySessionResponse)
async def update_study_session(session_id: str, update: StudySessionUpdate):
    """Update/end a study session."""
    raise HTTPException(status_code=404, detail="Study session not found")


@router.post("/study-sessions/{session_id}/interval")
async def record_interval(session_id: str, interval: RecordIntervalRequest):
    """Record a study interval (Pomodoro work/break)."""
    duration = int((interval.end_time - interval.start_time).total_seconds() / 60)
    
    recorded = StudyInterval(
        id=f"int_{datetime.now().strftime('%H%M%S')}",
        start_time=interval.start_time,
        end_time=interval.end_time,
        interval_type=interval.interval_type,
        completed=interval.completed,
        duration_minutes=duration,
    )
    
    return {
        "session_id": session_id,
        "interval": recorded,
        "distraction_count": interval.distraction_count,
    }


@router.post("/study-sessions/{session_id}/end")
async def end_study_session(
    session_id: str,
    focus_rating: Optional[int] = None,
    energy_after: Optional[int] = None,
    notes: Optional[str] = None,
    ended_early: bool = False,
    early_end_reason: Optional[str] = None,
):
    """End a study session."""
    return {
        "session_id": session_id,
        "end_time": datetime.now(),
        "was_completed": not ended_early,
        "focus_rating": focus_rating,
        "energy_after": energy_after,
    }


# ==========================================
# REMINDER ENDPOINTS
# ==========================================

@router.get("/learners/{learner_id}/reminders", response_model=List[ReminderResponse])
async def get_pending_reminders(learner_id: str, include_sent: bool = False):
    """Get pending reminders for a learner."""
    return []


@router.post("/reminders", response_model=ReminderResponse)
async def create_reminder(reminder: ReminderCreate):
    """Create a custom reminder."""
    return ReminderResponse(
        id="rem_" + datetime.now().strftime("%Y%m%d%H%M%S"),
        learner_id=reminder.learner_id,
        assignment_id=reminder.assignment_id,
        reminder_type=reminder.reminder_type,
        scheduled_for=reminder.scheduled_for,
        sent_at=None,
        channel=reminder.channel,
        title=reminder.title,
        message=reminder.message,
        action_url=reminder.action_url,
        was_sent=False,
        was_acknowledged=False,
        acknowledged_at=None,
        was_delivered=None,
        delivery_error=None,
        is_recurring=reminder.is_recurring,
        next_occurrence=reminder.next_occurrence,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@router.post("/reminders/{reminder_id}/acknowledge")
async def acknowledge_reminder(reminder_id: str, ack: AcknowledgeReminderRequest):
    """Acknowledge a reminder."""
    return {
        "reminder_id": reminder_id,
        "was_acknowledged": True,
        "acknowledged_at": ack.acknowledged_at,
    }


@router.delete("/reminders/{reminder_id}")
async def delete_reminder(reminder_id: str):
    """Delete a reminder."""
    return {"status": "deleted", "reminder_id": reminder_id}


# ==========================================
# EF INTERVENTION ENDPOINTS
# ==========================================

@router.post("/interventions", response_model=EFInterventionResponse)
async def create_intervention(intervention: EFInterventionCreate):
    """Create an EF intervention/strategy."""
    return EFInterventionResponse(
        id="int_" + datetime.now().strftime("%Y%m%d%H%M%S"),
        learner_id=intervention.learner_id,
        domain=intervention.domain,
        strategy_name=intervention.strategy_name,
        description=intervention.description,
        how_to_implement=intervention.how_to_implement,
        materials=intervention.materials,
        frequency=intervention.frequency,
        start_date=datetime.now(),
        end_date=None,
        is_active=True,
        implemented_by=intervention.implemented_by,
        effectiveness_ratings=None,
        average_effectiveness=None,
        total_ratings=0,
        target_behavior=intervention.target_behavior,
        success_criteria=intervention.success_criteria,
        baseline_behavior=intervention.baseline_behavior,
        teacher_notes=None,
        parent_notes=None,
        learner_notes=None,
        evidence_basis=intervention.evidence_basis,
        source_url=intervention.source_url,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@router.get("/interventions/{intervention_id}", response_model=EFInterventionResponse)
async def get_intervention(intervention_id: str):
    """Get an intervention."""
    raise HTTPException(status_code=404, detail="Intervention not found")


@router.get("/learners/{learner_id}/interventions", response_model=List[EFInterventionResponse])
async def get_learner_interventions(
    learner_id: str,
    domain: Optional[EFDomain] = None,
    active_only: bool = True,
):
    """Get interventions for a learner."""
    return []


@router.put("/interventions/{intervention_id}", response_model=EFInterventionResponse)
async def update_intervention(intervention_id: str, update: EFInterventionUpdate):
    """Update an intervention."""
    raise HTTPException(status_code=404, detail="Intervention not found")


@router.post("/interventions/{intervention_id}/rate")
async def rate_intervention(intervention_id: str, rating: RateInterventionRequest):
    """Rate an intervention's effectiveness."""
    recorded = EffectivenessRating(
        date=datetime.now(),
        rating=rating.rating,
        notes=rating.notes,
        rated_by=rating.rated_by,
    )
    
    return {
        "intervention_id": intervention_id,
        "rating": recorded,
        "new_average": rating.rating,  # In production, calculate from all ratings
    }


@router.post("/ai/strategies", response_model=AIStrategiesResponse)
async def get_ai_strategies(request: AIStrategiesRequest):
    """Get AI-suggested strategies based on EF profile."""
    from services.adhd_ai import adhd_ai_service
    
    # Build EF profile dict from request
    ef_profile = {
        "strengths": request.strengths or [],
        "challenges": request.challenges or [],
        "organization_rating": request.organization_rating,
        "time_management_rating": request.time_management_rating,
        "planning_rating": request.planning_rating,
        "task_initiation_rating": request.task_initiation_rating,
        "working_memory_rating": request.working_memory_rating,
    }
    
    # Call AI service
    ai_result = await adhd_ai_service.suggest_ef_strategies(
        learner_id=request.learner_id,
        ef_profile=ef_profile,
        current_challenge=request.current_challenge,
        context=request.context,
    )
    
    # Convert AI suggestions to intervention objects
    suggestions = []
    for strategy in ai_result.get("strategies", []):
        domain_str = strategy.get("domain", "organization").upper()
        try:
            domain = EFDomain[domain_str]
        except KeyError:
            domain = EFDomain.ORGANIZATION
        
        suggestions.append(EFInterventionCreate(
            learner_id=request.learner_id,
            domain=domain,
            strategy_name=strategy.get("title", "Strategy"),
            description=strategy.get("description", ""),
            how_to_implement=strategy.get("description", ""),
            materials=strategy.get("tools_needed", []),
            frequency="as needed",
            implemented_by="SELF",
            evidence_basis=strategy.get("why_it_helps"),
        ))
    
    # Fall back to default suggestions if AI failed
    if not suggestions:
        suggestions = [
            EFInterventionCreate(
                learner_id=request.learner_id,
                domain=EFDomain.ORGANIZATION,
                strategy_name="Color-Coded Binder System",
                description="Use different colored folders/sections for each subject",
                how_to_implement="Assign one color per subject. Use matching colored folders, tabs, and supplies.",
                materials=["Colored folders", "Tab dividers", "Colored pens"],
                frequency="daily",
                implemented_by="SELF",
            ),
            EFInterventionCreate(
                learner_id=request.learner_id,
                domain=EFDomain.TASK_INITIATION,
                strategy_name="5-4-3-2-1 Launch",
                description="Count down from 5 and start the task when you reach 1",
                how_to_implement="When struggling to start, count 5-4-3-2-1 out loud and begin the task at 1.",
                materials=[],
                frequency="as needed",
                implemented_by="SELF",
            ),
        ]
    
    return AIStrategiesResponse(
        suggestions=suggestions,
        explanation=ai_result.get("explanation", "Based on the EF profile, here are recommended strategies."),
        priority_order=[s.domain.value for s in suggestions[:3]],
        encouragement=ai_result.get("encouragement", "Small steps lead to big changes!"),
    )


# ==========================================
# SELF-MONITORING ENDPOINTS
# ==========================================

@router.post("/self-monitoring", response_model=SelfMonitoringLogResponse)
async def log_self_monitoring(log: SelfMonitoringLogCreate):
    """Log a self-monitoring check."""
    return SelfMonitoringLogResponse(
        id="monitor_" + datetime.now().strftime("%Y%m%d%H%M%S"),
        learner_id=log.learner_id,
        date=log.date,
        time=log.time,
        timestamp=datetime.now(),
        check_type=log.check_type,
        prompt_type=log.prompt_type,
        was_on_task=log.was_on_task,
        on_task_percent=log.on_task_percent,
        activity=log.activity,
        actual_activity=log.actual_activity,
        location=log.location,
        subject=log.subject,
        had_materials=log.had_materials,
        understood_task=log.understood_task,
        needs_help=log.needs_help,
        emotion_rating=log.emotion_rating,
        notes=log.notes,
        teacher_note=None,
        action_taken=None,
        was_reviewed=False,
        created_at=datetime.now(),
    )


@router.get("/learners/{learner_id}/self-monitoring", response_model=List[SelfMonitoringLogResponse])
async def get_self_monitoring_logs(
    learner_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    check_type: Optional[str] = None,
):
    """Get self-monitoring logs for a learner."""
    return []


@router.get("/learners/{learner_id}/self-monitoring/summary", response_model=SelfMonitoringSummary)
async def get_self_monitoring_summary(
    learner_id: str,
    start_date: date,
    end_date: date,
):
    """Get summary of self-monitoring data."""
    return SelfMonitoringSummary(
        learner_id=learner_id,
        date_range_start=start_date,
        date_range_end=end_date,
        total_checks=0,
        on_task_percentage=0,
        by_check_type={},
        by_subject=None,
        by_time_of_day={},
        trends=[],
        recommendations=[],
    )


# ==========================================
# PARENT DASHBOARD ENDPOINT
# ==========================================

@router.get("/learners/{learner_id}/parent-dashboard", response_model=ParentDashboardResponse)
async def get_parent_dashboard(learner_id: str):
    """Get parent dashboard view for a learner."""
    return ParentDashboardResponse(
        learner_id=learner_id,
        learner_name="",  # In production, fetch from database
        upcoming_assignments=[],
        overdue_assignments=[],
        recently_completed=[],
        todays_plan=None,
        weekly_completion_rate=0,
        ef_profile_summary=None,
        active_interventions=[],
        alerts=[],
        recent_self_monitoring=None,
    )


# ==========================================
# URGENCY CALCULATION ENDPOINT
# ==========================================

@router.post("/calculate-urgency", response_model=UrgencyCalculationResponse)
async def calculate_assignment_urgency(request: UrgencyCalculationRequest):
    """Calculate urgency levels for multiple assignments."""
    # In production, fetch assignments and calculate
    return UrgencyCalculationResponse(
        calculations=[],
        critical_count=0,
        high_count=0,
        medium_count=0,
        low_count=0,
    )
