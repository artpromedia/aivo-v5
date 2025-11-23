"""
WebSocket Manager for Real-time Communication
Author: artpromedia
Date: 2025-11-23
"""

from typing import Dict, List, Set, Optional, Any
from fastapi import WebSocket
from datetime import datetime
from uuid import uuid4

from core.logging import setup_logging
from agents.agent_manager import AgentManager

logger = setup_logging(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for real-time features
    """
    
    def __init__(self):
        # Active connections
        self.active_connections: Dict[str, Dict[str, Any]] = {}
        
        # User to connection mapping
        self.user_connections: Dict[str, List[str]] = {}
        
        # Learner to connection mapping
        self.learner_connections: Dict[str, List[str]] = {}
        
        # Room subscriptions
        self.rooms: Dict[str, Set[str]] = {}
        
        self.agent_manager: Optional[AgentManager] = None
        
    async def initialize(self, agent_manager: AgentManager = None):
        """Initialize WebSocket manager"""
        self.agent_manager = agent_manager
        logger.info("WebSocket Manager initialized")
    
    async def connect(
        self, 
        websocket: WebSocket, 
        user_id: str,
        connection_id: str = None
    ) -> str:
        """
        Accept and register a new WebSocket connection
        """
        await websocket.accept()
        
        connection_id = connection_id or f"ws_{uuid4().hex}"
        
        # Store connection
        self.active_connections[connection_id] = {
            "websocket": websocket,
            "user_id": user_id,
            "learner_ids": [],
            "connected_at": datetime.utcnow().isoformat(),
        }
        
        # Map user to connection
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(connection_id)
        
        # Send connection confirmation
        await self.send_personal_message(
            {
                "type": "connection_established",
                "connection_id": connection_id,
                "timestamp": datetime.utcnow().isoformat(),
            },
            connection_id
        )
        
        logger.info(f"WebSocket connected: {connection_id} for user {user_id}")
        
        return connection_id
    
    async def disconnect(self, connection_id: str):
        """
        Remove and clean up a WebSocket connection
        """
        if connection_id not in self.active_connections:
            return
        
        connection = self.active_connections[connection_id]
        user_id = connection["user_id"]
        learner_ids = connection.get("learner_ids", [])
        
        # Remove from user connections
        if user_id in self.user_connections:
            self.user_connections[user_id].remove(connection_id)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        # Remove from learner connections
        for learner_id in learner_ids:
            if learner_id in self.learner_connections:
                self.learner_connections[learner_id].remove(connection_id)
                if not self.learner_connections[learner_id]:
                    del self.learner_connections[learner_id]
        
        # Remove from rooms
        for room_id, connections in self.rooms.items():
            connections.discard(connection_id)
        
        # Remove connection
        del self.active_connections[connection_id]
        
        logger.info(f"WebSocket disconnected: {connection_id}")
    
    async def subscribe_to_learner(
        self, 
        connection_id: str, 
        learner_id: str
    ):
        """
        Subscribe connection to learner updates
        """
        if connection_id not in self.active_connections:
            return False
        
        # Add learner to connection
        if learner_id not in self.active_connections[connection_id]["learner_ids"]:
            self.active_connections[connection_id]["learner_ids"].append(
                learner_id
            )
        
        # Map learner to connection
        if learner_id not in self.learner_connections:
            self.learner_connections[learner_id] = []
        if connection_id not in self.learner_connections[learner_id]:
            self.learner_connections[learner_id].append(connection_id)
        
        logger.info(
            f"Connection {connection_id} subscribed to learner {learner_id}"
        )
        return True
    
    async def join_room(self, connection_id: str, room_id: str):
        """
        Join a room for group communication
        """
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add(connection_id)
        
        await self.send_to_room(
            {
                "type": "user_joined",
                "connection_id": connection_id,
                "room_id": room_id,
                "timestamp": datetime.utcnow().isoformat(),
            },
            room_id,
            exclude=[connection_id]
        )
    
    async def leave_room(self, connection_id: str, room_id: str):
        """
        Leave a room
        """
        if room_id in self.rooms:
            self.rooms[room_id].discard(connection_id)
            
            await self.send_to_room(
                {
                    "type": "user_left",
                    "connection_id": connection_id,
                    "room_id": room_id,
                    "timestamp": datetime.utcnow().isoformat(),
                },
                room_id
            )
    
    async def send_personal_message(
        self, 
        message: Dict[str, Any], 
        connection_id: str
    ):
        """
        Send message to specific connection
        """
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]["websocket"]
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to {connection_id}: {str(e)}")
                await self.disconnect(connection_id)
    
    async def send_to_user(
        self, 
        message: Dict[str, Any], 
        user_id: str
    ):
        """
        Send message to all connections of a user
        """
        if user_id in self.user_connections:
            for connection_id in self.user_connections[user_id]:
                await self.send_personal_message(message, connection_id)
    
    async def send_to_learner_subscribers(
        self, 
        message: Dict[str, Any], 
        learner_id: str
    ):
        """
        Send message to all connections subscribed to a learner
        """
        if learner_id in self.learner_connections:
            for connection_id in self.learner_connections[learner_id]:
                await self.send_personal_message(message, connection_id)
    
    async def send_to_room(
        self, 
        message: Dict[str, Any], 
        room_id: str,
        exclude: List[str] = None
    ):
        """
        Send message to all connections in a room
        """
        exclude = exclude or []
        if room_id in self.rooms:
            for connection_id in self.rooms[room_id]:
                if connection_id not in exclude:
                    await self.send_personal_message(message, connection_id)
    
    async def broadcast(
        self, 
        message: Dict[str, Any],
        exclude: List[str] = None
    ):
        """
        Broadcast message to all connections
        """
        exclude = exclude or []
        for connection_id in self.active_connections:
            if connection_id not in exclude:
                await self.send_personal_message(message, connection_id)
    
    async def disconnect_all(self):
        """
        Disconnect all active connections
        """
        connection_ids = list(self.active_connections.keys())
        for connection_id in connection_ids:
            await self.disconnect(connection_id)
    
    def get_connection_count(self) -> int:
        """Get total active connection count"""
        return len(self.active_connections)
    
    def get_user_connection_count(self, user_id: str) -> int:
        """Get connection count for specific user"""
        return len(self.user_connections.get(user_id, []))
    
    def get_learner_subscriber_count(self, learner_id: str) -> int:
        """Get subscriber count for specific learner"""
        return len(self.learner_connections.get(learner_id, []))


# Create global instance
socket_manager = ConnectionManager()
