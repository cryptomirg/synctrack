import json
import boto3
from typing import Dict, List, Optional, Any
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()


class BedrockService:
    """Service for interacting with AWS Bedrock"""
    
    def __init__(self):
        self.bedrock_client = boto3.client(
            'bedrock-runtime',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
        )
        self.model_id = os.getenv('BEDROCK_MODEL_ID', 'anthropic.claude-3-sonnet-20240229-v1:0')
    
    def _invoke_model(self, prompt: str, max_tokens: int = 2000) -> str:
        """Invoke Claude model via Bedrock"""
        try:
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": max_tokens,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
            
            response = self.bedrock_client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(body),
                contentType='application/json'
            )
            
            response_body = json.loads(response['body'].read())
            return response_body['content'][0]['text']
            
        except Exception as e:
            print(f"Error invoking Bedrock model: {e}")
            return ""
    
    def analyze_task_input(self, user_input: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Analyze user input to extract task information"""
        
        context_str = ""
        if context:
            context_str = f"Context: {json.dumps(context, indent=2)}\n\n"
        
        prompt = f"""You are a task analysis AI that helps women organize their tasks according to their hormonal cycles. 
        
{context_str}Analyze the following user input and extract task information. Return a JSON object with the following structure:

{{
    "tasks": [
        {{
            "title": "Task title",
            "description": "Detailed description",
            "task_type": "one of: creative, analytical, physical, social, administrative, strategic, detail_oriented, communication, learning, reflection",
            "estimated_duration": "duration in minutes",
            "priority": "1-5 scale",
            "deadline": "ISO date string if mentioned, null otherwise",
            "urgency": "high/medium/low"
        }}
    ],
    "intent": "schedule/update/delete/query",
    "additional_context": "any additional context or preferences mentioned"
}}

Task types explained:
- creative: brainstorming, design, writing, art
- analytical: data analysis, research, problem-solving
- physical: exercise, active tasks, physical activities
- social: meetings, presentations, networking
- administrative: organizing, filing, admin work
- strategic: planning, goal setting, strategy
- detail_oriented: editing, proofreading, quality control
- communication: calls, emails, presentations
- learning: studying, training, skill development
- reflection: journaling, evaluation, planning

User input: "{user_input}"

Respond with only the JSON object, no additional text."""

        response = self._invoke_model(prompt)
        
        try:
            # Clean response and parse JSON
            response = response.strip()
            if response.startswith('```json'):
                response = response[7:]
            if response.endswith('```'):
                response = response[:-3]
            
            return json.loads(response)
        except json.JSONDecodeError:
            # Fallback parsing
            return {
                "tasks": [{
                    "title": user_input[:100],
                    "description": user_input,
                    "task_type": "administrative",
                    "estimated_duration": 30,
                    "priority": 3,
                    "deadline": None,
                    "urgency": "medium"
                }],
                "intent": "schedule",
                "additional_context": ""
            }
    
    def generate_scheduling_explanation(self, task: Dict, optimal_date: datetime, phase: str, reasoning: str) -> str:
        """Generate human-friendly explanation for task scheduling"""
        
        prompt = f"""Generate a friendly, encouraging explanation for why a task is being scheduled at a specific time based on hormonal cycle optimization.

Task: {task.get('title', 'Task')}
Task Type: {task.get('task_type', 'general')}
Optimal Date: {optimal_date.strftime('%A, %B %d, %Y')}
Hormonal Phase: {phase}
Technical Reasoning: {reasoning}

Create a warm, supportive explanation that:
1. Explains why this timing is optimal for this type of task
2. Mentions the hormonal phase benefits
3. Encourages the user
4. Keeps it concise (2-3 sentences)

Example tone: "I've scheduled your creative writing session for Tuesday during your follicular phase when your creativity and energy are naturally peaking! This is the perfect time for innovative thinking and new ideas."

Generate explanation:"""

        return self._invoke_model(prompt, max_tokens=200)
    
    def suggest_task_modifications(self, task: Dict, current_phase: str, user_feedback: str) -> Dict[str, Any]:
        """Suggest modifications to tasks based on current phase and user feedback"""
        
        prompt = f"""You are helping optimize a task based on the user's current hormonal phase and feedback.

Current Task: {json.dumps(task, indent=2)}
Current Hormonal Phase: {current_phase}
User Feedback: "{user_feedback}"

Based on the current phase characteristics and user feedback, suggest modifications to make the task more suitable. 

Phase characteristics:
- menstrual: introspective, good focus, lower energy, great for planning and detail work
- follicular: rising energy, peak creativity, great for new projects and learning
- ovulatory: peak energy and confidence, excellent for communication and social tasks
- luteal: high attention to detail, analytical thinking, good for completing projects

Return JSON with:
{{
    "suggested_modifications": {{
        "title": "modified title if needed",
        "task_type": "adjusted type if needed",
        "estimated_duration": "adjusted duration",
        "break_into_subtasks": ["subtask1", "subtask2"] or null,
        "timing_adjustment": "earlier/later/different_day",
        "energy_level_needed": "high/medium/low"
    }},
    "explanation": "friendly explanation of suggested changes",
    "alternative_tasks": ["alternative task suggestions for current phase"]
}}

Respond with only the JSON object."""

        response = self._invoke_model(prompt)
        
        try:
            response = response.strip()
            if response.startswith('```json'):
                response = response[7:]
            if response.endswith('```'):
                response = response[:-3]
            
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "suggested_modifications": {
                    "title": task.get('title'),
                    "task_type": task.get('task_type'),
                    "estimated_duration": task.get('estimated_duration'),
                    "break_into_subtasks": None,
                    "timing_adjustment": "no_change",
                    "energy_level_needed": "medium"
                },
                "explanation": "Your task looks good as is for your current phase!",
                "alternative_tasks": []
            }
    
    def generate_daily_insights(self, current_phase: str, upcoming_tasks: List[Dict], energy_level: int) -> str:
        """Generate daily insights and recommendations"""
        
        prompt = f"""Generate daily insights and recommendations for a woman based on her hormonal cycle phase and upcoming tasks.

Current Phase: {current_phase}
Energy Level: {energy_level}/10
Upcoming Tasks: {json.dumps(upcoming_tasks, indent=2)}

Phase characteristics:
- menstrual: introspective, good focus, lower energy, great for planning and detail work
- follicular: rising energy, peak creativity, great for new projects and learning  
- ovulatory: peak energy and confidence, excellent for communication and social tasks
- luteal: high attention to detail, analytical thinking, good for completing projects

Provide:
1. A brief insight about the current phase
2. Energy and focus recommendations
3. Task-specific tips
4. Self-care suggestions
5. What to prioritize today

Keep it encouraging, practical, and under 200 words."""

        return self._invoke_model(prompt, max_tokens=300)