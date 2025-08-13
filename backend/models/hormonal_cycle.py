from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class CyclePhase(Enum):
    MENSTRUAL = "menstrual"
    FOLLICULAR = "follicular"
    OVULATORY = "ovulatory"
    LUTEAL = "luteal"


class TaskType(Enum):
    CREATIVE = "creative"
    ANALYTICAL = "analytical"
    PHYSICAL = "physical"
    SOCIAL = "social"
    ADMINISTRATIVE = "administrative"
    STRATEGIC = "strategic"
    DETAIL_ORIENTED = "detail_oriented"
    COMMUNICATION = "communication"
    LEARNING = "learning"
    REFLECTION = "reflection"


class TaskOptimization(BaseModel):
    task_type: TaskType
    optimal_phases: List[CyclePhase]
    energy_level: int = Field(ge=1, le=10)
    focus_level: int = Field(ge=1, le=10)
    description: str


class HormonalProfile(BaseModel):
    """Represents the hormonal characteristics of each cycle phase"""
    phase: CyclePhase
    day_range: tuple[int, int]
    energy_level: int = Field(ge=1, le=10)
    focus_level: int = Field(ge=1, le=10)
    creativity_level: int = Field(ge=1, le=10)
    social_energy: int = Field(ge=1, le=10)
    analytical_thinking: int = Field(ge=1, le=10)
    physical_energy: int = Field(ge=1, le=10)
    characteristics: List[str]


class CycleData(BaseModel):
    user_id: str
    last_period_start: datetime
    cycle_length: int = Field(default=28, ge=21, le=35)
    period_length: int = Field(default=5, ge=3, le=8)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Task(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    task_type: TaskType
    estimated_duration: int  # in minutes
    priority: int = Field(ge=1, le=5)
    deadline: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    scheduled_at: Optional[datetime] = None
    completed: bool = False


class HormonalCycleManager:
    """Manages hormonal cycle phases and task optimization"""
    
    # Hormonal profiles for each phase
    PHASE_PROFILES: Dict[CyclePhase, HormonalProfile] = {
        CyclePhase.MENSTRUAL: HormonalProfile(
            phase=CyclePhase.MENSTRUAL,
            day_range=(1, 5),
            energy_level=3,
            focus_level=6,
            creativity_level=4,
            social_energy=2,
            analytical_thinking=7,
            physical_energy=2,
            characteristics=[
                "Introspective and reflective",
                "Good for planning and organizing",
                "Lower energy but high focus",
                "Excellent for detail-oriented work",
                "Good time for analysis and evaluation"
            ]
        ),
        CyclePhase.FOLLICULAR: HormonalProfile(
            phase=CyclePhase.FOLLICULAR,
            day_range=(6, 13),
            energy_level=7,
            focus_level=8,
            creativity_level=9,
            social_energy=6,
            analytical_thinking=8,
            physical_energy=7,
            characteristics=[
                "Rising energy and optimism",
                "Peak creativity and innovation",
                "Great for new projects",
                "High learning capacity",
                "Good for problem-solving"
            ]
        ),
        CyclePhase.OVULATORY: HormonalProfile(
            phase=CyclePhase.OVULATORY,
            day_range=(14, 16),
            energy_level=9,
            focus_level=7,
            creativity_level=8,
            social_energy=10,
            analytical_thinking=6,
            physical_energy=9,
            characteristics=[
                "Peak energy and confidence",
                "Excellent for communication",
                "Great for presentations and meetings",
                "High social energy",
                "Perfect for networking and collaboration"
            ]
        ),
        CyclePhase.LUTEAL: HormonalProfile(
            phase=CyclePhase.LUTEAL,
            day_range=(17, 28),
            energy_level=5,
            focus_level=9,
            creativity_level=5,
            social_energy=4,
            analytical_thinking=9,
            physical_energy=4,
            characteristics=[
                "High attention to detail",
                "Excellent for administrative tasks",
                "Good for editing and reviewing",
                "Strong analytical thinking",
                "Perfect for completing projects"
            ]
        )
    }
    
    # Task optimization mapping
    TASK_OPTIMIZATIONS: List[TaskOptimization] = [
        TaskOptimization(
            task_type=TaskType.CREATIVE,
            optimal_phases=[CyclePhase.FOLLICULAR, CyclePhase.OVULATORY],
            energy_level=8,
            focus_level=7,
            description="Creative work, brainstorming, design, writing"
        ),
        TaskOptimization(
            task_type=TaskType.ANALYTICAL,
            optimal_phases=[CyclePhase.MENSTRUAL, CyclePhase.LUTEAL],
            energy_level=6,
            focus_level=9,
            description="Data analysis, research, problem-solving"
        ),
        TaskOptimization(
            task_type=TaskType.PHYSICAL,
            optimal_phases=[CyclePhase.FOLLICULAR, CyclePhase.OVULATORY],
            energy_level=8,
            focus_level=6,
            description="Exercise, physical activities, active tasks"
        ),
        TaskOptimization(
            task_type=TaskType.SOCIAL,
            optimal_phases=[CyclePhase.OVULATORY],
            energy_level=9,
            focus_level=7,
            description="Meetings, presentations, networking, collaboration"
        ),
        TaskOptimization(
            task_type=TaskType.ADMINISTRATIVE,
            optimal_phases=[CyclePhase.LUTEAL, CyclePhase.MENSTRUAL],
            energy_level=5,
            focus_level=9,
            description="Admin tasks, organizing, filing, data entry"
        ),
        TaskOptimization(
            task_type=TaskType.STRATEGIC,
            optimal_phases=[CyclePhase.MENSTRUAL, CyclePhase.FOLLICULAR],
            energy_level=6,
            focus_level=8,
            description="Planning, strategy, goal setting"
        ),
        TaskOptimization(
            task_type=TaskType.DETAIL_ORIENTED,
            optimal_phases=[CyclePhase.LUTEAL, CyclePhase.MENSTRUAL],
            energy_level=5,
            focus_level=10,
            description="Editing, proofreading, quality control"
        ),
        TaskOptimization(
            task_type=TaskType.COMMUNICATION,
            optimal_phases=[CyclePhase.OVULATORY, CyclePhase.FOLLICULAR],
            energy_level=8,
            focus_level=7,
            description="Calls, emails, presentations, negotiations"
        ),
        TaskOptimization(
            task_type=TaskType.LEARNING,
            optimal_phases=[CyclePhase.FOLLICULAR],
            energy_level=7,
            focus_level=8,
            description="Learning new skills, training, studying"
        ),
        TaskOptimization(
            task_type=TaskType.REFLECTION,
            optimal_phases=[CyclePhase.MENSTRUAL],
            energy_level=3,
            focus_level=8,
            description="Reflection, journaling, evaluation, planning"
        )
    ]
    
    def get_current_phase(self, cycle_data: CycleData) -> CyclePhase:
        """Determine current cycle phase based on cycle data"""
        today = datetime.now().date()
        last_period = cycle_data.last_period_start.date()
        days_since_period = (today - last_period).days
        
        # Normalize to current cycle
        cycle_day = (days_since_period % cycle_data.cycle_length) + 1
        
        for phase, profile in self.PHASE_PROFILES.items():
            if profile.day_range[0] <= cycle_day <= profile.day_range[1]:
                return phase
        
        # Default to luteal if no match (shouldn't happen)
        return CyclePhase.LUTEAL
    
    def get_phase_for_date(self, cycle_data: CycleData, target_date: datetime) -> CyclePhase:
        """Get cycle phase for a specific date"""
        last_period = cycle_data.last_period_start.date()
        target = target_date.date()
        days_since_period = (target - last_period).days
        
        # Handle negative days (target before last period)
        if days_since_period < 0:
            # Calculate previous cycle
            cycles_back = abs(days_since_period) // cycle_data.cycle_length + 1
            adjusted_start = last_period - timedelta(days=cycles_back * cycle_data.cycle_length)
            days_since_period = (target - adjusted_start).days
        
        cycle_day = (days_since_period % cycle_data.cycle_length) + 1
        
        for phase, profile in self.PHASE_PROFILES.items():
            if profile.day_range[0] <= cycle_day <= profile.day_range[1]:
                return phase
        
        return CyclePhase.LUTEAL
    
    def get_optimal_scheduling_score(self, task: Task, target_date: datetime, cycle_data: CycleData) -> float:
        """Calculate optimization score for scheduling a task on a specific date"""
        phase = self.get_phase_for_date(cycle_data, target_date)
        phase_profile = self.PHASE_PROFILES[phase]
        
        # Find task optimization
        task_opt = None
        for opt in self.TASK_OPTIMIZATIONS:
            if opt.task_type == task.task_type:
                task_opt = opt
                break
        
        if not task_opt:
            return 0.5  # Neutral score
        
        # Base score from phase alignment
        base_score = 0.8 if phase in task_opt.optimal_phases else 0.3
        
        # Adjust based on phase characteristics
        energy_match = phase_profile.energy_level / 10
        focus_match = phase_profile.focus_level / 10
        
        # Weight factors
        phase_weight = 0.5
        energy_weight = 0.3
        focus_weight = 0.2
        
        final_score = (
            base_score * phase_weight +
            energy_match * energy_weight +
            focus_match * focus_weight
        )
        
        # Priority boost
        priority_boost = (task.priority - 1) * 0.1
        
        return min(1.0, final_score + priority_boost)
    
    def get_next_optimal_dates(self, task: Task, cycle_data: CycleData, days_ahead: int = 30) -> List[tuple[datetime, float]]:
        """Get list of optimal dates for a task with scores"""
        optimal_dates = []
        today = datetime.now()
        
        for i in range(days_ahead):
            target_date = today + timedelta(days=i)
            score = self.get_optimal_scheduling_score(task, target_date, cycle_data)
            optimal_dates.append((target_date, score))
        
        # Sort by score (highest first)
        optimal_dates.sort(key=lambda x: x[1], reverse=True)
        
        return optimal_dates[:10]  # Return top 10 dates