"""
WebSocket Tests
Author: artpromedia
Date: 2025-11-23
"""

import pytest
import asyncio
import json
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket
from unittest.mock import Mock, patch, AsyncMock

from api.websockets.manager import ConnectionManager
from api.websockets.handlers import WebSocketHandler
from agents.agent_manager import AgentManager


class TestConnectionManager:
    """Test ConnectionManager functionality"""
    
    @pytest.fixture
    def manager(self):
        """Create ConnectionManager instance"""
        return ConnectionManager()
    
    @pytest.fixture
    async def mock_websocket(self):
        """Create mock WebSocket"""
        ws = AsyncMock(spec=WebSocket)
        ws.accept = AsyncMock()
        ws.send_json = AsyncMock()
        ws.close = AsyncMock()
        return ws
    
    @pytest.mark.asyncio
    async def test_initialize(self, manager):
        """Test manager initialization"""
        agent_manager = Mock(spec=AgentManager)
        await manager.initialize(agent_manager)
        
        assert manager.agent_manager == agent_manager
        assert manager.total_connections == 0
        assert len(manager.active_connections) == 0
    
    @pytest.mark.asyncio
    async def test_connect(self, manager, mock_websocket):
        """Test WebSocket connection"""
        user_id = "user-123"
        connection_id = await manager.connect(mock_websocket, user_id)
        
        assert connection_id in manager.active_connections
        assert user_id in manager.user_connections
        assert manager.total_connections == 1
        assert mock_websocket.accept.called
        assert mock_websocket.send_json.called
    
    @pytest.mark.asyncio
    async def test_disconnect(self, manager, mock_websocket):
        """Test WebSocket disconnection"""
        user_id = "user-123"
        connection_id = await manager.connect(mock_websocket, user_id)
        
        await manager.disconnect(connection_id)
        
        assert connection_id not in manager.active_connections
        assert manager.total_disconnections == 1
    
    @pytest.mark.asyncio
    async def test_subscribe_to_learner(self, manager, mock_websocket):
        """Test learner subscription"""
        user_id = "user-123"
        learner_id = "learner-456"
        connection_id = await manager.connect(mock_websocket, user_id)
        
        success = await manager.subscribe_to_learner(connection_id, learner_id)
        
        assert success is True
        assert learner_id in manager.learner_connections
        assert connection_id in manager.learner_connections[learner_id]
    
    @pytest.mark.asyncio
    async def test_join_room(self, manager, mock_websocket):
        """Test room joining"""
        user_id = "user-123"
        room_id = "room-789"
        connection_id = await manager.connect(mock_websocket, user_id)
        
        await manager.join_room(connection_id, room_id)
        
        assert room_id in manager.rooms
        assert connection_id in manager.rooms[room_id]
    
    @pytest.mark.asyncio
    async def test_leave_room(self, manager, mock_websocket):
        """Test room leaving"""
        user_id = "user-123"
        room_id = "room-789"
        connection_id = await manager.connect(mock_websocket, user_id)
        
        await manager.join_room(connection_id, room_id)
        await manager.leave_room(connection_id, room_id)
        
        assert connection_id not in manager.rooms[room_id]
    
    @pytest.mark.asyncio
    async def test_send_personal_message(self, manager, mock_websocket):
        """Test personal message sending"""
        user_id = "user-123"
        connection_id = await manager.connect(mock_websocket, user_id)
        
        message = {"type": "test", "data": "hello"}
        await manager.send_personal_message(message, connection_id)
        
        assert manager.total_messages_sent > 0
        assert mock_websocket.send_json.call_count >= 2  # Connection + test message
    
    @pytest.mark.asyncio
    async def test_send_to_learner_subscribers(self, manager):
        """Test sending to learner subscribers"""
        # Create multiple connections
        ws1 = AsyncMock(spec=WebSocket)
        ws1.accept = AsyncMock()
        ws1.send_json = AsyncMock()
        
        ws2 = AsyncMock(spec=WebSocket)
        ws2.accept = AsyncMock()
        ws2.send_json = AsyncMock()
        
        learner_id = "learner-456"
        conn1 = await manager.connect(ws1, "user-1")
        conn2 = await manager.connect(ws2, "user-2")
        
        await manager.subscribe_to_learner(conn1, learner_id)
        await manager.subscribe_to_learner(conn2, learner_id)
        
        message = {"type": "state_update", "learner_id": learner_id}
        await manager.send_to_learner_subscribers(message, learner_id)
        
        # Both connections should receive the message
        assert ws1.send_json.call_count >= 2
        assert ws2.send_json.call_count >= 2
    
    @pytest.mark.asyncio
    async def test_broadcast(self, manager):
        """Test message broadcasting"""
        ws1 = AsyncMock(spec=WebSocket)
        ws1.accept = AsyncMock()
        ws1.send_json = AsyncMock()
        
        ws2 = AsyncMock(spec=WebSocket)
        ws2.accept = AsyncMock()
        ws2.send_json = AsyncMock()
        
        conn1 = await manager.connect(ws1, "user-1")
        conn2 = await manager.connect(ws2, "user-2")
        
        message = {"type": "announcement", "text": "Server maintenance"}
        await manager.broadcast(message)
        
        assert ws1.send_json.call_count >= 2
        assert ws2.send_json.call_count >= 2
    
    def test_get_metrics(self, manager):
        """Test metrics retrieval"""
        metrics = manager.get_metrics()
        
        assert "connections" in metrics
        assert "users" in metrics
        assert "learners" in metrics
        assert "rooms" in metrics
        assert "messages" in metrics
        assert "performance" in metrics
        assert "errors" in metrics
        assert "uptime" in metrics
    
    def test_record_message_received(self, manager):
        """Test message received recording"""
        # This would be called when handling incoming messages
        manager.total_messages_received = 0
        manager.record_message_received("fake-connection-id")
        
        assert manager.total_messages_received == 1


class TestWebSocketHandler:
    """Test WebSocketHandler functionality"""
    
    @pytest.fixture
    def manager(self):
        """Create ConnectionManager instance"""
        return ConnectionManager()
    
    @pytest.fixture
    def agent_manager(self):
        """Create mock AgentManager"""
        return Mock(spec=AgentManager)
    
    @pytest.fixture
    def handler(self, manager, agent_manager):
        """Create WebSocketHandler instance"""
        return WebSocketHandler(manager, agent_manager)
    
    @pytest.fixture
    async def mock_websocket(self):
        """Create mock WebSocket"""
        ws = AsyncMock(spec=WebSocket)
        ws.accept = AsyncMock()
        ws.send_json = AsyncMock()
        return ws
    
    @pytest.mark.asyncio
    async def test_handle_ping(self, handler, manager, mock_websocket):
        """Test ping handler"""
        user_id = "user-123"
        connection_id = await manager.connect(mock_websocket, user_id)
        
        message = {"type": "ping"}
        await handler.handle_message(message, connection_id, mock_websocket)
        
        # Should send pong response
        calls = mock_websocket.send_json.call_args_list
        pong_sent = any(
            call[0][0].get("type") == "pong" 
            for call in calls
        )
        assert pong_sent
    
    @pytest.mark.asyncio
    async def test_handle_subscribe_learner(self, handler, manager, mock_websocket):
        """Test subscribe learner handler"""
        user_id = "user-123"
        learner_id = "learner-456"
        connection_id = await manager.connect(mock_websocket, user_id)
        
        message = {"type": "subscribe_learner", "learner_id": learner_id}
        await handler.handle_message(message, connection_id, mock_websocket)
        
        assert learner_id in manager.learner_connections
    
    @pytest.mark.asyncio
    async def test_handle_join_room(self, handler, manager, mock_websocket):
        """Test join room handler"""
        user_id = "user-123"
        room_id = "room-789"
        connection_id = await manager.connect(mock_websocket, user_id)
        
        message = {"type": "join_room", "room_id": room_id}
        await handler.handle_message(message, connection_id, mock_websocket)
        
        assert connection_id in manager.rooms[room_id]
    
    @pytest.mark.asyncio
    async def test_handle_unknown_message(self, handler, manager, mock_websocket):
        """Test unknown message type"""
        user_id = "user-123"
        connection_id = await manager.connect(mock_websocket, user_id)
        
        message = {"type": "unknown_type"}
        await handler.handle_message(message, connection_id, mock_websocket)
        
        # Should send error response
        calls = mock_websocket.send_json.call_args_list
        error_sent = any(
            call[0][0].get("type") == "error"
            for call in calls
        )
        assert error_sent


class TestWebSocketMetrics:
    """Test WebSocket metrics functionality"""
    
    def test_metrics_structure(self):
        """Test metrics have correct structure"""
        manager = ConnectionManager()
        metrics = manager.get_metrics()
        
        # Connections
        assert "active" in metrics["connections"]
        assert "total" in metrics["connections"]
        assert "disconnections" in metrics["connections"]
        
        # Messages
        assert "sent" in metrics["messages"]
        assert "received" in metrics["messages"]
        assert "per_second" in metrics["messages"]
        
        # Performance
        assert "average_latency_ms" in metrics["performance"]
        assert "min_latency_ms" in metrics["performance"]
        assert "max_latency_ms" in metrics["performance"]
        
        # Uptime
        assert "seconds" in metrics["uptime"]
        assert "started_at" in metrics["uptime"]
    
    @pytest.mark.asyncio
    async def test_latency_tracking(self):
        """Test latency is tracked correctly"""
        manager = ConnectionManager()
        ws = AsyncMock(spec=WebSocket)
        ws.accept = AsyncMock()
        ws.send_json = AsyncMock()
        
        connection_id = await manager.connect(ws, "user-123")
        
        # Send a message
        await manager.send_personal_message({"type": "test"}, connection_id)
        
        # Check latency was recorded
        assert len(manager.message_latencies) > 0
        
        metrics = manager.get_metrics()
        assert metrics["performance"]["average_latency_ms"] >= 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
