"""
API Routes Module
"""

from api.routes.agents import router as agents_router
from api.routes.focus_analytics import router as focus_analytics_router
from api.routes.iep_goals import router as iep_goals_router
from api.routes.aac import router as aac_router
from api.routes.iep_upload import router as iep_upload_router
from api.routes.adhd import router as adhd_router
from api.routes.autism import router as autism_router

# SLP Routes
from api.routes.slp import (
    profiles_router as slp_profiles_router,
    articulation_router as slp_articulation_router,
    fluency_router as slp_fluency_router,
    language_router as slp_language_router,
    pragmatic_router as slp_pragmatic_router,
    voice_router as slp_voice_router,
    sessions_router as slp_sessions_router,
    goals_router as slp_goals_router,
    homework_router as slp_homework_router,
)

__all__ = [
    "agents_router",
    "focus_analytics_router",
    "iep_goals_router",
    "iep_upload_router",
    "aac_router",
    "adhd_router",
    "autism_router",
    # SLP
    "slp_profiles_router",
    "slp_articulation_router",
    "slp_fluency_router",
    "slp_language_router",
    "slp_pragmatic_router",
    "slp_voice_router",
    "slp_sessions_router",
    "slp_goals_router",
    "slp_homework_router",
]
