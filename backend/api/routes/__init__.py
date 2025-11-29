"""
API Routes Module
"""

from api.routes.agents import router as agents_router
from api.routes.focus_analytics import router as focus_analytics_router
from api.routes.iep_goals import router as iep_goals_router
from api.routes.aac import router as aac_router

__all__ = ["agents_router", "focus_analytics_router", "iep_goals_router", "aac_router"]
