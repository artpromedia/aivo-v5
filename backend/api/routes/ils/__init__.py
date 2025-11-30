"""
Independent Living Skills (ILS) API Routes
Functional life skills instruction with task analysis and generalization tracking
Author: artpromedia
Date: 2025-11-29
"""

from fastapi import APIRouter
from .skills import router as skills_router
from .progress import router as progress_router
from .cbi import router as cbi_router
from .goals import router as goals_router
from .reports import router as reports_router

router = APIRouter()

# Include all sub-routers
router.include_router(skills_router, prefix="/skills", tags=["ILS Skills"])
router.include_router(progress_router, prefix="/progress", tags=["ILS Progress"])
router.include_router(cbi_router, prefix="/cbi", tags=["Community-Based Instruction"])
router.include_router(goals_router, prefix="/goals", tags=["ILS Goals"])
router.include_router(reports_router, prefix="/reports", tags=["ILS Reports"])
