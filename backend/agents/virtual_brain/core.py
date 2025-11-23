"""
Virtual Brain Core - The heart of AIVO Learning's AI system
Author: artpromedia
Date: 2025-11-23
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import json
import asyncio
from uuid import uuid4
import numpy as np
from pydantic import BaseModel, Field
from enum import Enum

from langchain.chat_models import ChatOpenAI
from langchain.embeddings import OpenAIEmbeddings
from langchain.memory import ConversationSummaryBufferMemory
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate, ChatPromptTemplate, MessagesPlaceholder
from langchain.callbacks import AsyncCallbackHandler
from langchain.schema import HumanMessage, AIMessage, SystemMessage

from core.config import settings
from core.logging import setup_logging
from services.cache.redis_client import redis_client
from db.models.learner import Learner
from agents.virtual_brain.memory import MemoryManager
from agents.virtual_brain.adaptation import AdaptationEngine
from agents.virtual_brain.performance import PerformanceAnalyzer

logger = setup_logging(__name__)


class LearningStyle(str, Enum):
    VISUAL = "visual"
    AUDITORY = "auditory"
    KINESTHETIC = "kinesthetic"
    READING_WRITING = "reading_writing"
    MULTIMODAL = "multimodal"


class CognitiveState(BaseModel):
    """Current cognitive and emotional state of learner"""
    cognitive_load: float = Field(default=0.5, ge=0.0, le=1.0)
    engagement: float = Field(default=1.0, ge=0.0, le=1.0)
    frustration: float = Field(default=0.0, ge=0.0, le=1.0)
    fatigue: float = Field(default=0.0, ge=0.0, le=1.0)
    confidence: float = Field(default=0.7, ge=0.0, le=1.0)
    motivation: float = Field(default=0.8, ge=0.0, le=1.0)
    attention_span: float = Field(default=1.0, ge=0.0, le=1.0)
    needs_break: bool = False
    recommended_action: str = "continue"
    last_break: datetime = Field(default_factory=datetime.utcnow)
    session_start: datetime = Field(default_factory=datetime.utcnow)
    activities_completed: int = 0


class LearnerProfile(BaseModel):
    """Comprehensive learner profile for Virtual Brain"""
    id: str
    first_name: str
    last_name: str
    age: int
    grade_level: str
    learning_style: LearningStyle
    diagnoses: List[str] = []
    strengths: List[str] = []
    challenges: List[str] = []
    interests: List[str] = []
    accommodations: List[str] = []
    iep_goals: List[Dict[str, Any]] = []
    preferred_difficulty: float = Field(default=0.5, ge=0.0, le=1.0)
    preferred_pace: str = "moderate"
    language: str = "en"
    timezone: str = "UTC"


class VirtualBrain:
    """
    AIVO Learning's Virtual Brain - Personalized AI agent for each learner
    Provides adaptive, intelligent tutoring tailored to individual needs
    """
    
    def __init__(self, learner_id: str):
        self.id = f"vb_{learner_id}_{uuid4().hex[:8]}"
        self.learner_id = learner_id
        self.profile: Optional[LearnerProfile] = None
        self.initialized = False
        
        # Initialize LLM
        self.llm = ChatOpenAI(
            model=settings.OPENAI_MODEL,
            temperature=settings.VIRTUAL_BRAIN_TEMPERATURE,
            max_tokens=settings.VIRTUAL_BRAIN_CONTEXT_WINDOW,
            openai_api_key=settings.OPENAI_API_KEY,
            openai_organization=settings.OPENAI_ORG_ID,
            callbacks=[self.StreamingCallback()],
        )
        
        # Initialize embeddings for semantic understanding
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=settings.OPENAI_API_KEY,
        )
        
        # Initialize memory system
        self.memory_manager = MemoryManager(learner_id)
        self.conversation_memory = ConversationSummaryBufferMemory(
            llm=self.llm,
            max_token_limit=settings.VIRTUAL_BRAIN_MAX_MEMORY,
            return_messages=True,
            memory_key="chat_history",
        )
        
        # Initialize specialized engines
        self.adaptation_engine = AdaptationEngine(self.llm, self.embeddings)
        self.performance_analyzer = PerformanceAnalyzer(learner_id)
        
        # State management
        self.cognitive_state = CognitiveState()
        self.performance_metrics = {
            "accuracy": 0.5,
            "speed": 1.0,
            "consistency": 1.0,
            "improvement_rate": 0.0,
            "mastery_levels": {},
            "skill_progress": {},
            "learning_velocity": 1.0,
        }
        
        # Session tracking
        self.current_session = {
            "id": uuid4().hex,
            "start_time": datetime.utcnow(),
            "interactions": [],
            "adaptations_made": [],
            "feedback_given": [],
        }
        
        logger.info(f"Virtual Brain created for learner {learner_id}", 
                   brain_id=self.id)
    
    async def initialize(self, learner_data: Dict[str, Any]) -> bool:
        """
        Initialize Virtual Brain with learner profile and historical data
        """
        try:
            # Create learner profile
            self.profile = LearnerProfile(**learner_data)
            
            # Load historical performance data
            historical_data = await self._load_historical_data()
            if historical_data:
                self.performance_metrics.update(historical_data.get("performance", {}))
                logger.info(f"Loaded historical data for learner {self.learner_id}")
            
            # Initialize memory with learner context
            await self.memory_manager.initialize(self.profile)
            
            # Set up personalized system prompt
            self.system_prompt = await self._create_system_prompt()
            
            # Calibrate adaptation engine
            await self.adaptation_engine.calibrate(self.profile, self.performance_metrics)
            
            self.initialized = True
            
            logger.info(
                f"Virtual Brain initialized successfully",
                brain_id=self.id,
                learner_id=self.learner_id,
                profile=self.profile.dict()
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Virtual Brain: {str(e)}", 
                        brain_id=self.id, error=str(e))
            return False
    
    async def process_interaction(
        self,
        interaction_type: str,
        content: Dict[str, Any],
        learner_response: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process a learning interaction and provide intelligent response
        """
        if not self.initialized:
            raise RuntimeError("Virtual Brain not initialized")
        
        start_time = datetime.utcnow()
        
        try:
            # Analyze current performance
            performance_analysis = await self.performance_analyzer.analyze(
                interaction_type,
                content,
                learner_response,
                context
            )
            
            # Update performance metrics
            self._update_performance_metrics(performance_analysis)
            
            # Detect cognitive state
            state_analysis = await self._analyze_cognitive_state(
                interaction_type,
                performance_analysis
            )
            
            # Check if adaptation is needed
            needs_adaptation = self._check_adaptation_triggers(state_analysis)
            
            # Adapt content if necessary
            if needs_adaptation:
                adapted_content = await self.adaptation_engine.adapt(
                    content=content,
                    profile=self.profile,
                    state=self.cognitive_state,
                    performance=self.performance_metrics
                )
                adaptation_applied = True
            else:
                adapted_content = content
                adaptation_applied = False
            
            # Generate personalized response
            ai_response = await self._generate_response(
                interaction_type=interaction_type,
                content=adapted_content,
                learner_response=learner_response,
                state=state_analysis,
                performance=performance_analysis
            )
            
            # Generate feedback if learner provided response
            feedback = None
            if learner_response:
                feedback = await self._generate_feedback(
                    learner_response=learner_response,
                    expected_response=content.get("expected_answer"),
                    performance=performance_analysis
                )
            
            # Get learning recommendations
            recommendations = await self._generate_recommendations(
                state_analysis,
                performance_analysis
            )
            
            # Update memory
            await self._update_memory(
                interaction_type=interaction_type,
                content=content,
                response=learner_response,
                ai_response=ai_response,
                feedback=feedback
            )
            
            # Track interaction
            interaction_data = {
                "timestamp": start_time.isoformat(),
                "type": interaction_type,
                "content_id": content.get("id"),
                "response": learner_response,
                "adaptation_applied": adaptation_applied,
                "state": state_analysis,
                "performance": performance_analysis,
            }
            self.current_session["interactions"].append(interaction_data)
            
            # Save state periodically
            if len(self.current_session["interactions"]) % 5 == 0:
                await self._save_state()
            
            # Calculate processing time
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            result = {
                "success": True,
                "brain_id": self.id,
                "adapted_content": adapted_content,
                "ai_response": ai_response,
                "feedback": feedback,
                "state": state_analysis,
                "performance": performance_analysis,
                "recommendations": recommendations,
                "adaptation_applied": adaptation_applied,
                "processing_time": processing_time,
                "session_id": self.current_session["id"],
            }
            
            logger.info(
                "Interaction processed successfully",
                brain_id=self.id,
                interaction_type=interaction_type,
                processing_time=processing_time
            )
            
            return result
            
        except Exception as e:
            logger.error(
                f"Error processing interaction: {str(e)}",
                brain_id=self.id,
                interaction_type=interaction_type,
                error=str(e)
            )
            
            return {
                "success": False,
                "error": str(e),
                "brain_id": self.id,
            }
    
    async def _create_system_prompt(self) -> str:
        """
        Create personalized system prompt for the Virtual Brain
        """
        diagnoses_str = ", ".join(self.profile.diagnoses) if self.profile.diagnoses else "none"
        accommodations_str = ", ".join(self.profile.accommodations) if self.profile.accommodations else "none"
        
        prompt = f"""You are AIVO, a personalized AI learning companion for {self.profile.first_name}.

Student Profile:
- Age: {self.profile.age} years old
- Grade Level: {self.profile.grade_level}
- Learning Style: {self.profile.learning_style.value}
- Diagnoses: {diagnoses_str}
- Accommodations Needed: {accommodations_str}
- Strengths: {', '.join(self.profile.strengths)}
- Challenges: {', '.join(self.profile.challenges)}
- Interests: {', '.join(self.profile.interests)}

Your Role:
1. Provide personalized, adaptive learning support
2. Use age-appropriate language and examples
3. Be encouraging, patient, and supportive
4. Adapt your teaching style to match their learning preferences
5. Provide clear, structured explanations
6. Celebrate successes and normalize mistakes as learning opportunities
7. Monitor for frustration and provide breaks when needed
8. Use their interests to make learning engaging
9. Provide scaffolding and support based on their needs
10. Always maintain a positive, growth mindset approach

Communication Guidelines:
- Keep responses concise and clear
- Use simple language appropriate for their age
- Break complex concepts into smaller steps
- Use visual descriptions for visual learners
- Provide examples related to their interests
- Offer encouragement and positive reinforcement
- Check for understanding frequently

Remember: Every child can learn, and your role is to find the best way to help {self.profile.first_name} succeed."""
        
        return prompt
    
    async def _generate_response(
        self,
        interaction_type: str,
        content: Dict[str, Any],
        learner_response: Optional[str],
        state: Dict[str, Any],
        performance: Dict[str, Any]
    ) -> str:
        """
        Generate intelligent, personalized response
        """
        # Create context-aware prompt
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=self.system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessage(content=f"""
Interaction Type: {interaction_type}
Content: {json.dumps(content, indent=2)}
Learner Response: {learner_response if learner_response else "No response yet"}
Current State: Engagement: {state.get('engagement', 0):.0%}, Frustration: {state.get('frustration', 0):.0%}
Performance: Accuracy: {performance.get('accuracy', 0):.0%}

Provide an appropriate response that:
1. Addresses the current learning content
2. Considers their emotional state
3. Provides appropriate support
4. Maintains engagement
5. Uses their preferred learning style

Response:""")
        ])
        
        # Create chain with memory
        chain = LLMChain(
            llm=self.llm,
            prompt=prompt,
            memory=self.conversation_memory,
            verbose=settings.DEBUG
        )
        
        # Generate response
        response = await chain.arun({})
        
        return response.strip()
    
    async def _generate_feedback(
        self,
        learner_response: str,
        expected_response: Optional[str],
        performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate detailed, constructive feedback
        """
        is_correct = False
        if expected_response:
            # Simple comparison for now, can be enhanced with NLP
            is_correct = learner_response.lower().strip() == expected_response.lower().strip()
        
        prompt = f"""
Provide encouraging feedback for {self.profile.first_name} (age {self.profile.age}):

Their answer: {learner_response}
Expected answer: {expected_response if expected_response else "Open-ended question"}
Correct: {is_correct}

Generate feedback that:
1. Acknowledges their effort
2. {"Celebrates their success" if is_correct else "Provides gentle correction"}
3. {"Reinforces the learning" if is_correct else "Offers a helpful hint"}
4. Encourages continued learning
5. Uses age-appropriate language

Feedback:"""
        
        feedback_text = await self.llm.apredict(prompt)
        
        return {
            "text": feedback_text.strip(),
            "is_correct": is_correct,
            "performance_impact": performance,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def _analyze_cognitive_state(
        self,
        interaction_type: str,
        performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze and update cognitive state based on performance
        """
        # Calculate various state metrics
        error_rate = 1.0 - performance.get("accuracy", 0.5)
        response_time = performance.get("response_time", 0)
        consecutive_errors = performance.get("consecutive_errors", 0)
        time_since_break = (datetime.utcnow() - self.cognitive_state.last_break).seconds / 60
        session_duration = (datetime.utcnow() - self.cognitive_state.session_start).seconds / 60
        
        # Update cognitive load
        self.cognitive_state.cognitive_load = min(1.0, 
            error_rate * 0.3 + 
            (response_time / 30) * 0.2 + 
            (self.cognitive_state.activities_completed * 0.02) +
            (session_duration / 60) * 0.2
        )
        
        # Update engagement
        self.cognitive_state.engagement = max(0.0, min(1.0,
            1.0 - 
            (performance.get("distractions", 0) * 0.15) -
            (performance.get("help_requests", 0) * 0.1) -
            (consecutive_errors * 0.1)
        ))
        
        # Update frustration
        self.cognitive_state.frustration = min(1.0,
            consecutive_errors * 0.25 +
            error_rate * 0.25 +
            (performance.get("retries", 0) * 0.15)
        )
        
        # Update fatigue
        self.cognitive_state.fatigue = min(1.0,
            (session_duration / 45) * 0.5 +  # Increases over 45 minutes
            (self.cognitive_state.activities_completed / 20) * 0.3 +
            self.cognitive_state.cognitive_load * 0.2
        )
        
        # Update confidence
        self.cognitive_state.confidence = max(0.0, min(1.0,
            performance.get("accuracy", 0.5) * 0.4 +
            (1.0 - self.cognitive_state.frustration) * 0.3 +
            self.cognitive_state.confidence * 0.3  # Momentum
        ))
        
        # Update motivation
        self.cognitive_state.motivation = max(0.0, min(1.0,
            self.cognitive_state.engagement * 0.3 +
            self.cognitive_state.confidence * 0.3 +
            (1.0 - self.cognitive_state.frustration) * 0.2 +
            (1.0 - self.cognitive_state.fatigue) * 0.2
        ))
        
        # Check if break is needed
        self.cognitive_state.needs_break = (
            self.cognitive_state.fatigue > 0.7 or
            self.cognitive_state.frustration > 0.8 or
            time_since_break > settings.BREAK_REMINDER_MINUTES or
            self.cognitive_state.cognitive_load > 0.85 or
            session_duration > settings.SESSION_TIMEOUT_MINUTES
        )
        
        # Determine recommended action
        self.cognitive_state.recommended_action = self._determine_recommended_action()
        
        # Increment activity counter
        self.cognitive_state.activities_completed += 1
        
        # Return state summary
        return self.cognitive_state.dict()
    
    def _determine_recommended_action(self) -> str:
        """
        Determine the best action based on current state
        """
        if self.cognitive_state.needs_break:
            return "take_break"
        elif self.cognitive_state.frustration > 0.7:
            return "provide_hint"
        elif self.cognitive_state.cognitive_load > 0.8:
            return "reduce_difficulty"
        elif self.cognitive_state.engagement < 0.3:
            return "switch_activity"
        elif self.cognitive_state.fatigue > 0.6:
            return "light_activity"
        elif self.cognitive_state.motivation < 0.3:
            return "motivational_boost"
        elif self.cognitive_state.confidence < 0.3:
            return "confidence_building"
        else:
            return "continue"
    
    def _check_adaptation_triggers(self, state: Dict[str, Any]) -> bool:
        """
        Check if content adaptation is needed based on triggers
        """
        return (
            state.get("cognitive_load", 0) > settings.ADAPTATION_THRESHOLD or
            state.get("engagement", 1) < (1 - settings.ADAPTATION_THRESHOLD) or
            state.get("frustration", 0) > settings.ADAPTATION_THRESHOLD * 0.8 or
            state.get("needs_break", False) or
            state.get("recommended_action") != "continue"
        )
    
    def _update_performance_metrics(self, analysis: Dict[str, Any]):
        """
        Update performance metrics with new analysis
        """
        # Use exponential moving average for smooth updates
        alpha = 0.3  # Learning rate
        
        for key in ["accuracy", "speed", "consistency"]:
            if key in analysis:
                current = self.performance_metrics.get(key, 0.5)
                self.performance_metrics[key] = alpha * analysis[key] + (1 - alpha) * current
        
        # Update improvement rate
        if "improvement" in analysis:
            self.performance_metrics["improvement_rate"] = analysis["improvement"]
        
        # Update mastery levels for specific skills
        if "skill" in analysis and "mastery" in analysis:
            skill = analysis["skill"]
            mastery = analysis["mastery"]
            self.performance_metrics["mastery_levels"][skill] = mastery
    
    async def _generate_recommendations(
        self,
        state: Dict[str, Any],
        performance: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate intelligent recommendations for next steps
        """
        recommendations = []
        
        # Break recommendation
        if state.get("needs_break"):
            recommendations.append({
                "type": "break",
                "priority": "high",
                "duration_minutes": 5,
                "activity": "movement_break",
                "message": f"Great job, {self.profile.first_name}! Time for a quick break to recharge!",
                "reason": "Fatigue or frustration detected"
            })
        
        # Difficulty adjustment
        if state.get("frustration", 0) > 0.7:
            recommendations.append({
                "type": "difficulty_adjustment",
                "priority": "high",
                "direction": "decrease",
                "amount": 0.3,
                "message": "Let's try something a bit easier",
                "reason": "High frustration level"
            })
        elif performance.get("accuracy", 0) > 0.9 and state.get("engagement", 0) > 0.7:
            recommendations.append({
                "type": "difficulty_adjustment",
                "priority": "medium",
                "direction": "increase",
                "amount": 0.2,
                "message": "You're doing great! Ready for a challenge?",
                "reason": "High performance and engagement"
            })
        
        # Content type recommendation
        if state.get("engagement", 1) < 0.4:
            content_type = "game" if self.profile.age < 12 else "interactive"
            recommendations.append({
                "type": "content_change",
                "priority": "medium",
                "suggestion": content_type,
                "message": f"Let's try something more {content_type}!",
                "reason": "Low engagement detected"
            })
        
        # Motivational boost
        if state.get("motivation", 1) < 0.4:
            recommendations.append({
                "type": "motivational",
                "priority": "medium",
                "action": "achievement_review",
                "message": "Let's look at all the amazing progress you've made!",
                "reason": "Low motivation detected"
            })
        
        # Subject recommendation based on performance
        if performance.get("consecutive_successes", 0) > 5:
            recommendations.append({
                "type": "advancement",
                "priority": "low",
                "action": "next_topic",
                "message": "You've mastered this! Ready for something new?",
                "reason": "Consistent success"
            })
        
        return recommendations
    
    async def _update_memory(
        self,
        interaction_type: str,
        content: Dict[str, Any],
        response: Optional[str],
        ai_response: str,
        feedback: Optional[Dict[str, Any]]
    ):
        """
        Update Virtual Brain's memory systems
        """
        # Update conversation memory
        await self.conversation_memory.save_context(
            {"input": f"{interaction_type}: {content.get('question', content.get('title', ''))}"},
            {"output": ai_response}
        )
        
        # Update long-term memory
        memory_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "interaction_type": interaction_type,
            "content_summary": content.get("title", ""),
            "topic": content.get("topic", ""),
            "skill": content.get("skill", ""),
            "learner_response": response,
            "ai_response": ai_response[:200],  # Truncate for storage
            "feedback": feedback,
            "state": self.cognitive_state.dict(),
            "performance": self.performance_metrics.copy(),
        }
        
        await self.memory_manager.add_memory(memory_entry)
    
    async def _load_historical_data(self) -> Optional[Dict[str, Any]]:
        """
        Load historical performance data from storage
        """
        try:
            key = f"learner:{self.learner_id}:performance"
            data = await redis_client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Error loading historical data: {str(e)}")
            return None
    
    async def _save_state(self):
        """
        Save current state to persistent storage
        """
        try:
            state_data = {
                "brain_id": self.id,
                "cognitive_state": self.cognitive_state.dict(),
                "performance_metrics": self.performance_metrics,
                "session": {
                    "id": self.current_session["id"],
                    "start_time": self.current_session["start_time"].isoformat(),
                    "interactions_count": len(self.current_session["interactions"]),
                    "adaptations_count": len(self.current_session["adaptations_made"]),
                },
                "last_updated": datetime.utcnow().isoformat(),
            }
            
            # Save to Redis with expiration
            key = f"learner:{self.learner_id}:state"
            await redis_client.set(
                key,
                json.dumps(state_data),
                ex=86400  # 24 hour expiration
            )
            
            # Also save performance metrics separately for historical analysis
            perf_key = f"learner:{self.learner_id}:performance"
            await redis_client.set(
                perf_key,
                json.dumps({"performance": self.performance_metrics}),
                ex=2592000  # 30 day expiration
            )
            
            logger.debug(f"State saved for learner {self.learner_id}")
            
        except Exception as e:
            logger.error(f"Error saving state: {str(e)}")
    
    async def end_session(self) -> Dict[str, Any]:
        """
        End the current learning session and generate summary
        """
        session_end = datetime.utcnow()
        session_duration = (session_end - self.current_session["start_time"]).seconds / 60
        
        # Generate session summary
        summary = {
            "session_id": self.current_session["id"],
            "learner_id": self.learner_id,
            "brain_id": self.id,
            "start_time": self.current_session["start_time"].isoformat(),
            "end_time": session_end.isoformat(),
            "duration_minutes": session_duration,
            "interactions_count": len(self.current_session["interactions"]),
            "adaptations_made": len(self.current_session["adaptations_made"]),
            "final_state": self.cognitive_state.dict(),
            "final_performance": self.performance_metrics.copy(),
            "recommendations": await self._generate_recommendations(
                self.cognitive_state.dict(),
                self.performance_metrics
            ),
        }
        
        # Save session summary
        await self._save_session_summary(summary)
        
        # Save final state
        await self._save_state()
        
        # Clear session data
        self.current_session = {
            "id": uuid4().hex,
            "start_time": datetime.utcnow(),
            "interactions": [],
            "adaptations_made": [],
            "feedback_given": [],
        }
        
        logger.info(
            f"Session ended for learner {self.learner_id}",
            session_id=summary["session_id"],
            duration=session_duration
        )
        
        return summary
    
    async def _save_session_summary(self, summary: Dict[str, Any]):
        """
        Save session summary to database
        """
        # This would save to PostgreSQL via SQLAlchemy
        # For now, save to Redis
        key = f"session:{summary['session_id']}"
        await redis_client.set(
            key,
            json.dumps(summary),
            ex=604800  # 7 day expiration
        )
    
    class StreamingCallback(AsyncCallbackHandler):
        """
        Callback handler for streaming LLM responses
        """
        async def on_llm_new_token(self, token: str, **kwargs) -> None:
            # Can be used to stream tokens to frontend via WebSocket
            pass
