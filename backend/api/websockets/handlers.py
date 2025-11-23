"""
WebSocket Message Handlers for Real-time Communication
Author: artpromedia
Date: 2025-11-23
"""

from typing import Dict, Any, Optional
from fastapi import WebSocket
from datetime import datetime

from core.logging import setup_logging
from db.database import get_db
from agents.agent_manager import AgentManager
from api.websockets.manager import ConnectionManager
from api.schemas.agent import (
    AgentInteraction,
    AdaptationRequest,
)

logger = setup_logging(__name__)


class WebSocketHandler:
    """
    Handles WebSocket messages and routes them to appropriate handlers
    """

    def __init__(
        self,
        socket_manager: ConnectionManager,
        agent_manager: AgentManager
    ):
        self.socket_manager = socket_manager
        self.agent_manager = agent_manager

        # Map message types to handlers
        self.handlers = {
            "virtual_brain_interact": self._handle_virtual_brain_interact,
            "subscribe_learner": self._handle_subscribe_learner,
            "unsubscribe_learner": self._handle_unsubscribe_learner,
            "get_state": self._handle_get_state,
            "adapt_content": self._handle_adapt_content,
            "join_room": self._handle_join_room,
            "leave_room": self._handle_leave_room,
            "ping": self._handle_ping,
        }

    async def handle_message(
        self,
        message: Dict[str, Any],
        connection_id: str,
        websocket: WebSocket,
    ):
        """
        Route incoming WebSocket message to appropriate handler
        """
        message_type = message.get("type")

        if message_type not in self.handlers:
            await self.socket_manager.send_personal_message(
                {
                    "type": "error",
                    "error": f"Unknown message type: {message_type}",
                    "timestamp": datetime.utcnow().isoformat(),
                },
                connection_id
            )
            return

        handler = self.handlers[message_type]

        try:
            await handler(message, connection_id, websocket)
        except Exception as e:
            logger.error(
                f"Error handling {message_type}: {str(e)}", exc_info=True
            )
            await self.socket_manager.send_personal_message(
                {
                    "type": "error",
                    "error": str(e),
                    "message_type": message_type,
                    "timestamp": datetime.utcnow().isoformat(),
                },
                connection_id
            )

    async def _handle_virtual_brain_interact(
        self,
        message: Dict[str, Any],
        connection_id: str,
        websocket: WebSocket,
    ):
        """
        Handle Virtual Brain interaction through WebSocket
        """
        try:
            # Extract interaction data
            interaction_data = message.get("data", {})

            # Validate required fields
            if "learner_id" not in interaction_data:
                raise ValueError("learner_id is required")

            learner_id = interaction_data["learner_id"]

            # Create AgentInteraction object
            interaction = AgentInteraction(**interaction_data)

            # Get or create Virtual Brain instance
            async for db in get_db():
                virtual_brain = await self.agent_manager.get_or_create_virtual_brain(
                    learner_id=learner_id,
                    db=db
                )

                # Process interaction
                result = await virtual_brain.process_interaction(
                    interaction_type=interaction.type,
                    content=interaction.content,
                    response=interaction.response,
                    context=interaction.context
                )

                # Send response
                response = {
                    "type": "virtual_brain_response",
                    "learner_id": learner_id,
                    "result": result,
                    "timestamp": datetime.utcnow().isoformat(),
                }

                await self.socket_manager.send_personal_message(
                    response,
                    connection_id
                )

                # Broadcast state update to all subscribers
                state_update = {
                    "type": "state_update",
                    "learner_id": learner_id,
                    "state": virtual_brain.get_state(),
                    "timestamp": datetime.utcnow().isoformat(),
                }

                await self.socket_manager.send_to_learner_subscribers(
                    state_update,
                    learner_id
                )

                break

        except ValueError as e:
            await self.socket_manager.send_personal_message(
                {
                    "type": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat(),
                },
                connection_id
            )

    async def _handle_subscribe_learner(
        self,
        message: Dict[str, Any],
        connection_id: str,
        websocket: WebSocket,
    ):
        """
        Subscribe to learner updates
        """
        learner_id = message.get("learner_id")

        if not learner_id:
            await self.socket_manager.send_personal_message(
                {
                    "type": "error",
                    "error": "learner_id is required",
                    "timestamp": datetime.utcnow().isoformat(),
                },
                connection_id
            )
            return

        # Subscribe to learner
        success = await self.socket_manager.subscribe_to_learner(
            connection_id,
            learner_id
        )

        # Send confirmation
        await self.socket_manager.send_personal_message(
            {
                "type": "subscribed",
                "learner_id": learner_id,
                "success": success,
                "timestamp": datetime.utcnow().isoformat(),
            },
            connection_id
        )

    async def _handle_unsubscribe_learner(
        self,
        message: Dict[str, Any],
        connection_id: str,
        websocket: WebSocket,
    ):
        """
        Unsubscribe from learner updates
        """
        learner_id = message.get("learner_id")

        if not learner_id:
            await self.socket_manager.send_personal_message(
                {
                    "type": "error",
                    "error": "learner_id is required",
                    "timestamp": datetime.utcnow().isoformat(),
                },
                connection_id
            )
            return

        # Remove from subscriptions
        connection = self.socket_manager.active_connections.get(connection_id)
        if connection:
            learner_ids = connection.get("learner_ids", [])
            if learner_id in learner_ids:
                learner_ids.remove(learner_id)

            # Remove from learner connections
            if learner_id in self.socket_manager.learner_connections:
                conns = self.socket_manager.learner_connections[learner_id]
                if connection_id in conns:
                    conns.remove(connection_id)
                if not conns:
                    del self.socket_manager.learner_connections[learner_id]

        # Send confirmation
        await self.socket_manager.send_personal_message(
            {
                "type": "unsubscribed",
                "learner_id": learner_id,
                "timestamp": datetime.utcnow().isoformat(),
            },
            connection_id
        )

    async def _handle_get_state(
        self,
        message: Dict[str, Any],
        connection_id: str,
        websocket: WebSocket,
    ):
        """
        Get current Virtual Brain state for learner
        """
        learner_id = message.get("learner_id")

        if not learner_id:
            await self.socket_manager.send_personal_message(
                {
                    "type": "error",
                    "error": "learner_id is required",
                    "timestamp": datetime.utcnow().isoformat(),
                },
                connection_id
            )
            return

        # Get Virtual Brain instance
        virtual_brain = self.agent_manager.get_virtual_brain(learner_id)

        if not virtual_brain:
            await self.socket_manager.send_personal_message(
                {
                    "type": "error",
                    "error": f"No active Virtual Brain for learner {learner_id}",
                    "timestamp": datetime.utcnow().isoformat(),
                },
                connection_id
            )
            return

        # Get state
        state = virtual_brain.get_state()

        # Send state
        await self.socket_manager.send_personal_message(
            {
                "type": "state_response",
                "learner_id": learner_id,
                "state": state,
                "timestamp": datetime.utcnow().isoformat(),
            },
            connection_id
        )

    async def _handle_adapt_content(
        self,
        message: Dict[str, Any],
        connection_id: str,
        websocket: WebSocket,
    ):
        """
        Request content adaptation for learner
        """
        try:
            # Extract adaptation request
            adaptation_data = message.get("data", {})

            # Validate required fields
            if "learner_id" not in adaptation_data:
                raise ValueError("learner_id is required")

            learner_id = adaptation_data["learner_id"]

            # Create AdaptationRequest object
            request = AdaptationRequest(**adaptation_data)

            # Get Virtual Brain instance
            virtual_brain = self.agent_manager.get_virtual_brain(learner_id)

            if not virtual_brain:
                await self.socket_manager.send_personal_message(
                    {
                        "type": "error",
                        "error": f"No active Virtual Brain for learner {learner_id}",
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    connection_id
                )
                return

            # Adapt content
            adapted_content = await virtual_brain.adaptation_engine.adapt_content(
                content=request.content,
                content_type=request.content_type,
                target_difficulty=request.target_difficulty,
                focus_areas=request.focus_areas,
            )

            # Send adapted content
            await self.socket_manager.send_personal_message(
                {
                    "type": "content_adapted",
                    "learner_id": learner_id,
                    "original_content": request.content,
                    "adapted_content": adapted_content,
                    "timestamp": datetime.utcnow().isoformat(),
                },
                connection_id
            )

        except ValueError as e:
            await self.socket_manager.send_personal_message(
                {
                    "type": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat(),
                },
                connection_id
            )

    async def _handle_join_room(
        self,
        message: Dict[str, Any],
        connection_id: str,
        websocket: WebSocket,
    ):
        """
        Join a collaboration room
        """
        room_id = message.get("room_id")

        if not room_id:
            await self.socket_manager.send_personal_message(
                {
                    "type": "error",
                    "error": "room_id is required",
                    "timestamp": datetime.utcnow().isoformat(),
                },
                connection_id
            )
            return

        # Join room
        await self.socket_manager.join_room(connection_id, room_id)

        # Send confirmation
        await self.socket_manager.send_personal_message(
            {
                "type": "room_joined",
                "room_id": room_id,
                "timestamp": datetime.utcnow().isoformat(),
            },
            connection_id
        )

    async def _handle_leave_room(
        self,
        message: Dict[str, Any],
        connection_id: str,
        websocket: WebSocket,
    ):
        """
        Leave a collaboration room
        """
        room_id = message.get("room_id")

        if not room_id:
            await self.socket_manager.send_personal_message(
                {
                    "type": "error",
                    "error": "room_id is required",
                    "timestamp": datetime.utcnow().isoformat(),
                },
                connection_id
            )
            return

        # Leave room
        await self.socket_manager.leave_room(connection_id, room_id)

        # Send confirmation
        await self.socket_manager.send_personal_message(
            {
                "type": "room_left",
                "room_id": room_id,
                "timestamp": datetime.utcnow().isoformat(),
            },
            connection_id
        )

    async def _handle_ping(
        self,
        message: Dict[str, Any],
        connection_id: str,
        websocket: WebSocket,
    ):
        """
        Handle ping for connection keep-alive
        """
        await self.socket_manager.send_personal_message(
            {
                "type": "pong",
                "timestamp": datetime.utcnow().isoformat(),
            },
            connection_id
        )
