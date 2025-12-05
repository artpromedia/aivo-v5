"""
IEP Extraction Service
Uses AI to extract goals, services, accommodations, and present levels from IEP documents.
"""

import os
import json
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
import httpx

logger = logging.getLogger(__name__)


class IEPExtractionService:
    """
    AI-powered extraction of IEP components from document text.
    Uses model-dispatch service for multi-provider AI support.
    """
    
    def __init__(self):
        self.model_dispatch_url = os.getenv(
            "MODEL_DISPATCH_URL", 
            "http://model-dispatch:4007"
        )
        self.default_model = os.getenv("IEP_EXTRACTION_MODEL", "gpt-4o")
        self.timeout = float(os.getenv("IEP_EXTRACTION_TIMEOUT", "120"))
    
    async def _call_ai(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: Optional[Dict] = None
    ) -> Optional[Dict[str, Any]]:
        """Call AI via model-dispatch service."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                payload = {
                    "model": self.default_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "max_tokens": 4000,
                    "temperature": 0.1,  # Low temperature for extraction accuracy
                }
                
                if response_format:
                    payload["response_format"] = response_format
                
                response = await client.post(
                    f"{self.model_dispatch_url}/chat/completions",
                    json=payload,
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    
                    # Try to parse as JSON
                    try:
                        # Handle markdown code blocks
                        if "```json" in content:
                            content = content.split("```json")[1].split("```")[0]
                        elif "```" in content:
                            content = content.split("```")[1].split("```")[0]
                        
                        return json.loads(content)
                    except json.JSONDecodeError:
                        logger.warning("AI response was not valid JSON")
                        return {"raw_content": content}
                else:
                    logger.error(f"Model dispatch error: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"AI call failed: {e}")
            return None
    
    async def extract_goals(
        self,
        text: str,
        page_info: Optional[List[Dict]] = None
    ) -> List[Dict[str, Any]]:
        """
        Extract IEP goals from document text.
        
        Returns list of goals with:
        - domain, goalText, baseline, targetCriteria, etc.
        - confidence score
        - page reference if available
        """
        system_prompt = """You are an expert at extracting IEP (Individualized Education Program) goals from educational documents.

Extract all IEP goals from the provided text. For each goal, identify:
1. domain: One of [READING, WRITING, MATH, COMMUNICATION, SOCIAL_EMOTIONAL, BEHAVIOR, MOTOR, DAILY_LIVING, VOCATIONAL, OTHER]
2. goalNumber: The goal number if present (e.g., "Goal 1", "1.A")
3. goalText: The complete goal statement
4. baseline: Current performance level if mentioned
5. targetCriteria: The specific target or success criteria
6. measurementMethod: How progress will be measured
7. frequency: How often progress is measured (e.g., "weekly", "quarterly")

Return a JSON array of goal objects. Estimate a confidence score (0-100) for each extraction based on clarity of the source text."""

        user_prompt = f"""Extract all IEP goals from this document text:

{text[:15000]}  # Limit to avoid token limits

Return as JSON array with this structure:
[
  {{
    "domain": "READING",
    "goalNumber": "1.A",
    "goalText": "By the end of the year, student will read grade-level text with 95% accuracy",
    "baseline": "Currently reads at 2nd grade level with 70% accuracy",
    "targetCriteria": "95% accuracy on grade-level passages",
    "measurementMethod": "Weekly reading assessments",
    "frequency": "weekly",
    "confidence": 85
  }}
]"""

        result = await self._call_ai(system_prompt, user_prompt)
        
        if result and isinstance(result, list):
            return result
        elif result and "goals" in result:
            return result["goals"]
        return []
    
    async def extract_services(
        self,
        text: str,
        page_info: Optional[List[Dict]] = None
    ) -> List[Dict[str, Any]]:
        """Extract related services from IEP document."""
        system_prompt = """You are an expert at extracting special education services from IEP documents.

Extract all related services mentioned. For each service, identify:
1. serviceType: One of [SPEECH_THERAPY, OCCUPATIONAL_THERAPY, PHYSICAL_THERAPY, COUNSELING, BEHAVIORAL_SUPPORT, READING_INTERVENTION, MATH_INTERVENTION, ASSISTIVE_TECHNOLOGY, TRANSPORTATION, NURSING, OTHER]
2. description: Description of the service
3. frequency: How often (e.g., "2x per week")
4. duration: Length of each session (e.g., "30 minutes")
5. location: Where provided (e.g., "Resource Room")
6. provider: Who provides it if mentioned

Return a JSON array with confidence scores."""

        user_prompt = f"""Extract all related services from this IEP document:

{text[:15000]}

Return as JSON array:
[
  {{
    "serviceType": "SPEECH_THERAPY",
    "description": "Speech-language services to address articulation and language processing",
    "frequency": "2x per week",
    "duration": "30 minutes",
    "location": "Speech Room",
    "provider": "Speech-Language Pathologist",
    "confidence": 90
  }}
]"""

        result = await self._call_ai(system_prompt, user_prompt)
        
        if result and isinstance(result, list):
            return result
        elif result and "services" in result:
            return result["services"]
        return []
    
    async def extract_accommodations(
        self,
        text: str,
        page_info: Optional[List[Dict]] = None
    ) -> List[Dict[str, Any]]:
        """Extract accommodations from IEP document."""
        system_prompt = """You are an expert at extracting educational accommodations from IEP documents.

Extract all accommodations mentioned. For each accommodation, identify:
1. category: One of [PRESENTATION, RESPONSE, SETTING, TIMING, ORGANIZATION, ASSISTIVE_TECHNOLOGY, OTHER]
2. description: The accommodation description
3. details: Any additional details
4. appliesTo: What contexts it applies to [INSTRUCTION, ASSESSMENT, ALL]

Return a JSON array with confidence scores."""

        user_prompt = f"""Extract all accommodations from this IEP document:

{text[:15000]}

Return as JSON array:
[
  {{
    "category": "TIMING",
    "description": "Extended time on tests and assignments",
    "details": "Time and a half (1.5x) on all assessments",
    "appliesTo": ["ASSESSMENT"],
    "confidence": 95
  }}
]"""

        result = await self._call_ai(system_prompt, user_prompt)
        
        if result and isinstance(result, list):
            return result
        elif result and "accommodations" in result:
            return result["accommodations"]
        return []
    
    async def extract_present_levels(
        self,
        text: str,
        page_info: Optional[List[Dict]] = None
    ) -> List[Dict[str, Any]]:
        """Extract Present Levels of Academic Achievement and Functional Performance (PLAAFP)."""
        system_prompt = """You are an expert at extracting Present Levels (PLAAFP) from IEP documents.

Extract all present level statements. For each, identify:
1. domain: One of [READING, WRITING, MATH, COMMUNICATION, SOCIAL_EMOTIONAL, BEHAVIOR, MOTOR, DAILY_LIVING, VOCATIONAL, OTHER]
2. currentPerformance: Description of current performance
3. strengths: Array of student strengths mentioned
4. needs: Array of needs/areas for improvement
5. parentInput: Any parent input mentioned
6. howDisabilityAffects: How the disability affects progress
7. educationalImplications: Implications for instruction

Return a JSON array with confidence scores."""

        user_prompt = f"""Extract all present level statements from this IEP document:

{text[:15000]}

Return as JSON array:
[
  {{
    "domain": "READING",
    "currentPerformance": "Student reads at 2nd grade level, struggles with decoding multisyllabic words",
    "strengths": ["Strong comprehension when text is read aloud", "Enjoys stories"],
    "needs": ["Decoding skills", "Reading fluency"],
    "parentInput": "Enjoys reading with family at home",
    "howDisabilityAffects": "Specific learning disability in reading impacts ability to access grade-level text independently",
    "educationalImplications": "Requires phonics-based reading intervention, audiobooks for content access",
    "confidence": 88
  }}
]"""

        result = await self._call_ai(system_prompt, user_prompt)
        
        if result and isinstance(result, list):
            return result
        elif result and "presentLevels" in result:
            return result["presentLevels"]
        return []
    
    async def analyze_smart_criteria(
        self,
        goal_text: str
    ) -> Dict[str, Any]:
        """Analyze a goal against SMART criteria."""
        system_prompt = """You are an expert at analyzing IEP goals against SMART criteria.

Analyze the provided goal and score each SMART criterion:
- Specific: Is the goal clear and unambiguous?
- Measurable: Can progress be quantified?
- Achievable: Is it realistic?
- Relevant: Is it appropriate for the student?
- Time-bound: Is there a deadline?

Provide scores (0-100), feedback, and evidence for each."""

        user_prompt = f"""Analyze this IEP goal against SMART criteria:

"{goal_text}"

Return JSON:
{{
  "specific": {{"met": true/false, "score": 0-100, "feedback": "...", "evidence": "..."}},
  "measurable": {{"met": true/false, "score": 0-100, "feedback": "...", "evidence": "..."}},
  "achievable": {{"met": true/false, "score": 0-100, "feedback": "...", "evidence": "..."}},
  "relevant": {{"met": true/false, "score": 0-100, "feedback": "...", "evidence": "..."}},
  "timeBound": {{"met": true/false, "score": 0-100, "feedback": "...", "evidence": "..."}},
  "overallScore": 0-100,
  "isCompliant": true/false,
  "suggestions": ["..."]
}}"""

        result = await self._call_ai(system_prompt, user_prompt)
        return result or {}
    
    async def extract_all(
        self,
        text: str,
        page_info: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Extract all IEP components from document text.
        
        Returns dict with goals, services, accommodations, presentLevels.
        """
        import asyncio
        
        # Run extractions in parallel for efficiency
        goals_task = self.extract_goals(text, page_info)
        services_task = self.extract_services(text, page_info)
        accommodations_task = self.extract_accommodations(text, page_info)
        present_levels_task = self.extract_present_levels(text, page_info)
        
        results = await asyncio.gather(
            goals_task,
            services_task,
            accommodations_task,
            present_levels_task,
            return_exceptions=True
        )
        
        return {
            "goals": results[0] if not isinstance(results[0], Exception) else [],
            "services": results[1] if not isinstance(results[1], Exception) else [],
            "accommodations": results[2] if not isinstance(results[2], Exception) else [],
            "presentLevels": results[3] if not isinstance(results[3], Exception) else [],
            "extractedAt": datetime.utcnow().isoformat(),
        }


# Global instance
iep_extraction_service = IEPExtractionService()
