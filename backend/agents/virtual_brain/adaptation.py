"""
Adaptation Engine - Dynamically adapts content based on learner needs
Author: artpromedia
Date: 2025-11-23
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import random

from core.logging import setup_logging

logger = setup_logging(__name__)


class AdaptationEngine:
    """
    Adapts learning content based on learner profile, state, and performance
    """
    
    def __init__(self, llm: Any, embeddings: Any):
        self.llm = llm
        self.embeddings = embeddings
        self.adaptation_strategies = self._initialize_strategies()
        
        logger.info("Adaptation Engine initialized")
    
    async def calibrate(self, profile: Any, performance_metrics: Dict[str, Any]):
        """
        Calibrate adaptation engine for specific learner
        """
        self.profile = profile
        self.baseline_performance = performance_metrics.copy()
        
        logger.info(f"Adaptation Engine calibrated for learner {profile.id}")
    
    async def adapt(
        self,
        content: Dict[str, Any],
        profile: Any,
        state: Any,
        performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Adapt content based on current learner state and needs
        """
        try:
            adapted_content = content.copy()
            adaptations_applied = []
            
            # Determine which adaptations to apply
            needed_adaptations = self._determine_adaptations(state, performance)
            
            for adaptation_type in needed_adaptations:
                if adaptation_type in self.adaptation_strategies:
                    strategy = self.adaptation_strategies[adaptation_type]
                    adapted_content = await strategy(
                        adapted_content,
                        profile,
                        state,
                        performance
                    )
                    adaptations_applied.append(adaptation_type)
            
            # Add metadata about adaptations
            adapted_content["adaptations"] = {
                "applied": adaptations_applied,
                "timestamp": datetime.utcnow().isoformat(),
                "reason": self._get_adaptation_reason(state, performance),
            }
            
            logger.info(
                f"Content adapted",
                adaptations=adaptations_applied,
                learner_id=profile.id
            )
            
            return adapted_content
            
        except Exception as e:
            logger.error(f"Error adapting content: {str(e)}")
            return content
    
    def _initialize_strategies(self) -> Dict[str, Any]:
        """
        Initialize adaptation strategy functions
        """
        return {
            "reduce_difficulty": self._reduce_difficulty,
            "increase_difficulty": self._increase_difficulty,
            "add_scaffolding": self._add_scaffolding,
            "simplify_language": self._simplify_language,
            "add_visual_aids": self._add_visual_aids,
            "break_into_steps": self._break_into_steps,
            "add_examples": self._add_examples,
            "change_format": self._change_format,
            "add_hints": self._add_hints,
            "reduce_cognitive_load": self._reduce_cognitive_load,
            "increase_engagement": self._increase_engagement,
            "provide_choice": self._provide_choice,
        }
    
    def _determine_adaptations(
        self,
        state: Any,
        performance: Dict[str, Any]
    ) -> List[str]:
        """
        Determine which adaptations are needed
        """
        adaptations = []
        
        # High cognitive load
        if state.cognitive_load > 0.8:
            adaptations.extend(["reduce_difficulty", "break_into_steps", "reduce_cognitive_load"])
        
        # High frustration
        if state.frustration > 0.7:
            adaptations.extend(["add_scaffolding", "add_hints", "simplify_language"])
        
        # Low engagement
        if state.engagement < 0.4:
            adaptations.extend(["increase_engagement", "change_format", "provide_choice"])
        
        # Low confidence
        if state.confidence < 0.3:
            adaptations.extend(["add_scaffolding", "add_examples", "reduce_difficulty"])
        
        # Poor performance
        if performance.get("accuracy", 0.5) < 0.3:
            adaptations.extend(["simplify_language", "break_into_steps", "add_examples"])
        
        # Excellent performance
        if performance.get("accuracy", 0.5) > 0.9 and state.engagement > 0.7:
            adaptations.append("increase_difficulty")
        
        # Fatigue
        if state.fatigue > 0.6:
            adaptations.extend(["reduce_cognitive_load", "change_format"])
        
        # Remove duplicates while preserving order
        seen = set()
        unique_adaptations = []
        for adaptation in adaptations:
            if adaptation not in seen:
                seen.add(adaptation)
                unique_adaptations.append(adaptation)
        
        return unique_adaptations[:3]  # Limit to top 3 adaptations
    
    async def _reduce_difficulty(
        self,
        content: Dict[str, Any],
        profile: Any,
        state: Any,
        performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Reduce content difficulty
        """
        content["difficulty_level"] = max(0.1, content.get("difficulty_level", 0.5) - 0.2)
        
        # Simplify questions
        if "question" in content:
            content["question_simplified"] = True
        
        # Reduce number of steps
        if "steps" in content and len(content["steps"]) > 3:
            content["steps"] = content["steps"][:3]
        
        # Add more guidance
        if "guidance" not in content:
            content["guidance"] = "Let's take this step by step together!"
        
        return content
    
    async def _increase_difficulty(
        self,
        content: Dict[str, Any],
        profile: Any,
        state: Any,
        performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Increase content difficulty for challenge
        """
        content["difficulty_level"] = min(1.0, content.get("difficulty_level", 0.5) + 0.2)
        
        # Add complexity
        if "challenge_mode" not in content:
            content["challenge_mode"] = True
            content["challenge_message"] = "Ready for a challenge? You've got this!"
        
        # Remove some scaffolding
        if "hints" in content:
            content["hints"] = content["hints"][:1]  # Keep only first hint
        
        return content
    
    async def _add_scaffolding(
        self,
        content: Dict[str, Any],
        profile: Any,
        state: Any,
        performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Add scaffolding and support structures
        """
        # Add step-by-step guidance
        if "scaffolding" not in content:
            content["scaffolding"] = {
                "enabled": True,
                "prompts": [
                    "Let's start with what you already know",
                    "What do you think the first step should be?",
                    "Great! Now let's try the next part",
                ],
                "checkpoints": True,
            }
        
        # Add worked examples
        if "worked_example" not in content:
            content["worked_example"] = {
                "provided": True,
                "similar_to_task": True,
            }
        
        return content
    
    async def _simplify_language(
        self,
        content: Dict[str, Any],
        profile: Any,
        state: Any,
        performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Simplify language for better comprehension
        """
        # Mark for language simplification
        content["language_level"] = "simplified"
        content["reading_level"] = max(1, profile.age - 2)  # 2 years below age
        
        # Add definitions for complex terms
        if "glossary" not in content:
            content["glossary"] = {
                "enabled": True,
                "inline_definitions": True,
            }
        
        return content
    
    async def _add_visual_aids(
        self,
        content: Dict[str, Any],
        profile: Any,
        state: Any,
        performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Add visual aids for visual learners
        """
        if profile.learning_style.value == "visual" or profile.learning_style.value == "multimodal":
            content["visual_aids"] = {
                "diagrams": True,
                "images": True,
                "color_coding": True,
                "spatial_organization": True,
            }
            
            # Add visual instructions
            content["instruction_format"] = "visual"
        
        return content
    
    async def _break_into_steps(
        self,
        content: Dict[str, Any],
        profile: Any,
        state: Any,
        performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Break content into smaller, manageable steps
        """
        content["chunked"] = True
        content["step_by_step"] = True
        
        # If steps exist, ensure they're small
        if "steps" in content and len(content["steps"]) > 5:
            # Group steps into micro-steps
            content["micro_steps"] = True
            content["one_at_a_time"] = True
        
        # Add progress indicators
        content["show_progress"] = True
        
        return content
    
    async def _add_examples(
        self,
        content: Dict[str, Any],
        profile: Any,
        state: Any,
        performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Add relevant examples
        """
        # Add examples related to learner's interests
        interests = profile.interests if profile.interests else ["general"]
        
        content["examples"] = {
            "provided": True,
            "count": 2,
            "related_to_interests": interests,
            "concrete": True,  # Use concrete vs abstract examples
        }
        
        # Add practice problems with examples
        content["guided_practice"] = True
        
        return content
    
    async def _change_format(
        self,
        content: Dict[str, Any],
        profile: Any,
        state: Any,
        performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Change content format to boost engagement
        """
        current_format = content.get("format", "standard")
        
        # Suggest alternative formats
        alternative_formats = ["game", "story", "puzzle", "interactive", "hands-on"]
        
        if profile.age < 12:
            new_format = random.choice(["game", "story", "interactive"])
        else:
            new_format = random.choice(alternative_formats)
        
        content["format"] = new_format
        content["format_changed"] = True
        content["previous_format"] = current_format
        
        return content
    
    async def _add_hints(
        self,
        content: Dict[str, Any],
        profile: Any,
        state: Any,
        performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Add progressive hints
        """
        if "hints" not in content:
            content["hints"] = [
                {"level": 1, "text": "Think about what you already know about this topic"},
                {"level": 2, "text": "Let's break this down into smaller parts"},
                {"level": 3, "text": "Here's a similar example to help you"},
            ]
        
        content["hint_system"] = {
            "enabled": True,
            "progressive": True,
            "on_demand": True,
        }
        
        return content
    
    async def _reduce_cognitive_load(
        self,
        content: Dict[str, Any],
        profile: Any,
        state: Any,
        performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Reduce cognitive load
        """
        # Simplify presentation
        content["minimal_distractions"] = True
        content["focused_content"] = True
        
        # Reduce information density
        content["information_density"] = "low"
        
        # Add white space and organization
        content["visual_organization"] = {
            "clear_sections": True,
            "white_space": True,
            "single_focus": True,
        }
        
        # Limit simultaneous concepts
        content["concepts_per_interaction"] = 1
        
        return content
    
    async def _increase_engagement(
        self,
        content: Dict[str, Any],
        profile: Any,
        state: Any,
        performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Increase engagement through various strategies
        """
        # Add gamification elements
        content["gamification"] = {
            "points": True,
            "badges": True,
            "progress_bar": True,
            "celebrations": True,
        }
        
        # Add interactive elements
        content["interactive"] = True
        
        # Connect to interests
        if profile.interests:
            content["personalization"] = {
                "interests": profile.interests,
                "themed": True,
            }
        
        # Add variety
        content["variety"] = {
            "mixed_activities": True,
            "surprise_elements": True,
        }
        
        return content
    
    async def _provide_choice(
        self,
        content: Dict[str, Any],
        profile: Any,
        state: Any,
        performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Provide learner choice for autonomy
        """
        content["choices"] = {
            "enabled": True,
            "options": [
                {"id": 1, "label": "Practice more examples"},
                {"id": 2, "label": "Try a challenge problem"},
                {"id": 3, "label": "Watch a video explanation"},
                {"id": 4, "label": "Move to next topic"},
            ],
            "allows_preference": True,
        }
        
        return content
    
    def _get_adaptation_reason(
        self,
        state: Any,
        performance: Dict[str, Any]
    ) -> str:
        """
        Generate human-readable reason for adaptation
        """
        reasons = []
        
        if state.cognitive_load > 0.8:
            reasons.append("high cognitive load")
        if state.frustration > 0.7:
            reasons.append("frustration detected")
        if state.engagement < 0.4:
            reasons.append("low engagement")
        if state.fatigue > 0.6:
            reasons.append("fatigue")
        if performance.get("accuracy", 0.5) < 0.3:
            reasons.append("difficulty with content")
        if performance.get("accuracy", 0.5) > 0.9:
            reasons.append("ready for more challenge")
        
        if reasons:
            return "Adapted due to: " + ", ".join(reasons)
        else:
            return "Proactive adaptation for optimal learning"
