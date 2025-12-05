"""
IEP Goals Repository
Database operations for IEP goals, data points, and notes.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy import select, update, delete, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)


class IEPGoalsRepository:
    """
    Repository for IEP Goals database operations.
    Works with SQLAlchemy async sessions.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    # ==========================================
    # GOAL OPERATIONS
    # ==========================================
    
    async def get_goals_by_learner(
        self,
        learner_id: str,
        status: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Get all IEP goals for a learner."""
        from db.models import IEPGoal
        
        query = select(IEPGoal).where(IEPGoal.learner_id == learner_id)
        
        if status:
            query = query.where(IEPGoal.status == status)
        if category:
            query = query.where(IEPGoal.category == category)
        
        query = query.order_by(IEPGoal.created_at.desc())
        query = query.limit(limit).offset(offset)
        
        result = await self.session.execute(query)
        goals = result.scalars().all()
        
        return [self._goal_to_dict(goal) for goal in goals]
    
    async def get_goal(self, goal_id: str) -> Optional[Dict[str, Any]]:
        """Get a single IEP goal by ID."""
        from db.models import IEPGoal
        
        result = await self.session.execute(
            select(IEPGoal).where(IEPGoal.id == goal_id)
        )
        goal = result.scalar_one_or_none()
        return self._goal_to_dict(goal) if goal else None
    
    async def create_goal(
        self,
        learner_id: str,
        goal: str,
        category: str,
        target_date: datetime,
        status: str = "NOT_STARTED",
        progress: float = 0.0,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a new IEP goal."""
        from db.models import IEPGoal
        
        new_goal = IEPGoal(
            learner_id=learner_id,
            goal=goal,
            category=category,
            target_date=target_date,
            status=status,
            progress=progress,
            notes=notes,
        )
        
        self.session.add(new_goal)
        await self.session.commit()
        await self.session.refresh(new_goal)
        
        return self._goal_to_dict(new_goal)
    
    async def update_goal(
        self,
        goal_id: str,
        updates: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """Update an IEP goal."""
        from db.models import IEPGoal
        
        # Filter out None values
        updates = {k: v for k, v in updates.items() if v is not None}
        
        if not updates:
            return await self.get_goal(goal_id)
        
        await self.session.execute(
            update(IEPGoal)
            .where(IEPGoal.id == goal_id)
            .values(**updates)
        )
        await self.session.commit()
        
        return await self.get_goal(goal_id)
    
    async def delete_goal(self, goal_id: str) -> bool:
        """Delete an IEP goal."""
        from db.models import IEPGoal
        
        await self.session.execute(
            delete(IEPGoal).where(IEPGoal.id == goal_id)
        )
        await self.session.commit()
        return True
    
    async def get_goals_count_by_learner(self, learner_id: str) -> int:
        """Get total count of goals for a learner."""
        from db.models import IEPGoal
        from sqlalchemy import func
        
        result = await self.session.execute(
            select(func.count(IEPGoal.id)).where(IEPGoal.learner_id == learner_id)
        )
        return result.scalar() or 0
    
    async def get_goals_summary_by_status(
        self,
        learner_id: str
    ) -> Dict[str, int]:
        """Get count of goals grouped by status."""
        from db.models import IEPGoal
        from sqlalchemy import func
        
        result = await self.session.execute(
            select(IEPGoal.status, func.count(IEPGoal.id))
            .where(IEPGoal.learner_id == learner_id)
            .group_by(IEPGoal.status)
        )
        
        summary = {}
        for status, count in result:
            summary[status] = count
        
        return summary
    
    # ==========================================
    # DATA POINT OPERATIONS (using JSON in notes for simplicity)
    # ==========================================
    
    async def add_data_point(
        self,
        goal_id: str,
        value: float,
        measurement_date: datetime,
        context: str = "classroom",
        recorded_by_id: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Add a data point to a goal's progress tracking."""
        import json
        from db.models import IEPGoal
        
        goal = await self.get_goal(goal_id)
        if not goal:
            raise ValueError(f"Goal {goal_id} not found")
        
        # Get existing data points from notes (stored as JSON)
        existing_notes = goal.get("notes") or ""
        try:
            goal_data = json.loads(existing_notes) if existing_notes.startswith("{") else {"notes": existing_notes, "data_points": []}
        except json.JSONDecodeError:
            goal_data = {"notes": existing_notes, "data_points": []}
        
        # Add new data point
        data_point = {
            "id": f"dp_{datetime.utcnow().timestamp()}",
            "value": value,
            "measurement_date": measurement_date.isoformat(),
            "context": context,
            "recorded_by_id": recorded_by_id,
            "notes": notes,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        goal_data.setdefault("data_points", []).append(data_point)
        
        # Update goal's progress with latest value
        await self.update_goal(goal_id, {
            "progress": value,
            "notes": json.dumps(goal_data),
        })
        
        return data_point
    
    async def get_data_points(self, goal_id: str) -> List[Dict[str, Any]]:
        """Get all data points for a goal."""
        import json
        
        goal = await self.get_goal(goal_id)
        if not goal:
            return []
        
        notes = goal.get("notes") or ""
        try:
            goal_data = json.loads(notes) if notes.startswith("{") else {}
        except json.JSONDecodeError:
            goal_data = {}
        
        return goal_data.get("data_points", [])
    
    # ==========================================
    # HELPER METHODS
    # ==========================================
    
    def _goal_to_dict(self, goal) -> Dict[str, Any]:
        """Convert IEPGoal model to dictionary."""
        if not goal:
            return None
        
        return {
            "id": goal.id,
            "learnerId": goal.learner_id,
            "goal": goal.goal,
            "category": goal.category,
            "targetDate": goal.target_date.isoformat() if goal.target_date else None,
            "status": goal.status,
            "progress": goal.progress,
            "notes": goal.notes,
            "createdAt": goal.created_at.isoformat() if goal.created_at else None,
            "updatedAt": goal.updated_at.isoformat() if goal.updated_at else None,
        }
