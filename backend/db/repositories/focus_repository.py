"""
Focus Analytics Repository
Database operations for focus data and game sessions.
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)


class FocusAnalyticsRepository:
    """
    Repository for focus analytics database operations.
    Works with SQLAlchemy async sessions.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    # ==========================================
    # FOCUS DATA OPERATIONS
    # ==========================================
    
    async def save_focus_metrics(
        self,
        learner_id: str,
        session_id: Optional[str],
        focus_score: float,
        distractions: int,
        metrics: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Save focus metrics for a session."""
        from db.models import FocusData
        
        data = FocusData(
            learner_id=learner_id,
            session_id=session_id,
            focus_score=focus_score,
            distractions=distractions,
            timestamp=datetime.utcnow(),
            metrics=metrics,
        )
        
        self.session.add(data)
        await self.session.commit()
        await self.session.refresh(data)
        
        return {
            "id": data.id,
            "learnerId": data.learner_id,
            "sessionId": data.session_id,
            "focusScore": data.focus_score,
            "distractions": data.distractions,
            "timestamp": data.timestamp.isoformat(),
            "metrics": data.metrics,
        }
    
    async def get_focus_history(
        self,
        learner_id: str,
        days: int = 30,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get focus data history for a learner."""
        from db.models import FocusData
        
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        result = await self.session.execute(
            select(FocusData)
            .where(and_(
                FocusData.learner_id == learner_id,
                FocusData.timestamp >= cutoff
            ))
            .order_by(FocusData.timestamp.desc())
            .limit(limit)
        )
        
        rows = result.scalars().all()
        
        return [{
            "id": r.id,
            "focusScore": r.focus_score,
            "distractions": r.distractions,
            "timestamp": r.timestamp.isoformat(),
            "metrics": r.metrics,
        } for r in rows]
    
    async def get_focus_aggregates(
        self,
        learner_id: str,
        days: int = 30,
    ) -> Dict[str, Any]:
        """Get aggregated focus statistics for a learner."""
        from db.models import FocusData
        
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        result = await self.session.execute(
            select(
                func.avg(FocusData.focus_score).label("avg_score"),
                func.min(FocusData.focus_score).label("min_score"),
                func.max(FocusData.focus_score).label("max_score"),
                func.sum(FocusData.distractions).label("total_distractions"),
                func.count(FocusData.id).label("session_count"),
            )
            .where(and_(
                FocusData.learner_id == learner_id,
                FocusData.timestamp >= cutoff
            ))
        )
        
        row = result.one_or_none()
        
        if not row or row.session_count == 0:
            return {
                "averageScore": 0,
                "minScore": 0,
                "maxScore": 0,
                "totalDistractions": 0,
                "sessionCount": 0,
                "days": days,
            }
        
        return {
            "averageScore": float(row.avg_score) if row.avg_score else 0,
            "minScore": float(row.min_score) if row.min_score else 0,
            "maxScore": float(row.max_score) if row.max_score else 0,
            "totalDistractions": int(row.total_distractions) if row.total_distractions else 0,
            "sessionCount": int(row.session_count),
            "days": days,
        }
    
    # ==========================================
    # GAME SESSION OPERATIONS
    # ==========================================
    
    async def save_game_session(
        self,
        learner_id: str,
        game_type: str,
        duration: int,
        completed: bool,
        score: Optional[int] = None,
        subject: Optional[str] = None,
        difficulty: int = 1,
        triggered_by: str = "focus_break",
    ) -> Dict[str, Any]:
        """Save a completed focus break game session."""
        from db.models import GameSession
        
        session = GameSession(
            learner_id=learner_id,
            game_type=game_type,
            subject=subject,
            difficulty=difficulty,
            duration=duration,
            score=score,
            completed=completed,
            triggered_by=triggered_by,
            returned_to_learning=True,
        )
        
        self.session.add(session)
        await self.session.commit()
        await self.session.refresh(session)
        
        return {
            "id": session.id,
            "learnerId": session.learner_id,
            "gameType": session.game_type,
            "duration": session.duration,
            "score": session.score,
            "completed": session.completed,
            "createdAt": session.created_at.isoformat(),
        }
    
    async def get_game_history(
        self,
        learner_id: str,
        days: int = 30,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Get game session history for a learner."""
        from db.models import GameSession
        
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        result = await self.session.execute(
            select(GameSession)
            .where(and_(
                GameSession.learner_id == learner_id,
                GameSession.created_at >= cutoff
            ))
            .order_by(GameSession.created_at.desc())
            .limit(limit)
        )
        
        rows = result.scalars().all()
        
        return [{
            "id": r.id,
            "gameType": r.game_type,
            "duration": r.duration,
            "score": r.score,
            "completed": r.completed,
            "createdAt": r.created_at.isoformat(),
        } for r in rows]
    
    async def get_preferred_break_types(
        self,
        learner_id: str,
        days: int = 30,
    ) -> List[str]:
        """Get preferred break game types based on completion rates."""
        from db.models import GameSession
        
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        # Get completion rates by game type
        result = await self.session.execute(
            select(
                GameSession.game_type,
                func.count(GameSession.id).label("total"),
                func.sum(
                    func.case((GameSession.completed == True, 1), else_=0)
                ).label("completed_count"),
            )
            .where(and_(
                GameSession.learner_id == learner_id,
                GameSession.created_at >= cutoff,
                GameSession.triggered_by == "focus_break",
            ))
            .group_by(GameSession.game_type)
        )
        
        rows = result.all()
        
        if not rows:
            return ["movement", "breathing"]  # Defaults
        
        # Calculate completion rates and sort
        rates = []
        for row in rows:
            if row.total > 0:
                rate = (row.completed_count or 0) / row.total
                rates.append((row.game_type, rate, row.total))
        
        # Sort by completion rate, then by count
        rates.sort(key=lambda x: (x[1], x[2]), reverse=True)
        
        return [r[0] for r in rates[:3]] or ["movement", "breathing"]
    
    async def get_optimal_session_length(
        self,
        learner_id: str,
        days: int = 30,
    ) -> int:
        """Estimate optimal session length based on focus patterns."""
        from db.models import FocusData
        
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        # Get sessions with high focus scores
        result = await self.session.execute(
            select(FocusData.metrics)
            .where(and_(
                FocusData.learner_id == learner_id,
                FocusData.timestamp >= cutoff,
                FocusData.focus_score >= 70,  # Good focus sessions
            ))
        )
        
        rows = result.scalars().all()
        
        if not rows:
            return 20  # Default 20 minutes
        
        # Extract session lengths from metrics
        lengths = []
        for metrics in rows:
            if isinstance(metrics, dict):
                session_mins = metrics.get("active_minutes") or metrics.get("total_session_minutes")
                if session_mins and 5 <= session_mins <= 60:
                    lengths.append(session_mins)
        
        if not lengths:
            return 20
        
        # Return median session length
        lengths.sort()
        mid = len(lengths) // 2
        return int(lengths[mid])
