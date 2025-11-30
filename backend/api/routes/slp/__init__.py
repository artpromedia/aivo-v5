"""
Speech-Language Pathology (SLP) API Routes Module
Author: artpromedia
Date: 2025-01-14

Provides endpoints for:
- SLP Profiles
- Articulation Therapy
- Fluency Therapy
- Receptive Language
- Expressive Language
- Pragmatic Language
- Voice Therapy
- SLP Sessions
- SLP Goals
- Parent Speech Homework
"""

from api.routes.slp.profiles import router as profiles_router
from api.routes.slp.articulation import router as articulation_router
from api.routes.slp.fluency import router as fluency_router
from api.routes.slp.language import router as language_router
from api.routes.slp.pragmatic import router as pragmatic_router
from api.routes.slp.voice import router as voice_router
from api.routes.slp.sessions import router as sessions_router
from api.routes.slp.goals import router as goals_router
from api.routes.slp.homework import router as homework_router

__all__ = [
    "profiles_router",
    "articulation_router",
    "fluency_router",
    "language_router",
    "pragmatic_router",
    "voice_router",
    "sessions_router",
    "goals_router",
    "homework_router",
]
