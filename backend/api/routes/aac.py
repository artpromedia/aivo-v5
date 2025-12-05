"""
AAC (Augmentative & Alternative Communication) API Routes
Author: artpromedia
Date: 2025-01-13
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import datetime, timedelta

from db.database import get_db
from db.models.user import User
from api.schemas.aac import (
    # System
    AACSystemCreate,
    AACSystemUpdate,
    AACSystemResponse,
    # Symbol
    AACSymbolCreate,
    AACSymbolUpdate,
    AACSymbolResponse,
    AACSymbolSearch,
    # Board
    AACBoardCreate,
    AACBoardUpdate,
    AACBoardResponse,
    AACBoardSymbolCreate,
    AACBoardSymbolUpdate,
    AACBoardSymbolResponse,
    AACBulkSymbolAdd,
    # Usage
    AACUsageLogCreate,
    AACUsageLogResponse,
    AACUtterance,
    # Goals
    AACVocabularyGoalCreate,
    AACVocabularyGoalUpdate,
    AACVocabularyGoalResponse,
    # Progress
    AACProgressReportCreate,
    AACProgressReportResponse,
    # Analytics
    AACDashboardStats,
    AACRecommendation,
    AACAnalyticsRequest,
    AACAnalyticsResponse,
    # Enums
    AACSymbolCategory,
    AACMasteryLevel,
)
from api.dependencies.auth import get_current_user, verify_learner_access
from core.logging import setup_logging

router = APIRouter()
logger = setup_logging(__name__)


# ===== AAC System Endpoints =====

@router.post("/systems", response_model=AACSystemResponse, status_code=status.HTTP_201_CREATED)
async def create_aac_system(
    system: AACSystemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create an AAC system configuration for a learner"""
    if not await verify_learner_access(current_user, system.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    try:
        # Check if system already exists
        result = await db.execute(
            select(AACSystem).where(AACSystem.learner_id == system.learnerId)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="AAC system already exists for this learner"
            )
        
        db_system = AACSystem(
            learner_id=system.learnerId,
            system_type=system.systemType,
            access_method=system.accessMethod,
            grid_size=system.gridSize,
            vocabulary_size=system.vocabularySize,
            voice_id=system.voiceId,
            speech_rate=system.speechRate,
            scan_speed=system.scanSpeed,
            dwell_time=system.dwellTime,
            high_contrast_mode=system.highContrastMode,
            large_targets=system.largeTargets,
            auditory_feedback=system.auditoryFeedback,
            visual_feedback=system.visualFeedback,
            settings=system.settings or {},
        )
        
        db.add(db_system)
        await db.commit()
        await db.refresh(db_system)
        
        return _map_system_to_response(db_system)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating AAC system: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create AAC system: {str(e)}"
        )


@router.get("/systems/{learner_id}", response_model=AACSystemResponse)
async def get_aac_system(
    learner_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get AAC system configuration for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    result = await db.execute(
        select(AACSystem).where(AACSystem.learner_id == learner_id)
    )
    system = result.scalar_one_or_none()
    
    if not system:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AAC system not found for this learner"
        )
    
    return _map_system_to_response(system)


@router.patch("/systems/{learner_id}", response_model=AACSystemResponse)
async def update_aac_system(
    learner_id: str,
    updates: AACSystemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update AAC system configuration"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    result = await db.execute(
        select(AACSystem).where(AACSystem.learner_id == learner_id)
    )
    system = result.scalar_one_or_none()
    
    if not system:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AAC system not found"
        )
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(system, _camel_to_snake(field), value)
    
    await db.commit()
    await db.refresh(system)
    
    return _map_system_to_response(system)


# ===== Symbol Endpoints =====

@router.get("/symbols", response_model=List[AACSymbolResponse])
async def search_symbols(
    query: Optional[str] = None,
    category: Optional[AACSymbolCategory] = None,
    is_core: Optional[bool] = None,
    symbol_set: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Search and filter available AAC symbols"""
    stmt = select(AACSymbol)
    
    conditions = []
    if query:
        conditions.append(AACSymbol.label.ilike(f"%{query}%"))
    if category:
        conditions.append(AACSymbol.category == category)
    if is_core is not None:
        conditions.append(AACSymbol.is_core == is_core)
    if symbol_set:
        conditions.append(AACSymbol.symbol_set == symbol_set)
    
    if conditions:
        stmt = stmt.where(and_(*conditions))
    
    stmt = stmt.order_by(AACSymbol.display_order, AACSymbol.label)
    stmt = stmt.offset(offset).limit(limit)
    
    result = await db.execute(stmt)
    symbols = result.scalars().all()
    
    return [_map_symbol_to_response(s) for s in symbols]


@router.get("/symbols/{symbol_id}", response_model=AACSymbolResponse)
async def get_symbol(
    symbol_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific AAC symbol"""
    result = await db.execute(
        select(AACSymbol).where(AACSymbol.id == symbol_id)
    )
    symbol = result.scalar_one_or_none()
    
    if not symbol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Symbol not found"
        )
    
    return _map_symbol_to_response(symbol)


@router.post("/symbols", response_model=AACSymbolResponse, status_code=status.HTTP_201_CREATED)
async def create_symbol(
    symbol: AACSymbolCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new AAC symbol (admin only)"""
    # Check admin/SLP permissions
    allowed_roles = {"admin", "platform_admin", "slp", "speech_therapist", "therapist"}
    user_roles = set(getattr(current_user, 'roles', []) or [])
    user_role = getattr(current_user, 'role', '').lower()
    
    if not (user_roles & allowed_roles) and user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators and speech therapists can create AAC symbols"
        )
    
    db_symbol = AACSymbol(
        label=symbol.label,
        category=symbol.category,
        image_url=symbol.imageUrl,
        symbol_set=symbol.symbolSet,
        is_core=symbol.isCore,
        display_order=symbol.displayOrder,
        background_color=symbol.backgroundColor,
        text_color=symbol.textColor,
        border_color=symbol.borderColor,
        audio_url=symbol.audioUrl,
        metadata=symbol.metadata or {},
    )
    
    db.add(db_symbol)
    await db.commit()
    await db.refresh(db_symbol)
    
    return _map_symbol_to_response(db_symbol)


# ===== Board Endpoints =====

@router.get("/boards/{learner_id}", response_model=List[AACBoardResponse])
async def get_learner_boards(
    learner_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all communication boards for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    result = await db.execute(
        select(AACBoard)
        .where(AACBoard.learner_id == learner_id)
        .order_by(AACBoard.display_order)
    )
    boards = result.scalars().all()
    
    return [await _map_board_to_response(b, db) for b in boards]


@router.get("/boards/{learner_id}/{board_id}", response_model=AACBoardResponse)
async def get_board(
    learner_id: str,
    board_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific communication board with its symbols"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    result = await db.execute(
        select(AACBoard).where(
            and_(AACBoard.id == board_id, AACBoard.learner_id == learner_id)
        )
    )
    board = result.scalar_one_or_none()
    
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found"
        )
    
    return await _map_board_to_response(board, db)


@router.post("/boards", response_model=AACBoardResponse, status_code=status.HTTP_201_CREATED)
async def create_board(
    board: AACBoardCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new communication board"""
    if not await verify_learner_access(current_user, board.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    db_board = AACBoard(
        learner_id=board.learnerId,
        name=board.name,
        board_type=board.boardType,
        rows=board.rows,
        columns=board.columns,
        background_color=board.backgroundColor,
        is_default=board.isDefault,
        display_order=board.displayOrder,
    )
    
    db.add(db_board)
    await db.flush()
    
    # Add symbols if provided
    if board.symbols:
        for symbol_data in board.symbols:
            board_symbol = AACBoardSymbol(
                board_id=db_board.id,
                symbol_id=symbol_data.symbolId,
                row=symbol_data.row,
                column=symbol_data.column,
                custom_label=symbol_data.customLabel,
                custom_image_url=symbol_data.customImageUrl,
                is_hidden=symbol_data.isHidden,
            )
            db.add(board_symbol)
    
    await db.commit()
    await db.refresh(db_board)
    
    return await _map_board_to_response(db_board, db)


@router.patch("/boards/{board_id}", response_model=AACBoardResponse)
async def update_board(
    board_id: str,
    updates: AACBoardUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a communication board"""
    result = await db.execute(
        select(AACBoard).where(AACBoard.id == board_id)
    )
    board = result.scalar_one_or_none()
    
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found"
        )
    
    if not await verify_learner_access(current_user, board.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(board, _camel_to_snake(field), value)
    
    await db.commit()
    await db.refresh(board)
    
    return await _map_board_to_response(board, db)


@router.delete("/boards/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_board(
    board_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a communication board"""
    result = await db.execute(
        select(AACBoard).where(AACBoard.id == board_id)
    )
    board = result.scalar_one_or_none()
    
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found"
        )
    
    if not await verify_learner_access(current_user, board.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    await db.delete(board)
    await db.commit()


@router.post("/boards/{board_id}/symbols", response_model=AACBoardSymbolResponse)
async def add_symbol_to_board(
    board_id: str,
    symbol: AACBoardSymbolCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a symbol to a board"""
    result = await db.execute(
        select(AACBoard).where(AACBoard.id == board_id)
    )
    board = result.scalar_one_or_none()
    
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found"
        )
    
    if not await verify_learner_access(current_user, board.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    board_symbol = AACBoardSymbol(
        board_id=board_id,
        symbol_id=symbol.symbolId,
        row=symbol.row,
        column=symbol.column,
        custom_label=symbol.customLabel,
        custom_image_url=symbol.customImageUrl,
        is_hidden=symbol.isHidden,
    )
    
    db.add(board_symbol)
    await db.commit()
    await db.refresh(board_symbol)
    
    return _map_board_symbol_to_response(board_symbol)


@router.post("/boards/{board_id}/symbols/bulk", response_model=List[AACBoardSymbolResponse])
async def bulk_add_symbols_to_board(
    board_id: str,
    data: AACBulkSymbolAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add multiple symbols to a board at once"""
    result = await db.execute(
        select(AACBoard).where(AACBoard.id == board_id)
    )
    board = result.scalar_one_or_none()
    
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found"
        )
    
    if not await verify_learner_access(current_user, board.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    created_symbols = []
    for symbol_data in data.symbols:
        board_symbol = AACBoardSymbol(
            board_id=board_id,
            symbol_id=symbol_data.symbolId,
            row=symbol_data.row,
            column=symbol_data.column,
            custom_label=symbol_data.customLabel,
            custom_image_url=symbol_data.customImageUrl,
            is_hidden=symbol_data.isHidden,
        )
        db.add(board_symbol)
        created_symbols.append(board_symbol)
    
    await db.commit()
    
    for sym in created_symbols:
        await db.refresh(sym)
    
    return [_map_board_symbol_to_response(s) for s in created_symbols]


# ===== Usage Logging Endpoints =====

@router.post("/usage", response_model=AACUsageLogResponse, status_code=status.HTTP_201_CREATED)
async def log_symbol_usage(
    usage: AACUsageLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Log a single symbol usage event"""
    if not await verify_learner_access(current_user, usage.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    db_log = AACUsageLog(
        learner_id=usage.learnerId,
        symbol_id=usage.symbolId,
        board_id=usage.boardId,
        communicative_function=usage.communicativeFunction,
        context_activity=usage.contextActivity,
        was_prompted=usage.wasPrompted,
        prompt_level=usage.promptLevel,
        response_latency=usage.responseLatency,
        was_successful=usage.wasSuccessful,
        partner_response=usage.partnerResponse,
        notes=usage.notes,
        metadata=usage.metadata or {},
    )
    
    db.add(db_log)
    await db.commit()
    await db.refresh(db_log)
    
    return _map_usage_log_to_response(db_log)


@router.post("/usage/utterance", response_model=List[AACUsageLogResponse])
async def log_utterance(
    utterance: AACUtterance,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Log a multi-symbol utterance"""
    if not await verify_learner_access(current_user, utterance.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    logs = []
    utterance_id = f"utt_{datetime.utcnow().timestamp()}"
    
    for i, symbol_id in enumerate(utterance.symbolIds):
        db_log = AACUsageLog(
            learner_id=utterance.learnerId,
            symbol_id=symbol_id,
            board_id=utterance.boardId,
            communicative_function=utterance.communicativeFunction,
            context_activity=utterance.contextActivity,
            was_prompted=utterance.wasPrompted,
            prompt_level=utterance.promptLevel,
            metadata={
                "utterance_id": utterance_id,
                "position": i,
                "utterance_length": len(utterance.symbolIds)
            },
        )
        db.add(db_log)
        logs.append(db_log)
    
    await db.commit()
    
    for log in logs:
        await db.refresh(log)
    
    return [_map_usage_log_to_response(log) for log in logs]


@router.get("/usage/{learner_id}", response_model=List[AACUsageLogResponse])
async def get_usage_logs(
    learner_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    symbol_id: Optional[str] = None,
    limit: int = Query(100, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get usage logs for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    stmt = select(AACUsageLog).where(AACUsageLog.learner_id == learner_id)
    
    if start_date:
        stmt = stmt.where(AACUsageLog.timestamp >= start_date)
    if end_date:
        stmt = stmt.where(AACUsageLog.timestamp <= end_date)
    if symbol_id:
        stmt = stmt.where(AACUsageLog.symbol_id == symbol_id)
    
    stmt = stmt.order_by(AACUsageLog.timestamp.desc()).limit(limit)
    
    result = await db.execute(stmt)
    logs = result.scalars().all()
    
    return [_map_usage_log_to_response(log) for log in logs]


# ===== Vocabulary Goals Endpoints =====

@router.get("/goals/{learner_id}", response_model=List[AACVocabularyGoalResponse])
async def get_vocabulary_goals(
    learner_id: str,
    include_achieved: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get vocabulary goals for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    stmt = select(AACVocabularyGoal).where(AACVocabularyGoal.learner_id == learner_id)
    
    if not include_achieved:
        stmt = stmt.where(AACVocabularyGoal.is_achieved == False)
    
    result = await db.execute(stmt)
    goals = result.scalars().all()
    
    return [await _map_goal_to_response(g, db) for g in goals]


@router.post("/goals", response_model=AACVocabularyGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_vocabulary_goal(
    goal: AACVocabularyGoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new vocabulary goal"""
    if not await verify_learner_access(current_user, goal.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    db_goal = AACVocabularyGoal(
        learner_id=goal.learnerId,
        symbol_id=goal.symbolId,
        target_mastery=goal.targetMastery,
        target_trials=goal.targetTrials,
        target_accuracy=goal.targetAccuracy,
        context_description=goal.contextDescription,
        notes=goal.notes,
    )
    
    db.add(db_goal)
    await db.commit()
    await db.refresh(db_goal)
    
    return await _map_goal_to_response(db_goal, db)


@router.patch("/goals/{goal_id}", response_model=AACVocabularyGoalResponse)
async def update_vocabulary_goal(
    goal_id: str,
    updates: AACVocabularyGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a vocabulary goal"""
    result = await db.execute(
        select(AACVocabularyGoal).where(AACVocabularyGoal.id == goal_id)
    )
    goal = result.scalar_one_or_none()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    if not await verify_learner_access(current_user, goal.learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, _camel_to_snake(field), value)
    
    # Check if goal is achieved
    if goal.success_rate >= goal.target_accuracy and goal.completed_trials >= goal.target_trials:
        goal.is_achieved = True
        goal.achieved_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(goal)
    
    return await _map_goal_to_response(goal, db)


# ===== Analytics & Dashboard Endpoints =====

@router.get("/dashboard/{learner_id}", response_model=AACDashboardStats)
async def get_dashboard_stats(
    learner_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get AAC dashboard statistics for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    
    # Total available symbols
    total_symbols_result = await db.execute(select(func.count(AACSymbol.id)))
    total_symbols = total_symbols_result.scalar() or 0
    
    # Symbols used today
    today_usage_result = await db.execute(
        select(func.count(func.distinct(AACUsageLog.symbol_id)))
        .where(and_(
            AACUsageLog.learner_id == learner_id,
            AACUsageLog.timestamp >= today_start
        ))
    )
    symbols_today = today_usage_result.scalar() or 0
    
    # Symbols used this week
    week_usage_result = await db.execute(
        select(func.count(func.distinct(AACUsageLog.symbol_id)))
        .where(and_(
            AACUsageLog.learner_id == learner_id,
            AACUsageLog.timestamp >= week_start
        ))
    )
    symbols_week = week_usage_result.scalar() or 0
    
    # Average utterances per day (last 7 days)
    daily_counts_result = await db.execute(
        select(func.count(AACUsageLog.id))
        .where(and_(
            AACUsageLog.learner_id == learner_id,
            AACUsageLog.timestamp >= week_start
        ))
    )
    total_week_utterances = daily_counts_result.scalar() or 0
    avg_per_day = total_week_utterances / 7
    
    # Goals statistics
    goals_result = await db.execute(
        select(AACVocabularyGoal).where(AACVocabularyGoal.learner_id == learner_id)
    )
    goals = goals_result.scalars().all()
    goals_in_progress = sum(1 for g in goals if not g.is_achieved)
    goals_achieved = sum(1 for g in goals if g.is_achieved)
    
    # Most used symbols (top 10)
    most_used_result = await db.execute(
        select(
            AACUsageLog.symbol_id,
            func.count(AACUsageLog.id).label('count')
        )
        .where(AACUsageLog.learner_id == learner_id)
        .group_by(AACUsageLog.symbol_id)
        .order_by(func.count(AACUsageLog.id).desc())
        .limit(10)
    )
    most_used_rows = most_used_result.all()
    most_used_symbols = [
        {"symbolId": row.symbol_id, "count": row.count}
        for row in most_used_rows
    ]
    
    # Communicative function breakdown
    function_result = await db.execute(
        select(
            AACUsageLog.communicative_function,
            func.count(AACUsageLog.id).label('count')
        )
        .where(AACUsageLog.learner_id == learner_id)
        .group_by(AACUsageLog.communicative_function)
    )
    function_rows = function_result.all()
    function_breakdown = {
        row.communicative_function: row.count
        for row in function_rows
    }
    
    # Recent activity (last 20)
    recent_result = await db.execute(
        select(AACUsageLog)
        .where(AACUsageLog.learner_id == learner_id)
        .order_by(AACUsageLog.timestamp.desc())
        .limit(20)
    )
    recent_logs = recent_result.scalars().all()
    
    return AACDashboardStats(
        totalSymbolsAvailable=total_symbols,
        symbolsUsedToday=symbols_today,
        symbolsUsedThisWeek=symbols_week,
        averageUtterancesPerDay=avg_per_day,
        goalsInProgress=goals_in_progress,
        goalsAchieved=goals_achieved,
        mostUsedSymbols=most_used_symbols,
        communicativeFunctionBreakdown=function_breakdown,
        recentActivity=[_map_usage_log_to_response(log) for log in recent_logs]
    )


@router.get("/recommendations/{learner_id}", response_model=List[AACRecommendation])
async def get_recommendations(
    learner_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get AI-powered recommendations for AAC improvement"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    recommendations = []
    
    # Analyze usage patterns
    week_start = datetime.utcnow() - timedelta(days=7)
    
    # Check for underutilized core vocabulary
    core_symbols_result = await db.execute(
        select(AACSymbol).where(AACSymbol.is_core == True).limit(50)
    )
    core_symbols = core_symbols_result.scalars().all()
    
    used_symbols_result = await db.execute(
        select(func.distinct(AACUsageLog.symbol_id))
        .where(and_(
            AACUsageLog.learner_id == learner_id,
            AACUsageLog.timestamp >= week_start
        ))
    )
    used_symbol_ids = set(row[0] for row in used_symbols_result.all())
    
    # Find unused core vocabulary
    unused_core = [s for s in core_symbols if s.id not in used_symbol_ids]
    if unused_core:
        for symbol in unused_core[:3]:  # Recommend top 3
            recommendations.append(AACRecommendation(
                type="new_symbol",
                priority="medium",
                title=f"Introduce '{symbol.label}'",
                description=f"The core vocabulary word '{symbol.label}' hasn't been used recently. Consider introducing it in daily activities.",
                symbolId=symbol.id,
                actionData={"category": symbol.category}
            ))
    
    # Check for potential new goals
    goals_result = await db.execute(
        select(AACVocabularyGoal)
        .where(and_(
            AACVocabularyGoal.learner_id == learner_id,
            AACVocabularyGoal.is_achieved == False
        ))
    )
    active_goals = goals_result.scalars().all()
    
    if len(active_goals) < 3:
        recommendations.append(AACRecommendation(
            type="goal_suggestion",
            priority="low",
            title="Add more vocabulary goals",
            description="Consider adding more vocabulary goals to support communication development.",
            actionData={"current_goal_count": len(active_goals)}
        ))
    
    # Check communicative function diversity
    function_result = await db.execute(
        select(func.distinct(AACUsageLog.communicative_function))
        .where(and_(
            AACUsageLog.learner_id == learner_id,
            AACUsageLog.timestamp >= week_start
        ))
    )
    used_functions = [row[0] for row in function_result.all()]
    
    all_functions = ["REQUESTING", "COMMENTING", "QUESTIONING", "GREETING", "RESPONDING"]
    missing_functions = [f for f in all_functions if f not in used_functions]
    
    if missing_functions:
        recommendations.append(AACRecommendation(
            type="board_update",
            priority="medium",
            title="Expand communicative functions",
            description=f"Consider adding opportunities for: {', '.join(missing_functions[:2]).lower()}",
            actionData={"missing_functions": missing_functions}
        ))
    
    return recommendations


@router.post("/analytics", response_model=AACAnalyticsResponse)
async def get_analytics(
    request: AACAnalyticsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed AAC usage analytics"""
    if not await verify_learner_access(current_user, request.learnerId, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    end_date = request.endDate or datetime.utcnow()
    start_date = request.startDate or (end_date - timedelta(days=30))
    
    # Base query for the period
    base_conditions = and_(
        AACUsageLog.learner_id == request.learnerId,
        AACUsageLog.timestamp >= start_date,
        AACUsageLog.timestamp <= end_date
    )
    
    # Total utterances
    total_result = await db.execute(
        select(func.count(AACUsageLog.id)).where(base_conditions)
    )
    total_utterances = total_result.scalar() or 0
    
    # Unique symbols
    unique_result = await db.execute(
        select(func.count(func.distinct(AACUsageLog.symbol_id))).where(base_conditions)
    )
    unique_symbols = unique_result.scalar() or 0
    
    # Symbol usage by category
    category_result = await db.execute(
        select(
            AACSymbol.category,
            func.count(AACUsageLog.id).label('count')
        )
        .join(AACSymbol, AACUsageLog.symbol_id == AACSymbol.id)
        .where(base_conditions)
        .group_by(AACSymbol.category)
    )
    category_usage = {row.category: row.count for row in category_result.all()}
    
    # Communicative function usage
    function_result = await db.execute(
        select(
            AACUsageLog.communicative_function,
            func.count(AACUsageLog.id).label('count')
        )
        .where(base_conditions)
        .group_by(AACUsageLog.communicative_function)
    )
    function_usage = {row.communicative_function: row.count for row in function_result.all()}
    
    # Top symbols
    top_result = await db.execute(
        select(
            AACUsageLog.symbol_id,
            AACSymbol.label,
            func.count(AACUsageLog.id).label('count')
        )
        .join(AACSymbol, AACUsageLog.symbol_id == AACSymbol.id)
        .where(base_conditions)
        .group_by(AACUsageLog.symbol_id, AACSymbol.label)
        .order_by(func.count(AACUsageLog.id).desc())
        .limit(20)
    )
    top_symbols = [
        {"symbolId": row.symbol_id, "label": row.label, "count": row.count}
        for row in top_result.all()
    ]
    
    return AACAnalyticsResponse(
        learnerId=request.learnerId,
        period={"start": start_date.isoformat(), "end": end_date.isoformat()},
        totalUtterances=total_utterances,
        uniqueSymbols=unique_symbols,
        averageUtteranceLength=1.0,  # Would need utterance grouping logic
        symbolUsageByCategory=category_usage,
        communicativeFunctionUsage=function_usage,
        dailyTrends=[],  # Would need date grouping logic
        topSymbols=top_symbols,
        progressOverTime=[]  # Would need time series logic
    )


# ===== Progress Reports =====

@router.get("/reports/{learner_id}", response_model=List[AACProgressReportResponse])
async def get_progress_reports(
    learner_id: str,
    limit: int = Query(10, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get progress reports for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    result = await db.execute(
        select(AACProgressReport)
        .where(AACProgressReport.learner_id == learner_id)
        .order_by(AACProgressReport.created_at.desc())
        .limit(limit)
    )
    reports = result.scalars().all()
    
    return [_map_report_to_response(r) for r in reports]


@router.post("/reports/generate/{learner_id}", response_model=AACProgressReportResponse)
async def generate_progress_report(
    learner_id: str,
    period_days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a new progress report for a learner"""
    if not await verify_learner_access(current_user, learner_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this learner"
        )
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=period_days)
    
    # Gather analytics data
    base_conditions = and_(
        AACUsageLog.learner_id == learner_id,
        AACUsageLog.timestamp >= start_date,
        AACUsageLog.timestamp <= end_date
    )
    
    # Total utterances
    total_result = await db.execute(
        select(func.count(AACUsageLog.id)).where(base_conditions)
    )
    total_utterances = total_result.scalar() or 0
    
    # Unique symbols
    unique_result = await db.execute(
        select(func.count(func.distinct(AACUsageLog.symbol_id))).where(base_conditions)
    )
    unique_symbols = unique_result.scalar() or 0
    
    # Most used symbols
    most_used_result = await db.execute(
        select(AACSymbol.label)
        .join(AACUsageLog, AACUsageLog.symbol_id == AACSymbol.id)
        .where(base_conditions)
        .group_by(AACSymbol.id, AACSymbol.label)
        .order_by(func.count(AACUsageLog.id).desc())
        .limit(10)
    )
    most_used = [row[0] for row in most_used_result.all()]
    
    # Communicative functions
    function_result = await db.execute(
        select(
            AACUsageLog.communicative_function,
            func.count(AACUsageLog.id).label('count')
        )
        .where(base_conditions)
        .group_by(AACUsageLog.communicative_function)
    )
    functions = {row.communicative_function: row.count for row in function_result.all()}
    
    # Prompting data
    prompted_result = await db.execute(
        select(func.count(AACUsageLog.id))
        .where(and_(base_conditions, AACUsageLog.was_prompted == True))
    )
    prompted_count = prompted_result.scalar() or 0
    
    independent_count = total_utterances - prompted_count
    
    # Goals progress
    goals_result = await db.execute(
        select(AACVocabularyGoal).where(AACVocabularyGoal.learner_id == learner_id)
    )
    goals = goals_result.scalars().all()
    goals_progress = [
        {
            "symbolId": g.symbol_id,
            "currentMastery": g.current_mastery,
            "targetMastery": g.target_mastery,
            "progress": g.completed_trials / g.target_trials if g.target_trials > 0 else 0,
            "isAchieved": g.is_achieved
        }
        for g in goals
    ]
    
    # Generate recommendations
    recommendations = []
    if unique_symbols < 20:
        recommendations.append("Consider expanding vocabulary exposure")
    if prompted_count > independent_count:
        recommendations.append("Work on fading prompts for independent communication")
    if "COMMENTING" not in functions:
        recommendations.append("Create opportunities for commenting during activities")
    
    # Create report
    report = AACProgressReport(
        learner_id=learner_id,
        report_type="weekly" if period_days <= 7 else "monthly",
        period_start=start_date,
        period_end=end_date,
        total_utterances=total_utterances,
        unique_symbols_used=unique_symbols,
        average_utterance_length=1.0,
        most_used_symbols=most_used,
        communicative_functions=functions,
        prompting_data={
            "prompted": prompted_count,
            "independent": independent_count,
            "independence_rate": independent_count / total_utterances if total_utterances > 0 else 0
        },
        goals_progress=goals_progress,
        recommendations=recommendations,
    )
    
    db.add(report)
    await db.commit()
    await db.refresh(report)
    
    return _map_report_to_response(report)


# ===== Helper Functions =====

def _camel_to_snake(name: str) -> str:
    """Convert camelCase to snake_case"""
    import re
    return re.sub(r'(?<!^)(?=[A-Z])', '_', name).lower()


def _map_system_to_response(system) -> AACSystemResponse:
    return AACSystemResponse(
        id=system.id,
        learnerId=system.learner_id,
        systemType=system.system_type,
        accessMethod=system.access_method,
        gridSize=system.grid_size,
        vocabularySize=system.vocabulary_size,
        voiceId=system.voice_id,
        speechRate=system.speech_rate,
        scanSpeed=system.scan_speed,
        dwellTime=system.dwell_time,
        highContrastMode=system.high_contrast_mode,
        largeTargets=system.large_targets,
        auditoryFeedback=system.auditory_feedback,
        visualFeedback=system.visual_feedback,
        settings=system.settings,
        isActive=system.is_active,
        createdAt=system.created_at,
        updatedAt=system.updated_at,
    )


def _map_symbol_to_response(symbol) -> AACSymbolResponse:
    return AACSymbolResponse(
        id=symbol.id,
        label=symbol.label,
        category=symbol.category,
        imageUrl=symbol.image_url,
        symbolSet=symbol.symbol_set,
        isCore=symbol.is_core,
        displayOrder=symbol.display_order,
        backgroundColor=symbol.background_color,
        textColor=symbol.text_color,
        borderColor=symbol.border_color,
        audioUrl=symbol.audio_url,
        metadata=symbol.metadata,
        createdAt=symbol.created_at,
        updatedAt=symbol.updated_at,
    )


def _map_board_symbol_to_response(board_symbol) -> AACBoardSymbolResponse:
    return AACBoardSymbolResponse(
        id=board_symbol.id,
        boardId=board_symbol.board_id,
        symbolId=board_symbol.symbol_id,
        row=board_symbol.row,
        column=board_symbol.column,
        customLabel=board_symbol.custom_label,
        customImageUrl=board_symbol.custom_image_url,
        isHidden=board_symbol.is_hidden,
    )


async def _map_board_to_response(board, db: AsyncSession) -> AACBoardResponse:
    # Get board symbols
    result = await db.execute(
        select(AACBoardSymbol)
        .where(AACBoardSymbol.board_id == board.id)
        .order_by(AACBoardSymbol.row, AACBoardSymbol.column)
    )
    board_symbols = result.scalars().all()
    
    return AACBoardResponse(
        id=board.id,
        learnerId=board.learner_id,
        name=board.name,
        boardType=board.board_type,
        rows=board.rows,
        columns=board.columns,
        backgroundColor=board.background_color,
        isDefault=board.is_default,
        displayOrder=board.display_order,
        symbols=[_map_board_symbol_to_response(s) for s in board_symbols],
        createdAt=board.created_at,
        updatedAt=board.updated_at,
    )


def _map_usage_log_to_response(log) -> AACUsageLogResponse:
    return AACUsageLogResponse(
        id=log.id,
        learnerId=log.learner_id,
        symbolId=log.symbol_id,
        boardId=log.board_id,
        communicativeFunction=log.communicative_function,
        contextActivity=log.context_activity,
        wasPrompted=log.was_prompted,
        promptLevel=log.prompt_level,
        responseLatency=log.response_latency,
        wasSuccessful=log.was_successful,
        partnerResponse=log.partner_response,
        notes=log.notes,
        metadata=log.metadata,
        timestamp=log.timestamp,
    )


async def _map_goal_to_response(goal, db: AsyncSession) -> AACVocabularyGoalResponse:
    # Get symbol info
    result = await db.execute(
        select(AACSymbol).where(AACSymbol.id == goal.symbol_id)
    )
    symbol = result.scalar_one_or_none()
    
    return AACVocabularyGoalResponse(
        id=goal.id,
        learnerId=goal.learner_id,
        symbolId=goal.symbol_id,
        currentMastery=goal.current_mastery,
        targetMastery=goal.target_mastery,
        completedTrials=goal.completed_trials,
        targetTrials=goal.target_trials,
        successRate=goal.success_rate,
        targetAccuracy=goal.target_accuracy,
        contextDescription=goal.context_description,
        notes=goal.notes,
        isAchieved=goal.is_achieved,
        achievedAt=goal.achieved_at,
        symbol=_map_symbol_to_response(symbol) if symbol else None,
        createdAt=goal.created_at,
        updatedAt=goal.updated_at,
    )


def _map_report_to_response(report) -> AACProgressReportResponse:
    return AACProgressReportResponse(
        id=report.id,
        learnerId=report.learner_id,
        reportType=report.report_type,
        periodStart=report.period_start,
        periodEnd=report.period_end,
        totalUtterances=report.total_utterances,
        uniqueSymbolsUsed=report.unique_symbols_used,
        averageUtteranceLength=report.average_utterance_length,
        mostUsedSymbols=report.most_used_symbols,
        communicativeFunctions=report.communicative_functions,
        promptingData=report.prompting_data,
        goalsProgress=report.goals_progress,
        recommendations=report.recommendations,
        notes=report.notes,
        createdAt=report.created_at,
    )


# Import models (would be defined in db/models/aac.py)
# These are placeholder references - actual models would be SQLAlchemy models
class AACSystem:
    pass

class AACSymbol:
    pass

class AACBoard:
    pass

class AACBoardSymbol:
    pass

class AACUsageLog:
    pass

class AACVocabularyGoal:
    pass

class AACProgressReport:
    pass
