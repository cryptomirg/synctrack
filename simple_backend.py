#!/usr/bin/env python3
"""
Simplified SyncTracker Backend - Core functionality without LangChain
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json
import os
import boto3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="SyncTracker API (Simplified)",
    description="Hormonal Cycle-Aware Task Optimization API - Core Features",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple Bedrock client
try:
    bedrock_client = boto3.client(
        'bedrock-runtime',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name=os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
    )
    BEDROCK_AVAILABLE = True
    print("✅ AWS Bedrock client initialized successfully")
except Exception as e:
    print(f"⚠️  AWS Bedrock not available: {e}")
    BEDROCK_AVAILABLE = False

# Pydantic models
class CycleData(BaseModel):
    user_id: str
    last_period_start: datetime
    cycle_length: int = 28
    period_length: int = 5

class TaskInput(BaseModel):
    title: str
    description: Optional[str] = None
    task_type: Optional[str] = "administrative"
    estimated_duration: int = 60
    priority: int = 3
    deadline: Optional[datetime] = None

# In-memory storage
user_cycles: Dict[str, CycleData] = {}
user_tasks: Dict[str, List[Dict]] = {}

# Hormonal cycle logic
PHASE_PROFILES = {
    "menstrual": {
        "day_range": (1, 5),
        "energy_level": 3,
        "focus_level": 6,
        "characteristics": [
            "Introspective and reflective",
            "Good for planning and organizing",
            "Lower energy but high focus"
        ]
    },
    "follicular": {
        "day_range": (6, 13),
        "energy_level": 7,
        "focus_level": 8,
        "characteristics": [
            "Rising energy and optimism",
            "Peak creativity and innovation",
            "Great for new projects"
        ]
    },
    "ovulatory": {
        "day_range": (14, 16),
        "energy_level": 9,
        "focus_level": 7,
        "characteristics": [
            "Peak energy and confidence",
            "Excellent for communication",
            "Great for presentations and meetings"
        ]
    },
    "luteal": {
        "day_range": (17, 28),
        "energy_level": 5,
        "focus_level": 9,
        "characteristics": [
            "High attention to detail",
            "Excellent for administrative tasks",
            "Good for editing and reviewing"
        ]
    }
}

def get_current_phase(cycle_data: CycleData) -> str:
    """Get current cycle phase"""
    today = datetime.now().date()
    last_period = cycle_data.last_period_start.date()
    days_since_period = (today - last_period).days
    cycle_day = (days_since_period % cycle_data.cycle_length) + 1
    
    for phase, profile in PHASE_PROFILES.items():
        if profile["day_range"][0] <= cycle_day <= profile["day_range"][1]:
            return phase
    
    return "luteal"

def invoke_bedrock(prompt: str) -> str:
    """Simple Bedrock invocation"""
    if not BEDROCK_AVAILABLE:
        return "AI analysis not available - please check AWS credentials"
    
    try:
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        response = bedrock_client.invoke_model(
            modelId=os.getenv('BEDROCK_MODEL_ID', 'anthropic.claude-3-sonnet-20240229-v1:0'),
            body=json.dumps(body),
            contentType='application/json'
        )
        
        response_body = json.loads(response['body'].read())
        return response_body['content'][0]['text']
    except Exception as e:
        return f"AI analysis error: {str(e)}"

# API Routes
@app.get("/")
async def root():
    return {"message": "SyncTracker API - Simplified Version", "bedrock_available": BEDROCK_AVAILABLE}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.utcnow(),
        "bedrock_available": BEDROCK_AVAILABLE
    }

@app.post("/api/cycle/setup")
async def setup_cycle(cycle_data: CycleData):
    """Set up user cycle data"""
    user_cycles[cycle_data.user_id] = cycle_data
    current_phase = get_current_phase(cycle_data)
    phase_profile = PHASE_PROFILES[current_phase]
    
    return {
        "message": "Cycle data updated successfully",
        "current_phase": {
            "phase": current_phase,
            "characteristics": phase_profile["characteristics"],
            "energy_level": phase_profile["energy_level"],
            "focus_level": phase_profile["focus_level"]
        }
    }

@app.get("/api/cycle/{user_id}/current")
async def get_current_phase_info(user_id: str):
    """Get current cycle phase info"""
    if user_id not in user_cycles:
        raise HTTPException(status_code=404, detail="User cycle data not found")
    
    cycle_data = user_cycles[user_id]
    current_phase = get_current_phase(cycle_data)
    phase_profile = PHASE_PROFILES[current_phase]
    
    today = datetime.now().date()
    last_period = cycle_data.last_period_start.date()
    days_since_period = (today - last_period).days
    cycle_day = (days_since_period % cycle_data.cycle_length) + 1
    
    return {
        "phase": current_phase,
        "day_in_cycle": cycle_day,
        "energy_level": phase_profile["energy_level"],
        "focus_level": phase_profile["focus_level"],
        "characteristics": phase_profile["characteristics"],
        "optimal_tasks": ["creative", "analytical", "physical", "social"]  # Simplified
    }

@app.get("/api/cycle/{user_id}/insights")
async def get_daily_insights(user_id: str):
    """Get daily insights"""
    if user_id not in user_cycles:
        raise HTTPException(status_code=404, detail="User cycle data not found")
    
    cycle_data = user_cycles[user_id]
    current_phase = get_current_phase(cycle_data)
    
    if BEDROCK_AVAILABLE:
        prompt = f"""Generate daily insights for a woman in her {current_phase} phase. 
        Keep it encouraging and practical, under 200 words."""
        insights = invoke_bedrock(prompt)
    else:
        insights = f"You're in your {current_phase} phase. This is a great time for {', '.join(PHASE_PROFILES[current_phase]['characteristics'][:2])}."
    
    return {
        "insights": insights,
        "upcoming_tasks": []
    }

@app.post("/api/tasks/analyze")
async def analyze_task(task_input: Dict):
    """Analyze task input"""
    text = task_input.get("text", "")
    
    if BEDROCK_AVAILABLE:
        prompt = f"""Analyze this task and return JSON:
        Task: "{text}"
        
        Return: {{"tasks": [{{"title": "task title", "task_type": "administrative", "estimated_duration": 30, "priority": 3}}]}}"""
        
        response = invoke_bedrock(prompt)
        try:
            # Try to extract JSON from response
            if "{" in response:
                json_str = response[response.find("{"):response.rfind("}")+1]
                return json.loads(json_str)
        except:
            pass
    
    # Fallback response
    return {
        "tasks": [{
            "title": text[:50] if text else "New Task",
            "description": text,
            "task_type": "administrative",
            "estimated_duration": 30,
            "priority": 3,
            "deadline": None
        }],
        "intent": "schedule"
    }

@app.post("/api/tasks/schedule")
async def schedule_task(schedule_input: Dict):
    """Schedule a task"""
    user_id = schedule_input["user_id"]
    task = schedule_input["task"]
    
    if user_id not in user_cycles:
        raise HTTPException(status_code=404, detail="User cycle data not found")
    
    # Simple scheduling - next available day
    scheduled_time = datetime.now() + timedelta(days=1)
    scheduled_time = scheduled_time.replace(hour=10, minute=0, second=0, microsecond=0)
    
    cycle_data = user_cycles[user_id]
    current_phase = get_current_phase(cycle_data)
    
    # Store task
    if user_id not in user_tasks:
        user_tasks[user_id] = []
    
    task_data = {
        **task,
        "scheduled_at": scheduled_time.isoformat(),
        "phase": current_phase
    }
    user_tasks[user_id].append(task_data)
    
    explanation = f"Scheduled your {task.get('task_type', 'task')} for tomorrow morning during your {current_phase} phase!"
    
    return {
        "task": task_data,
        "scheduling": {
            "scheduled_time": scheduled_time.isoformat(),
            "hormonal_phase": current_phase,
            "cycle_score": 0.8
        },
        "explanation": explanation
    }

@app.post("/api/chat")
async def chat_with_assistant(chat_input: Dict):
    """Simple chat endpoint"""
    message = chat_input.get("message", "")
    
    if BEDROCK_AVAILABLE:
        prompt = f"""You are a helpful assistant for women's productivity and hormonal cycle awareness. 
        Respond to: "{message}"
        Keep it supportive and practical."""
        response = invoke_bedrock(prompt)
    else:
        response = "I'm here to help with your cycle-aware productivity! (AI features require AWS Bedrock setup)"
    
    return {"response": response}

@app.get("/api/tasks/{user_id}/upcoming")
async def get_upcoming_tasks(user_id: str):
    """Get upcoming tasks"""
    tasks = user_tasks.get(user_id, [])
    return {"upcoming_tasks": tasks}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting SyncTracker Simplified Backend...")
    print("📍 Backend will be available at: http://localhost:8000")
    print("📖 API documentation at: http://localhost:8000/docs")
    
    uvicorn.run(
        "simple_backend:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )