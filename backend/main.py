from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import json
import os
import speech_recognition as sr
import io
from pydub import AudioSegment
import tempfile

from .models.hormonal_cycle import (
    CycleData, Task, TaskType, CyclePhase, HormonalCycleManager
)
from .services.bedrock_service import BedrockService
from .services.calendar_service import CalendarService
from .agents.cycle_agent import CycleAwareAgent

# Initialize FastAPI app
app = FastAPI(
    title="SyncTracker API",
    description="Hormonal Cycle-Aware Task Optimization API",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
cycle_manager = HormonalCycleManager()
bedrock_service = BedrockService()
calendar_service = CalendarService()
cycle_agent = CycleAwareAgent()

# Pydantic models for API
class UserCycleInput(BaseModel):
    user_id: str
    last_period_start: datetime
    cycle_length: int = 28
    period_length: int = 5

class TaskInput(BaseModel):
    title: str
    description: Optional[str] = None
    task_type: Optional[TaskType] = None
    estimated_duration: int = 60  # minutes
    priority: int = 3
    deadline: Optional[datetime] = None

class VoiceTaskInput(BaseModel):
    user_id: str
    text: Optional[str] = None  # Transcribed text if already processed

class ChatInput(BaseModel):
    user_id: str
    message: str
    context: Optional[Dict] = None

class ScheduleTaskInput(BaseModel):
    user_id: str
    task: TaskInput
    preferred_time: Optional[datetime] = None
    working_hours: tuple = (9, 17)

# In-memory storage (replace with database in production)
user_cycles: Dict[str, CycleData] = {}
user_tasks: Dict[str, List[Task]] = {}

# Helper functions
def get_user_cycle_data(user_id: str) -> Optional[CycleData]:
    return user_cycles.get(user_id)

def get_user_tasks(user_id: str) -> List[Task]:
    return user_tasks.get(user_id, [])

# API Endpoints

@app.get("/")
async def root():
    return {"message": "SyncTracker API - Hormonal Cycle-Aware Task Optimization"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Cycle Management Endpoints

@app.post("/api/cycle/setup")
async def setup_user_cycle(cycle_input: UserCycleInput):
    """Set up or update user's cycle data"""
    try:
        cycle_data = CycleData(
            user_id=cycle_input.user_id,
            last_period_start=cycle_input.last_period_start,
            cycle_length=cycle_input.cycle_length,
            period_length=cycle_input.period_length
        )
        
        user_cycles[cycle_input.user_id] = cycle_data
        
        # Get current phase info
        current_phase = cycle_manager.get_current_phase(cycle_data)
        phase_profile = cycle_manager.PHASE_PROFILES[current_phase]
        
        return {
            "message": "Cycle data updated successfully",
            "current_phase": {
                "phase": current_phase.value,
                "characteristics": phase_profile.characteristics,
                "energy_level": phase_profile.energy_level,
                "focus_level": phase_profile.focus_level
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/cycle/{user_id}/current")
async def get_current_phase(user_id: str):
    """Get user's current hormonal phase"""
    cycle_data = get_user_cycle_data(user_id)
    if not cycle_data:
        raise HTTPException(status_code=404, detail="User cycle data not found")
    
    current_phase = cycle_manager.get_current_phase(cycle_data)
    phase_profile = cycle_manager.PHASE_PROFILES[current_phase]
    
    return {
        "phase": current_phase.value,
        "day_in_cycle": (datetime.now().date() - cycle_data.last_period_start.date()).days + 1,
        "characteristics": phase_profile.characteristics,
        "energy_level": phase_profile.energy_level,
        "focus_level": phase_profile.focus_level,
        "creativity_level": phase_profile.creativity_level,
        "social_energy": phase_profile.social_energy,
        "optimal_tasks": [opt.task_type.value for opt in cycle_manager.TASK_OPTIMIZATIONS 
                         if current_phase in opt.optimal_phases]
    }

@app.get("/api/cycle/{user_id}/insights")
async def get_daily_insights(user_id: str):
    """Get daily insights and recommendations"""
    cycle_data = get_user_cycle_data(user_id)
    if not cycle_data:
        raise HTTPException(status_code=404, detail="User cycle data not found")
    
    upcoming_tasks = calendar_service.get_upcoming_tasks(7)
    insights = cycle_agent.get_daily_insights(cycle_data, upcoming_tasks)
    
    return {
        "insights": insights,
        "upcoming_tasks": upcoming_tasks
    }

# Task Management Endpoints

@app.post("/api/tasks/analyze")
async def analyze_task_text(task_input: VoiceTaskInput):
    """Analyze task input text and extract task information"""
    try:
        if not task_input.text:
            raise HTTPException(status_code=400, detail="No text provided")
        
        # Get user context
        cycle_data = get_user_cycle_data(task_input.user_id)
        context = None
        if cycle_data:
            current_phase = cycle_manager.get_current_phase(cycle_data)
            context = {
                "current_phase": current_phase.value,
                "user_id": task_input.user_id
            }
        
        analysis = bedrock_service.analyze_task_input(task_input.text, context)
        return analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tasks/voice", response_model=Dict)
async def process_voice_input(user_id: str, audio: UploadFile = File(...)):
    """Process voice input for task creation"""
    try:
        # Read audio file
        audio_data = await audio.read()
        
        # Convert to WAV format for speech recognition
        audio_segment = AudioSegment.from_file(io.BytesIO(audio_data))
        
        # Create temporary WAV file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            audio_segment.export(temp_file.name, format="wav")
            temp_file_path = temp_file.name
        
        try:
            # Speech recognition
            recognizer = sr.Recognizer()
            with sr.AudioFile(temp_file_path) as source:
                audio_data = recognizer.record(source)
                text = recognizer.recognize_google(audio_data)
            
            # Clean up temp file
            os.unlink(temp_file_path)
            
            # Analyze the transcribed text
            task_input = VoiceTaskInput(user_id=user_id, text=text)
            analysis = await analyze_task_text(task_input)
            
            return {
                "transcribed_text": text,
                "analysis": analysis
            }
            
        except sr.UnknownValueError:
            os.unlink(temp_file_path)
            raise HTTPException(status_code=400, detail="Could not understand audio")
        except sr.RequestError as e:
            os.unlink(temp_file_path)
            raise HTTPException(status_code=500, detail=f"Speech recognition error: {e}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tasks/schedule")
async def schedule_task(schedule_input: ScheduleTaskInput):
    """Schedule a task optimally based on hormonal cycle"""
    try:
        cycle_data = get_user_cycle_data(schedule_input.user_id)
        if not cycle_data:
            raise HTTPException(status_code=404, detail="User cycle data not found")
        
        # Create Task object
        task = Task(
            title=schedule_input.task.title,
            description=schedule_input.task.description,
            task_type=schedule_input.task.task_type or TaskType.ADMINISTRATIVE,
            estimated_duration=schedule_input.task.estimated_duration,
            priority=schedule_input.task.priority,
            deadline=schedule_input.task.deadline
        )
        
        # Schedule the task
        scheduling_result = calendar_service.schedule_task_optimally(
            task, 
            cycle_data, 
            days_ahead=14,
            working_hours=schedule_input.working_hours
        )
        
        if not scheduling_result:
            raise HTTPException(status_code=400, detail="Could not find optimal scheduling slot")
        
        # Store task
        if schedule_input.user_id not in user_tasks:
            user_tasks[schedule_input.user_id] = []
        
        task.scheduled_at = scheduling_result['scheduled_time']
        task.id = scheduling_result.get('calendar_event_id')
        user_tasks[schedule_input.user_id].append(task)
        
        # Generate explanation
        explanation = bedrock_service.generate_scheduling_explanation(
            task.model_dump(),
            scheduling_result['scheduled_time'],
            scheduling_result['hormonal_phase'],
            scheduling_result['reasoning']
        )
        
        return {
            "task": task.model_dump(),
            "scheduling": scheduling_result,
            "explanation": explanation
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tasks/{user_id}")
async def get_user_tasks_endpoint(user_id: str):
    """Get all tasks for a user"""
    tasks = get_user_tasks(user_id)
    return {
        "tasks": [task.model_dump() for task in tasks],
        "count": len(tasks)
    }

@app.get("/api/tasks/{user_id}/upcoming")
async def get_upcoming_tasks(user_id: str, days: int = 7):
    """Get upcoming tasks from calendar"""
    try:
        upcoming = calendar_service.get_upcoming_tasks(days)
        return {
            "upcoming_tasks": upcoming,
            "count": len(upcoming)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Chat/Agent Endpoints

@app.post("/api/chat")
async def chat_with_agent(chat_input: ChatInput):
    """Chat with the cycle-aware agent"""
    try:
        cycle_data = get_user_cycle_data(chat_input.user_id)
        response = cycle_agent.process_user_input(chat_input.message, cycle_data)
        
        return {
            "response": response,
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Calendar Integration Endpoints

@app.get("/api/calendar/{user_id}/availability")
async def get_calendar_availability(user_id: str, start_date: datetime, end_date: datetime):
    """Get calendar availability for date range"""
    try:
        availability = calendar_service.get_calendar_availability(start_date, end_date)
        return {
            "availability": availability,
            "period": {
                "start": start_date,
                "end": end_date
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/calendar/{user_id}/export")
async def export_calendar(user_id: str, response_class=PlainTextResponse):
    """Export user's optimized tasks to iCal format"""
    try:
        cycle_data = get_user_cycle_data(user_id)
        if not cycle_data:
            raise HTTPException(status_code=404, detail="User cycle data not found")
        
        tasks = get_user_tasks(user_id)
        ical_content = calendar_service.export_to_ical(tasks, cycle_data)
        
        return PlainTextResponse(
            content=ical_content,
            media_type="text/calendar",
            headers={"Content-Disposition": f"attachment; filename=synctracker_{user_id}.ics"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Optimization Endpoints

@app.get("/api/optimize/{user_id}/task-recommendations")
async def get_task_recommendations(user_id: str):
    """Get task recommendations for current phase"""
    try:
        cycle_data = get_user_cycle_data(user_id)
        if not cycle_data:
            raise HTTPException(status_code=404, detail="User cycle data not found")
        
        current_phase = cycle_manager.get_current_phase(cycle_data)
        phase_profile = cycle_manager.PHASE_PROFILES[current_phase]
        
        # Get optimal task types for current phase
        optimal_tasks = []
        for opt in cycle_manager.TASK_OPTIMIZATIONS:
            if current_phase in opt.optimal_phases:
                optimal_tasks.append({
                    "task_type": opt.task_type.value,
                    "description": opt.description,
                    "energy_requirement": opt.energy_level,
                    "focus_requirement": opt.focus_level
                })
        
        return {
            "current_phase": current_phase.value,
            "phase_characteristics": phase_profile.characteristics,
            "energy_level": phase_profile.energy_level,
            "focus_level": phase_profile.focus_level,
            "recommended_tasks": optimal_tasks
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/optimize/batch-schedule")
async def batch_schedule_tasks(user_id: str, tasks: List[TaskInput]):
    """Schedule multiple tasks optimally"""
    try:
        cycle_data = get_user_cycle_data(user_id)
        if not cycle_data:
            raise HTTPException(status_code=404, detail="User cycle data not found")
        
        scheduled_tasks = []
        
        for task_input in tasks:
            task = Task(
                title=task_input.title,
                description=task_input.description,
                task_type=task_input.task_type or TaskType.ADMINISTRATIVE,
                estimated_duration=task_input.estimated_duration,
                priority=task_input.priority,
                deadline=task_input.deadline
            )
            
            # Get optimal dates
            optimal_dates = cycle_manager.get_next_optimal_dates(task, cycle_data, 21)
            
            if optimal_dates:
                best_date, score = optimal_dates[0]
                phase = cycle_manager.get_phase_for_date(cycle_data, best_date)
                
                scheduled_tasks.append({
                    "task": task.model_dump(),
                    "optimal_date": best_date,
                    "cycle_score": score,
                    "phase": phase.value
                })
        
        return {
            "scheduled_tasks": scheduled_tasks,
            "total_tasks": len(scheduled_tasks)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host=os.getenv("HOST", "0.0.0.0"), 
        port=int(os.getenv("PORT", 8000)), 
        reload=os.getenv("DEBUG", "False").lower() == "true"
    )