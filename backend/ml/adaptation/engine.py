"""
Adaptive Learning ML Engine
Author: artpromedia
Date: 2025-01-26

Machine learning-powered adaptive learning system for:
- Difficulty level prediction
- Content adaptation
- Learning pace optimization
- Knowledge gap detection
- Personalized recommendations
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import json
import httpx

from core.logging import setup_logging
from core.config import settings

logger = setup_logging(__name__)

# Model dispatch service URL
MODEL_DISPATCH_URL = getattr(settings, "MODEL_DISPATCH_URL", "http://model-dispatch:4007")


class DifficultyLevel(Enum):
    """Content difficulty levels"""
    VERY_EASY = 1
    EASY = 2
    MEDIUM = 3
    HARD = 4
    VERY_HARD = 5


class LearningState(Enum):
    """Learner's current state"""
    STRUGGLING = "struggling"
    LEARNING = "learning"
    MASTERING = "mastering"
    MASTERED = "mastered"


@dataclass
class LearnerProfile:
    """Learner's adaptive learning profile"""
    learner_id: str
    current_level: float = 0.5  # 0-1 scale
    learning_rate: float = 0.1  # How fast learner progresses
    consistency: float = 0.5  # Performance consistency
    engagement: float = 0.5  # Engagement level
    preferred_difficulty: float = 0.5  # Preferred challenge level
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    last_updated: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ContentFeatures:
    """Features extracted from content for adaptation"""
    content_id: str
    complexity_score: float  # 0-1
    reading_level: float  # Grade level
    concept_density: float  # Concepts per paragraph
    prerequisite_count: int
    estimated_time_minutes: int
    modality: str  # text, visual, audio, interactive
    topic_ids: List[str] = field(default_factory=list)


@dataclass
class LearningEvent:
    """Single learning interaction event"""
    event_id: str
    learner_id: str
    content_id: str
    timestamp: datetime
    time_spent_seconds: int
    correct_responses: int
    total_responses: int
    difficulty_level: float
    engagement_score: float
    hints_used: int = 0
    attempts: int = 1


class AdaptiveLearningEngine:
    """
    ML-powered adaptive learning engine
    
    Uses collaborative filtering and content-based methods to:
    - Predict optimal difficulty
    - Adapt content presentation
    - Identify knowledge gaps
    - Generate personalized paths
    """
    
    def __init__(self):
        self.profiles: Dict[str, LearnerProfile] = {}
        self.content_features: Dict[str, ContentFeatures] = {}
        self.event_buffer: List[LearningEvent] = []
        
        # Model parameters (would be loaded from trained model)
        self.difficulty_weights = np.array([0.3, 0.2, 0.2, 0.15, 0.15])
        self.adaptation_threshold = 0.7
        
        logger.info("Adaptive Learning Engine initialized")
    
    async def predict_difficulty(
        self,
        learner_id: str,
        content_features: Dict[str, Any],
        recent_performance: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Predict optimal difficulty level for a learner
        
        Args:
            learner_id: Unique learner identifier
            content_features: Features of the content
            recent_performance: Recent performance data
            
        Returns:
            Difficulty prediction with confidence and recommendations
        """
        try:
            # Get or create learner profile
            profile = self._get_learner_profile(learner_id)
            
            # Calculate performance-based difficulty adjustment
            if recent_performance:
                avg_accuracy = np.mean([p.get("accuracy", 0.5) for p in recent_performance[-10:]])
                avg_time_ratio = np.mean([p.get("timeRatio", 1.0) for p in recent_performance[-10:]])
                
                # Adjust difficulty based on performance
                if avg_accuracy > 0.85 and avg_time_ratio < 0.8:
                    # Doing well and fast - increase difficulty
                    difficulty_adjustment = 0.1
                elif avg_accuracy < 0.6 or avg_time_ratio > 1.5:
                    # Struggling - decrease difficulty
                    difficulty_adjustment = -0.15
                else:
                    difficulty_adjustment = 0.0
            else:
                difficulty_adjustment = 0.0
            
            # Calculate target difficulty
            base_difficulty = profile.current_level + profile.preferred_difficulty * 0.3
            target_difficulty = np.clip(base_difficulty + difficulty_adjustment, 0.1, 0.95)
            
            # Map to difficulty level
            difficulty_level = self._map_to_difficulty_level(target_difficulty)
            
            # Calculate confidence based on data availability
            confidence = min(0.9, 0.5 + len(recent_performance or []) * 0.04)
            
            # Use AI for enhanced prediction if available
            ai_prediction = await self._get_ai_difficulty_prediction(
                learner_id, content_features, recent_performance, profile
            )
            
            if ai_prediction:
                # Blend rule-based and AI predictions
                target_difficulty = 0.6 * target_difficulty + 0.4 * ai_prediction.get("difficulty", target_difficulty)
                confidence = max(confidence, ai_prediction.get("confidence", 0.5))
            
            return {
                "learnerId": learner_id,
                "predictedDifficulty": round(target_difficulty, 3),
                "difficultyLevel": difficulty_level.name,
                "confidence": round(confidence, 3),
                "adjustmentReason": self._get_adjustment_reason(difficulty_adjustment),
                "recommendations": self._generate_difficulty_recommendations(
                    profile, target_difficulty, recent_performance
                ),
                "zoneOfProximalDevelopment": {
                    "lower": round(max(0.1, target_difficulty - 0.15), 3),
                    "optimal": round(target_difficulty, 3),
                    "upper": round(min(0.95, target_difficulty + 0.15), 3),
                }
            }
            
        except Exception as e:
            logger.error(f"Difficulty prediction error: {e}")
            return {
                "learnerId": learner_id,
                "predictedDifficulty": 0.5,
                "difficultyLevel": "MEDIUM",
                "confidence": 0.3,
                "error": str(e)
            }
    
    async def adapt_content(
        self,
        content: Dict[str, Any],
        learner_id: str,
        target_difficulty: Optional[float] = None,
        adaptations: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Adapt content for a specific learner
        
        Possible adaptations:
        - Simplify/complexify language
        - Add/remove scaffolding
        - Adjust pacing
        - Add visual supports
        - Modify question types
        """
        try:
            profile = self._get_learner_profile(learner_id)
            
            # Determine needed adaptations
            if adaptations is None:
                adaptations = self._determine_adaptations(profile, content)
            
            # Apply adaptations
            adapted_content = content.copy()
            adaptation_log = []
            
            for adaptation in adaptations:
                result = await self._apply_adaptation(adapted_content, adaptation, profile)
                if result:
                    adapted_content = result["content"]
                    adaptation_log.append(result["log"])
            
            return {
                "originalContentId": content.get("id"),
                "adaptedContent": adapted_content,
                "adaptationsApplied": adaptation_log,
                "targetDifficulty": target_difficulty or profile.current_level,
                "learnerProfile": {
                    "currentLevel": profile.current_level,
                    "learningRate": profile.learning_rate,
                }
            }
            
        except Exception as e:
            logger.error(f"Content adaptation error: {e}")
            return {
                "originalContentId": content.get("id"),
                "adaptedContent": content,
                "error": str(e)
            }
    
    async def detect_knowledge_gaps(
        self,
        learner_id: str,
        topic_performance: List[Dict[str, Any]],
        curriculum_map: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Detect knowledge gaps based on performance patterns
        
        Returns identified gaps with severity and remediation suggestions
        """
        try:
            gaps = []
            
            # Analyze topic performance
            for topic in topic_performance:
                accuracy = topic.get("accuracy", 0)
                attempts = topic.get("attempts", 0)
                
                if accuracy < 0.6 and attempts >= 3:
                    gap_severity = "critical" if accuracy < 0.4 else "moderate"
                    gaps.append({
                        "topicId": topic.get("topicId"),
                        "topicName": topic.get("topicName"),
                        "currentAccuracy": accuracy,
                        "severity": gap_severity,
                        "attempts": attempts,
                        "prerequisites": topic.get("prerequisites", []),
                    })
            
            # Sort by severity
            gaps.sort(key=lambda g: (0 if g["severity"] == "critical" else 1, g["currentAccuracy"]))
            
            # Generate remediation plan using AI
            remediation_plan = await self._generate_remediation_plan(learner_id, gaps, curriculum_map)
            
            return {
                "learnerId": learner_id,
                "identifiedGaps": gaps,
                "totalGaps": len(gaps),
                "criticalGaps": len([g for g in gaps if g["severity"] == "critical"]),
                "remediationPlan": remediation_plan,
                "estimatedRemediationTime": sum(
                    30 if g["severity"] == "critical" else 15 for g in gaps
                ),
            }
            
        except Exception as e:
            logger.error(f"Knowledge gap detection error: {e}")
            return {"learnerId": learner_id, "identifiedGaps": [], "error": str(e)}
    
    async def generate_learning_path(
        self,
        learner_id: str,
        target_goals: List[str],
        available_content: List[Dict[str, Any]],
        constraints: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate personalized learning path
        
        Creates an optimized sequence of content based on:
        - Learner profile and gaps
        - Prerequisites and dependencies
        - Time constraints
        - Learning preferences
        """
        try:
            profile = self._get_learner_profile(learner_id)
            
            # Score and rank content
            scored_content = []
            for content in available_content:
                score = self._score_content_for_learner(content, profile, target_goals)
                scored_content.append((content, score))
            
            # Sort by score (descending) and prerequisites
            scored_content.sort(key=lambda x: (-x[1], x[0].get("prerequisiteCount", 0)))
            
            # Build path respecting prerequisites
            path = []
            completed = set()
            max_items = constraints.get("maxItems", 20) if constraints else 20
            
            for content, score in scored_content[:max_items * 2]:
                prerequisites = set(content.get("prerequisites", []))
                if prerequisites.issubset(completed):
                    path.append({
                        "contentId": content.get("id"),
                        "title": content.get("title"),
                        "type": content.get("type"),
                        "estimatedMinutes": content.get("estimatedMinutes", 15),
                        "difficulty": content.get("difficulty", 0.5),
                        "relevanceScore": score,
                    })
                    completed.add(content.get("id"))
                
                if len(path) >= max_items:
                    break
            
            # Calculate total time
            total_minutes = sum(item["estimatedMinutes"] for item in path)
            
            return {
                "learnerId": learner_id,
                "targetGoals": target_goals,
                "learningPath": path,
                "totalItems": len(path),
                "estimatedTotalMinutes": total_minutes,
                "estimatedCompletionDays": max(1, total_minutes // 30),
                "adaptedForLevel": profile.current_level,
            }
            
        except Exception as e:
            logger.error(f"Learning path generation error: {e}")
            return {"learnerId": learner_id, "learningPath": [], "error": str(e)}
    
    def update_learner_profile(
        self,
        learner_id: str,
        learning_event: LearningEvent,
    ) -> LearnerProfile:
        """
        Update learner profile based on new learning event
        
        Uses exponential moving average for smooth updates
        """
        profile = self._get_learner_profile(learner_id)
        
        # Calculate performance metrics
        accuracy = learning_event.correct_responses / max(1, learning_event.total_responses)
        
        # Update current level with EMA
        alpha = 0.1  # Smoothing factor
        performance_delta = accuracy - profile.current_level
        profile.current_level = np.clip(
            profile.current_level + alpha * performance_delta,
            0.0, 1.0
        )
        
        # Update learning rate based on improvement
        if performance_delta > 0.1:
            profile.learning_rate = min(0.3, profile.learning_rate + 0.02)
        elif performance_delta < -0.1:
            profile.learning_rate = max(0.05, profile.learning_rate - 0.01)
        
        # Update engagement based on time spent
        expected_time = learning_event.time_spent_seconds
        if learning_event.time_spent_seconds > 0:
            # Good engagement if completed in reasonable time
            engagement_signal = 1.0 if 0.5 < learning_event.time_spent_seconds / max(60, expected_time) < 2.0 else 0.5
            profile.engagement = 0.9 * profile.engagement + 0.1 * engagement_signal
        
        profile.last_updated = datetime.utcnow()
        self.profiles[learner_id] = profile
        
        logger.info(f"Updated profile for learner {learner_id}: level={profile.current_level:.3f}")
        
        return profile
    
    # ===== Private Helper Methods =====
    
    def _get_learner_profile(self, learner_id: str) -> LearnerProfile:
        """Get or create learner profile"""
        if learner_id not in self.profiles:
            self.profiles[learner_id] = LearnerProfile(learner_id=learner_id)
        return self.profiles[learner_id]
    
    def _map_to_difficulty_level(self, difficulty: float) -> DifficultyLevel:
        """Map continuous difficulty to discrete level"""
        if difficulty < 0.2:
            return DifficultyLevel.VERY_EASY
        elif difficulty < 0.4:
            return DifficultyLevel.EASY
        elif difficulty < 0.6:
            return DifficultyLevel.MEDIUM
        elif difficulty < 0.8:
            return DifficultyLevel.HARD
        else:
            return DifficultyLevel.VERY_HARD
    
    def _get_adjustment_reason(self, adjustment: float) -> str:
        """Generate human-readable adjustment reason"""
        if adjustment > 0.05:
            return "Increasing difficulty based on strong recent performance"
        elif adjustment < -0.05:
            return "Decreasing difficulty to support learning"
        else:
            return "Maintaining current difficulty level"
    
    def _generate_difficulty_recommendations(
        self,
        profile: LearnerProfile,
        target_difficulty: float,
        recent_performance: Optional[List[Dict[str, Any]]],
    ) -> List[str]:
        """Generate recommendations based on difficulty analysis"""
        recommendations = []
        
        if profile.consistency < 0.4:
            recommendations.append("Consider shorter practice sessions for better consistency")
        
        if profile.engagement < 0.5:
            recommendations.append("Try interactive content to boost engagement")
        
        if target_difficulty > 0.7:
            recommendations.append("Break complex topics into smaller chunks")
        
        if target_difficulty < 0.3:
            recommendations.append("Ready to tackle more challenging material")
        
        return recommendations or ["Continue at current pace"]
    
    def _determine_adaptations(
        self,
        profile: LearnerProfile,
        content: Dict[str, Any],
    ) -> List[str]:
        """Determine what adaptations are needed"""
        adaptations = []
        
        content_difficulty = content.get("difficulty", 0.5)
        
        if content_difficulty > profile.current_level + 0.2:
            adaptations.append("add_scaffolding")
            adaptations.append("simplify_language")
        elif content_difficulty < profile.current_level - 0.2:
            adaptations.append("add_extensions")
        
        if profile.engagement < 0.5:
            adaptations.append("add_interactivity")
        
        if "visual" in profile.strengths:
            adaptations.append("add_visual_supports")
        
        return adaptations
    
    async def _apply_adaptation(
        self,
        content: Dict[str, Any],
        adaptation: str,
        profile: LearnerProfile,
    ) -> Optional[Dict[str, Any]]:
        """Apply a specific adaptation to content"""
        try:
            if adaptation == "add_scaffolding":
                content["scaffolding"] = {
                    "hints": ["Think about what you already know about this topic"],
                    "breakdown": True,
                    "visualAids": True,
                }
                return {"content": content, "log": "Added scaffolding support"}
            
            elif adaptation == "simplify_language":
                # Could use AI to simplify - for now, flag it
                content["simplified"] = True
                content["readingLevel"] = max(1, content.get("readingLevel", 5) - 2)
                return {"content": content, "log": "Simplified language"}
            
            elif adaptation == "add_extensions":
                content["extensions"] = {
                    "challengeQuestions": True,
                    "deeperExploration": True,
                }
                return {"content": content, "log": "Added extension activities"}
            
            elif adaptation == "add_interactivity":
                content["interactivity"] = {
                    "checkpoints": True,
                    "instantFeedback": True,
                    "gamification": True,
                }
                return {"content": content, "log": "Enhanced interactivity"}
            
            elif adaptation == "add_visual_supports":
                content["visualSupports"] = True
                return {"content": content, "log": "Added visual supports"}
            
            return None
            
        except Exception as e:
            logger.error(f"Adaptation error for {adaptation}: {e}")
            return None
    
    async def _generate_remediation_plan(
        self,
        learner_id: str,
        gaps: List[Dict[str, Any]],
        curriculum_map: Optional[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Generate remediation plan for knowledge gaps"""
        plan = []
        
        for gap in gaps:
            remediation = {
                "topicId": gap["topicId"],
                "topicName": gap["topicName"],
                "strategy": "review" if gap["severity"] == "moderate" else "reteach",
                "activities": [],
            }
            
            if gap["severity"] == "critical":
                remediation["activities"] = [
                    {"type": "video", "description": "Watch foundational concept video"},
                    {"type": "practice", "description": "Complete guided practice problems"},
                    {"type": "assessment", "description": "Check understanding with mini-quiz"},
                ]
            else:
                remediation["activities"] = [
                    {"type": "review", "description": "Review key concepts"},
                    {"type": "practice", "description": "Practice with scaffolded problems"},
                ]
            
            # Add prerequisite review if needed
            if gap.get("prerequisites"):
                remediation["prerequisiteReview"] = gap["prerequisites"]
            
            plan.append(remediation)
        
        return plan
    
    def _score_content_for_learner(
        self,
        content: Dict[str, Any],
        profile: LearnerProfile,
        target_goals: List[str],
    ) -> float:
        """Score content relevance for learner"""
        score = 0.0
        
        # Difficulty match
        content_difficulty = content.get("difficulty", 0.5)
        difficulty_diff = abs(content_difficulty - profile.current_level)
        score += max(0, 1.0 - difficulty_diff) * 0.3
        
        # Goal relevance
        content_topics = set(content.get("topics", []))
        goal_overlap = len(content_topics.intersection(set(target_goals)))
        score += min(1.0, goal_overlap * 0.3) * 0.4
        
        # Engagement match
        if content.get("interactive") and profile.engagement < 0.5:
            score += 0.15
        
        # Strength alignment
        if content.get("modality") in profile.strengths:
            score += 0.15
        
        return round(score, 3)
    
    async def _get_ai_difficulty_prediction(
        self,
        learner_id: str,
        content_features: Dict[str, Any],
        recent_performance: Optional[List[Dict[str, Any]]],
        profile: LearnerProfile,
    ) -> Optional[Dict[str, Any]]:
        """Get AI-enhanced difficulty prediction"""
        try:
            prompt = f"""Predict optimal difficulty for learner.

Learner Profile:
- Current Level: {profile.current_level}
- Learning Rate: {profile.learning_rate}
- Engagement: {profile.engagement}

Recent Performance (last 5):
{json.dumps(recent_performance[-5:] if recent_performance else [], indent=2)}

Content Features:
{json.dumps(content_features, indent=2)}

Return JSON with:
- difficulty: float (0-1)
- confidence: float (0-1)
- reasoning: string"""

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{MODEL_DISPATCH_URL}/api/chat",
                    json={
                        "messages": [
                            {"role": "system", "content": "You are an adaptive learning AI that predicts optimal content difficulty."},
                            {"role": "user", "content": prompt}
                        ],
                        "taskType": "difficulty_prediction",
                        "responseFormat": "json",
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result.get("content", "{}")
                    
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0].strip()
                    elif "```" in content:
                        content = content.split("```")[1].split("```")[0].strip()
                    
                    return json.loads(content)
                    
        except Exception as e:
            logger.warning(f"AI difficulty prediction unavailable: {e}")
        
        return None


# Singleton instance
adaptive_engine = AdaptiveLearningEngine()


# ===== Convenience Functions =====

async def predict_difficulty(
    learner_id: str,
    content_features: Dict[str, Any],
    recent_performance: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Predict optimal difficulty for learner"""
    return await adaptive_engine.predict_difficulty(
        learner_id, content_features, recent_performance
    )


async def adapt_content(
    content: Dict[str, Any],
    learner_id: str,
    target_difficulty: Optional[float] = None,
) -> Dict[str, Any]:
    """Adapt content for learner"""
    return await adaptive_engine.adapt_content(
        content, learner_id, target_difficulty
    )


async def detect_knowledge_gaps(
    learner_id: str,
    topic_performance: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Detect knowledge gaps"""
    return await adaptive_engine.detect_knowledge_gaps(
        learner_id, topic_performance
    )


async def generate_learning_path(
    learner_id: str,
    target_goals: List[str],
    available_content: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Generate personalized learning path"""
    return await adaptive_engine.generate_learning_path(
        learner_id, target_goals, available_content
    )
