"""
Authentication Dependencies
Author: artpromedia
Date: 2025-11-23
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from db.database import get_db
from db.models.user import User
from core.security import verify_token
from core.logging import setup_logging

logger = setup_logging(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Verify token
    payload = verify_token(token, "access")
    
    if not payload:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    
    if user_id is None:
        raise credentials_exception
    
    # Get user from database
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verify that the current user is active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def verify_learner_access(
    current_user: User,
    learner_id: str,
    db: AsyncSession
) -> bool:
    """
    Verify that the current user has access to a specific learner
    """
    from db.models.learner import Learner
    
    result = await db.execute(
        select(Learner).where(Learner.id == learner_id)
    )
    learner = result.scalar_one_or_none()
    
    if not learner:
        return False
    
    # Check if user is the parent or has admin role
    if learner.parent_id == current_user.id:
        return True
    
    admin_roles = ["super_admin", "global_admin", "district_admin", "school_admin"]
    if current_user.role.value in admin_roles:
        return True
    
    return False


def require_role(*allowed_roles: str):
    """
    Dependency to require specific user roles
    """
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    
    return role_checker


async def verify_websocket_token(
    token: Optional[str],
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Verify JWT token for WebSocket connections
    
    Args:
        token: JWT access token from query parameter
        db: Database session
        
    Returns:
        User object if valid, None otherwise
    """
    if not token:
        logger.warning("WebSocket connection attempt without token")
        return None
    
    try:
        # Verify token
        payload = verify_token(token, "access")
        
        if not payload:
            logger.warning("Invalid WebSocket token")
            return None
        
        user_id: str = payload.get("sub")
        
        if user_id is None:
            logger.warning("WebSocket token missing user ID")
            return None
        
        # Get user from database
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if user is None:
            logger.warning(f"User not found for WebSocket token: {user_id}")
            return None
        
        if not user.is_active:
            logger.warning(f"Inactive user attempted WebSocket: {user_id}")
            return None
        
        return user
        
    except Exception as e:
        logger.error(f"Error verifying WebSocket token: {str(e)}")
        return None
