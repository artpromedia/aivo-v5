"""
Redis Cache Client
Author: artpromedia
Date: 2025-11-23
"""

from typing import Optional, Any
import json
import redis.asyncio as redis

from core.config import settings
from core.logging import setup_logging

logger = setup_logging(__name__)


class RedisClient:
    """
    Async Redis client for caching and state management
    """
    
    def __init__(self):
        self.client: Optional[redis.Redis] = None
        self.connected = False
    
    async def connect(self):
        """
        Connect to Redis server
        """
        try:
            self.client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                max_connections=10
            )
            
            # Test connection
            await self.client.ping()
            
            self.connected = True
            logger.info("Redis client connected successfully")
            
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {str(e)}")
            self.connected = False
            raise
    
    async def disconnect(self):
        """
        Disconnect from Redis server
        """
        if self.client:
            await self.client.close()
            self.connected = False
            logger.info("Redis client disconnected")
    
    async def get(self, key: str) -> Optional[str]:
        """
        Get value from Redis
        """
        try:
            if not self.connected:
                await self.connect()
            
            value = await self.client.get(key)
            return value
            
        except Exception as e:
            logger.error(f"Redis GET error: {str(e)}", key=key)
            return None
    
    async def set(
        self,
        key: str,
        value: str,
        ex: Optional[int] = None,
        nx: bool = False
    ) -> bool:
        """
        Set value in Redis
        
        Args:
            key: Redis key
            value: Value to store
            ex: Expiration time in seconds
            nx: Only set if key does not exist
        """
        try:
            if not self.connected:
                await self.connect()
            
            result = await self.client.set(key, value, ex=ex, nx=nx)
            return bool(result)
            
        except Exception as e:
            logger.error(f"Redis SET error: {str(e)}", key=key)
            return False
    
    async def delete(self, key: str) -> bool:
        """
        Delete key from Redis
        """
        try:
            if not self.connected:
                await self.connect()
            
            result = await self.client.delete(key)
            return result > 0
            
        except Exception as e:
            logger.error(f"Redis DELETE error: {str(e)}", key=key)
            return False
    
    async def exists(self, key: str) -> bool:
        """
        Check if key exists in Redis
        """
        try:
            if not self.connected:
                await self.connect()
            
            result = await self.client.exists(key)
            return result > 0
            
        except Exception as e:
            logger.error(f"Redis EXISTS error: {str(e)}", key=key)
            return False
    
    async def expire(self, key: str, seconds: int) -> bool:
        """
        Set expiration time for key
        """
        try:
            if not self.connected:
                await self.connect()
            
            result = await self.client.expire(key, seconds)
            return bool(result)
            
        except Exception as e:
            logger.error(f"Redis EXPIRE error: {str(e)}", key=key)
            return False
    
    async def get_json(self, key: str) -> Optional[Any]:
        """
        Get JSON value from Redis
        """
        value = await self.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                logger.error(f"Failed to decode JSON from Redis", key=key)
                return None
        return None
    
    async def set_json(
        self,
        key: str,
        value: Any,
        ex: Optional[int] = None
    ) -> bool:
        """
        Set JSON value in Redis
        """
        try:
            json_value = json.dumps(value)
            return await self.set(key, json_value, ex=ex)
        except (TypeError, ValueError) as e:
            logger.error(f"Failed to encode JSON for Redis: {str(e)}", key=key)
            return False
    
    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """
        Increment integer value in Redis
        """
        try:
            if not self.connected:
                await self.connect()
            
            result = await self.client.incrby(key, amount)
            return result
            
        except Exception as e:
            logger.error(f"Redis INCREMENT error: {str(e)}", key=key)
            return None
    
    async def get_ttl(self, key: str) -> Optional[int]:
        """
        Get time-to-live for key in seconds
        """
        try:
            if not self.connected:
                await self.connect()
            
            ttl = await self.client.ttl(key)
            return ttl if ttl > 0 else None
            
        except Exception as e:
            logger.error(f"Redis TTL error: {str(e)}", key=key)
            return None
    
    async def keys(self, pattern: str = "*") -> list:
        """
        Get all keys matching pattern
        """
        try:
            if not self.connected:
                await self.connect()
            
            keys = await self.client.keys(pattern)
            return keys
            
        except Exception as e:
            logger.error(f"Redis KEYS error: {str(e)}", pattern=pattern)
            return []
    
    async def flush_db(self):
        """
        Flush current database (USE WITH CAUTION!)
        """
        try:
            if not self.connected:
                await self.connect()
            
            await self.client.flushdb()
            logger.warning("Redis database flushed")
            
        except Exception as e:
            logger.error(f"Redis FLUSHDB error: {str(e)}")


# Global Redis client instance
redis_client = RedisClient()
