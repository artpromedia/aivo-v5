"""
WebSocket Metrics Endpoint
Author: artpromedia
Date: 2025-11-23
"""

from fastapi import APIRouter, Depends
from typing import Dict, Any

from api.websockets.manager import socket_manager
from api.dependencies.auth import get_current_user, require_role
from db.models.user import User

router = APIRouter()


@router.get("/metrics")
async def get_websocket_metrics(
    current_user: User = Depends(require_role("admin", "super_admin"))
) -> Dict[str, Any]:
    """
    Get comprehensive WebSocket metrics
    
    Requires admin or super_admin role
    
    Returns:
    - connections: Active, total, and disconnection counts
    - users: Connected user count
    - learners: Subscribed learner count
    - rooms: Active room count
    - messages: Sent, received, and throughput
    - performance: Latency statistics
    - errors: Error count
    - uptime: System uptime
    """
    return socket_manager.get_metrics()


@router.get("/status")
async def get_websocket_status(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get basic WebSocket connection status
    
    Available to all authenticated users
    """
    return {
        "active_connections": socket_manager.get_connection_count(),
        "connected_users": len(socket_manager.user_connections),
        "subscribed_learners": len(socket_manager.learner_connections),
        "active_rooms": len(socket_manager.rooms),
    }
