"""
Autism Support System API Routes

Endpoints for visual supports, social stories, behavior tracking,
communication profiles, and transition support.
"""

from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel

from api.schemas.autism import (
    # Profile
    AutismProfileCreate,
    AutismProfileUpdate,
    AutismProfileResponse,
    # Communication Profile
    CommunicationProfileCreate,
    CommunicationProfileUpdate,
    CommunicationProfileResponse,
    # Visual Support
    VisualSupportCreate,
    VisualSupportUpdate,
    VisualSupportResponse,
    RecordVisualSupportUsage,
    VisualSupportType,
    # Visual Schedule
    VisualScheduleCreate,
    VisualScheduleUpdate,
    VisualScheduleResponse,
    MarkScheduleItemComplete,
    # Social Story
    SocialStoryCreate,
    SocialStoryUpdate,
    SocialStoryResponse,
    RecordSocialStoryReading,
    AIGenerateSocialStoryRequest,
    AIGenerateSocialStoryResponse,
    SocialStorySentence,
    SocialStorySentenceType,
    ComprehensionQuestion,
    # Behavior
    BehaviorIncidentCreate,
    BehaviorIncidentUpdate,
    BehaviorIncidentResponse,
    BehaviorIncidentListResponse,
    BehaviorPatternCreate,
    BehaviorPatternUpdate,
    BehaviorPatternResponse,
    BehaviorFunctionAnalysisRequest,
    BehaviorFunctionAnalysisResponse,
    BehaviorFunction,
    BehaviorIntensity,
    # Token Board
    TokenBoardCreate,
    TokenBoardUpdate,
    TokenBoardResponse,
    AwardTokenRequest,
    ResetTokenBoardRequest,
    # Transition
    TransitionSupportCreate,
    TransitionSupportUpdate,
    TransitionSupportResponse,
    RecordTransitionAttempt,
    TransitionDifficulty,
    # Dashboard
    AutismDashboardResponse,
    CommunicationStyle,
    SocialInteractionLevel,
    ChangeFlexibility,
)

router = APIRouter(prefix="/api/autism", tags=["Autism Support System"])


# ==========================================
# AUTISM PROFILE ENDPOINTS
# ==========================================

@router.post("/profile", response_model=AutismProfileResponse)
async def create_autism_profile(profile: AutismProfileCreate):
    """Create an autism profile for a learner."""
    return AutismProfileResponse(
        id="autism_" + profile.learner_id,
        learner_id=profile.learner_id,
        diagnosis_date=profile.diagnosis_date,
        diagnosed_by=profile.diagnosed_by,
        support_level=profile.support_level,
        assessment_notes=profile.assessment_notes,
        communication_style=profile.communication_style,
        expressive_language=profile.expressive_language,
        receptive_language=profile.receptive_language,
        uses_aac=profile.uses_aac,
        aac_system_type=profile.aac_system_type,
        communication_strengths=profile.communication_strengths,
        communication_challenges=profile.communication_challenges,
        social_interaction_level=profile.social_interaction_level,
        joint_attention=profile.joint_attention,
        peer_interaction=profile.peer_interaction,
        adult_interaction=profile.adult_interaction,
        social_strengths=profile.social_strengths,
        social_challenges=profile.social_challenges,
        change_flexibility=profile.change_flexibility,
        needs_visual_schedule=profile.needs_visual_schedule,
        needs_transition_warnings=profile.needs_transition_warnings,
        preferred_warning_time=profile.preferred_warning_time,
        routine_preferences=profile.routine_preferences,
        sensory_profile_id=profile.sensory_profile_id,
        primary_sensory_needs=profile.primary_sensory_needs,
        special_interests=[i.dict() for i in profile.special_interests] if profile.special_interests else None,
        common_triggers=profile.common_triggers,
        calming_strategies=profile.calming_strategies,
        reinforcers=profile.reinforcers,
        preferred_visual_support_types=profile.preferred_visual_support_types,
        needs_social_stories=profile.needs_social_stories,
        needs_token_system=profile.needs_token_system,
        token_goal_size=profile.token_goal_size,
        parent_notes=profile.parent_notes,
        teacher_notes=profile.teacher_notes,
        therapist_notes=profile.therapist_notes,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@router.get("/profile/{learner_id}", response_model=AutismProfileResponse)
async def get_autism_profile(learner_id: str):
    """Get autism profile for a learner."""
    # In production, fetch from database
    raise HTTPException(status_code=404, detail="Profile not found")


@router.patch("/profile/{learner_id}", response_model=AutismProfileResponse)
async def update_autism_profile(learner_id: str, updates: AutismProfileUpdate):
    """Update autism profile."""
    raise HTTPException(status_code=404, detail="Profile not found")


@router.delete("/profile/{learner_id}")
async def delete_autism_profile(learner_id: str):
    """Delete autism profile."""
    return {"message": "Profile deleted", "learner_id": learner_id}


# ==========================================
# COMMUNICATION PROFILE ENDPOINTS
# ==========================================

@router.post("/communication-profile", response_model=CommunicationProfileResponse)
async def create_communication_profile(profile: CommunicationProfileCreate):
    """Create a detailed communication profile."""
    return CommunicationProfileResponse(
        id="comm_" + profile.autism_profile_id,
        autism_profile_id=profile.autism_profile_id,
        primary_expressive_mode=profile.primary_expressive_mode,
        speech_clarity=profile.speech_clarity,
        average_utterance_length=profile.average_utterance_length,
        vocabulary_level=profile.vocabulary_level,
        can_request_help=profile.can_request_help,
        can_express_needs=profile.can_express_needs,
        can_ask_questions=profile.can_ask_questions,
        can_tell_stories=profile.can_tell_stories,
        follows_simple_directions=profile.follows_simple_directions,
        follows_multi_step_directions=profile.follows_multi_step_directions,
        understands_questions=profile.understands_questions,
        understands_sarcasm=profile.understands_sarcasm,
        understands_idioms=profile.understands_idioms,
        needs_visual_supports=profile.needs_visual_supports,
        needs_simplified_language=profile.needs_simplified_language,
        processing_time=profile.processing_time,
        makes_eye_contact=profile.makes_eye_contact,
        initiates_conversation=profile.initiates_conversation,
        maintains_conversation=profile.maintains_conversation,
        takes_turns=profile.takes_turns,
        understood_by_familiar=profile.understood_by_familiar,
        understood_by_unfamiliar=profile.understood_by_unfamiliar,
        aac_device_type=profile.aac_device_type,
        aac_app_or_system=profile.aac_app_or_system,
        aac_vocabulary_size=profile.aac_vocabulary_size,
        aac_proficiency=profile.aac_proficiency,
        aac_supports_needed=profile.aac_supports_needed,
        current_goals=profile.current_goals,
        target_skills=profile.target_skills,
        effective_strategies=profile.effective_strategies,
        ineffective_approaches=profile.ineffective_approaches,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@router.get("/communication-profile/{autism_profile_id}", response_model=CommunicationProfileResponse)
async def get_communication_profile(autism_profile_id: str):
    """Get communication profile."""
    raise HTTPException(status_code=404, detail="Communication profile not found")


@router.patch("/communication-profile/{profile_id}", response_model=CommunicationProfileResponse)
async def update_communication_profile(profile_id: str, updates: CommunicationProfileUpdate):
    """Update communication profile."""
    raise HTTPException(status_code=404, detail="Communication profile not found")


# ==========================================
# VISUAL SUPPORT ENDPOINTS
# ==========================================

@router.post("/visual-supports", response_model=VisualSupportResponse)
async def create_visual_support(support: VisualSupportCreate):
    """Create a visual support."""
    return VisualSupportResponse(
        id="vs_" + support.autism_profile_id + "_" + str(datetime.now().timestamp()),
        autism_profile_id=support.autism_profile_id,
        created_by_id=None,
        type=support.type,
        title=support.title,
        description=support.description,
        instructions=support.instructions,
        image_url=support.image_url,
        image_urls=support.image_urls,
        content=support.content,
        is_active=support.is_active,
        is_printable=support.is_printable,
        show_on_dashboard=support.show_on_dashboard,
        display_order=support.display_order,
        contexts=support.contexts,
        subjects=support.subjects,
        activities=support.activities,
        usage_count=0,
        last_used_at=None,
        effectiveness_rating=None,
        is_shared_with_parent=support.is_shared_with_parent,
        is_template=support.is_template,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@router.get("/visual-supports/{autism_profile_id}", response_model=List[VisualSupportResponse])
async def get_visual_supports(
    autism_profile_id: str,
    type: Optional[VisualSupportType] = None,
    is_active: bool = True,
):
    """Get all visual supports for a learner."""
    return []


@router.get("/visual-support/{support_id}", response_model=VisualSupportResponse)
async def get_visual_support(support_id: str):
    """Get a specific visual support."""
    raise HTTPException(status_code=404, detail="Visual support not found")


@router.patch("/visual-support/{support_id}", response_model=VisualSupportResponse)
async def update_visual_support(support_id: str, updates: VisualSupportUpdate):
    """Update a visual support."""
    raise HTTPException(status_code=404, detail="Visual support not found")


@router.delete("/visual-support/{support_id}")
async def delete_visual_support(support_id: str):
    """Delete a visual support."""
    return {"message": "Visual support deleted", "id": support_id}


@router.post("/visual-support/{support_id}/use")
async def record_visual_support_usage(support_id: str, usage: RecordVisualSupportUsage):
    """Record usage of a visual support."""
    return {
        "message": "Usage recorded",
        "support_id": support_id,
        "usage_count": 1,
        "effectiveness_rating": usage.effectiveness_rating,
    }


# ==========================================
# VISUAL SCHEDULE ENDPOINTS
# ==========================================

@router.post("/schedules", response_model=VisualScheduleResponse)
async def create_visual_schedule(schedule: VisualScheduleCreate):
    """Create a visual schedule."""
    return VisualScheduleResponse(
        id="sched_" + schedule.autism_profile_id + "_" + str(datetime.now().timestamp()),
        autism_profile_id=schedule.autism_profile_id,
        created_by_id=None,
        name=schedule.name,
        description=schedule.description,
        schedule_type=schedule.schedule_type,
        items=[item.dict() for item in schedule.items],
        display_format=schedule.display_format,
        show_times=schedule.show_times,
        show_checkboxes=schedule.show_checkboxes,
        image_size=schedule.image_size,
        color_coding=schedule.color_coding,
        applicable_days=schedule.applicable_days,
        start_time=schedule.start_time,
        end_time=schedule.end_time,
        is_active=schedule.is_active,
        is_template=schedule.is_template,
        times_used=0,
        last_used_at=None,
        completion_rate=None,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@router.get("/schedules/{autism_profile_id}", response_model=List[VisualScheduleResponse])
async def get_visual_schedules(
    autism_profile_id: str,
    schedule_type: Optional[str] = None,
    is_active: bool = True,
):
    """Get all visual schedules for a learner."""
    return []


@router.get("/schedule/{schedule_id}", response_model=VisualScheduleResponse)
async def get_visual_schedule(schedule_id: str):
    """Get a specific visual schedule."""
    raise HTTPException(status_code=404, detail="Schedule not found")


@router.patch("/schedule/{schedule_id}", response_model=VisualScheduleResponse)
async def update_visual_schedule(schedule_id: str, updates: VisualScheduleUpdate):
    """Update a visual schedule."""
    raise HTTPException(status_code=404, detail="Schedule not found")


@router.delete("/schedule/{schedule_id}")
async def delete_visual_schedule(schedule_id: str):
    """Delete a visual schedule."""
    return {"message": "Schedule deleted", "id": schedule_id}


@router.post("/schedule/{schedule_id}/item-complete")
async def mark_schedule_item_complete(schedule_id: str, item: MarkScheduleItemComplete):
    """Mark a schedule item as complete."""
    return {
        "message": "Item updated",
        "schedule_id": schedule_id,
        "item_id": item.item_id,
        "is_completed": item.is_completed,
    }


@router.post("/schedule/{schedule_id}/reset")
async def reset_schedule(schedule_id: str):
    """Reset all schedule items to incomplete."""
    return {"message": "Schedule reset", "schedule_id": schedule_id}


# ==========================================
# SOCIAL STORY ENDPOINTS
# ==========================================

def validate_social_story_ratio(sentences: List[SocialStorySentence]) -> dict:
    """Validate Carol Gray's Social Story ratio (2-5 descriptive/perspective per directive)."""
    counts = {
        "descriptive": 0,
        "perspective": 0,
        "directive": 0,
        "affirmative": 0,
        "control": 0,
        "cooperative": 0,
    }
    
    for sentence in sentences:
        if sentence.type == SocialStorySentenceType.DESCRIPTIVE:
            counts["descriptive"] += 1
        elif sentence.type == SocialStorySentenceType.PERSPECTIVE:
            counts["perspective"] += 1
        elif sentence.type == SocialStorySentenceType.DIRECTIVE:
            counts["directive"] += 1
        elif sentence.type == SocialStorySentenceType.AFFIRMATIVE:
            counts["affirmative"] += 1
        elif sentence.type == SocialStorySentenceType.CONTROL:
            counts["control"] += 1
        elif sentence.type == SocialStorySentenceType.COOPERATIVE:
            counts["cooperative"] += 1
    
    # Calculate ratio: (descriptive + perspective + affirmative) / directive
    supportive = counts["descriptive"] + counts["perspective"] + counts["affirmative"]
    directive = counts["directive"]
    
    # Ratio should be 2-5:1
    ratio_valid = directive == 0 or (supportive / directive >= 2 and supportive / directive <= 5)
    
    return {**counts, "ratio_valid": ratio_valid}


@router.post("/social-stories", response_model=SocialStoryResponse)
async def create_social_story(story: SocialStoryCreate):
    """Create a social story."""
    ratio_info = validate_social_story_ratio(story.sentences)
    
    return SocialStoryResponse(
        id="story_" + story.autism_profile_id + "_" + str(datetime.now().timestamp()),
        autism_profile_id=story.autism_profile_id,
        created_by_id=None,
        title=story.title,
        topic=story.topic,
        target_situation=story.target_situation,
        target_behavior=story.target_behavior,
        sentences=[s.dict() for s in story.sentences],
        descriptive_count=ratio_info["descriptive"],
        perspective_count=ratio_info["perspective"],
        directive_count=ratio_info["directive"],
        affirmative_count=ratio_info["affirmative"],
        control_count=ratio_info["control"],
        cooperative_count=ratio_info["cooperative"],
        ratio_valid=ratio_info["ratio_valid"],
        font_size=story.font_size,
        show_images=story.show_images,
        read_aloud=story.read_aloud,
        page_per_sentence=story.page_per_sentence,
        comprehension_questions=[q.dict() for q in story.comprehension_questions] if story.comprehension_questions else None,
        is_active=story.is_active,
        times_read=0,
        last_read_at=None,
        comprehension_score=None,
        behavior_improvement=None,
        generated_by_ai=False,
        ai_prompt=None,
        was_edited=False,
        is_shared_with_parent=story.is_shared_with_parent,
        is_template=story.is_template,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@router.get("/social-stories/{autism_profile_id}", response_model=List[SocialStoryResponse])
async def get_social_stories(
    autism_profile_id: str,
    topic: Optional[str] = None,
    is_active: bool = True,
):
    """Get all social stories for a learner."""
    return []


@router.get("/social-story/{story_id}", response_model=SocialStoryResponse)
async def get_social_story(story_id: str):
    """Get a specific social story."""
    raise HTTPException(status_code=404, detail="Social story not found")


@router.patch("/social-story/{story_id}", response_model=SocialStoryResponse)
async def update_social_story(story_id: str, updates: SocialStoryUpdate):
    """Update a social story."""
    raise HTTPException(status_code=404, detail="Social story not found")


@router.delete("/social-story/{story_id}")
async def delete_social_story(story_id: str):
    """Delete a social story."""
    return {"message": "Social story deleted", "id": story_id}


@router.post("/social-story/{story_id}/read")
async def record_social_story_reading(story_id: str, reading: RecordSocialStoryReading):
    """Record a social story reading session."""
    return {
        "message": "Reading recorded",
        "story_id": story_id,
        "times_read": 1,
    }


@router.post("/social-stories/generate", response_model=AIGenerateSocialStoryResponse)
async def generate_social_story(request: AIGenerateSocialStoryRequest):
    """Generate a social story using AI."""
    # In production, use AI to generate story following Carol Gray's formula
    sample_sentences = [
        SocialStorySentence(order=1, text=f"Sometimes {request.target_situation}.", type=SocialStorySentenceType.DESCRIPTIVE),
        SocialStorySentence(order=2, text="Many people experience this situation.", type=SocialStorySentenceType.DESCRIPTIVE),
        SocialStorySentence(order=3, text="Other people might feel different ways about this.", type=SocialStorySentenceType.PERSPECTIVE),
        SocialStorySentence(order=4, text="Adults want to help me feel comfortable.", type=SocialStorySentenceType.PERSPECTIVE),
        SocialStorySentence(order=5, text=f"I can try to {request.target_behavior or 'stay calm'}.", type=SocialStorySentenceType.DIRECTIVE),
        SocialStorySentence(order=6, text="It's okay to ask for help.", type=SocialStorySentenceType.AFFIRMATIVE),
    ]
    
    comprehension = [
        ComprehensionQuestion(
            question="What can I do in this situation?",
            correct_answer=request.target_behavior or "stay calm",
            options=[request.target_behavior or "stay calm", "run away", "cry", "ask for help"],
        ),
    ]
    
    return AIGenerateSocialStoryResponse(
        title=f"Story About {request.topic}",
        sentences=sample_sentences,
        comprehension_questions=comprehension,
        ratio_valid=True,
        generation_notes="Generated with 4 descriptive/perspective sentences per 1 directive (4:1 ratio).",
    )


# ==========================================
# BEHAVIOR INCIDENT ENDPOINTS
# ==========================================

@router.post("/behavior-incidents", response_model=BehaviorIncidentResponse)
async def create_behavior_incident(incident: BehaviorIncidentCreate):
    """Record a behavior incident (ABC data)."""
    return BehaviorIncidentResponse(
        id="incident_" + str(datetime.now().timestamp()),
        autism_profile_id=incident.autism_profile_id,
        recorded_by_id=None,
        incident_date=incident.incident_date,
        incident_time=incident.incident_time,
        location=incident.location,
        activity=incident.activity,
        subject=incident.subject,
        antecedent=incident.antecedent,
        behavior=incident.behavior,
        consequence=incident.consequence,
        hypothesized_function=incident.hypothesized_function,
        intensity=incident.intensity,
        duration=incident.duration,
        frequency_in_period=incident.frequency_in_period,
        staff_present=incident.staff_present,
        peers_present=incident.peers_present,
        environment_factors=incident.environment_factors,
        physical_state=incident.physical_state,
        intervention_used=incident.intervention_used,
        intervention_effective=incident.intervention_effective,
        debrief_completed=False,
        debrief_notes=incident.debrief_notes,
        parent_notified=incident.parent_notified,
        parent_notified_at=datetime.now() if incident.parent_notified else None,
        pattern_id=None,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@router.get("/behavior-incidents/{autism_profile_id}", response_model=BehaviorIncidentListResponse)
async def get_behavior_incidents(
    autism_profile_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    function: Optional[BehaviorFunction] = None,
    intensity: Optional[BehaviorIntensity] = None,
):
    """Get behavior incidents for a learner."""
    return BehaviorIncidentListResponse(
        incidents=[],
        total=0,
        function_breakdown={},
        intensity_breakdown={},
    )


@router.get("/behavior-incident/{incident_id}", response_model=BehaviorIncidentResponse)
async def get_behavior_incident(incident_id: str):
    """Get a specific behavior incident."""
    raise HTTPException(status_code=404, detail="Incident not found")


@router.patch("/behavior-incident/{incident_id}", response_model=BehaviorIncidentResponse)
async def update_behavior_incident(incident_id: str, updates: BehaviorIncidentUpdate):
    """Update a behavior incident."""
    raise HTTPException(status_code=404, detail="Incident not found")


@router.delete("/behavior-incident/{incident_id}")
async def delete_behavior_incident(incident_id: str):
    """Delete a behavior incident."""
    return {"message": "Incident deleted", "id": incident_id}


# ==========================================
# BEHAVIOR PATTERN ENDPOINTS
# ==========================================

@router.post("/behavior-patterns", response_model=BehaviorPatternResponse)
async def create_behavior_pattern(pattern: BehaviorPatternCreate):
    """Create a behavior pattern from analyzed incidents."""
    return BehaviorPatternResponse(
        id="pattern_" + str(datetime.now().timestamp()),
        autism_profile_id=pattern.autism_profile_id,
        pattern_name=pattern.pattern_name,
        description=pattern.description,
        identified_date=datetime.now(),
        primary_function=pattern.primary_function,
        secondary_function=pattern.secondary_function,
        function_evidence=pattern.function_evidence,
        common_antecedents=pattern.common_antecedents,
        common_settings=pattern.common_settings,
        common_times=pattern.common_times,
        trigger_themes=pattern.trigger_themes,
        topography_description=pattern.topography_description,
        average_intensity=pattern.average_intensity,
        average_duration=pattern.average_duration,
        average_frequency=pattern.average_frequency,
        prevention_strategies=pattern.prevention_strategies,
        replacement_behaviors=pattern.replacement_behaviors,
        teaching_strategies=pattern.teaching_strategies,
        consequence_strategies=pattern.consequence_strategies,
        crisis_strategies=pattern.crisis_strategies,
        incident_count_before=pattern.incident_count_before,
        incident_count_after=None,
        percent_reduction=None,
        last_review_date=None,
        is_active=True,
        intervention_start_date=pattern.intervention_start_date,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@router.get("/behavior-patterns/{autism_profile_id}", response_model=List[BehaviorPatternResponse])
async def get_behavior_patterns(
    autism_profile_id: str,
    function: Optional[BehaviorFunction] = None,
    is_active: bool = True,
):
    """Get behavior patterns for a learner."""
    return []


@router.get("/behavior-pattern/{pattern_id}", response_model=BehaviorPatternResponse)
async def get_behavior_pattern(pattern_id: str):
    """Get a specific behavior pattern."""
    raise HTTPException(status_code=404, detail="Pattern not found")


@router.patch("/behavior-pattern/{pattern_id}", response_model=BehaviorPatternResponse)
async def update_behavior_pattern(pattern_id: str, updates: BehaviorPatternUpdate):
    """Update a behavior pattern."""
    raise HTTPException(status_code=404, detail="Pattern not found")


@router.post("/behavior-patterns/analyze", response_model=BehaviorFunctionAnalysisResponse)
async def analyze_behavior_function(request: BehaviorFunctionAnalysisRequest):
    """Analyze behavior incidents to identify function."""
    # In production, analyze actual incidents
    return BehaviorFunctionAnalysisResponse(
        total_incidents=0,
        function_breakdown={
            "ATTENTION": 0,
            "ESCAPE": 0,
            "TANGIBLE": 0,
            "SENSORY": 0,
            "UNKNOWN": 0,
        },
        most_likely_function=BehaviorFunction.UNKNOWN,
        confidence=0.0,
        common_antecedents=[],
        common_settings=[],
        common_times=[],
        recommendations=[
            "Collect more ABC data to identify patterns",
            "Consider environmental modifications",
            "Develop replacement behaviors",
        ],
        suggested_pattern=None,
    )


# ==========================================
# TOKEN BOARD ENDPOINTS
# ==========================================

@router.post("/token-boards", response_model=TokenBoardResponse)
async def create_token_board(board: TokenBoardCreate):
    """Create a token board."""
    return TokenBoardResponse(
        id="token_" + board.autism_profile_id + "_" + str(datetime.now().timestamp()),
        autism_profile_id=board.autism_profile_id,
        name=board.name,
        description=board.description,
        token_image_url=board.token_image_url,
        empty_token_url=board.empty_token_url,
        reward_image_url=board.reward_image_url,
        total_tokens_needed=board.total_tokens_needed,
        current_tokens=0,
        token_shape=board.token_shape,
        reward_name=board.reward_name,
        reward_description=board.reward_description,
        is_reward_activity=board.is_reward_activity,
        earning_criteria=board.earning_criteria,
        token_value=board.token_value,
        reset_frequency=board.reset_frequency,
        last_reset_at=None,
        token_history=None,
        times_completed=0,
        total_tokens_earned=0,
        average_to_completion=None,
        is_active=True,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@router.get("/token-boards/{autism_profile_id}", response_model=List[TokenBoardResponse])
async def get_token_boards(autism_profile_id: str, is_active: bool = True):
    """Get all token boards for a learner."""
    return []


@router.get("/token-board/{board_id}", response_model=TokenBoardResponse)
async def get_token_board(board_id: str):
    """Get a specific token board."""
    raise HTTPException(status_code=404, detail="Token board not found")


@router.patch("/token-board/{board_id}", response_model=TokenBoardResponse)
async def update_token_board(board_id: str, updates: TokenBoardUpdate):
    """Update a token board."""
    raise HTTPException(status_code=404, detail="Token board not found")


@router.delete("/token-board/{board_id}")
async def delete_token_board(board_id: str):
    """Delete a token board."""
    return {"message": "Token board deleted", "id": board_id}


@router.post("/token-board/{board_id}/award", response_model=TokenBoardResponse)
async def award_token(board_id: str, award: AwardTokenRequest):
    """Award tokens on a token board."""
    # In production, update database and check if reward earned
    return TokenBoardResponse(
        id=board_id,
        autism_profile_id="placeholder",
        name="Sample Board",
        description=None,
        token_image_url=None,
        empty_token_url=None,
        reward_image_url=None,
        total_tokens_needed=5,
        current_tokens=award.token_count,
        token_shape="star",
        reward_name="Break Time",
        reward_description=None,
        is_reward_activity=True,
        earning_criteria=["Good listening", "Following directions"],
        token_value=1,
        reset_frequency="session",
        last_reset_at=None,
        token_history=[{
            "earned_at": datetime.now().isoformat(),
            "criterion": award.criterion,
            "awarded_by": award.awarded_by,
            "notes": award.notes,
        }],
        times_completed=0,
        total_tokens_earned=award.token_count,
        average_to_completion=None,
        is_active=True,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@router.post("/token-board/{board_id}/reset")
async def reset_token_board(board_id: str, reset: ResetTokenBoardRequest):
    """Reset a token board."""
    return {
        "message": "Token board reset",
        "board_id": board_id,
        "reward_awarded": reset.award_reward,
    }


# ==========================================
# TRANSITION SUPPORT ENDPOINTS
# ==========================================

@router.post("/transitions", response_model=TransitionSupportResponse)
async def create_transition_support(transition: TransitionSupportCreate):
    """Create a transition support."""
    return TransitionSupportResponse(
        id="trans_" + transition.autism_profile_id + "_" + str(datetime.now().timestamp()),
        autism_profile_id=transition.autism_profile_id,
        name=transition.name,
        from_activity=transition.from_activity,
        to_activity=transition.to_activity,
        transition_type=transition.transition_type,
        difficulty=transition.difficulty,
        specific_challenges=transition.specific_challenges,
        warning_time_minutes=transition.warning_time_minutes,
        warning_type=transition.warning_type,
        uses_visual_timer=transition.uses_visual_timer,
        uses_first_then=transition.uses_first_then,
        uses_social_story=transition.uses_social_story,
        uses_countdown=transition.uses_countdown,
        linked_visual_support_id=transition.linked_visual_support_id,
        linked_social_story_id=transition.linked_social_story_id,
        transition_steps=[s.dict() for s in transition.transition_steps] if transition.transition_steps else None,
        sensory_supports_before=transition.sensory_supports_before,
        sensory_supports_after=transition.sensory_supports_after,
        uses_reinforcement=transition.uses_reinforcement,
        reinforcement_type=transition.reinforcement_type,
        success_rate=None,
        total_attempts=0,
        successful_attempts=0,
        average_duration=None,
        is_active=True,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@router.get("/transitions/{autism_profile_id}", response_model=List[TransitionSupportResponse])
async def get_transition_supports(
    autism_profile_id: str,
    difficulty: Optional[TransitionDifficulty] = None,
    is_active: bool = True,
):
    """Get all transition supports for a learner."""
    return []


@router.get("/transition/{transition_id}", response_model=TransitionSupportResponse)
async def get_transition_support(transition_id: str):
    """Get a specific transition support."""
    raise HTTPException(status_code=404, detail="Transition support not found")


@router.patch("/transition/{transition_id}", response_model=TransitionSupportResponse)
async def update_transition_support(transition_id: str, updates: TransitionSupportUpdate):
    """Update a transition support."""
    raise HTTPException(status_code=404, detail="Transition support not found")


@router.delete("/transition/{transition_id}")
async def delete_transition_support(transition_id: str):
    """Delete a transition support."""
    return {"message": "Transition support deleted", "id": transition_id}


@router.post("/transition/{transition_id}/record")
async def record_transition_attempt(transition_id: str, attempt: RecordTransitionAttempt):
    """Record a transition attempt."""
    return {
        "message": "Transition attempt recorded",
        "transition_id": transition_id,
        "was_successful": attempt.was_successful,
        "duration_seconds": attempt.duration_seconds,
    }


# ==========================================
# DASHBOARD ENDPOINT
# ==========================================

@router.get("/dashboard/{learner_id}", response_model=AutismDashboardResponse)
async def get_autism_dashboard(learner_id: str):
    """Get autism support dashboard for a learner."""
    raise HTTPException(status_code=404, detail="Profile not found")
