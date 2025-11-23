"""
Memory Manager - Manages Virtual Brain's memory systems
Author: artpromedia
Date: 2025-11-23
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json
import numpy as np
from collections import deque

from core.logging import setup_logging
from services.cache.redis_client import redis_client

logger = setup_logging(__name__)


class MemoryManager:
    """
    Manages short-term and long-term memory for Virtual Brain
    Implements memory consolidation and retrieval strategies
    """
    
    def __init__(self, learner_id: str):
        self.learner_id = learner_id
        self.short_term_memory = deque(maxlen=50)  # Recent interactions
        self.working_memory = {}  # Current context
        self.episodic_memory = []  # Significant events
        self.semantic_memory = {}  # Learned facts and concepts
        
        logger.info(f"Memory Manager initialized for learner {learner_id}")
    
    async def initialize(self, profile: Any):
        """
        Initialize memory with learner profile and historical data
        """
        try:
            # Load existing memories from storage
            await self._load_memories()
            
            # Initialize working memory with profile
            self.working_memory = {
                "learner_profile": profile.dict(),
                "current_topic": None,
                "current_skill": None,
                "recent_mistakes": [],
                "recent_successes": [],
                "active_goals": [],
            }
            
            logger.info(f"Memory initialized for learner {self.learner_id}")
            
        except Exception as e:
            logger.error(f"Failed to initialize memory: {str(e)}")
            raise
    
    async def add_memory(self, memory_entry: Dict[str, Any]):
        """
        Add a new memory entry and process it
        """
        try:
            # Add to short-term memory
            self.short_term_memory.append(memory_entry)
            
            # Update working memory
            await self._update_working_memory(memory_entry)
            
            # Check if this should be consolidated to long-term memory
            if self._is_significant_event(memory_entry):
                await self._consolidate_to_episodic(memory_entry)
            
            # Extract semantic information
            await self._extract_semantic_knowledge(memory_entry)
            
            # Periodically save memories
            if len(self.short_term_memory) % 10 == 0:
                await self._save_memories()
            
            logger.debug(f"Memory added for learner {self.learner_id}")
            
        except Exception as e:
            logger.error(f"Error adding memory: {str(e)}")
    
    async def retrieve_relevant_memories(
        self,
        query: str,
        context: Dict[str, Any],
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Retrieve memories relevant to current query/context
        """
        relevant_memories = []
        
        try:
            # Search short-term memory
            for memory in reversed(self.short_term_memory):
                if self._is_relevant(memory, query, context):
                    relevant_memories.append(memory)
                    if len(relevant_memories) >= limit:
                        break
            
            # Search episodic memory if needed
            if len(relevant_memories) < limit:
                for memory in reversed(self.episodic_memory):
                    if self._is_relevant(memory, query, context):
                        relevant_memories.append(memory)
                        if len(relevant_memories) >= limit:
                            break
            
            # Search semantic memory for relevant concepts
            topic = context.get("topic")
            if topic and topic in self.semantic_memory:
                semantic_info = {
                    "type": "semantic",
                    "content": self.semantic_memory[topic],
                    "timestamp": datetime.utcnow().isoformat()
                }
                relevant_memories.insert(0, semantic_info)
            
            logger.debug(
                f"Retrieved {len(relevant_memories)} relevant memories",
                learner_id=self.learner_id
            )
            
            return relevant_memories
            
        except Exception as e:
            logger.error(f"Error retrieving memories: {str(e)}")
            return []
    
    async def get_learning_history(
        self,
        topic: Optional[str] = None,
        skill: Optional[str] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get learning history for specific topic/skill
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            history = {
                "interactions": [],
                "successes": 0,
                "failures": 0,
                "average_accuracy": 0.0,
                "total_time_minutes": 0,
                "topics_covered": set(),
                "skills_practiced": set(),
            }
            
            # Filter memories by topic/skill and date
            relevant_memories = []
            for memory in list(self.short_term_memory) + self.episodic_memory:
                memory_date = datetime.fromisoformat(memory.get("timestamp", ""))
                
                if memory_date < cutoff_date:
                    continue
                
                if topic and memory.get("topic") != topic:
                    continue
                
                if skill and memory.get("skill") != skill:
                    continue
                
                relevant_memories.append(memory)
            
            # Calculate statistics
            if relevant_memories:
                accuracies = []
                for memory in relevant_memories:
                    history["interactions"].append({
                        "timestamp": memory.get("timestamp"),
                        "type": memory.get("interaction_type"),
                        "topic": memory.get("topic"),
                        "skill": memory.get("skill"),
                    })
                    
                    if memory.get("topic"):
                        history["topics_covered"].add(memory["topic"])
                    if memory.get("skill"):
                        history["skills_practiced"].add(memory["skill"])
                    
                    # Count successes/failures
                    if memory.get("feedback"):
                        if memory["feedback"].get("is_correct"):
                            history["successes"] += 1
                        else:
                            history["failures"] += 1
                    
                    # Track accuracy
                    if memory.get("performance", {}).get("accuracy"):
                        accuracies.append(memory["performance"]["accuracy"])
                
                if accuracies:
                    history["average_accuracy"] = sum(accuracies) / len(accuracies)
            
            # Convert sets to lists for JSON serialization
            history["topics_covered"] = list(history["topics_covered"])
            history["skills_practiced"] = list(history["skills_practiced"])
            
            return history
            
        except Exception as e:
            logger.error(f"Error getting learning history: {str(e)}")
            return {}
    
    async def get_working_memory(self) -> Dict[str, Any]:
        """
        Get current working memory context
        """
        return self.working_memory.copy()
    
    async def update_working_memory(self, updates: Dict[str, Any]):
        """
        Update working memory with new context
        """
        self.working_memory.update(updates)
    
    async def clear_working_memory(self):
        """
        Clear working memory (e.g., when switching topics)
        """
        preserved_items = ["learner_profile"]
        preserved = {k: v for k, v in self.working_memory.items() if k in preserved_items}
        
        self.working_memory = preserved
        self.working_memory.update({
            "current_topic": None,
            "current_skill": None,
            "recent_mistakes": [],
            "recent_successes": [],
        })
    
    def _is_significant_event(self, memory: Dict[str, Any]) -> bool:
        """
        Determine if a memory should be consolidated to episodic memory
        """
        # Significant events include:
        # - First time learning a concept
        # - Major breakthroughs
        # - Repeated failures (to remember struggles)
        # - Completing milestones
        # - Strong emotional responses
        
        interaction_type = memory.get("interaction_type", "")
        state = memory.get("state", {})
        performance = memory.get("performance", {})
        
        # High frustration or breakthrough moments
        if state.get("frustration", 0) > 0.8 or state.get("confidence", 0) > 0.9:
            return True
        
        # Very good or very bad performance
        if performance.get("accuracy", 0.5) < 0.2 or performance.get("accuracy", 0.5) > 0.95:
            return True
        
        # Achievement or milestone
        if interaction_type in ["achievement", "milestone", "assessment_complete"]:
            return True
        
        return False
    
    async def _consolidate_to_episodic(self, memory: Dict[str, Any]):
        """
        Move significant memory to episodic (long-term) memory
        """
        self.episodic_memory.append(memory)
        
        # Keep episodic memory limited
        if len(self.episodic_memory) > 1000:
            self.episodic_memory = self.episodic_memory[-1000:]
        
        logger.debug(f"Memory consolidated to episodic storage", learner_id=self.learner_id)
    
    async def _extract_semantic_knowledge(self, memory: Dict[str, Any]):
        """
        Extract and store semantic knowledge from memory
        """
        topic = memory.get("topic")
        skill = memory.get("skill")
        
        if not topic:
            return
        
        # Initialize topic in semantic memory if new
        if topic not in self.semantic_memory:
            self.semantic_memory[topic] = {
                "first_encountered": memory.get("timestamp"),
                "times_practiced": 0,
                "average_accuracy": 0.5,
                "mastery_level": 0.0,
                "related_skills": set(),
                "common_mistakes": [],
                "successful_strategies": [],
            }
        
        topic_memory = self.semantic_memory[topic]
        
        # Update statistics
        topic_memory["times_practiced"] += 1
        
        if skill:
            topic_memory["related_skills"].add(skill)
        
        # Update average accuracy
        if memory.get("performance", {}).get("accuracy"):
            current_avg = topic_memory["average_accuracy"]
            new_accuracy = memory["performance"]["accuracy"]
            topic_memory["average_accuracy"] = (
                current_avg * 0.7 + new_accuracy * 0.3
            )
        
        # Update mastery level
        topic_memory["mastery_level"] = min(1.0,
            topic_memory["average_accuracy"] * 0.6 +
            min(1.0, topic_memory["times_practiced"] / 20) * 0.4
        )
        
        # Track mistakes and strategies
        if memory.get("feedback"):
            if not memory["feedback"].get("is_correct"):
                mistake = {
                    "content": memory.get("content_summary", ""),
                    "timestamp": memory.get("timestamp"),
                }
                topic_memory["common_mistakes"].append(mistake)
                # Keep only recent mistakes
                topic_memory["common_mistakes"] = topic_memory["common_mistakes"][-10:]
    
    async def _update_working_memory(self, memory: Dict[str, Any]):
        """
        Update working memory with new interaction
        """
        # Update current context
        if memory.get("topic"):
            self.working_memory["current_topic"] = memory["topic"]
        
        if memory.get("skill"):
            self.working_memory["current_skill"] = memory["skill"]
        
        # Track recent mistakes and successes
        if memory.get("feedback"):
            if memory["feedback"].get("is_correct"):
                self.working_memory["recent_successes"].append({
                    "content": memory.get("content_summary", ""),
                    "timestamp": memory.get("timestamp"),
                })
                self.working_memory["recent_successes"] = self.working_memory["recent_successes"][-5:]
            else:
                self.working_memory["recent_mistakes"].append({
                    "content": memory.get("content_summary", ""),
                    "timestamp": memory.get("timestamp"),
                })
                self.working_memory["recent_mistakes"] = self.working_memory["recent_mistakes"][-5:]
    
    def _is_relevant(
        self,
        memory: Dict[str, Any],
        query: str,
        context: Dict[str, Any]
    ) -> bool:
        """
        Check if memory is relevant to current query/context
        """
        # Check topic match
        if context.get("topic") and memory.get("topic") == context["topic"]:
            return True
        
        # Check skill match
        if context.get("skill") and memory.get("skill") == context["skill"]:
            return True
        
        # Check text similarity (simple keyword matching for now)
        query_lower = query.lower()
        memory_text = (
            memory.get("content_summary", "") + " " +
            memory.get("topic", "") + " " +
            memory.get("skill", "")
        ).lower()
        
        # Simple keyword overlap check
        query_words = set(query_lower.split())
        memory_words = set(memory_text.split())
        overlap = len(query_words.intersection(memory_words))
        
        return overlap >= 2
    
    async def _load_memories(self):
        """
        Load memories from persistent storage
        """
        try:
            # Load episodic memory
            key = f"learner:{self.learner_id}:episodic_memory"
            data = await redis_client.get(key)
            if data:
                self.episodic_memory = json.loads(data)
            
            # Load semantic memory
            key = f"learner:{self.learner_id}:semantic_memory"
            data = await redis_client.get(key)
            if data:
                semantic_data = json.loads(data)
                # Convert related_skills back to sets
                for topic in semantic_data:
                    if "related_skills" in semantic_data[topic]:
                        semantic_data[topic]["related_skills"] = set(
                            semantic_data[topic]["related_skills"]
                        )
                self.semantic_memory = semantic_data
            
            logger.info(f"Memories loaded for learner {self.learner_id}")
            
        except Exception as e:
            logger.error(f"Error loading memories: {str(e)}")
    
    async def _save_memories(self):
        """
        Save memories to persistent storage
        """
        try:
            # Save episodic memory
            key = f"learner:{self.learner_id}:episodic_memory"
            await redis_client.set(
                key,
                json.dumps(self.episodic_memory),
                ex=2592000  # 30 days
            )
            
            # Save semantic memory
            # Convert sets to lists for JSON serialization
            semantic_data = {}
            for topic, data in self.semantic_memory.items():
                semantic_data[topic] = data.copy()
                if "related_skills" in semantic_data[topic]:
                    semantic_data[topic]["related_skills"] = list(
                        semantic_data[topic]["related_skills"]
                    )
            
            key = f"learner:{self.learner_id}:semantic_memory"
            await redis_client.set(
                key,
                json.dumps(semantic_data),
                ex=2592000  # 30 days
            )
            
            logger.debug(f"Memories saved for learner {self.learner_id}")
            
        except Exception as e:
            logger.error(f"Error saving memories: {str(e)}")
    
    async def get_mastery_levels(self) -> Dict[str, float]:
        """
        Get mastery levels for all topics
        """
        return {
            topic: data["mastery_level"]
            for topic, data in self.semantic_memory.items()
        }
    
    async def get_statistics(self) -> Dict[str, Any]:
        """
        Get memory statistics
        """
        return {
            "short_term_count": len(self.short_term_memory),
            "episodic_count": len(self.episodic_memory),
            "semantic_topics": len(self.semantic_memory),
            "topics_learned": list(self.semantic_memory.keys()),
            "mastery_levels": await self.get_mastery_levels(),
        }
