"""
Goal Validator Service

SMART criteria validation and AI-powered goal improvement suggestions
for IEP goals extracted from uploaded documents.
"""

import re
from dataclasses import dataclass
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class SMARTCriterion(str, Enum):
    """SMART criteria enum."""
    SPECIFIC = "specific"
    MEASURABLE = "measurable"
    ACHIEVABLE = "achievable"
    RELEVANT = "relevant"
    TIME_BOUND = "time_bound"


class SMARTAnalysis(BaseModel):
    """Analysis result for a single SMART criterion."""
    criterion: SMARTCriterion
    is_met: bool
    confidence: float = Field(ge=0.0, le=1.0)
    explanation: str
    suggestion: Optional[str] = None


class GoalValidationResult(BaseModel):
    """Complete validation result for a goal."""
    goal_text: str
    is_smart_compliant: bool
    overall_score: float = Field(ge=0.0, le=100.0)
    criteria_analysis: list[SMARTAnalysis]
    improved_goal: Optional[str] = None
    improvement_explanation: Optional[str] = None
    detected_domain: Optional[str] = None
    detected_baseline: Optional[str] = None
    detected_target: Optional[str] = None
    detected_timeframe: Optional[str] = None
    warnings: list[str] = Field(default_factory=list)


class GoalValidatorService:
    """
    Service for validating IEP goals against SMART criteria
    and providing AI-powered improvement suggestions.
    """
    
    # Common measurement patterns
    MEASUREMENT_PATTERNS = [
        r'\d+\s*%',  # Percentages
        r'\d+\s*out\s+of\s+\d+',  # X out of Y
        r'\d+\s*/\s*\d+',  # X/Y fractions
        r'\d+\s+times?',  # N times
        r'\d+\s+trials?',  # N trials
        r'\d+\s+opportunities?',  # N opportunities
        r'\d+\s+sessions?',  # N sessions
        r'\d+\s+consecutive',  # N consecutive
        r'accuracy\s+of\s+\d+',  # accuracy of N
        r'independently',  # Independence measure
        r'with\s+(minimal|moderate|maximum)\s+support',  # Support levels
        r'(no|zero|0)\s+(prompts?|cues?|reminders?)',  # No prompts
        r'\d+\s+(minute|min|second|sec)',  # Time measures
    ]
    
    # Time-bound patterns
    TIME_PATTERNS = [
        r'by\s+(the\s+end\s+of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)',
        r'by\s+\d{1,2}/\d{1,2}/\d{2,4}',  # Date format
        r'within\s+\d+\s+(week|month|year|day)s?',
        r'by\s+(the\s+end\s+of\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(week|month|year)s?',
        r'by\s+(the\s+)?end\s+of\s+(the\s+)?(school\s+)?year',
        r'by\s+(the\s+)?end\s+of\s+(the\s+)?(iep|annual\s+review)',
        r'over\s+\d+\s+(week|month|session)s?',
        r'(annually|quarterly|monthly|weekly)',
        r'\d{4}',  # Year
    ]
    
    # Domain keywords
    DOMAIN_KEYWORDS = {
        "ACADEMIC_READING": ["reading", "phonics", "decoding", "fluency", "comprehension", "vocabulary", "sight words"],
        "ACADEMIC_MATH": ["math", "number", "counting", "addition", "subtraction", "multiplication", "division", "algebra", "geometry", "calculation"],
        "ACADEMIC_WRITING": ["writing", "handwriting", "spelling", "sentence", "paragraph", "essay", "composition", "grammar"],
        "COMMUNICATION": ["speech", "language", "articulation", "fluency", "expressive", "receptive", "pragmatic", "social communication", "aac", "augmentative"],
        "SOCIAL_EMOTIONAL": ["social", "emotional", "behavior", "self-regulation", "coping", "friendship", "peer", "interaction", "anxiety", "anger"],
        "ADAPTIVE": ["daily living", "self-care", "hygiene", "dressing", "toileting", "eating", "functional"],
        "MOTOR": ["motor", "fine motor", "gross motor", "coordination", "balance", "handwriting", "cutting", "ot", "pt", "physical therapy", "occupational therapy"],
        "TRANSITION": ["transition", "vocational", "employment", "job", "career", "independent living", "post-secondary", "college"],
        "COGNITIVE": ["attention", "memory", "executive function", "problem-solving", "reasoning", "organization", "planning"],
        "SENSORY": ["sensory", "sensory processing", "sensory diet", "sensory regulation"],
    }
    
    def __init__(self, llm_client=None):
        """
        Initialize the goal validator service.
        
        Args:
            llm_client: Optional LLM client for AI-powered analysis.
                       If not provided, uses rule-based analysis only.
        """
        self.llm_client = llm_client
    
    async def validate_goal(
        self,
        goal_text: str,
        baseline: Optional[str] = None,
        use_ai: bool = True,
    ) -> GoalValidationResult:
        """
        Validate a goal against SMART criteria.
        
        Args:
            goal_text: The goal text to validate
            baseline: Optional baseline/present level for context
            use_ai: Whether to use AI for enhanced analysis
            
        Returns:
            GoalValidationResult with detailed analysis
        """
        goal_lower = goal_text.lower()
        
        # Analyze each SMART criterion
        criteria_analysis = []
        
        # 1. Specific
        specific_analysis = self._analyze_specific(goal_text, goal_lower)
        criteria_analysis.append(specific_analysis)
        
        # 2. Measurable
        measurable_analysis = self._analyze_measurable(goal_text, goal_lower)
        criteria_analysis.append(measurable_analysis)
        
        # 3. Achievable (harder to determine without context)
        achievable_analysis = self._analyze_achievable(goal_text, goal_lower, baseline)
        criteria_analysis.append(achievable_analysis)
        
        # 4. Relevant (domain detection)
        relevant_analysis = self._analyze_relevant(goal_text, goal_lower)
        criteria_analysis.append(relevant_analysis)
        
        # 5. Time-bound
        time_bound_analysis = self._analyze_time_bound(goal_text, goal_lower)
        criteria_analysis.append(time_bound_analysis)
        
        # Calculate overall score
        criteria_met = sum(1 for c in criteria_analysis if c.is_met)
        overall_score = (criteria_met / 5) * 100
        
        # Adjust score based on confidence
        avg_confidence = sum(c.confidence for c in criteria_analysis) / 5
        overall_score = overall_score * (0.5 + 0.5 * avg_confidence)
        
        is_smart_compliant = criteria_met >= 4 and overall_score >= 70
        
        # Detect components
        detected_domain = self._detect_domain(goal_lower)
        detected_baseline = self._extract_baseline(goal_text)
        detected_target = self._extract_target(goal_text)
        detected_timeframe = self._extract_timeframe(goal_text)
        
        # Generate warnings
        warnings = self._generate_warnings(
            goal_text,
            criteria_analysis,
            detected_baseline,
            detected_target,
        )
        
        # Generate improved goal if AI is available and goal needs improvement
        improved_goal = None
        improvement_explanation = None
        
        if use_ai and self.llm_client and not is_smart_compliant:
            improved_goal, improvement_explanation = await self._generate_improved_goal(
                goal_text,
                criteria_analysis,
                baseline,
                detected_domain,
            )
        
        return GoalValidationResult(
            goal_text=goal_text,
            is_smart_compliant=is_smart_compliant,
            overall_score=round(overall_score, 1),
            criteria_analysis=criteria_analysis,
            improved_goal=improved_goal,
            improvement_explanation=improvement_explanation,
            detected_domain=detected_domain,
            detected_baseline=detected_baseline,
            detected_target=detected_target,
            detected_timeframe=detected_timeframe,
            warnings=warnings,
        )
    
    def _analyze_specific(self, goal_text: str, goal_lower: str) -> SMARTAnalysis:
        """Analyze if the goal is specific."""
        # Check for specificity indicators
        has_action_verb = any(verb in goal_lower for verb in [
            "will", "shall", "can", "demonstrate", "perform", "complete",
            "identify", "name", "describe", "explain", "use", "apply",
            "read", "write", "solve", "calculate", "respond", "initiate",
        ])
        
        has_clear_behavior = any(behavior in goal_lower for behavior in [
            "read", "write", "speak", "listen", "count", "solve",
            "identify", "name", "describe", "explain", "demonstrate",
            "follow", "complete", "respond", "initiate", "request",
            "greet", "share", "take turns", "wait", "transition",
        ])
        
        has_condition = any(cond in goal_lower for cond in [
            "given", "when", "during", "in", "with", "using",
            "across", "within", "throughout",
        ])
        
        # Word count as proxy for detail
        word_count = len(goal_text.split())
        has_detail = word_count >= 15
        
        # Vague terms that reduce specificity
        vague_terms = ["improve", "increase", "decrease", "better", "more", "less", "good", "appropriate"]
        has_vague_terms = any(term in goal_lower for term in vague_terms)
        
        score = 0
        if has_action_verb:
            score += 0.25
        if has_clear_behavior:
            score += 0.25
        if has_condition:
            score += 0.25
        if has_detail:
            score += 0.15
        if not has_vague_terms:
            score += 0.1
        
        is_met = score >= 0.5
        confidence = min(score + 0.3, 1.0) if is_met else min(score + 0.2, 0.8)
        
        explanation = []
        if has_action_verb:
            explanation.append("Contains action verb")
        else:
            explanation.append("Missing clear action verb")
        if has_clear_behavior:
            explanation.append("defines observable behavior")
        if has_condition:
            explanation.append("includes conditions")
        if has_vague_terms:
            explanation.append("but contains vague terms")
        
        suggestion = None
        if not is_met:
            suggestions = []
            if not has_action_verb:
                suggestions.append("Add an action verb (e.g., 'will read', 'will identify')")
            if not has_clear_behavior:
                suggestions.append("Specify the observable behavior")
            if not has_condition:
                suggestions.append("Add conditions (e.g., 'given a grade-level text')")
            if has_vague_terms:
                suggestions.append("Replace vague terms with specific descriptions")
            suggestion = "; ".join(suggestions)
        
        return SMARTAnalysis(
            criterion=SMARTCriterion.SPECIFIC,
            is_met=is_met,
            confidence=confidence,
            explanation=". ".join(explanation) if explanation else "Goal specificity unclear",
            suggestion=suggestion,
        )
    
    def _analyze_measurable(self, goal_text: str, goal_lower: str) -> SMARTAnalysis:
        """Analyze if the goal is measurable."""
        # Check for measurement patterns
        has_measurement = False
        measurement_types = []
        
        for pattern in self.MEASUREMENT_PATTERNS:
            if re.search(pattern, goal_lower):
                has_measurement = True
                measurement_types.append(pattern)
        
        # Check for numeric values
        has_numbers = bool(re.search(r'\d+', goal_text))
        
        # Check for data collection method hints
        has_data_method = any(method in goal_lower for method in [
            "data", "observation", "checklist", "rubric", "assessment",
            "probe", "sample", "work sample", "curriculum-based",
            "portfolio", "trial", "session",
        ])
        
        score = 0
        if has_measurement:
            score += 0.5
        if has_numbers:
            score += 0.25
        if has_data_method:
            score += 0.25
        
        is_met = score >= 0.5
        confidence = min(score + 0.2, 1.0) if is_met else min(score + 0.3, 0.7)
        
        if has_measurement:
            explanation = f"Contains measurable criteria"
            if has_data_method:
                explanation += " with data collection method"
        elif has_numbers:
            explanation = "Contains numbers but measurement criteria could be clearer"
        else:
            explanation = "No clear measurement criteria found"
        
        suggestion = None
        if not is_met:
            suggestion = "Add measurable criteria such as: percentage (e.g., '80% accuracy'), frequency (e.g., '4 out of 5 trials'), or duration (e.g., 'for 5 consecutive sessions')"
        
        return SMARTAnalysis(
            criterion=SMARTCriterion.MEASURABLE,
            is_met=is_met,
            confidence=confidence,
            explanation=explanation,
            suggestion=suggestion,
        )
    
    def _analyze_achievable(
        self,
        goal_text: str,
        goal_lower: str,
        baseline: Optional[str],
    ) -> SMARTAnalysis:
        """Analyze if the goal is achievable."""
        # This is difficult to assess without student context
        # We look for reasonable targets and realistic language
        
        # Check for overly ambitious language
        overly_ambitious = any(term in goal_lower for term in [
            "always", "never", "100%", "perfectly", "all the time",
            "every time", "without any", "completely independently",
        ])
        
        # Check for incremental language
        incremental = any(term in goal_lower for term in [
            "increase", "improve", "progress", "develop", "build",
            "with support", "with prompting", "with cues",
            "minimal", "moderate", "fading",
        ])
        
        # Check if baseline is mentioned or provided
        has_baseline_context = baseline is not None or any(term in goal_lower for term in [
            "from", "baseline", "current", "present level",
            "currently", "at this time",
        ])
        
        # Look for reasonable percentage targets
        percentage_match = re.search(r'(\d+)\s*%', goal_text)
        reasonable_target = True
        if percentage_match:
            target_pct = int(percentage_match.group(1))
            if target_pct > 95:
                reasonable_target = False
        
        score = 0.5  # Start neutral
        if not overly_ambitious:
            score += 0.2
        if incremental:
            score += 0.15
        if has_baseline_context:
            score += 0.15
        if reasonable_target:
            score += 0.1
        else:
            score -= 0.2
        
        is_met = score >= 0.5
        confidence = 0.6  # Lower confidence since we can't fully assess without student data
        
        explanation_parts = []
        if overly_ambitious:
            explanation_parts.append("Contains overly ambitious language")
        if incremental:
            explanation_parts.append("Uses incremental progress language")
        if has_baseline_context:
            explanation_parts.append("References baseline")
        if not reasonable_target:
            explanation_parts.append("Target may be too high")
        
        explanation = ". ".join(explanation_parts) if explanation_parts else "Achievability assessment requires student context"
        
        suggestion = None
        if not is_met or overly_ambitious:
            suggestion = "Consider: Is this goal achievable within the timeframe given the student's current level? Avoid 100% or 'always' criteria; 80-90% is typically more realistic."
        
        return SMARTAnalysis(
            criterion=SMARTCriterion.ACHIEVABLE,
            is_met=is_met,
            confidence=confidence,
            explanation=explanation,
            suggestion=suggestion,
        )
    
    def _analyze_relevant(self, goal_text: str, goal_lower: str) -> SMARTAnalysis:
        """Analyze if the goal is relevant (connected to a clear domain/need)."""
        detected_domain = self._detect_domain(goal_lower)
        
        # Check for connection to student needs language
        has_need_connection = any(term in goal_lower for term in [
            "in order to", "so that", "to enable", "to support",
            "to improve", "to increase", "to develop", "to build",
            "academic", "functional", "social", "communication",
            "independent", "grade level", "age-appropriate",
        ])
        
        # Check for clear educational purpose
        has_educational_purpose = any(term in goal_lower for term in [
            "classroom", "school", "academic", "learning", "instruction",
            "curriculum", "grade", "subject", "lesson", "assignment",
            "homework", "test", "assessment", "work", "task",
        ])
        
        score = 0
        if detected_domain:
            score += 0.5
        if has_need_connection:
            score += 0.25
        if has_educational_purpose:
            score += 0.25
        
        is_met = score >= 0.5
        confidence = min(score + 0.3, 1.0) if is_met else 0.7
        
        if detected_domain:
            explanation = f"Goal relates to {detected_domain.replace('_', ' ').title()} domain"
            if has_need_connection:
                explanation += " with clear purpose"
        elif has_need_connection or has_educational_purpose:
            explanation = "Goal has educational relevance but domain unclear"
        else:
            explanation = "Goal relevance and domain unclear"
        
        suggestion = None
        if not is_met:
            suggestion = "Clarify how this goal connects to the student's identified needs and educational program"
        
        return SMARTAnalysis(
            criterion=SMARTCriterion.RELEVANT,
            is_met=is_met,
            confidence=confidence,
            explanation=explanation,
            suggestion=suggestion,
        )
    
    def _analyze_time_bound(self, goal_text: str, goal_lower: str) -> SMARTAnalysis:
        """Analyze if the goal is time-bound."""
        has_time = False
        time_type = None
        
        for pattern in self.TIME_PATTERNS:
            if re.search(pattern, goal_lower, re.IGNORECASE):
                has_time = True
                time_type = "explicit deadline"
                break
        
        # Check for implicit time references
        if not has_time:
            implicit_time = any(term in goal_lower for term in [
                "annual", "iep", "quarter", "semester", "grading period",
                "marking period", "review", "by the time",
            ])
            if implicit_time:
                has_time = True
                time_type = "implicit timeline"
        
        score = 1.0 if has_time else 0.0
        is_met = has_time
        confidence = 0.9 if has_time else 0.85
        
        if has_time:
            explanation = f"Contains {time_type}"
        else:
            explanation = "No timeline or deadline specified"
        
        suggestion = None
        if not is_met:
            suggestion = "Add a timeline such as: 'by the end of the school year', 'within 6 months', or 'by [specific date]'"
        
        return SMARTAnalysis(
            criterion=SMARTCriterion.TIME_BOUND,
            is_met=is_met,
            confidence=confidence,
            explanation=explanation,
            suggestion=suggestion,
        )
    
    def _detect_domain(self, goal_lower: str) -> Optional[str]:
        """Detect the most likely domain for the goal."""
        domain_scores = {}
        
        for domain, keywords in self.DOMAIN_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in goal_lower)
            if score > 0:
                domain_scores[domain] = score
        
        if domain_scores:
            return max(domain_scores, key=domain_scores.get)
        return None
    
    def _extract_baseline(self, goal_text: str) -> Optional[str]:
        """Extract baseline/present level from goal text."""
        # Look for baseline patterns
        patterns = [
            r'from\s+(\d+\s*%)',
            r'currently\s+at\s+(\d+\s*%)',
            r'baseline\s+of\s+(\d+\s*%)',
            r'present(?:ly)?\s+(?:level\s+)?(?:at|of)?\s*(\d+\s*%)',
            r'from\s+(\d+\s*out\s+of\s+\d+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, goal_text, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return None
    
    def _extract_target(self, goal_text: str) -> Optional[str]:
        """Extract target criteria from goal text."""
        # Look for target patterns
        patterns = [
            r'(?:to|with|at)\s+(\d+\s*%\s*accuracy)',
            r'(\d+\s*%)\s+(?:of\s+the\s+time|accuracy|correct)',
            r'(\d+\s*out\s+of\s+\d+\s*(?:trials?|opportunities?|attempts?))',
            r'(\d+\s*/\s*\d+)',
            r'(\d+)\s+consecutive\s+(?:times?|trials?|sessions?)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, goal_text, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return None
    
    def _extract_timeframe(self, goal_text: str) -> Optional[str]:
        """Extract timeframe from goal text."""
        for pattern in self.TIME_PATTERNS:
            match = re.search(pattern, goal_text, re.IGNORECASE)
            if match:
                return match.group(0)
        return None
    
    def _generate_warnings(
        self,
        goal_text: str,
        criteria_analysis: list[SMARTAnalysis],
        detected_baseline: Optional[str],
        detected_target: Optional[str],
    ) -> list[str]:
        """Generate warnings about potential issues with the goal."""
        warnings = []
        
        # Check for very short goals
        if len(goal_text.split()) < 10:
            warnings.append("Goal may be too brief to be adequately specific")
        
        # Check for missing baseline
        if not detected_baseline:
            warnings.append("No baseline/present level detected - consider adding current performance level")
        
        # Check for very high targets
        if detected_target:
            pct_match = re.search(r'(\d+)\s*%', detected_target)
            if pct_match and int(pct_match.group(1)) >= 95:
                warnings.append("Target of 95%+ may be unrealistic - consider 80-90% for most goals")
        
        # Check for multiple criteria not met
        not_met = [c for c in criteria_analysis if not c.is_met]
        if len(not_met) >= 3:
            warnings.append(f"Goal is missing {len(not_met)} SMART criteria - significant revision recommended")
        
        # Check for passive voice
        passive_indicators = ["will be", "is to be", "can be", "should be"]
        if any(ind in goal_text.lower() for ind in passive_indicators):
            warnings.append("Consider using active voice (e.g., 'Student will...' instead of 'will be...')")
        
        return warnings
    
    async def _generate_improved_goal(
        self,
        original_goal: str,
        criteria_analysis: list[SMARTAnalysis],
        baseline: Optional[str],
        detected_domain: Optional[str],
    ) -> tuple[Optional[str], Optional[str]]:
        """
        Use AI to generate an improved version of the goal.
        
        Returns tuple of (improved_goal, explanation)
        """
        if not self.llm_client:
            return None, None
        
        # Build prompt
        missing_criteria = [c.criterion.value for c in criteria_analysis if not c.is_met]
        suggestions = [c.suggestion for c in criteria_analysis if c.suggestion]
        
        prompt = f"""Improve this IEP goal to be SMART-compliant.

Original Goal: {original_goal}

Missing SMART Criteria: {', '.join(missing_criteria)}

Current Suggestions:
{chr(10).join(f'- {s}' for s in suggestions)}

{f'Student Baseline: {baseline}' if baseline else ''}
{f'Goal Domain: {detected_domain}' if detected_domain else ''}

Please provide:
1. An improved version of the goal that addresses all missing criteria
2. A brief explanation of the changes made

Format your response as:
IMPROVED GOAL: [your improved goal]
EXPLANATION: [your explanation]
"""

        try:
            response = await self.llm_client.generate(
                prompt=prompt,
                max_tokens=500,
                temperature=0.3,
            )
            
            # Parse response
            improved_goal = None
            explanation = None
            
            if "IMPROVED GOAL:" in response:
                parts = response.split("IMPROVED GOAL:", 1)[1]
                if "EXPLANATION:" in parts:
                    improved_goal = parts.split("EXPLANATION:")[0].strip()
                    explanation = parts.split("EXPLANATION:")[1].strip()
                else:
                    improved_goal = parts.strip()
            
            return improved_goal, explanation
            
        except Exception as e:
            # Log error but don't fail
            print(f"Error generating improved goal: {e}")
            return None, None
    
    async def batch_validate(
        self,
        goals: list[str],
        use_ai: bool = True,
    ) -> list[GoalValidationResult]:
        """
        Validate multiple goals.
        
        Args:
            goals: List of goal texts to validate
            use_ai: Whether to use AI for enhanced analysis
            
        Returns:
            List of validation results
        """
        results = []
        for goal in goals:
            result = await self.validate_goal(goal, use_ai=use_ai)
            results.append(result)
        return results
    
    def get_domain_suggestions(self, domain: str) -> list[str]:
        """
        Get example goal frameworks for a specific domain.
        
        Args:
            domain: The goal domain (e.g., 'ACADEMIC_READING')
            
        Returns:
            List of example goal templates
        """
        domain_templates = {
            "ACADEMIC_READING": [
                "Given [grade-level text], [Student] will read [X] words per minute with [X]% accuracy as measured by [method] by [date].",
                "[Student] will identify the main idea and [X] supporting details in [grade-level passages] with [X]% accuracy across [X] consecutive probes by [date].",
                "When presented with unfamiliar words, [Student] will apply [specific decoding strategy] to read words correctly [X] out of [X] opportunities by [date].",
            ],
            "ACADEMIC_MATH": [
                "[Student] will solve [grade-level] [operation] problems with [X]% accuracy on [X] consecutive assessments by [date].",
                "Given a word problem, [Student] will identify the operation needed and solve correctly [X] out of [X] opportunities by [date].",
                "[Student] will demonstrate understanding of [concept] by [specific behavior] with [X]% accuracy by [date].",
            ],
            "COMMUNICATION": [
                "[Student] will produce the [sound/sounds] in [position] of words with [X]% accuracy across [X] sessions by [date].",
                "[Student] will use [X]-word sentences to [communicate need/describe/request] in [X] out of [X] opportunities by [date].",
                "During conversation, [Student] will [pragmatic skill] with [X]% accuracy across [X] sessions by [date].",
            ],
            "SOCIAL_EMOTIONAL": [
                "When [triggering situation], [Student] will use [coping strategy] in [X] out of [X] opportunities as measured by [method] by [date].",
                "[Student] will [social skill] during [activity/setting] with [X]% accuracy across [X] consecutive observations by [date].",
                "[Student] will identify and express [X] emotions appropriately in [X] out of [X] situations by [date].",
            ],
            "ADAPTIVE": [
                "[Student] will independently complete [daily living task] with [X]% accuracy across [X] consecutive days by [date].",
                "Given [support level], [Student] will [adaptive skill] in [X] out of [X] opportunities by [date].",
            ],
            "MOTOR": [
                "[Student] will [motor skill] with [X]% accuracy/[X] out of [X] trials as measured by [method] by [date].",
                "Given [tools/support], [Student] will complete [fine/gross motor task] independently in [X] out of [X] opportunities by [date].",
            ],
        }
        
        return domain_templates.get(domain, [
            "[Student] will [specific behavior] with [X]% accuracy in [X] out of [X] opportunities as measured by [method] by [date]."
        ])


# Singleton instance for use across the application
_goal_validator_instance: Optional[GoalValidatorService] = None


def get_goal_validator(llm_client=None) -> GoalValidatorService:
    """Get the goal validator service instance."""
    global _goal_validator_instance
    if _goal_validator_instance is None:
        _goal_validator_instance = GoalValidatorService(llm_client)
    return _goal_validator_instance
