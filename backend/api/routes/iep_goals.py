"""
IEP Goal Management API Routes

Endpoints for managing IEP goals, data points, and notes.
Supports role-based access for teachers, parents, and therapists.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

from core.logging import setup_logging
from db.models.user import User
from api.dependencies.auth import get_current_user

logger = setup_logging(__name__)

router = APIRouter(prefix="/iep", tags=["IEP Goals"])


# ============================================================================
# Enums
# ============================================================================

class IEPGoalStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    ACHIEVED = "achieved"
    MODIFIED = "modified"
    DISCONTINUED = "discontinued"


class IEPCategory(str, Enum):
    ACADEMIC = "academic"
    BEHAVIORAL = "behavioral"
    SOCIAL_EMOTIONAL = "social_emotional"
    COMMUNICATION = "communication"
    MOTOR = "motor"
    SELF_CARE = "self_care"
    TRANSITION = "transition"


class IEPNoteType(str, Enum):
    OBSERVATION = "observation"
    STRATEGY = "strategy"
    CONCERN = "concern"
    CELEBRATION = "celebration"


class IEPMeasurementContext(str, Enum):
    CLASSROOM = "classroom"
    HOME = "home"
    THERAPY = "therapy"
    COMMUNITY = "community"
    ASSESSMENT = "assessment"
    OTHER = "other"


class UserRole(str, Enum):
    TEACHER = "TEACHER"
    PARENT = "PARENT"
    THERAPIST = "THERAPIST"


# ============================================================================
# Schemas
# ============================================================================

class IEPDataPointCreate(BaseModel):
    """Create a new data point for a goal"""
    value: float
    measurement_date: datetime = Field(default_factory=datetime.utcnow)
    context: IEPMeasurementContext = IEPMeasurementContext.CLASSROOM
    notes: Optional[str] = None
    evidence_url: Optional[str] = None


class IEPDataPointResponse(BaseModel):
    """Data point response"""
    id: str
    goal_id: str
    value: float
    measurement_date: datetime
    recorded_by_id: Optional[str] = None
    recorded_by_role: Optional[str] = None
    recorded_by_name: Optional[str] = None
    context: IEPMeasurementContext
    notes: Optional[str] = None
    evidence_url: Optional[str] = None
    created_at: datetime


class IEPNoteCreate(BaseModel):
    """Create a new note for a goal"""
    content: str
    note_type: IEPNoteType = IEPNoteType.OBSERVATION
    is_private: bool = False


class IEPNoteResponse(BaseModel):
    """Note response"""
    id: str
    goal_id: str
    author_id: str
    author_role: str
    author_name: Optional[str] = None
    content: str
    note_type: IEPNoteType
    is_private: bool
    created_at: datetime


class IEPGoalCreate(BaseModel):
    """Create a new IEP goal (teachers only)"""
    learner_id: str
    goal_name: str
    category: IEPCategory
    subject: Optional[str] = None
    description: str
    current_level: float
    target_level: float
    measurement_unit: str
    start_date: datetime
    target_date: datetime
    review_date: Optional[datetime] = None
    assigned_to_id: Optional[str] = None


class IEPGoalUpdate(BaseModel):
    """Update an IEP goal (teachers only)"""
    goal_name: Optional[str] = None
    description: Optional[str] = None
    current_level: Optional[float] = None
    target_level: Optional[float] = None
    measurement_unit: Optional[str] = None
    status: Optional[IEPGoalStatus] = None
    target_date: Optional[datetime] = None
    review_date: Optional[datetime] = None
    assigned_to_id: Optional[str] = None


class IEPGoalResponse(BaseModel):
    """IEP goal response"""
    id: str
    learner_id: str
    goal_name: str
    category: IEPCategory
    subject: Optional[str] = None
    description: str
    current_level: float
    target_level: float
    measurement_unit: str
    progress_percentage: float
    status: IEPGoalStatus
    start_date: datetime
    target_date: datetime
    review_date: Optional[datetime] = None
    created_by_id: Optional[str] = None
    created_by_name: Optional[str] = None
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    data_points: List[IEPDataPointResponse] = []
    notes: List[IEPNoteResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "id": "goal-123",
                "learner_id": "learner-456",
                "goal_name": "Reading Comprehension",
                "category": "academic",
                "subject": "ELA",
                "description": "Student will answer inferential questions with 80% accuracy",
                "current_level": 55.0,
                "target_level": 80.0,
                "measurement_unit": "accuracy %",
                "progress_percentage": 68.75,
                "status": "in_progress",
                "start_date": "2025-09-01T00:00:00Z",
                "target_date": "2026-03-01T00:00:00Z",
                "review_date": "2025-12-01T00:00:00Z"
            }
        }


class IEPGoalsListResponse(BaseModel):
    """List of IEP goals"""
    goals: List[IEPGoalResponse]
    total: int
    learner_id: str


# ============================================================================
# Database Integration
# ============================================================================

from db.repositories.iep_goals_repository import IEPGoalsRepository
from db.database import get_async_session


async def get_repository():
    """Dependency to get IEP Goals repository with session."""
    async with get_async_session() as session:
        yield IEPGoalsRepository(session)


# ============================================================================
# Helper Functions
# ============================================================================

def calculate_progress(current: float, target: float) -> float:
    """Calculate progress percentage"""
    if target <= 0:
        return 0.0
    progress = (current / target) * 100
    return min(max(progress, 0.0), 100.0)


def check_role_permission(role: str, action: str) -> bool:
    """Check if role has permission for action"""
    permissions = {
        "TEACHER": ["create_goal", "update_goal", "delete_goal", "add_data", "add_note", "view_private_notes"],
        "PARENT": ["add_data_home", "add_note", "view_goals"],
        "THERAPIST": ["add_data_therapy", "add_note", "view_goals", "view_private_notes"]
    }
    return action in permissions.get(role, [])


# ============================================================================
# Endpoints - Goals
# ============================================================================

@router.get("/learners/{learner_id}/goals", response_model=IEPGoalsListResponse)
async def get_learner_goals(
    learner_id: str,
    status: Optional[IEPGoalStatus] = None,
    category: Optional[IEPCategory] = None,
    repo: IEPGoalsRepository = Depends(get_repository),
):
    """
    Get all IEP goals for a learner.
    
    Accessible by teachers, parents, and therapists.
    Parents see public notes only.
    """
    logger.info(f"Fetching IEP goals for learner {learner_id}")
    
    # Query database
    status_str = status.value.upper() if status else None
    category_str = category.value.upper() if category else None
    
    goals = await repo.get_goals_by_learner(
        learner_id,
        status=status_str,
        category=category_str,
    )
    
    # Convert to response format
    goal_responses = []
    for g in goals:
        data_points = await repo.get_data_points(g["id"])
        goal_responses.append(IEPGoalResponse(
            id=g["id"],
            learner_id=g["learnerId"],
            goal_name=g["goal"],
            category=IEPCategory(g["category"].lower()) if g.get("category") else IEPCategory.ACADEMIC,
            description=g["goal"],
            current_level=g.get("progress") or 0,
            target_level=100.0,
            measurement_unit="percent",
            progress_percentage=g.get("progress") or 0,
            status=IEPGoalStatus(g["status"].lower()) if g.get("status") else IEPGoalStatus.NOT_STARTED,
            start_date=datetime.fromisoformat(g["createdAt"]) if g.get("createdAt") else datetime.utcnow(),
            target_date=datetime.fromisoformat(g["targetDate"]) if g.get("targetDate") else datetime.utcnow(),
            data_points=[],
            notes=[],
            created_at=datetime.fromisoformat(g["createdAt"]) if g.get("createdAt") else datetime.utcnow(),
            updated_at=datetime.fromisoformat(g["updatedAt"]) if g.get("updatedAt") else datetime.utcnow(),
        ))
    
    return IEPGoalsListResponse(
        goals=goal_responses,
        total=len(goal_responses),
        learner_id=learner_id
    )


@router.get("/goals/{goal_id}", response_model=IEPGoalResponse)
async def get_goal(
    goal_id: str,
    repo: IEPGoalsRepository = Depends(get_repository),
):
    """Get a single IEP goal by ID"""
    goal = await repo.get_goal(goal_id)
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    data_points = await repo.get_data_points(goal_id)
    
    return IEPGoalResponse(
        id=goal["id"],
        learner_id=goal["learnerId"],
        goal_name=goal["goal"],
        category=IEPCategory(goal["category"].lower()) if goal.get("category") else IEPCategory.ACADEMIC,
        description=goal["goal"],
        current_level=goal.get("progress") or 0,
        target_level=100.0,
        measurement_unit="percent",
        progress_percentage=goal.get("progress") or 0,
        status=IEPGoalStatus(goal["status"].lower()) if goal.get("status") else IEPGoalStatus.NOT_STARTED,
        start_date=datetime.fromisoformat(goal["createdAt"]) if goal.get("createdAt") else datetime.utcnow(),
        target_date=datetime.fromisoformat(goal["targetDate"]) if goal.get("targetDate") else datetime.utcnow(),
        data_points=[],
        notes=[],
        created_at=datetime.fromisoformat(goal["createdAt"]) if goal.get("createdAt") else datetime.utcnow(),
        updated_at=datetime.fromisoformat(goal["updatedAt"]) if goal.get("updatedAt") else datetime.utcnow(),
    )


@router.post("/goals", response_model=IEPGoalResponse)
async def create_goal(
    goal: IEPGoalCreate,
    repo: IEPGoalsRepository = Depends(get_repository),
):
    """
    Create a new IEP goal.
    
    Teachers only.
    """
    logger.info(f"Creating IEP goal for learner {goal.learner_id}: {goal.goal_name}")
    
    created = await repo.create_goal(
        learner_id=goal.learner_id,
        goal=goal.description,
        category=goal.category.value.upper(),
        target_date=goal.target_date,
        status="NOT_STARTED",
        progress=goal.current_level,
    )
    
    return IEPGoalResponse(
        id=created["id"],
        learner_id=created["learnerId"],
        goal_name=goal.goal_name,
        category=goal.category,
        description=created["goal"],
        current_level=created.get("progress") or 0,
        target_level=goal.target_level,
        measurement_unit=goal.measurement_unit,
        progress_percentage=calculate_progress(goal.current_level, goal.target_level),
        status=IEPGoalStatus.NOT_STARTED,
        start_date=goal.start_date,
        target_date=goal.target_date,
        review_date=goal.review_date,
        data_points=[],
        notes=[],
        created_at=datetime.fromisoformat(created["createdAt"]) if created.get("createdAt") else datetime.utcnow(),
        updated_at=datetime.fromisoformat(created["updatedAt"]) if created.get("updatedAt") else datetime.utcnow(),
    )


@router.put("/goals/{goal_id}", response_model=IEPGoalResponse)
async def update_goal(
    goal_id: str,
    updates: IEPGoalUpdate,
    repo: IEPGoalsRepository = Depends(get_repository),
):
    """
    Update an IEP goal.
    
    Teachers only.
    """
    existing = await repo.get_goal(goal_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Build update dict
    update_dict = {}
    if updates.goal_name:
        update_dict["goal"] = updates.goal_name
    if updates.description:
        update_dict["goal"] = updates.description
    if updates.status:
        update_dict["status"] = updates.status.value.upper()
    if updates.current_level is not None:
        update_dict["progress"] = updates.current_level
    if updates.target_date:
        update_dict["target_date"] = updates.target_date
    
    updated = await repo.update_goal(goal_id, update_dict)
    
    logger.info(f"Updated IEP goal {goal_id}")
    
    return IEPGoalResponse(
        id=updated["id"],
        learner_id=updated["learnerId"],
        goal_name=updated["goal"],
        category=IEPCategory(existing["category"].lower()) if existing.get("category") else IEPCategory.ACADEMIC,
        description=updated["goal"],
        current_level=updated.get("progress") or 0,
        target_level=updates.target_level or 100.0,
        measurement_unit=updates.measurement_unit or "percent",
        progress_percentage=updated.get("progress") or 0,
        status=IEPGoalStatus(updated["status"].lower()) if updated.get("status") else IEPGoalStatus.NOT_STARTED,
        start_date=datetime.fromisoformat(updated["createdAt"]) if updated.get("createdAt") else datetime.utcnow(),
        target_date=datetime.fromisoformat(updated["targetDate"]) if updated.get("targetDate") else datetime.utcnow(),
        data_points=[],
        notes=[],
        created_at=datetime.fromisoformat(updated["createdAt"]) if updated.get("createdAt") else datetime.utcnow(),
        updated_at=datetime.fromisoformat(updated["updatedAt"]) if updated.get("updatedAt") else datetime.utcnow(),
    )


# ============================================================================
# Endpoints - Data Points
# ============================================================================

@router.get("/goals/{goal_id}/data-points", response_model=List[IEPDataPointResponse])
async def get_data_points(
    goal_id: str,
    repo: IEPGoalsRepository = Depends(get_repository),
):
    """Get all data points for a goal"""
    data_points = await repo.get_data_points(goal_id)
    return [IEPDataPointResponse(
        id=dp.get("id", ""),
        goal_id=goal_id,
        value=dp.get("value", 0),
        measurement_date=datetime.fromisoformat(dp["measurement_date"]) if dp.get("measurement_date") else datetime.utcnow(),
        context=IEPMeasurementContext(dp.get("context", "classroom")),
        notes=dp.get("notes"),
        created_at=datetime.fromisoformat(dp["created_at"]) if dp.get("created_at") else datetime.utcnow(),
    ) for dp in data_points]


@router.post("/goals/{goal_id}/data-points", response_model=IEPDataPointResponse)
async def add_data_point(
    goal_id: str,
    data_point: IEPDataPointCreate,
    repo: IEPGoalsRepository = Depends(get_repository),
    current_user: User = Depends(get_current_user),
):
    """
    Add a data point to a goal.
    
    Teachers: Any context
    Parents: Home context only
    Therapists: Therapy context only
    """
    logger.info(f"Adding data point to goal {goal_id}: {data_point.value}")
    
    # Check role permissions for context
    user_role = getattr(current_user, 'role', 'parent').lower()
    context = data_point.context.value
    
    # Define context permissions by role
    role_contexts = {
        'teacher': ['classroom', 'assessment', 'home', 'therapy', 'community', 'other'],
        'admin': ['classroom', 'assessment', 'home', 'therapy', 'community', 'other'],
        'platform_admin': ['classroom', 'assessment', 'home', 'therapy', 'community', 'other'],
        'parent': ['home', 'community', 'other'],
        'therapist': ['therapy', 'other'],
        'slp': ['therapy', 'classroom', 'other'],
    }
    
    allowed_contexts = role_contexts.get(user_role, ['home', 'other'])
    
    if context not in allowed_contexts:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your role ({user_role}) cannot add data for context: {context}"
        )
    
    dp = await repo.add_data_point(
        goal_id=goal_id,
        value=data_point.value,
        measurement_date=data_point.measurement_date,
        context=data_point.context.value,
        notes=data_point.notes,
    )
    
    return IEPDataPointResponse(
        id=dp.get("id", ""),
        goal_id=goal_id,
        value=dp.get("value", 0),
        measurement_date=datetime.fromisoformat(dp["measurement_date"]) if dp.get("measurement_date") else datetime.utcnow(),
        context=data_point.context,
        notes=dp.get("notes"),
        evidence_url=data_point.evidence_url,
        created_at=datetime.fromisoformat(dp["created_at"]) if dp.get("created_at") else datetime.utcnow(),
    )


# ============================================================================
# Endpoints - Notes
# ============================================================================

@router.get("/goals/{goal_id}/notes", response_model=List[IEPNoteResponse])
async def get_notes(
    goal_id: str,
    include_private: bool = Query(default=False, description="Include private notes (educators only)"),
    current_user: User = Depends(get_current_user),
):
    """Get all notes for a goal"""
    notes = [n for n in _notes_store.values() if n.get("goal_id") == goal_id]
    
    # Filter private notes based on user role
    # Only educators (teachers, admins, therapists) can see private notes
    user_role = getattr(current_user, 'role', 'parent').lower()
    educator_roles = {'teacher', 'admin', 'platform_admin', 'therapist', 'slp', 'educator'}
    
    can_see_private = include_private and user_role in educator_roles
    
    if not can_see_private:
        notes = [n for n in notes if not n.get("is_private", False)]
    
    return [_note_to_response(n) for n in notes]


@router.post("/goals/{goal_id}/notes", response_model=IEPNoteResponse)
async def add_note(goal_id: str, note: IEPNoteCreate):
    """
    Add a note to a goal.
    
    All roles can add notes.
    Only teachers can mark notes as private.
    """
    logger.info(f"Adding note to goal {goal_id}: {note.note_type.value}")
    
    note_id = f"note-{datetime.utcnow().timestamp()}"
    
    note_data = {
        "id": note_id,
        "goal_id": goal_id,
        "author_id": "current-user",  # TODO: Get from auth
        "author_role": "PARENT",  # TODO: Get from auth
        "author_name": "User Name",
        "content": note.content,
        "note_type": note.note_type.value,
        "is_private": note.is_private,
        "created_at": datetime.utcnow().isoformat()
    }
    
    _notes_store[note_id] = note_data
    
    # Add to goal's notes list
    if goal_id in _goals_store:
        _goals_store[goal_id]["notes"].append(note_data)
    
    return _note_to_response(note_data)


# ============================================================================
# Endpoints - Analytics
# ============================================================================

@router.get("/learners/{learner_id}/summary")
async def get_iep_summary(learner_id: str):
    """Get IEP progress summary for a learner"""
    goals = [g for g in _goals_store.values() if g.get("learner_id") == learner_id]
    
    if not goals:
        goals = _generate_mock_goals(learner_id)
    
    total = len(goals)
    achieved = sum(1 for g in goals if g.get("status") == "achieved")
    in_progress = sum(1 for g in goals if g.get("status") == "in_progress")
    
    # Calculate average progress
    avg_progress = sum(g.get("progress_percentage", 0) for g in goals) / total if total > 0 else 0
    
    # Count goals needing attention
    needs_attention = sum(1 for g in goals if _goal_needs_attention(g))
    
    return {
        "learner_id": learner_id,
        "total_goals": total,
        "achieved": achieved,
        "in_progress": in_progress,
        "not_started": sum(1 for g in goals if g.get("status") == "not_started"),
        "needs_attention": needs_attention,
        "average_progress": round(avg_progress, 1),
        "by_category": _count_by_category(goals),
        "generated_at": datetime.utcnow().isoformat()
    }


# ============================================================================
# Health Check
# ============================================================================

@router.get("/health")
async def iep_health():
    """Health check for IEP service"""
    return {
        "status": "healthy",
        "service": "iep_goals",
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# Helper Functions
# ============================================================================

def _goal_to_response(goal: dict) -> IEPGoalResponse:
    """Convert goal dict to response model"""
    return IEPGoalResponse(
        id=goal["id"],
        learner_id=goal["learner_id"],
        goal_name=goal["goal_name"],
        category=IEPCategory(goal["category"]),
        subject=goal.get("subject"),
        description=goal["description"],
        current_level=goal["current_level"],
        target_level=goal["target_level"],
        measurement_unit=goal["measurement_unit"],
        progress_percentage=goal.get("progress_percentage", 0),
        status=IEPGoalStatus(goal.get("status", "not_started")),
        start_date=datetime.fromisoformat(goal["start_date"]) if isinstance(goal["start_date"], str) else goal["start_date"],
        target_date=datetime.fromisoformat(goal["target_date"]) if isinstance(goal["target_date"], str) else goal["target_date"],
        review_date=datetime.fromisoformat(goal["review_date"]) if goal.get("review_date") and isinstance(goal["review_date"], str) else goal.get("review_date"),
        created_by_id=goal.get("created_by_id"),
        created_by_name=goal.get("created_by_name"),
        assigned_to_id=goal.get("assigned_to_id"),
        assigned_to_name=goal.get("assigned_to_name"),
        data_points=[_data_point_to_response(dp) for dp in goal.get("data_points", [])],
        notes=[_note_to_response(n) for n in goal.get("notes", [])],
        created_at=datetime.fromisoformat(goal["created_at"]) if isinstance(goal["created_at"], str) else goal["created_at"],
        updated_at=datetime.fromisoformat(goal["updated_at"]) if isinstance(goal["updated_at"], str) else goal["updated_at"]
    )


def _data_point_to_response(dp: dict) -> IEPDataPointResponse:
    """Convert data point dict to response model"""
    return IEPDataPointResponse(
        id=dp["id"],
        goal_id=dp["goal_id"],
        value=dp["value"],
        measurement_date=datetime.fromisoformat(dp["measurement_date"]) if isinstance(dp["measurement_date"], str) else dp["measurement_date"],
        recorded_by_id=dp.get("recorded_by_id"),
        recorded_by_role=dp.get("recorded_by_role"),
        recorded_by_name=dp.get("recorded_by_name"),
        context=IEPMeasurementContext(dp.get("context", "classroom")),
        notes=dp.get("notes"),
        evidence_url=dp.get("evidence_url"),
        created_at=datetime.fromisoformat(dp["created_at"]) if isinstance(dp["created_at"], str) else dp["created_at"]
    )


def _note_to_response(note: dict) -> IEPNoteResponse:
    """Convert note dict to response model"""
    return IEPNoteResponse(
        id=note["id"],
        goal_id=note["goal_id"],
        author_id=note["author_id"],
        author_role=note["author_role"],
        author_name=note.get("author_name"),
        content=note["content"],
        note_type=IEPNoteType(note.get("note_type", "observation")),
        is_private=note.get("is_private", False),
        created_at=datetime.fromisoformat(note["created_at"]) if isinstance(note["created_at"], str) else note["created_at"]
    )


def _goal_needs_attention(goal: dict) -> bool:
    """Check if goal needs attention (behind schedule)"""
    progress = goal.get("progress_percentage", 0)
    
    start = datetime.fromisoformat(goal["start_date"]) if isinstance(goal["start_date"], str) else goal["start_date"]
    target = datetime.fromisoformat(goal["target_date"]) if isinstance(goal["target_date"], str) else goal["target_date"]
    now = datetime.utcnow()
    
    total_days = (target - start).days
    elapsed_days = (now - start).days
    
    if total_days <= 0:
        return False
    
    time_progress = (elapsed_days / total_days) * 100
    
    # Needs attention if less than 50% progress when more than 50% time passed
    return progress < 50 and time_progress > 50


def _count_by_category(goals: list) -> dict:
    """Count goals by category"""
    counts = {}
    for goal in goals:
        cat = goal.get("category", "academic")
        counts[cat] = counts.get(cat, 0) + 1
    return counts


def _generate_mock_goals(learner_id: str) -> list:
    """Generate mock goals for demo"""
    now = datetime.utcnow()
    
    return [
        {
            "id": "goal-1",
            "learner_id": learner_id,
            "goal_name": "Reading Comprehension",
            "category": "academic",
            "subject": "ELA",
            "description": "Student will answer inferential questions about grade-level text with 80% accuracy.",
            "current_level": 55,
            "target_level": 80,
            "measurement_unit": "accuracy %",
            "progress_percentage": 68.75,
            "status": "in_progress",
            "start_date": (now - timedelta(days=60)).isoformat(),
            "target_date": (now + timedelta(days=120)).isoformat(),
            "review_date": (now + timedelta(days=10)).isoformat(),
            "created_by_id": "teacher-1",
            "created_by_name": "Ms. Johnson",
            "data_points": [],
            "notes": [],
            "created_at": (now - timedelta(days=60)).isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "id": "goal-2",
            "learner_id": learner_id,
            "goal_name": "Math Problem Solving",
            "category": "academic",
            "subject": "Math",
            "description": "Student will solve multi-step word problems using appropriate strategies with 75% accuracy.",
            "current_level": 70,
            "target_level": 75,
            "measurement_unit": "accuracy %",
            "progress_percentage": 93.33,
            "status": "in_progress",
            "start_date": (now - timedelta(days=90)).isoformat(),
            "target_date": (now + timedelta(days=30)).isoformat(),
            "data_points": [],
            "notes": [],
            "created_at": (now - timedelta(days=90)).isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "id": "goal-3",
            "learner_id": learner_id,
            "goal_name": "Turn-Taking in Conversation",
            "category": "social_emotional",
            "description": "Student will wait for their turn and respond appropriately in 4 out of 5 peer conversations.",
            "current_level": 3.2,
            "target_level": 4,
            "measurement_unit": "out of 5",
            "progress_percentage": 80,
            "status": "in_progress",
            "start_date": (now - timedelta(days=45)).isoformat(),
            "target_date": (now + timedelta(days=90)).isoformat(),
            "data_points": [],
            "notes": [],
            "created_at": (now - timedelta(days=45)).isoformat(),
            "updated_at": now.isoformat()
        }
    ]


# Import timedelta for mock data
from datetime import timedelta
