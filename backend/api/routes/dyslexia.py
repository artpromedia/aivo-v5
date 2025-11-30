"""
Dyslexia Intervention System - FastAPI Routes
Structured literacy instruction based on Orton-Gillingham principles
"""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from prisma import Prisma

from ..schemas.dyslexia import (
    # Profile
    DyslexiaProfileCreate, DyslexiaProfileUpdate, DyslexiaProfileResponse,
    # Phonological
    PhonologicalSkillCreate, PhonologicalSkillUpdate, PhonologicalSkillResponse,
    # Phonics
    PhonicsSkillCreate, PhonicsSkillUpdate, PhonicsSkillResponse,
    # Decoding
    DecodingSessionCreate, DecodingSessionResponse,
    # Sight Words
    SightWordProgressCreate, SightWordProgressUpdate, SightWordProgressResponse,
    # Fluency
    FluencyAssessmentCreate, FluencyAssessmentResponse,
    # Comprehension
    ComprehensionSkillCreate, ComprehensionSkillUpdate, ComprehensionSkillResponse,
    # Spelling
    SpellingPatternCreate, SpellingPatternUpdate, SpellingPatternResponse,
    # Lessons
    DyslexiaLessonCreate, DyslexiaLessonResponse,
    # Activities
    MultisensoryActivityCreate, MultisensoryActivityUpdate, MultisensoryActivityResponse,
    # Parent Support
    ParentDyslexiaSupportCreate, ParentDyslexiaSupportResponse,
    # Dashboard
    DyslexiaProgressSummary, DyslexiaDashboardData,
    # Enums
    PhonicsCategory, SensoryModality, DyslexiaLessonType,
    PhonicsMasteryLevel, PhonologicalSkillType, ComprehensionSkillType,
    # OG Sequence
    OG_SCOPE_AND_SEQUENCE
)

router = APIRouter(prefix="/dyslexia", tags=["Dyslexia Intervention"])
prisma = Prisma()


# ==========================================
# DYSLEXIA PROFILE ENDPOINTS
# ==========================================

@router.post("/profiles", response_model=DyslexiaProfileResponse)
async def create_dyslexia_profile(data: DyslexiaProfileCreate):
    """Create a new dyslexia profile for a learner"""
    # Check if profile already exists
    existing = await prisma.dyslexiaprofile.find_unique(
        where={"learnerId": data.learner_id}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists for this learner")
    
    profile = await prisma.dyslexiaprofile.create(
        data={
            "learnerId": data.learner_id,
            "severity": data.severity.value,
            "subtypes": [s.value for s in data.subtypes],
            "diagnosisDate": data.diagnosis_date,
            "diagnosingProfessional": data.diagnosing_professional,
            "diagnosisNotes": data.diagnosis_notes,
            "currentReadingLevel": data.current_reading_level,
            "gradeEquivalent": data.grade_equivalent,
            "lexileLevel": data.lexile_level,
            "targetReadingLevel": data.target_reading_level,
            "interventionProgram": data.intervention_program,
            "currentPhonicsLevel": data.current_phonics_level,
            "sessionsPerWeek": data.sessions_per_week,
            "sessionDurationMinutes": data.session_duration_minutes,
            "preferredModalities": [m.value for m in data.preferred_modalities],
            "accommodations": data.accommodations,
            "assistiveTechnology": data.assistive_technology,
        }
    )
    return profile


@router.get("/profiles/{learner_id}", response_model=DyslexiaProfileResponse)
async def get_dyslexia_profile(learner_id: str):
    """Get dyslexia profile by learner ID"""
    profile = await prisma.dyslexiaprofile.find_unique(
        where={"learnerId": learner_id}
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Dyslexia profile not found")
    return profile


@router.patch("/profiles/{learner_id}", response_model=DyslexiaProfileResponse)
async def update_dyslexia_profile(learner_id: str, data: DyslexiaProfileUpdate):
    """Update dyslexia profile"""
    update_data = {}
    
    if data.severity is not None:
        update_data["severity"] = data.severity.value
    if data.subtypes is not None:
        update_data["subtypes"] = [s.value for s in data.subtypes]
    if data.diagnosis_date is not None:
        update_data["diagnosisDate"] = data.diagnosis_date
    if data.diagnosing_professional is not None:
        update_data["diagnosingProfessional"] = data.diagnosing_professional
    if data.diagnosis_notes is not None:
        update_data["diagnosisNotes"] = data.diagnosis_notes
    if data.current_reading_level is not None:
        update_data["currentReadingLevel"] = data.current_reading_level
    if data.grade_equivalent is not None:
        update_data["gradeEquivalent"] = data.grade_equivalent
    if data.lexile_level is not None:
        update_data["lexileLevel"] = data.lexile_level
    if data.target_reading_level is not None:
        update_data["targetReadingLevel"] = data.target_reading_level
    if data.intervention_program is not None:
        update_data["interventionProgram"] = data.intervention_program
    if data.current_phonics_level is not None:
        update_data["currentPhonicsLevel"] = data.current_phonics_level
    if data.sessions_per_week is not None:
        update_data["sessionsPerWeek"] = data.sessions_per_week
    if data.session_duration_minutes is not None:
        update_data["sessionDurationMinutes"] = data.session_duration_minutes
    if data.preferred_modalities is not None:
        update_data["preferredModalities"] = [m.value for m in data.preferred_modalities]
    if data.accommodations is not None:
        update_data["accommodations"] = data.accommodations
    if data.assistive_technology is not None:
        update_data["assistiveTechnology"] = data.assistive_technology
    if data.last_assessment_date is not None:
        update_data["lastAssessmentDate"] = data.last_assessment_date
    if data.next_assessment_date is not None:
        update_data["nextAssessmentDate"] = data.next_assessment_date
    if data.overall_progress is not None:
        update_data["overallProgress"] = data.overall_progress
    if data.is_active is not None:
        update_data["isActive"] = data.is_active
    
    profile = await prisma.dyslexiaprofile.update(
        where={"learnerId": learner_id},
        data=update_data
    )
    return profile


# ==========================================
# PHONOLOGICAL AWARENESS ENDPOINTS
# ==========================================

@router.post("/phonological-skills", response_model=PhonologicalSkillResponse)
async def create_phonological_skill(data: PhonologicalSkillCreate):
    """Create or update a phonological awareness skill record"""
    skill = await prisma.phonologicalawarenessskill.upsert(
        where={
            "learnerId_skillType": {
                "learnerId": data.learner_id,
                "skillType": data.skill_type.value
            }
        },
        create={
            "learnerId": data.learner_id,
            "skillType": data.skill_type.value,
            "masteryLevel": data.mastery_level.value,
            "accuracyPercent": data.accuracy_percent,
            "assessmentNotes": data.assessment_notes,
            "targetMastery": data.target_mastery.value,
            "targetDate": data.target_date,
        },
        update={
            "masteryLevel": data.mastery_level.value,
            "accuracyPercent": data.accuracy_percent,
            "assessmentNotes": data.assessment_notes,
        }
    )
    return skill


@router.get("/phonological-skills/{learner_id}", response_model=List[PhonologicalSkillResponse])
async def get_phonological_skills(learner_id: str):
    """Get all phonological skills for a learner"""
    skills = await prisma.phonologicalawarenessskill.find_many(
        where={"learnerId": learner_id},
        order_by={"skillType": "asc"}
    )
    return skills


@router.patch("/phonological-skills/{skill_id}", response_model=PhonologicalSkillResponse)
async def update_phonological_skill(skill_id: str, data: PhonologicalSkillUpdate):
    """Update a phonological skill"""
    update_data = {}
    
    if data.mastery_level is not None:
        update_data["masteryLevel"] = data.mastery_level.value
    if data.accuracy_percent is not None:
        update_data["accuracyPercent"] = data.accuracy_percent
    if data.last_assessed_at is not None:
        update_data["lastAssessedAt"] = data.last_assessed_at
    if data.assessment_notes is not None:
        update_data["assessmentNotes"] = data.assessment_notes
    if data.total_attempts is not None:
        update_data["totalAttempts"] = data.total_attempts
    if data.correct_attempts is not None:
        update_data["correctAttempts"] = data.correct_attempts
    if data.practice_minutes is not None:
        update_data["practiceMinutes"] = data.practice_minutes
    if data.target_mastery is not None:
        update_data["targetMastery"] = data.target_mastery.value
    if data.target_date is not None:
        update_data["targetDate"] = data.target_date
    
    skill = await prisma.phonologicalawarenessskill.update(
        where={"id": skill_id},
        data=update_data
    )
    return skill


@router.post("/phonological-skills/{learner_id}/initialize")
async def initialize_phonological_skills(learner_id: str):
    """Initialize all phonological skill types for a learner"""
    skills_created = []
    for skill_type in PhonologicalSkillType:
        skill = await prisma.phonologicalawarenessskill.upsert(
            where={
                "learnerId_skillType": {
                    "learnerId": learner_id,
                    "skillType": skill_type.value
                }
            },
            create={
                "learnerId": learner_id,
                "skillType": skill_type.value,
            },
            update={}
        )
        skills_created.append(skill)
    return {"message": f"Initialized {len(skills_created)} phonological skills", "skills": skills_created}


# ==========================================
# PHONICS SKILL ENDPOINTS
# ==========================================

@router.post("/phonics-skills", response_model=PhonicsSkillResponse)
async def create_phonics_skill(data: PhonicsSkillCreate):
    """Create a phonics skill record"""
    skill = await prisma.phonicsskill.upsert(
        where={
            "learnerId_pattern": {
                "learnerId": data.learner_id,
                "pattern": data.pattern
            }
        },
        create={
            "learnerId": data.learner_id,
            "category": data.category.value,
            "level": data.level,
            "pattern": data.pattern,
            "patternName": data.pattern_name,
            "exampleWords": data.example_words,
            "masteryLevel": data.mastery_level.value,
            "ogSequenceNumber": data.og_sequence_number,
            "prerequisiteIds": data.prerequisite_ids,
        },
        update={
            "masteryLevel": data.mastery_level.value,
        }
    )
    return skill


@router.get("/phonics-skills/{learner_id}", response_model=List[PhonicsSkillResponse])
async def get_phonics_skills(
    learner_id: str,
    category: Optional[PhonicsCategory] = None,
    level: Optional[int] = None
):
    """Get phonics skills for a learner, optionally filtered by category or level"""
    where_clause = {"learnerId": learner_id}
    if category:
        where_clause["category"] = category.value
    if level:
        where_clause["level"] = level
    
    skills = await prisma.phonicsskill.find_many(
        where=where_clause,
        order_by=[{"level": "asc"}, {"pattern": "asc"}]
    )
    return skills


@router.patch("/phonics-skills/{skill_id}", response_model=PhonicsSkillResponse)
async def update_phonics_skill(skill_id: str, data: PhonicsSkillUpdate):
    """Update a phonics skill"""
    update_data = {}
    
    if data.mastery_level is not None:
        update_data["masteryLevel"] = data.mastery_level.value
    if data.introduced_at is not None:
        update_data["introducedAt"] = data.introduced_at
    if data.mastered_at is not None:
        update_data["masteredAt"] = data.mastered_at
    if data.reading_accuracy is not None:
        update_data["readingAccuracy"] = data.reading_accuracy
    if data.spelling_accuracy is not None:
        update_data["spellingAccuracy"] = data.spelling_accuracy
    if data.total_exposures is not None:
        update_data["totalExposures"] = data.total_exposures
    if data.correct_readings is not None:
        update_data["correctReadings"] = data.correct_readings
    if data.correct_spellings is not None:
        update_data["correctSpellings"] = data.correct_spellings
    
    skill = await prisma.phonicsskill.update(
        where={"id": skill_id},
        data=update_data
    )
    return skill


@router.post("/phonics-skills/{learner_id}/initialize-og-sequence")
async def initialize_og_sequence(learner_id: str, up_to_level: int = 12):
    """Initialize phonics skills based on Orton-Gillingham scope and sequence"""
    skills_created = []
    
    for og_level in OG_SCOPE_AND_SEQUENCE:
        if og_level.level > up_to_level:
            break
            
        # Determine category based on level
        category_map = {
            1: PhonicsCategory.SINGLE_CONSONANTS,
            2: PhonicsCategory.CONSONANT_DIGRAPHS,
            3: PhonicsCategory.CONSONANT_BLENDS,
            4: PhonicsCategory.LONG_VOWELS_CVCe,
            5: PhonicsCategory.VOWEL_TEAMS,
            6: PhonicsCategory.DIPHTHONGS,
            7: PhonicsCategory.R_CONTROLLED_VOWELS,
            8: PhonicsCategory.COMPLEX_CONSONANTS,
            9: PhonicsCategory.ADVANCED_VOWELS,
            10: PhonicsCategory.MULTISYLLABIC,
            11: PhonicsCategory.MULTISYLLABIC,
            12: PhonicsCategory.MORPHOLOGY,
        }
        
        for i, pattern in enumerate(og_level.patterns):
            skill = await prisma.phonicsskill.upsert(
                where={
                    "learnerId_pattern": {
                        "learnerId": learner_id,
                        "pattern": pattern
                    }
                },
                create={
                    "learnerId": learner_id,
                    "category": category_map[og_level.level].value,
                    "level": og_level.level,
                    "pattern": pattern,
                    "patternName": f"{og_level.name} - {pattern}",
                    "exampleWords": og_level.example_words[:3] if i == 0 else [],
                    "ogSequenceNumber": (og_level.level * 100) + i,
                },
                update={}
            )
            skills_created.append(skill)
    
    return {"message": f"Initialized {len(skills_created)} phonics patterns", "count": len(skills_created)}


# ==========================================
# DECODING SESSION ENDPOINTS
# ==========================================

@router.post("/decoding-sessions", response_model=DecodingSessionResponse)
async def create_decoding_session(data: DecodingSessionCreate):
    """Log a decoding practice session"""
    session = await prisma.decodingsession.create(
        data={
            "learnerId": data.learner_id,
            "sessionDate": data.session_date or datetime.now(),
            "durationMinutes": data.duration_minutes,
            "wordListType": data.word_list_type,
            "wordsAttempted": [w.model_dump() for w in data.words_attempted],
            "totalWords": data.total_words,
            "correctWords": data.correct_words,
            "accuracy": data.accuracy,
            "errorTypes": data.error_types,
            "commonPatterns": data.common_patterns,
            "wordsPerMinute": data.words_per_minute,
            "selfCorrections": data.self_corrections,
            "teacherNotes": data.teacher_notes,
            "focusForNext": data.focus_for_next,
        }
    )
    return session


@router.get("/decoding-sessions/{learner_id}", response_model=List[DecodingSessionResponse])
async def get_decoding_sessions(
    learner_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get decoding sessions for a learner"""
    sessions = await prisma.decodingsession.find_many(
        where={"learnerId": learner_id},
        order_by={"sessionDate": "desc"},
        take=limit,
        skip=offset
    )
    return sessions


@router.get("/decoding-sessions/{learner_id}/analytics")
async def get_decoding_analytics(learner_id: str, days: int = 30):
    """Get decoding analytics for a learner"""
    since = datetime.now() - timedelta(days=days)
    
    sessions = await prisma.decodingsession.find_many(
        where={
            "learnerId": learner_id,
            "sessionDate": {"gte": since}
        },
        order_by={"sessionDate": "asc"}
    )
    
    if not sessions:
        return {"message": "No sessions found", "data": None}
    
    total_words = sum(s.totalWords for s in sessions)
    total_correct = sum(s.correctWords for s in sessions)
    avg_accuracy = total_correct / total_words if total_words > 0 else 0
    
    # Aggregate error types
    error_totals = {}
    for session in sessions:
        if session.errorTypes:
            for error_type, count in session.errorTypes.items():
                error_totals[error_type] = error_totals.get(error_type, 0) + count
    
    return {
        "period_days": days,
        "total_sessions": len(sessions),
        "total_words_practiced": total_words,
        "total_correct": total_correct,
        "average_accuracy": round(avg_accuracy * 100, 1),
        "error_breakdown": error_totals,
        "accuracy_trend": [
            {"date": s.sessionDate.isoformat(), "accuracy": s.accuracy}
            for s in sessions
        ]
    }


# ==========================================
# SIGHT WORD PROGRESS ENDPOINTS
# ==========================================

@router.post("/sight-words", response_model=SightWordProgressResponse)
async def create_sight_word_progress(data: SightWordProgressCreate):
    """Create sight word progress record"""
    progress = await prisma.sightwordprogress.create(
        data={
            "learnerId": data.learner_id,
            "totalWordsLearned": data.total_words_learned,
            "totalWordsAutomatic": data.total_words_automatic,
            "dolchProgress": data.dolch_progress,
            "fryProgress": data.fry_progress,
            "customWords": data.custom_words,
            "currentList": data.current_list.value,
            "currentFocusWords": data.current_focus_words,
        }
    )
    return progress


@router.get("/sight-words/{learner_id}", response_model=SightWordProgressResponse)
async def get_sight_word_progress(learner_id: str):
    """Get sight word progress for a learner"""
    progress = await prisma.sightwordprogress.find_unique(
        where={"learnerId": learner_id}
    )
    if not progress:
        raise HTTPException(status_code=404, detail="Sight word progress not found")
    return progress


@router.patch("/sight-words/{learner_id}", response_model=SightWordProgressResponse)
async def update_sight_word_progress(learner_id: str, data: SightWordProgressUpdate):
    """Update sight word progress"""
    update_data = {}
    
    if data.total_words_learned is not None:
        update_data["totalWordsLearned"] = data.total_words_learned
    if data.total_words_automatic is not None:
        update_data["totalWordsAutomatic"] = data.total_words_automatic
    if data.dolch_progress is not None:
        update_data["dolchProgress"] = data.dolch_progress
    if data.fry_progress is not None:
        update_data["fryProgress"] = data.fry_progress
    if data.custom_words is not None:
        update_data["customWords"] = data.custom_words
    if data.current_list is not None:
        update_data["currentList"] = data.current_list.value
    if data.current_focus_words is not None:
        update_data["currentFocusWords"] = data.current_focus_words
    if data.total_practice_minutes is not None:
        update_data["totalPracticeMinutes"] = data.total_practice_minutes
    if data.last_practice_date is not None:
        update_data["lastPracticeDate"] = data.last_practice_date
    if data.streak is not None:
        update_data["streak"] = data.streak
    
    progress = await prisma.sightwordprogress.update(
        where={"learnerId": learner_id},
        data=update_data
    )
    return progress


# ==========================================
# FLUENCY ASSESSMENT ENDPOINTS
# ==========================================

@router.post("/fluency-assessments", response_model=FluencyAssessmentResponse)
async def create_fluency_assessment(data: FluencyAssessmentCreate):
    """Create a fluency assessment record"""
    assessment = await prisma.fluencyassessment.create(
        data={
            "learnerId": data.learner_id,
            "assessmentDate": data.assessment_date or datetime.now(),
            "passageTitle": data.passage_title,
            "passageLevel": data.passage_level,
            "passageWordCount": data.passage_word_count,
            "wordsCorrectPerMinute": data.words_correct_per_minute,
            "totalWordsRead": data.total_words_read,
            "errorsCount": data.errors_count,
            "accuracy": data.accuracy,
            "readingTimeSeconds": data.reading_time_seconds,
            "expressionScore": data.expression_score,
            "phrasingScore": data.phrasing_score,
            "smoothnessScore": data.smoothness_score,
            "paceScore": data.pace_score,
            "prosodyTotal": data.prosody_total,
            "comprehensionQuestions": data.comprehension_questions,
            "comprehensionCorrect": data.comprehension_correct,
            "comprehensionPercent": data.comprehension_percent,
            "substitutions": data.substitutions,
            "omissions": data.omissions,
            "insertions": data.insertions,
            "selfCorrections": data.self_corrections,
            "teacherNotes": data.teacher_notes,
            "areasForImprovement": data.areas_for_improvement,
        }
    )
    return assessment


@router.get("/fluency-assessments/{learner_id}", response_model=List[FluencyAssessmentResponse])
async def get_fluency_assessments(
    learner_id: str,
    limit: int = Query(20, ge=1, le=100)
):
    """Get fluency assessments for a learner"""
    assessments = await prisma.fluencyassessment.find_many(
        where={"learnerId": learner_id},
        order_by={"assessmentDate": "desc"},
        take=limit
    )
    return assessments


@router.get("/fluency-assessments/{learner_id}/trends")
async def get_fluency_trends(learner_id: str):
    """Get fluency trends for a learner"""
    assessments = await prisma.fluencyassessment.find_many(
        where={"learnerId": learner_id},
        order_by={"assessmentDate": "asc"}
    )
    
    if not assessments:
        return {"message": "No assessments found", "data": None}
    
    wcpm_trend = [
        {"date": a.assessmentDate.isoformat(), "wcpm": a.wordsCorrectPerMinute}
        for a in assessments
    ]
    
    accuracy_trend = [
        {"date": a.assessmentDate.isoformat(), "accuracy": a.accuracy}
        for a in assessments
    ]
    
    prosody_trend = [
        {"date": a.assessmentDate.isoformat(), "prosody": a.prosodyTotal}
        for a in assessments if a.prosodyTotal
    ]
    
    # Calculate growth
    if len(assessments) >= 2:
        first_wcpm = assessments[0].wordsCorrectPerMinute
        last_wcpm = assessments[-1].wordsCorrectPerMinute
        wcpm_growth = last_wcpm - first_wcpm
        wcpm_growth_percent = (wcpm_growth / first_wcpm * 100) if first_wcpm > 0 else 0
    else:
        wcpm_growth = 0
        wcpm_growth_percent = 0
    
    return {
        "total_assessments": len(assessments),
        "latest_wcpm": assessments[-1].wordsCorrectPerMinute if assessments else None,
        "wcpm_growth": round(wcpm_growth, 1),
        "wcpm_growth_percent": round(wcpm_growth_percent, 1),
        "wcpm_trend": wcpm_trend,
        "accuracy_trend": accuracy_trend,
        "prosody_trend": prosody_trend
    }


# ==========================================
# COMPREHENSION SKILL ENDPOINTS
# ==========================================

@router.post("/comprehension-skills", response_model=ComprehensionSkillResponse)
async def create_comprehension_skill(data: ComprehensionSkillCreate):
    """Create or update a comprehension skill record"""
    skill = await prisma.comprehensionskill.upsert(
        where={
            "learnerId_skillType": {
                "learnerId": data.learner_id,
                "skillType": data.skill_type.value
            }
        },
        create={
            "learnerId": data.learner_id,
            "skillType": data.skill_type.value,
            "masteryLevel": data.mastery_level.value,
            "accuracyPercent": data.accuracy_percent,
            "strategiesIntroduced": data.strategies_introduced,
            "preferredStrategies": data.preferred_strategies,
            "targetMastery": data.target_mastery.value,
            "targetDate": data.target_date,
            "notes": data.notes,
        },
        update={
            "masteryLevel": data.mastery_level.value,
            "accuracyPercent": data.accuracy_percent,
        }
    )
    return skill


@router.get("/comprehension-skills/{learner_id}", response_model=List[ComprehensionSkillResponse])
async def get_comprehension_skills(learner_id: str):
    """Get all comprehension skills for a learner"""
    skills = await prisma.comprehensionskill.find_many(
        where={"learnerId": learner_id},
        order_by={"skillType": "asc"}
    )
    return skills


@router.patch("/comprehension-skills/{skill_id}", response_model=ComprehensionSkillResponse)
async def update_comprehension_skill(skill_id: str, data: ComprehensionSkillUpdate):
    """Update a comprehension skill"""
    update_data = {}
    
    if data.mastery_level is not None:
        update_data["masteryLevel"] = data.mastery_level.value
    if data.accuracy_percent is not None:
        update_data["accuracyPercent"] = data.accuracy_percent
    if data.total_assessments is not None:
        update_data["totalAssessments"] = data.total_assessments
    if data.correct_responses is not None:
        update_data["correctResponses"] = data.correct_responses
    if data.last_assessed_at is not None:
        update_data["lastAssessedAt"] = data.last_assessed_at
    if data.strategies_introduced is not None:
        update_data["strategiesIntroduced"] = data.strategies_introduced
    if data.preferred_strategies is not None:
        update_data["preferredStrategies"] = data.preferred_strategies
    if data.target_mastery is not None:
        update_data["targetMastery"] = data.target_mastery.value
    if data.target_date is not None:
        update_data["targetDate"] = data.target_date
    if data.notes is not None:
        update_data["notes"] = data.notes
    
    skill = await prisma.comprehensionskill.update(
        where={"id": skill_id},
        data=update_data
    )
    return skill


@router.post("/comprehension-skills/{learner_id}/initialize")
async def initialize_comprehension_skills(learner_id: str):
    """Initialize all comprehension skill types for a learner"""
    skills_created = []
    for skill_type in ComprehensionSkillType:
        skill = await prisma.comprehensionskill.upsert(
            where={
                "learnerId_skillType": {
                    "learnerId": learner_id,
                    "skillType": skill_type.value
                }
            },
            create={
                "learnerId": learner_id,
                "skillType": skill_type.value,
            },
            update={}
        )
        skills_created.append(skill)
    return {"message": f"Initialized {len(skills_created)} comprehension skills", "skills": skills_created}


# ==========================================
# SPELLING PATTERN ENDPOINTS
# ==========================================

@router.post("/spelling-patterns", response_model=SpellingPatternResponse)
async def create_spelling_pattern(data: SpellingPatternCreate):
    """Create a spelling pattern record"""
    pattern = await prisma.spellingpattern.upsert(
        where={
            "learnerId_pattern": {
                "learnerId": data.learner_id,
                "pattern": data.pattern
            }
        },
        create={
            "learnerId": data.learner_id,
            "pattern": data.pattern,
            "category": data.category.value,
            "rule": data.rule,
            "exampleWords": data.example_words,
            "exceptionWords": data.exception_words,
            "masteryLevel": data.mastery_level.value,
        },
        update={
            "masteryLevel": data.mastery_level.value,
        }
    )
    return pattern


@router.get("/spelling-patterns/{learner_id}", response_model=List[SpellingPatternResponse])
async def get_spelling_patterns(
    learner_id: str,
    category: Optional[PhonicsCategory] = None
):
    """Get spelling patterns for a learner"""
    where_clause = {"learnerId": learner_id}
    if category:
        where_clause["category"] = category.value
    
    patterns = await prisma.spellingpattern.find_many(
        where=where_clause,
        order_by={"pattern": "asc"}
    )
    return patterns


@router.patch("/spelling-patterns/{pattern_id}", response_model=SpellingPatternResponse)
async def update_spelling_pattern(pattern_id: str, data: SpellingPatternUpdate):
    """Update a spelling pattern"""
    update_data = {}
    
    if data.mastery_level is not None:
        update_data["masteryLevel"] = data.mastery_level.value
    if data.introduced_at is not None:
        update_data["introducedAt"] = data.introduced_at
    if data.mastered_at is not None:
        update_data["masteredAt"] = data.mastered_at
    if data.total_attempts is not None:
        update_data["totalAttempts"] = data.total_attempts
    if data.correct_attempts is not None:
        update_data["correctAttempts"] = data.correct_attempts
    if data.accuracy is not None:
        update_data["accuracy"] = data.accuracy
    if data.frequent_errors is not None:
        update_data["frequentErrors"] = data.frequent_errors
    
    pattern = await prisma.spellingpattern.update(
        where={"id": pattern_id},
        data=update_data
    )
    return pattern


# ==========================================
# DYSLEXIA LESSON ENDPOINTS
# ==========================================

@router.post("/lessons", response_model=DyslexiaLessonResponse)
async def create_dyslexia_lesson(data: DyslexiaLessonCreate):
    """Create a dyslexia lesson record"""
    lesson = await prisma.dyslexialesson.create(
        data={
            "learnerId": data.learner_id,
            "lessonType": data.lesson_type.value,
            "lessonDate": data.lesson_date or datetime.now(),
            "durationMinutes": data.duration_minutes,
            "title": data.title,
            "objectives": data.objectives,
            "materialsUsed": data.materials_used,
            "reviewComponent": data.review_component,
            "newTeachingComponent": data.new_teaching_component,
            "practiceComponent": data.practice_component,
            "phonicsFocus": data.phonics_focus,
            "sightWordsFocus": data.sight_words_focus,
            "studentResponse": data.student_response,
            "masteryDemonstrated": data.mastery_demonstrated,
            "accuracyPercent": data.accuracy_percent,
            "nextSteps": data.next_steps,
            "homePractice": data.home_practice,
            "teacherNotes": data.teacher_notes,
            "parentCommunication": data.parent_communication,
        }
    )
    return lesson


@router.get("/lessons/{learner_id}", response_model=List[DyslexiaLessonResponse])
async def get_dyslexia_lessons(
    learner_id: str,
    lesson_type: Optional[DyslexiaLessonType] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get dyslexia lessons for a learner"""
    where_clause = {"learnerId": learner_id}
    if lesson_type:
        where_clause["lessonType"] = lesson_type.value
    
    lessons = await prisma.dyslexialesson.find_many(
        where=where_clause,
        order_by={"lessonDate": "desc"},
        take=limit,
        skip=offset
    )
    return lessons


@router.get("/lessons/{learner_id}/recent-focus")
async def get_recent_lesson_focus(learner_id: str, days: int = 7):
    """Get recent lesson focus areas"""
    since = datetime.now() - timedelta(days=days)
    
    lessons = await prisma.dyslexialesson.find_many(
        where={
            "learnerId": learner_id,
            "lessonDate": {"gte": since}
        }
    )
    
    # Aggregate focus areas
    phonics_focus = set()
    sight_words_focus = set()
    lesson_types = {}
    
    for lesson in lessons:
        phonics_focus.update(lesson.phonicsFocus or [])
        sight_words_focus.update(lesson.sightWordsFocus or [])
        lt = lesson.lessonType
        lesson_types[lt] = lesson_types.get(lt, 0) + 1
    
    return {
        "period_days": days,
        "total_lessons": len(lessons),
        "lesson_type_breakdown": lesson_types,
        "phonics_patterns_covered": list(phonics_focus),
        "sight_words_covered": list(sight_words_focus)
    }


# ==========================================
# MULTISENSORY ACTIVITY ENDPOINTS
# ==========================================

@router.post("/activities", response_model=MultisensoryActivityResponse)
async def create_multisensory_activity(data: MultisensoryActivityCreate):
    """Create a multisensory activity"""
    activity = await prisma.multisensoryactivity.create(
        data={
            "learnerId": data.learner_id,
            "name": data.name,
            "description": data.description,
            "category": data.category.value if data.category else None,
            "targetSkills": data.target_skills,
            "primaryModality": data.primary_modality.value,
            "modalities": [m.value for m in data.modalities],
            "instructions": data.instructions,
            "materials": data.materials,
            "setupTimeMinutes": data.setup_time_minutes,
            "activityMinutes": data.activity_minutes,
            "difficultyLevel": data.difficulty_level,
            "gradeRange": data.grade_range,
            "phonicsLevels": data.phonics_levels,
            "imageUrl": data.image_url,
            "videoUrl": data.video_url,
            "printableUrl": data.printable_url,
            "variations": data.variations,
            "adaptations": data.adaptations,
        }
    )
    return activity


@router.get("/activities", response_model=List[MultisensoryActivityResponse])
async def get_multisensory_activities(
    category: Optional[PhonicsCategory] = None,
    modality: Optional[SensoryModality] = None,
    difficulty: Optional[int] = Query(None, ge=1, le=5),
    phonics_level: Optional[int] = None,
    limit: int = Query(50, ge=1, le=100)
):
    """Get multisensory activities with optional filters"""
    where_clause = {"isActive": True}
    
    if category:
        where_clause["category"] = category.value
    if modality:
        where_clause["primaryModality"] = modality.value
    if difficulty:
        where_clause["difficultyLevel"] = difficulty
    if phonics_level:
        where_clause["phonicsLevels"] = {"has": phonics_level}
    
    activities = await prisma.multisensoryactivity.find_many(
        where=where_clause,
        order_by={"usageCount": "desc"},
        take=limit
    )
    return activities


@router.get("/activities/{activity_id}", response_model=MultisensoryActivityResponse)
async def get_multisensory_activity(activity_id: str):
    """Get a specific multisensory activity"""
    activity = await prisma.multisensoryactivity.find_unique(
        where={"id": activity_id}
    )
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@router.patch("/activities/{activity_id}", response_model=MultisensoryActivityResponse)
async def update_multisensory_activity(activity_id: str, data: MultisensoryActivityUpdate):
    """Update a multisensory activity"""
    update_data = {}
    
    if data.name is not None:
        update_data["name"] = data.name
    if data.description is not None:
        update_data["description"] = data.description
    if data.category is not None:
        update_data["category"] = data.category.value
    if data.target_skills is not None:
        update_data["targetSkills"] = data.target_skills
    if data.primary_modality is not None:
        update_data["primaryModality"] = data.primary_modality.value
    if data.modalities is not None:
        update_data["modalities"] = [m.value for m in data.modalities]
    if data.instructions is not None:
        update_data["instructions"] = data.instructions
    if data.materials is not None:
        update_data["materials"] = data.materials
    if data.setup_time_minutes is not None:
        update_data["setupTimeMinutes"] = data.setup_time_minutes
    if data.activity_minutes is not None:
        update_data["activityMinutes"] = data.activity_minutes
    if data.difficulty_level is not None:
        update_data["difficultyLevel"] = data.difficulty_level
    if data.usage_count is not None:
        update_data["usageCount"] = data.usage_count
    if data.avg_rating is not None:
        update_data["avgRating"] = data.avg_rating
    if data.is_active is not None:
        update_data["isActive"] = data.is_active
    
    activity = await prisma.multisensoryactivity.update(
        where={"id": activity_id},
        data=update_data
    )
    return activity


@router.post("/activities/{activity_id}/log-usage")
async def log_activity_usage(activity_id: str, rating: Optional[int] = Query(None, ge=1, le=5)):
    """Log usage of an activity and optionally add a rating"""
    activity = await prisma.multisensoryactivity.find_unique(
        where={"id": activity_id}
    )
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    new_usage_count = activity.usageCount + 1
    update_data = {"usageCount": new_usage_count}
    
    if rating:
        # Calculate new average rating
        if activity.avgRating:
            new_avg = ((activity.avgRating * (activity.usageCount)) + rating) / new_usage_count
        else:
            new_avg = rating
        update_data["avgRating"] = new_avg
    
    updated = await prisma.multisensoryactivity.update(
        where={"id": activity_id},
        data=update_data
    )
    return updated


# ==========================================
# PARENT DYSLEXIA SUPPORT ENDPOINTS
# ==========================================

@router.post("/parent-support", response_model=ParentDyslexiaSupportResponse)
async def create_parent_support_log(data: ParentDyslexiaSupportCreate):
    """Log a parent support/home practice session"""
    log = await prisma.parentdyslexiasupport.create(
        data={
            "learnerId": data.learner_id,
            "practiceDate": data.practice_date or datetime.now(),
            "practiceType": data.practice_type,
            "durationMinutes": data.duration_minutes,
            "activitiesCompleted": data.activities_completed,
            "wordsReviewed": data.words_reviewed,
            "patternsFocused": data.patterns_focused,
            "engagementLevel": data.engagement_level,
            "frustrationLevel": data.frustration_level,
            "successLevel": data.success_level,
            "whatWorkedWell": data.what_worked_well,
            "challenges": data.challenges,
            "questionsForTeacher": data.questions_for_teacher,
            "materialsUsed": data.materials_used,
            "gamesPlayed": data.games_played,
            "bestTimeOfDay": data.best_time_of_day,
            "bestLocation": data.best_location,
            "distractionsNoted": data.distractions_noted,
        }
    )
    return log


@router.get("/parent-support/{learner_id}", response_model=List[ParentDyslexiaSupportResponse])
async def get_parent_support_logs(
    learner_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get parent support logs for a learner"""
    logs = await prisma.parentdyslexiasupport.find_many(
        where={"learnerId": learner_id},
        order_by={"practiceDate": "desc"},
        take=limit,
        skip=offset
    )
    return logs


@router.get("/parent-support/{learner_id}/summary")
async def get_parent_support_summary(learner_id: str, days: int = 30):
    """Get summary of parent support activities"""
    since = datetime.now() - timedelta(days=days)
    
    logs = await prisma.parentdyslexiasupport.find_many(
        where={
            "learnerId": learner_id,
            "practiceDate": {"gte": since}
        }
    )
    
    if not logs:
        return {"message": "No practice logs found", "data": None}
    
    total_minutes = sum(log.durationMinutes for log in logs)
    avg_engagement = sum(log.engagementLevel or 0 for log in logs if log.engagementLevel) / len([l for l in logs if l.engagementLevel]) if any(l.engagementLevel for l in logs) else None
    avg_success = sum(log.successLevel or 0 for log in logs if log.successLevel) / len([l for l in logs if l.successLevel]) if any(l.successLevel for l in logs) else None
    
    # Aggregate practice types
    practice_types = {}
    for log in logs:
        pt = log.practiceType
        practice_types[pt] = practice_types.get(pt, 0) + 1
    
    return {
        "period_days": days,
        "total_sessions": len(logs),
        "total_practice_minutes": total_minutes,
        "avg_engagement_level": round(avg_engagement, 1) if avg_engagement else None,
        "avg_success_level": round(avg_success, 1) if avg_success else None,
        "practice_type_breakdown": practice_types,
        "recent_questions": [log.questionsForTeacher for log in logs[:5] if log.questionsForTeacher]
    }


# ==========================================
# DASHBOARD & ANALYTICS ENDPOINTS
# ==========================================

@router.get("/dashboard/{learner_id}", response_model=DyslexiaDashboardData)
async def get_dyslexia_dashboard(learner_id: str):
    """Get comprehensive dashboard data for a learner"""
    # Get profile
    profile = await prisma.dyslexiaprofile.find_unique(
        where={"learnerId": learner_id}
    )
    
    # Get phonological skills
    phonological_skills = await prisma.phonologicalawarenessskill.find_many(
        where={"learnerId": learner_id}
    )
    
    # Get phonics skills
    phonics_skills = await prisma.phonicsskill.find_many(
        where={"learnerId": learner_id},
        order_by=[{"level": "asc"}, {"pattern": "asc"}]
    )
    
    # Get sight word progress
    sight_words = await prisma.sightwordprogress.find_unique(
        where={"learnerId": learner_id}
    )
    
    # Get recent fluency assessments
    fluency_assessments = await prisma.fluencyassessment.find_many(
        where={"learnerId": learner_id},
        order_by={"assessmentDate": "desc"},
        take=5
    )
    
    # Get comprehension skills
    comprehension_skills = await prisma.comprehensionskill.find_many(
        where={"learnerId": learner_id}
    )
    
    # Get recent lessons
    recent_lessons = await prisma.dyslexialesson.find_many(
        where={"learnerId": learner_id},
        order_by={"lessonDate": "desc"},
        take=5
    )
    
    # Get recent decoding sessions
    recent_decoding = await prisma.decodingsession.find_many(
        where={"learnerId": learner_id},
        order_by={"sessionDate": "desc"},
        take=5
    )
    
    # Get recommended activities based on current level
    current_level = profile.currentPhonicsLevel if profile else 1
    recommended_activities = await prisma.multisensoryactivity.find_many(
        where={
            "isActive": True,
            "phonicsLevels": {"has": current_level}
        },
        order_by={"avgRating": "desc"},
        take=5
    )
    
    # Build summary
    phonological_mastered = len([s for s in phonological_skills if s.masteryLevel in ["MASTERED", "AUTOMATICITY"]])
    phonics_mastered = len([s for s in phonics_skills if s.masteryLevel in ["MASTERED", "AUTOMATICITY"]])
    comprehension_mastered = len([s for s in comprehension_skills if s.masteryLevel in ["MASTERED", "AUTOMATICITY"]])
    
    # Calculate averages
    phonological_avg = sum(s.accuracyPercent for s in phonological_skills) / len(phonological_skills) if phonological_skills else 0
    phonics_reading_avg = sum(s.readingAccuracy for s in phonics_skills) / len(phonics_skills) if phonics_skills else 0
    phonics_spelling_avg = sum(s.spellingAccuracy for s in phonics_skills) / len(phonics_skills) if phonics_skills else 0
    comprehension_avg = sum(s.accuracyPercent for s in comprehension_skills) / len(comprehension_skills) if comprehension_skills else 0
    
    # Fluency trend
    fluency_trend = None
    if len(fluency_assessments) >= 2:
        recent_wcpm = fluency_assessments[0].wordsCorrectPerMinute
        older_wcpm = fluency_assessments[-1].wordsCorrectPerMinute
        if recent_wcpm > older_wcpm * 1.05:
            fluency_trend = "improving"
        elif recent_wcpm < older_wcpm * 0.95:
            fluency_trend = "declining"
        else:
            fluency_trend = "stable"
    
    # Lessons this week
    week_ago = datetime.now() - timedelta(days=7)
    lessons_this_week = len([l for l in recent_lessons if l.lessonDate >= week_ago])
    
    summary = DyslexiaProgressSummary(
        learner_id=learner_id,
        profile=profile,
        phonological_skills_count=len(phonological_skills),
        phonological_mastered_count=phonological_mastered,
        phonological_avg_accuracy=round(phonological_avg, 1),
        phonics_skills_count=len(phonics_skills),
        phonics_mastered_count=phonics_mastered,
        current_phonics_level=current_level,
        phonics_avg_reading_accuracy=round(phonics_reading_avg, 1),
        phonics_avg_spelling_accuracy=round(phonics_spelling_avg, 1),
        sight_words_learned=sight_words.totalWordsLearned if sight_words else 0,
        sight_words_automatic=sight_words.totalWordsAutomatic if sight_words else 0,
        current_sight_word_list=sight_words.currentList if sight_words else None,
        latest_wcpm=fluency_assessments[0].wordsCorrectPerMinute if fluency_assessments else None,
        fluency_trend=fluency_trend,
        latest_prosody_score=fluency_assessments[0].prosodyTotal if fluency_assessments and fluency_assessments[0].prosodyTotal else None,
        comprehension_skills_mastered=comprehension_mastered,
        comprehension_avg_accuracy=round(comprehension_avg, 1),
        total_lessons=len(recent_lessons),
        lessons_this_week=lessons_this_week,
        total_practice_minutes=sight_words.totalPracticeMinutes if sight_words else 0,
        last_session_date=recent_lessons[0].lessonDate if recent_lessons else None
    )
    
    return DyslexiaDashboardData(
        summary=summary,
        recent_lessons=recent_lessons,
        recent_decoding_sessions=recent_decoding,
        recent_fluency_assessments=fluency_assessments,
        phonics_progression=phonics_skills,
        recommended_activities=recommended_activities,
        og_scope_sequence=OG_SCOPE_AND_SEQUENCE
    )


@router.get("/og-scope-sequence")
async def get_og_scope_sequence():
    """Get the complete Orton-Gillingham scope and sequence"""
    return OG_SCOPE_AND_SEQUENCE
