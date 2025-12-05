"""
ADHD/Executive Function AI Service
AI-powered project breakdown, daily planning, and strategy suggestions.
"""

import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
import httpx

logger = logging.getLogger(__name__)


class ADHDAIService:
    """
    AI-powered support for ADHD/Executive Function features.
    Uses model-dispatch service for multi-provider AI support.
    """
    
    def __init__(self):
        self.model_dispatch_url = os.getenv(
            "MODEL_DISPATCH_URL", 
            "http://model-dispatch:4007"
        )
        self.default_model = os.getenv("ADHD_AI_MODEL", "gpt-4o")
        self.timeout = float(os.getenv("ADHD_AI_TIMEOUT", "60"))
    
    async def _call_ai(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
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
                    "max_tokens": 2000,
                    "temperature": temperature,
                }
                
                response = await client.post(
                    f"{self.model_dispatch_url}/chat/completions",
                    json=payload,
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    
                    # Try to parse as JSON
                    try:
                        if "```json" in content:
                            content = content.split("```json")[1].split("```")[0]
                        elif "```" in content:
                            content = content.split("```")[1].split("```")[0]
                        
                        return json.loads(content)
                    except json.JSONDecodeError:
                        return {"raw_content": content}
                else:
                    logger.error(f"Model dispatch error: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"AI call failed: {e}")
            return None

    async def generate_project_breakdown(
        self,
        project_title: str,
        project_description: str,
        subject: Optional[str],
        final_due_date: datetime,
        num_steps: int,
        estimated_total_minutes: Optional[int],
        learner_strengths: Optional[List[str]] = None,
        learner_challenges: Optional[List[str]] = None,
        grade_level: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Generate an AI-powered project breakdown."""
        
        days_until_due = max(1, (final_due_date - datetime.now()).days)
        
        system_prompt = """You are an expert educational coach specializing in supporting students with ADHD and executive function challenges. 
Your task is to break down projects into manageable, concrete steps that are:
1. Specific and actionable (start with action verbs)
2. Time-bounded with realistic estimates
3. Ordered logically with dependencies considered
4. Broken into chunks of 25-45 minutes (ideal focus duration for ADHD)
5. Include built-in checkpoints and small wins

Always respond with valid JSON in this format:
{
  "steps": [
    {
      "step_number": 1,
      "title": "Action-oriented title",
      "description": "Detailed description of what to do",
      "estimated_minutes": 30,
      "suggested_day": 1,
      "tips": "ADHD-friendly tip for this step"
    }
  ],
  "explanation": "Brief explanation of the breakdown strategy",
  "success_strategies": ["List of strategies to stay on track"]
}"""

        user_prompt = f"""Break down this project for a {"grade " + str(grade_level) + " " if grade_level else ""}student:

PROJECT: {project_title}
DESCRIPTION: {project_description}
{f"SUBJECT: {subject}" if subject else ""}
DUE DATE: {final_due_date.strftime("%B %d, %Y")} ({days_until_due} days from now)
NUMBER OF STEPS: {num_steps}
{f"ESTIMATED TOTAL TIME: {estimated_total_minutes} minutes" if estimated_total_minutes else ""}

{f"LEARNER STRENGTHS: {', '.join(learner_strengths)}" if learner_strengths else ""}
{f"LEARNER CHALLENGES: {', '.join(learner_challenges)}" if learner_challenges else ""}

Please create {num_steps} concrete, actionable steps with ADHD-friendly time estimates and tips."""

        result = await self._call_ai(system_prompt, user_prompt, temperature=0.7)
        
        if result and "steps" in result:
            return result
        
        # Fallback to basic breakdown if AI fails
        return self._generate_fallback_breakdown(
            project_title, num_steps, days_until_due, estimated_total_minutes
        )

    def _generate_fallback_breakdown(
        self,
        project_title: str,
        num_steps: int,
        days_until_due: int,
        estimated_total_minutes: Optional[int],
    ) -> Dict[str, Any]:
        """Generate a basic fallback breakdown when AI is unavailable."""
        minutes_per_step = (estimated_total_minutes or 120) // num_steps
        days_per_step = max(1, days_until_due // num_steps)
        
        step_templates = [
            ("Research and gather materials", "Collect all resources, notes, and materials needed for the project."),
            ("Outline and plan", "Create a rough outline or plan for what you want to accomplish."),
            ("First draft or initial work", "Start working on the main content without worrying about perfection."),
            ("Continue development", "Build on your initial work and add more detail."),
            ("Review and refine", "Look over your work and make improvements."),
            ("Final polish", "Make final edits and ensure everything is complete."),
        ]
        
        steps = []
        for i in range(num_steps):
            template_idx = min(i, len(step_templates) - 1)
            if num_steps > len(step_templates) and i >= len(step_templates) - 1:
                title = f"Continue working on {project_title}"
                description = f"Continue making progress on your project."
            else:
                title, description = step_templates[template_idx]
            
            steps.append({
                "step_number": i + 1,
                "title": title,
                "description": description,
                "estimated_minutes": minutes_per_step,
                "suggested_day": (i + 1) * days_per_step,
                "tips": "Take a short break after completing this step.",
            })
        
        return {
            "steps": steps,
            "explanation": "Here's a basic breakdown to help you tackle this project step by step.",
            "success_strategies": [
                "Work in 25-minute focused sessions with 5-minute breaks",
                "Check off each step as you complete it",
                "Reward yourself after finishing difficult steps",
            ],
        }

    async def generate_daily_plan(
        self,
        learner_id: str,
        date: datetime,
        wake_time: str,
        bed_time: str,
        school_start: Optional[str],
        school_end: Optional[str],
        assignments: List[Dict[str, Any]],
        preferred_study_times: Optional[List[str]] = None,
        ef_challenges: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Generate an AI-powered daily plan."""
        
        system_prompt = """You are an expert in creating ADHD-friendly daily schedules. Create a balanced day plan that:
1. Includes regular breaks and transitions
2. Places challenging tasks during optimal focus times
3. Builds in buffer time for task-switching
4. Alternates between different types of activities
5. Includes movement breaks and regulation activities

Respond with valid JSON in this format:
{
  "time_blocks": [
    {
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "category": "homework|break|meal|routine|exercise|free_time|school",
      "title": "Activity title",
      "description": "What to do",
      "related_assignment_id": null
    }
  ],
  "morning_tips": ["Tips for morning routine"],
  "evening_tips": ["Tips for evening wind-down"],
  "focus_strategies": ["Strategies for maintaining focus today"]
}"""

        assignments_text = "\n".join([
            f"- {a.get('title', 'Assignment')}: Due {a.get('due_date', 'soon')}, ~{a.get('estimated_minutes', 30)} min, Priority: {a.get('urgency', 'medium')}"
            for a in assignments[:10]  # Limit to 10 assignments
        ])

        user_prompt = f"""Create a daily plan for {date.strftime("%A, %B %d")}:

SCHEDULE:
- Wake time: {wake_time}
- Bed time: {bed_time}
{f"- School: {school_start} to {school_end}" if school_start and school_end else "- No school today"}

ASSIGNMENTS TO COMPLETE:
{assignments_text if assignments_text else "No specific assignments listed"}

{f"PREFERRED STUDY TIMES: {', '.join(preferred_study_times)}" if preferred_study_times else ""}
{f"CHALLENGES TO ACCOMMODATE: {', '.join(ef_challenges)}" if ef_challenges else ""}

Create a realistic, ADHD-friendly schedule with appropriate breaks and transitions."""

        result = await self._call_ai(system_prompt, user_prompt, temperature=0.7)
        
        if result and "time_blocks" in result:
            return result
        
        # Fallback to basic daily plan
        return self._generate_fallback_daily_plan(wake_time, bed_time, school_start, school_end)

    def _generate_fallback_daily_plan(
        self,
        wake_time: str,
        bed_time: str,
        school_start: Optional[str],
        school_end: Optional[str],
    ) -> Dict[str, Any]:
        """Generate a basic fallback daily plan."""
        blocks = [
            {"start_time": wake_time, "end_time": self._add_minutes(wake_time, 30), "category": "routine", "title": "Morning Routine", "description": "Wake up, get ready for the day"},
            {"start_time": self._add_minutes(wake_time, 30), "end_time": self._add_minutes(wake_time, 60), "category": "meal", "title": "Breakfast", "description": "Eat a healthy breakfast"},
        ]
        
        if school_start and school_end:
            blocks.append({
                "start_time": school_start, 
                "end_time": school_end, 
                "category": "school", 
                "title": "School", 
                "description": "Attend classes"
            })
            homework_start = self._add_minutes(school_end, 60)
        else:
            homework_start = self._add_minutes(wake_time, 120)
        
        blocks.extend([
            {"start_time": homework_start, "end_time": self._add_minutes(homework_start, 25), "category": "homework", "title": "Homework Session 1", "description": "Focus on priority assignments"},
            {"start_time": self._add_minutes(homework_start, 25), "end_time": self._add_minutes(homework_start, 35), "category": "break", "title": "Short Break", "description": "Move around, get a snack"},
            {"start_time": self._add_minutes(homework_start, 35), "end_time": self._add_minutes(homework_start, 60), "category": "homework", "title": "Homework Session 2", "description": "Continue with assignments"},
        ])
        
        return {
            "time_blocks": blocks,
            "morning_tips": ["Lay out clothes the night before", "Have a consistent wake-up routine"],
            "evening_tips": ["No screens 30 minutes before bed", "Review tomorrow's schedule"],
            "focus_strategies": ["Use a timer for work sessions", "Take movement breaks"],
        }

    def _add_minutes(self, time_str: str, minutes: int) -> str:
        """Add minutes to a time string."""
        try:
            hour, minute = map(int, time_str.split(":"))
            total_minutes = hour * 60 + minute + minutes
            new_hour = (total_minutes // 60) % 24
            new_minute = total_minutes % 60
            return f"{new_hour:02d}:{new_minute:02d}"
        except:
            return time_str

    async def suggest_ef_strategies(
        self,
        learner_id: str,
        ef_profile: Dict[str, Any],
        current_challenge: Optional[str] = None,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate personalized EF strategy suggestions."""
        
        system_prompt = """You are an expert in executive function coaching for students with ADHD. 
Based on the learner's EF profile, suggest specific, actionable strategies that:
1. Build on their strengths
2. Address their specific challenges
3. Are developmentally appropriate
4. Can be implemented immediately

Respond with valid JSON in this format:
{
  "strategies": [
    {
      "domain": "organization|time_management|planning|task_initiation|working_memory|metacognition|emotional_control|flexibility",
      "title": "Strategy name",
      "description": "How to implement this strategy",
      "why_it_helps": "Explanation of why this works",
      "difficulty": "easy|medium|hard",
      "tools_needed": ["List of tools or apps that help"]
    }
  ],
  "priority_focus": "The most important area to focus on",
  "encouragement": "Motivational message for the learner"
}"""

        profile_text = f"""
Strengths: {', '.join(ef_profile.get('strengths', ['Not specified']))}
Challenges: {', '.join(ef_profile.get('challenges', ['Not specified']))}
Organization Rating: {ef_profile.get('organization_rating', 'N/A')}/5
Time Management Rating: {ef_profile.get('time_management_rating', 'N/A')}/5
Planning Rating: {ef_profile.get('planning_rating', 'N/A')}/5
Task Initiation Rating: {ef_profile.get('task_initiation_rating', 'N/A')}/5
Working Memory Rating: {ef_profile.get('working_memory_rating', 'N/A')}/5
"""

        user_prompt = f"""Suggest personalized executive function strategies for this learner:

EF PROFILE:
{profile_text}

{f"CURRENT CHALLENGE: {current_challenge}" if current_challenge else ""}
{f"CONTEXT: {context}" if context else ""}

Provide 3-5 specific strategies that would help this learner most."""

        result = await self._call_ai(system_prompt, user_prompt, temperature=0.8)
        
        if result and "strategies" in result:
            return result
        
        # Fallback strategies
        return {
            "strategies": [
                {
                    "domain": "organization",
                    "title": "Visual Task Board",
                    "description": "Use a whiteboard or app to track tasks in 'To Do', 'Doing', and 'Done' columns",
                    "why_it_helps": "Makes progress visible and reduces overwhelm",
                    "difficulty": "easy",
                    "tools_needed": ["Whiteboard or Trello app"],
                },
                {
                    "domain": "time_management",
                    "title": "Pomodoro Technique",
                    "description": "Work for 25 minutes, then take a 5-minute break. Repeat.",
                    "why_it_helps": "Breaks work into manageable chunks",
                    "difficulty": "easy",
                    "tools_needed": ["Timer or Pomodoro app"],
                },
            ],
            "priority_focus": "Start with organization strategies to build a foundation",
            "encouragement": "Small steps lead to big changes. You've got this!",
        }


# Singleton instance
adhd_ai_service = ADHDAIService()
