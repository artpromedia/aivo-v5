"""
WebSocket Routes for Real-time Communication
Author: artpromedia
Date: 2025-11-23
"""

from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    Query,
    status
)
from typing import Optional

from core.logging import setup_logging
from api.websockets.manager import socket_manager
from api.websockets.handlers import WebSocketHandler
from api.dependencies.auth import verify_websocket_token
from agents.agent_manager import agent_manager

logger = setup_logging(__name__)

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """
    Main WebSocket endpoint for real-time communication

    Query Parameters:
    - token: JWT access token for authentication

    Message Format (Client -> Server):
    {
        "type": "message_type",
        "data": {...}
    }

    Message Types:
    - virtual_brain_interact: Process Virtual Brain interaction
    - subscribe_learner: Subscribe to learner updates
    - unsubscribe_learner: Unsubscribe from learner updates
    - get_state: Get current cognitive state
    - adapt_content: Request content adaptation
    - join_room: Join collaboration room
    - leave_room: Leave collaboration room
    - ping: Keep-alive ping

    Response Format (Server -> Client):
    {
        "type": "response_type",
        "data": {...},
        "timestamp": "ISO timestamp"
    }
    """

    connection_id = None

    try:
        # Verify authentication
        user = await verify_websocket_token(token)

        if not user:
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="Authentication failed"
            )
            return

        # Accept connection
        connection_id = await socket_manager.connect(
            websocket,
            str(user.id)
        )

        # Create handler
        handler = WebSocketHandler(socket_manager, agent_manager)

        logger.info(
            f"WebSocket connection established: {connection_id} "
            f"for user {user.id}"
        )

        # Message loop
        while True:
            try:
                # Receive message
                message = await websocket.receive_json()

                # Handle message
                await handler.handle_message(
                    message,
                    connection_id,
                    websocket
                )

            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected: {connection_id}")
                break

            except Exception as e:
                logger.error(
                    f"Error processing message from {connection_id}: {str(e)}",
                    exc_info=True
                )

                # Send error response
                await socket_manager.send_personal_message(
                    {
                        "type": "error",
                        "error": "Internal server error",
                        "timestamp": None,
                    },
                    connection_id
                )

    except Exception as e:
        logger.error(
            f"WebSocket connection error: {str(e)}",
            exc_info=True
        )

        if websocket.client_state.name == "CONNECTED":
            await websocket.close(
                code=status.WS_1011_INTERNAL_ERROR,
                reason="Internal server error"
            )

    finally:
        # Cleanup connection
        if connection_id:
            await socket_manager.disconnect(connection_id)
