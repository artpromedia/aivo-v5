"""
Performance Analyzer - Analyzes learner performance and progress
Author: artpromedia
Date: 2025-11-23
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import deque
import statistics

from core.logging import setup_logging

logger = setup_logging(__name__)


class PerformanceAnalyzer:
    """
    Analyzes learner performance, detects patterns, and provides insights
    """
    
    def __init__(self, learner_id: str):
        self.learner_id = learner_id
        self.recent_responses = deque(maxlen=20)
        self.session_history = deque(maxlen=10)
        self.skill_tracker = {}
        
        logger.info(f"Performance Analyzer initialized for learner {learner_id}")
    
    async def analyze(
        self,
        interaction_type: str,
        content: Dict[str, Any],
        learner_response: Optional[str],
        context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze performance for current interaction
        """
        try:
            analysis = {
                "timestamp": datetime.utcnow().isoformat(),
                "interaction_type": interaction_type,
                "accuracy": 0.5,
                "speed": 1.0,
                "consistency": 1.0,
                "improvement": 0.0,
                "response_time": 0,
                "consecutive_errors": 0,
                "consecutive_successes": 0,
                "distractions": 0,
                "help_requests": 0,
                "retries": 0,
                "confidence_indicator": 0.7,
            }
            
            # Analyze response if provided
            if learner_response:
                response_analysis = await self._analyze_response(
                    learner_response,
                    content,
                    context
                )
                analysis.update(response_analysis)
            
            # Track skill-specific performance
            if content.get("skill"):
                skill_analysis = await self._analyze_skill_performance(
                    content["skill"],
                    analysis
                )
                analysis["skill"] = content["skill"]
                analysis["mastery"] = skill_analysis.get("mastery", 0.0)
            
            # Detect patterns
            patterns = await self._detect_patterns(analysis)
            analysis["patterns"] = patterns
            
            # Store for future analysis
            self.recent_responses.append(analysis)
            
            logger.debug(
                f"Performance analyzed",
                learner_id=self.learner_id,
                accuracy=analysis["accuracy"]
            )
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing performance: {str(e)}")
            return {"error": str(e)}
    
    async def _analyze_response(
        self,
        learner_response: str,
        content: Dict[str, Any],
        context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze learner's response
        """
        analysis = {
            "accuracy": 0.0,
            "response_time": 0,
            "confidence_indicator": 0.5,
        }
        
        # Get expected answer
        expected_answer = content.get("expected_answer")
        
        if expected_answer:
            # Calculate accuracy (simple comparison for now)
            is_correct = self._check_correctness(
                learner_response,
                expected_answer,
                content.get("answer_type", "exact")
            )
            analysis["accuracy"] = 1.0 if is_correct else 0.0
            
            # Update consecutive streaks
            if is_correct:
                analysis["consecutive_successes"] = self._get_consecutive_successes() + 1
                analysis["consecutive_errors"] = 0
            else:
                analysis["consecutive_errors"] = self._get_consecutive_errors() + 1
                analysis["consecutive_successes"] = 0
        
        # Calculate response time if available
        if context and context.get("start_time"):
            start_time = datetime.fromisoformat(context["start_time"])
            response_time = (datetime.utcnow() - start_time).total_seconds()
            analysis["response_time"] = response_time
            
            # Estimate speed (normalized)
            expected_time = content.get("expected_time", 30)
            analysis["speed"] = expected_time / max(response_time, 1)
        
        # Detect confidence from response characteristics
        analysis["confidence_indicator"] = self._estimate_confidence(learner_response)
        
        # Track help requests and retries
        if context:
            analysis["help_requests"] = context.get("help_requests", 0)
            analysis["retries"] = context.get("retries", 0)
            analysis["distractions"] = context.get("distractions", 0)
        
        return analysis
    
    def _check_correctness(
        self,
        response: str,
        expected: str,
        answer_type: str
    ) -> bool:
        """
        Check if response is correct
        """
        response_clean = response.lower().strip()
        expected_clean = expected.lower().strip()
        
        if answer_type == "exact":
            return response_clean == expected_clean
        elif answer_type == "contains":
            return expected_clean in response_clean
        elif answer_type == "numeric":
            try:
                return abs(float(response_clean) - float(expected_clean)) < 0.01
            except ValueError:
                return False
        elif answer_type == "multiple_choice":
            return response_clean in [opt.lower().strip() for opt in expected.split("|")]
        else:
            # Default to fuzzy matching
            return self._fuzzy_match(response_clean, expected_clean)
    
    def _fuzzy_match(self, response: str, expected: str, threshold: float = 0.8) -> bool:
        """
        Fuzzy string matching
        """
        # Simple word overlap ratio
        response_words = set(response.split())
        expected_words = set(expected.split())
        
        if not expected_words:
            return False
        
        overlap = len(response_words.intersection(expected_words))
        ratio = overlap / len(expected_words)
        
        return ratio >= threshold
    
    def _estimate_confidence(self, response: str) -> float:
        """
        Estimate learner confidence from response characteristics
        """
        confidence = 0.5
        
        # Longer, more detailed responses suggest higher confidence
        word_count = len(response.split())
        if word_count > 20:
            confidence += 0.2
        elif word_count < 5:
            confidence -= 0.2
        
        # Check for uncertainty markers
        uncertainty_markers = [
            "i think", "maybe", "probably", "not sure",
            "i guess", "perhaps", "might be", "could be"
        ]
        response_lower = response.lower()
        
        for marker in uncertainty_markers:
            if marker in response_lower:
                confidence -= 0.15
        
        # Check for confidence markers
        confidence_markers = [
            "definitely", "certainly", "absolutely", "sure",
            "clearly", "obviously", "of course"
        ]
        
        for marker in confidence_markers:
            if marker in response_lower:
                confidence += 0.15
        
        return max(0.0, min(1.0, confidence))
    
    def _get_consecutive_successes(self) -> int:
        """
        Count consecutive successful responses
        """
        count = 0
        for response in reversed(self.recent_responses):
            if response.get("accuracy", 0) >= 0.8:
                count += 1
            else:
                break
        return count
    
    def _get_consecutive_errors(self) -> int:
        """
        Count consecutive errors
        """
        count = 0
        for response in reversed(self.recent_responses):
            if response.get("accuracy", 0) < 0.5:
                count += 1
            else:
                break
        return count
    
    async def _analyze_skill_performance(
        self,
        skill: str,
        current_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze performance for specific skill
        """
        # Initialize skill tracker if needed
        if skill not in self.skill_tracker:
            self.skill_tracker[skill] = {
                "attempts": 0,
                "successes": 0,
                "total_accuracy": 0.0,
                "average_accuracy": 0.0,
                "mastery": 0.0,
                "first_attempt": datetime.utcnow().isoformat(),
                "last_attempt": datetime.utcnow().isoformat(),
                "history": deque(maxlen=10),
            }
        
        tracker = self.skill_tracker[skill]
        
        # Update tracker
        tracker["attempts"] += 1
        tracker["last_attempt"] = datetime.utcnow().isoformat()
        
        accuracy = current_analysis.get("accuracy", 0.0)
        tracker["total_accuracy"] += accuracy
        tracker["average_accuracy"] = tracker["total_accuracy"] / tracker["attempts"]
        
        if accuracy >= 0.8:
            tracker["successes"] += 1
        
        tracker["history"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "accuracy": accuracy,
        })
        
        # Calculate mastery level
        mastery = self._calculate_mastery(tracker)
        tracker["mastery"] = mastery
        
        return {
            "skill": skill,
            "mastery": mastery,
            "attempts": tracker["attempts"],
            "average_accuracy": tracker["average_accuracy"],
        }
    
    def _calculate_mastery(self, tracker: Dict[str, Any]) -> float:
        """
        Calculate mastery level for a skill
        """
        # Factors: average accuracy, consistency, number of attempts
        avg_accuracy = tracker["average_accuracy"]
        attempts = tracker["attempts"]
        
        # Calculate consistency from recent history
        if len(tracker["history"]) >= 3:
            recent_accuracies = [h["accuracy"] for h in tracker["history"]]
            consistency = 1.0 - statistics.stdev(recent_accuracies)
        else:
            consistency = 0.5
        
        # Mastery formula
        mastery = (
            avg_accuracy * 0.5 +  # Accuracy is most important
            consistency * 0.3 +   # Consistency matters
            min(1.0, attempts / 10) * 0.2  # Experience helps
        )
        
        return max(0.0, min(1.0, mastery))
    
    async def _detect_patterns(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detect performance patterns
        """
        patterns = {
            "improving": False,
            "declining": False,
            "plateau": False,
            "struggling": False,
            "excelling": False,
            "inconsistent": False,
        }
        
        if len(self.recent_responses) < 5:
            return patterns
        
        # Get recent accuracies
        recent_accuracies = [
            r.get("accuracy", 0.5)
            for r in list(self.recent_responses)[-10:]
        ]
        
        # Check for improvement trend
        first_half = recent_accuracies[:len(recent_accuracies)//2]
        second_half = recent_accuracies[len(recent_accuracies)//2:]
        
        first_avg = sum(first_half) / len(first_half)
        second_avg = sum(second_half) / len(second_half)
        
        if second_avg > first_avg + 0.15:
            patterns["improving"] = True
        elif second_avg < first_avg - 0.15:
            patterns["declining"] = True
        
        # Check for plateau
        if statistics.stdev(recent_accuracies) < 0.1:
            patterns["plateau"] = True
        
        # Check for struggling
        if sum(recent_accuracies[-5:]) / 5 < 0.4:
            patterns["struggling"] = True
        
        # Check for excelling
        if sum(recent_accuracies[-5:]) / 5 > 0.85:
            patterns["excelling"] = True
        
        # Check for inconsistency
        if statistics.stdev(recent_accuracies) > 0.3:
            patterns["inconsistent"] = True
        
        return patterns
    
    async def get_performance_summary(
        self,
        period: str = "session"
    ) -> Dict[str, Any]:
        """
        Get performance summary for period
        """
        try:
            if period == "session":
                data = list(self.recent_responses)
            else:
                # Could filter by date for other periods
                data = list(self.recent_responses)
            
            if not data:
                return {"error": "No data available"}
            
            # Calculate aggregate metrics
            accuracies = [r.get("accuracy", 0) for r in data]
            response_times = [r.get("response_time", 0) for r in data if r.get("response_time", 0) > 0]
            
            summary = {
                "period": period,
                "total_interactions": len(data),
                "average_accuracy": sum(accuracies) / len(accuracies) if accuracies else 0,
                "median_accuracy": statistics.median(accuracies) if accuracies else 0,
                "accuracy_std": statistics.stdev(accuracies) if len(accuracies) > 1 else 0,
                "average_response_time": sum(response_times) / len(response_times) if response_times else 0,
                "consecutive_successes": self._get_consecutive_successes(),
                "consecutive_errors": self._get_consecutive_errors(),
                "skills_practiced": len(self.skill_tracker),
                "mastery_levels": {
                    skill: data["mastery"]
                    for skill, data in self.skill_tracker.items()
                },
            }
            
            # Detect patterns
            patterns = await self._detect_patterns({})
            summary["patterns"] = patterns
            
            # Performance classification
            avg_accuracy = summary["average_accuracy"]
            if avg_accuracy >= 0.9:
                summary["performance_level"] = "excellent"
            elif avg_accuracy >= 0.75:
                summary["performance_level"] = "good"
            elif avg_accuracy >= 0.6:
                summary["performance_level"] = "satisfactory"
            elif avg_accuracy >= 0.4:
                summary["performance_level"] = "needs_improvement"
            else:
                summary["performance_level"] = "struggling"
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating performance summary: {str(e)}")
            return {"error": str(e)}
    
    async def get_skill_report(self) -> Dict[str, Any]:
        """
        Get detailed skill-by-skill report
        """
        report = {
            "total_skills": len(self.skill_tracker),
            "skills": [],
        }
        
        for skill, data in self.skill_tracker.items():
            skill_info = {
                "skill": skill,
                "mastery": data["mastery"],
                "attempts": data["attempts"],
                "average_accuracy": data["average_accuracy"],
                "first_attempt": data["first_attempt"],
                "last_attempt": data["last_attempt"],
                "status": self._classify_skill_status(data["mastery"]),
            }
            report["skills"].append(skill_info)
        
        # Sort by mastery level
        report["skills"].sort(key=lambda x: x["mastery"])
        
        return report
    
    def _classify_skill_status(self, mastery: float) -> str:
        """
        Classify skill status based on mastery
        """
        if mastery >= 0.9:
            return "mastered"
        elif mastery >= 0.7:
            return "proficient"
        elif mastery >= 0.5:
            return "developing"
        elif mastery >= 0.3:
            return "emerging"
        else:
            return "needs_support"
    
    async def reset_session(self):
        """
        Reset session-specific data
        """
        self.recent_responses.clear()
        logger.info(f"Session reset for learner {self.learner_id}")
