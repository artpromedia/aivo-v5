"""
Agent Manager - Manages Virtual Brain Instances
Author: artpromedia
Date: 2025-11-23
"""

from typing import Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from agents.virtual_brain.core import VirtualBrain
from db.models.learner import Learner
from core.logging import setup_logging

logger = setup_logging(__name__)


class AgentManager:
    """
    Manages Virtual Brain agent instances for all learners
    """
    
    def __init__(self):
        self.virtual_brains: Dict[str, VirtualBrain] = {}
        logger.info("Agent Manager initialized")
    
    async def get_or_create_virtual_brain(
        self,
        learner_id: str,
        db: Optional[AsyncSession] = None
    ) -> VirtualBrain:
        """
        Get existing Virtual Brain or create new one for learner
        """
        # Check if already exists in memory
        if learner_id in self.virtual_brains:
            return self.virtual_brains[learner_id]
        
        # Create new Virtual Brain
        virtual_brain = VirtualBrain(learner_id)
        
        # Initialize with learner data if db session provided
        if db:
            result = await db.execute(
                select(Learner).where(Learner.id == learner_id)
            )
            learner = result.scalar_one_or_none()
            
            if learner:
                learner_data = learner.to_dict()
                await virtual_brain.initialize(learner_data)
        
        # Store in memory
        self.virtual_brains[learner_id] = virtual_brain
        
        logger.info(f"Virtual Brain created for learner {learner_id}")
        
        return virtual_brain
    
    async def get_virtual_brain(self, learner_id: str) -> Optional[VirtualBrain]:
        """
        Get existing Virtual Brain instance
        """
        return self.virtual_brains.get(learner_id)
    
    async def remove_virtual_brain(self, learner_id: str):
        """
        Remove Virtual Brain from memory (e.g., after session ends)
        """
        if learner_id in self.virtual_brains:
            # End session before removing
            await self.virtual_brains[learner_id].end_session()
            del self.virtual_brains[learner_id]
            logger.info(f"Virtual Brain removed for learner {learner_id}")
    
    async def get_all_active_brains(self) -> Dict[str, VirtualBrain]:
        """
        Get all active Virtual Brain instances
        """
        return self.virtual_brains.copy()
    
    async def cleanup_inactive_brains(self, inactive_minutes: int = 60):
        """
        Remove Virtual Brains that have been inactive
        """
        from datetime import datetime, timedelta
        
        cutoff_time = datetime.utcnow() - timedelta(minutes=inactive_minutes)
        inactive_learners = []
        
        for learner_id, brain in self.virtual_brains.items():
            last_activity = brain.current_session.get("start_time")
            if last_activity and last_activity < cutoff_time:
                inactive_learners.append(learner_id)
        
        for learner_id in inactive_learners:
            await self.remove_virtual_brain(learner_id)
        
        if inactive_learners:
            logger.info(
                f"Cleaned up {len(inactive_learners)} inactive Virtual Brains"
            )


# Global agent manager instance
agent_manager = AgentManager()
