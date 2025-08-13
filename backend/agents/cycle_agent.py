from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from langchain.agents import Tool, AgentExecutor, create_react_agent
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferWindowMemory
from langchain_aws import BedrockLLM
import json
import os
from dotenv import load_dotenv

from ..models.hormonal_cycle import (
    HormonalCycleManager, 
    CycleData, 
    Task, 
    TaskType, 
    CyclePhase
)
from ..services.bedrock_service import BedrockService

load_dotenv()


class CycleAwareAgent:
    """LangChain agent that understands hormonal cycles and optimizes task scheduling"""
    
    def __init__(self):
        self.cycle_manager = HormonalCycleManager()
        self.bedrock_service = BedrockService()
        
        # Initialize Bedrock LLM
        self.llm = BedrockLLM(
            model_id=os.getenv('BEDROCK_MODEL_ID', 'anthropic.claude-3-sonnet-20240229-v1:0'),
            region_name=os.getenv('AWS_DEFAULT_REGION', 'us-east-1'),
            credentials_profile_name=None
        )
        
        # Memory for conversation context
        self.memory = ConversationBufferWindowMemory(
            memory_key="chat_history",
            k=10,
            return_messages=True
        )
        
        # Initialize tools
        self.tools = self._create_tools()
        
        # Create agent
        self.agent = self._create_agent()
    
    def _create_tools(self) -> List[Tool]:
        """Create tools for the agent"""
        
        def get_current_phase_tool(cycle_data_json: str) -> str:
            """Get current hormonal phase for a user"""
            try:
                cycle_data_dict = json.loads(cycle_data_json)
                cycle_data = CycleData(**cycle_data_dict)
                phase = self.cycle_manager.get_current_phase(cycle_data)
                profile = self.cycle_manager.PHASE_PROFILES[phase]
                
                return json.dumps({
                    "current_phase": phase.value,
                    "characteristics": profile.characteristics,
                    "energy_level": profile.energy_level,
                    "focus_level": profile.focus_level,
                    "optimal_for": self._get_optimal_tasks_for_phase(phase)
                })
            except Exception as e:
                return f"Error: {str(e)}"
        
        def analyze_task_tool(task_description: str) -> str:
            """Analyze a task description and categorize it"""
            try:
                analysis = self.bedrock_service.analyze_task_input(task_description)
                return json.dumps(analysis)
            except Exception as e:
                return f"Error analyzing task: {str(e)}"
        
        def find_optimal_scheduling_tool(task_json: str, cycle_data_json: str) -> str:
            """Find optimal scheduling for a task"""
            try:
                task_dict = json.loads(task_json)
                cycle_data_dict = json.loads(cycle_data_json)
                
                # Create task object
                task = Task(
                    title=task_dict['title'],
                    description=task_dict.get('description', ''),
                    task_type=TaskType(task_dict['task_type']),
                    estimated_duration=task_dict['estimated_duration'],
                    priority=task_dict['priority'],
                    deadline=datetime.fromisoformat(task_dict['deadline']) if task_dict.get('deadline') else None
                )
                
                cycle_data = CycleData(**cycle_data_dict)
                
                # Get optimal dates
                optimal_dates = self.cycle_manager.get_next_optimal_dates(task, cycle_data)
                
                results = []
                for date, score in optimal_dates[:5]:  # Top 5 dates
                    phase = self.cycle_manager.get_phase_for_date(cycle_data, date)
                    results.append({
                        "date": date.isoformat(),
                        "score": round(score, 3),
                        "phase": phase.value,
                        "day_of_week": date.strftime("%A")
                    })
                
                return json.dumps(results)
                
            except Exception as e:
                return f"Error finding optimal scheduling: {str(e)}"
        
        def get_phase_recommendations_tool(phase: str) -> str:
            """Get recommendations for a specific hormonal phase"""
            try:
                phase_enum = CyclePhase(phase.lower())
                profile = self.cycle_manager.PHASE_PROFILES[phase_enum]
                
                recommendations = {
                    "phase": phase,
                    "energy_level": profile.energy_level,
                    "focus_level": profile.focus_level,
                    "characteristics": profile.characteristics,
                    "optimal_task_types": self._get_optimal_tasks_for_phase(phase_enum),
                    "self_care_tips": self._get_self_care_tips(phase_enum),
                    "productivity_tips": self._get_productivity_tips(phase_enum)
                }
                
                return json.dumps(recommendations)
                
            except Exception as e:
                return f"Error getting recommendations: {str(e)}"
        
        def calculate_energy_compatibility_tool(task_type: str, phase: str) -> str:
            """Calculate how well a task type matches a hormonal phase"""
            try:
                task_type_enum = TaskType(task_type.lower())
                phase_enum = CyclePhase(phase.lower())
                
                # Find task optimization
                task_opt = None
                for opt in self.cycle_manager.TASK_OPTIMIZATIONS:
                    if opt.task_type == task_type_enum:
                        task_opt = opt
                        break
                
                if not task_opt:
                    return json.dumps({"compatibility": "unknown", "score": 0.5})
                
                compatibility = "high" if phase_enum in task_opt.optimal_phases else "low"
                score = 0.8 if phase_enum in task_opt.optimal_phases else 0.3
                
                return json.dumps({
                    "compatibility": compatibility,
                    "score": score,
                    "reasoning": task_opt.description,
                    "optimal_phases": [p.value for p in task_opt.optimal_phases]
                })
                
            except Exception as e:
                return f"Error calculating compatibility: {str(e)}"
        
        return [
            Tool(
                name="get_current_phase",
                description="Get current hormonal phase and characteristics for a user. Input should be cycle data as JSON.",
                func=get_current_phase_tool
            ),
            Tool(
                name="analyze_task",
                description="Analyze and categorize a task description. Input should be the task description string.",
                func=analyze_task_tool
            ),
            Tool(
                name="find_optimal_scheduling",
                description="Find optimal scheduling dates for a task. Input should be task JSON and cycle data JSON.",
                func=find_optimal_scheduling_tool
            ),
            Tool(
                name="get_phase_recommendations",
                description="Get recommendations for a specific hormonal phase. Input should be phase name.",
                func=get_phase_recommendations_tool
            ),
            Tool(
                name="calculate_energy_compatibility",
                description="Calculate compatibility between task type and hormonal phase. Input should be 'task_type,phase'.",
                func=calculate_energy_compatibility_tool
            )
        ]
    
    def _create_agent(self) -> AgentExecutor:
        """Create the ReAct agent"""
        
        template = """You are a specialized AI assistant that helps women optimize their productivity by aligning tasks with their natural hormonal cycles. You understand the four main phases (menstrual, follicular, ovulatory, luteal) and how different types of tasks are best performed during different phases.

You have access to the following tools:
{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Key principles:
1. Always consider the user's current hormonal phase when making recommendations
2. Provide warm, supportive, and encouraging responses
3. Explain the reasoning behind scheduling recommendations
4. Offer alternatives and flexibility
5. Consider both energy levels and cognitive strengths of each phase
6. Be sensitive to individual variations in cycles

Previous conversation:
{chat_history}

Question: {input}
Thought: {agent_scratchpad}"""

        prompt = PromptTemplate(
            template=template,
            input_variables=["input", "chat_history", "agent_scratchpad"],
            partial_variables={
                "tools": "\n".join([f"{tool.name}: {tool.description}" for tool in self.tools]),
                "tool_names": ", ".join([tool.name for tool in self.tools])
            }
        )
        
        agent = create_react_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )
        
        return AgentExecutor(
            agent=agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True,
            max_iterations=5,
            handle_parsing_errors=True
        )
    
    def _get_optimal_tasks_for_phase(self, phase: CyclePhase) -> List[str]:
        """Get list of optimal task types for a phase"""
        optimal_tasks = []
        for opt in self.cycle_manager.TASK_OPTIMIZATIONS:
            if phase in opt.optimal_phases:
                optimal_tasks.append(opt.task_type.value)
        return optimal_tasks
    
    def _get_self_care_tips(self, phase: CyclePhase) -> List[str]:
        """Get self-care tips for each phase"""
        tips = {
            CyclePhase.MENSTRUAL: [
                "Rest and gentle movement",
                "Warm baths and heating pads",
                "Nourishing foods and hydration",
                "Journaling and reflection",
                "Gentle yoga or stretching"
            ],
            CyclePhase.FOLLICULAR: [
                "Try new activities and challenges",
                "Social activities and networking",
                "Creative projects and brainstorming",
                "Learn new skills",
                "Moderate to intense exercise"
            ],
            CyclePhase.OVULATORY: [
                "Schedule important meetings",
                "Social events and presentations",
                "High-intensity workouts",
                "Collaborative projects",
                "Public speaking opportunities"
            ],
            CyclePhase.LUTEAL: [
                "Focus on completing projects",
                "Organize and declutter",
                "Prepare for upcoming menstruation",
                "Gentle exercise like walking",
                "Practice stress management"
            ]
        }
        return tips.get(phase, [])
    
    def _get_productivity_tips(self, phase: CyclePhase) -> List[str]:
        """Get productivity tips for each phase"""
        tips = {
            CyclePhase.MENSTRUAL: [
                "Focus on planning and strategizing",
                "Do detailed analytical work",
                "Review and evaluate past projects",
                "Work in quiet, comfortable environments",
                "Take frequent breaks"
            ],
            CyclePhase.FOLLICULAR: [
                "Start new projects and initiatives",
                "Brainstorm and generate ideas",
                "Learn new skills or take courses",
                "Network and build relationships",
                "Take on challenging problems"
            ],
            CyclePhase.OVULATORY: [
                "Schedule presentations and meetings",
                "Negotiate and make important decisions",
                "Collaborate on team projects",
                "Handle difficult conversations",
                "Take leadership roles"
            ],
            CyclePhase.LUTEAL: [
                "Focus on finishing and completing tasks",
                "Do detailed editing and proofreading",
                "Organize files and systems",
                "Handle administrative tasks",
                "Prepare for the next cycle"
            ]
        }
        return tips.get(phase, [])
    
    def process_user_input(self, user_input: str, cycle_data: Optional[CycleData] = None) -> str:
        """Process user input and return agent response"""
        
        # Add cycle data to context if available
        context = ""
        if cycle_data:
            context = f"User's cycle data: {cycle_data.model_dump_json()}\n\n"
        
        full_input = context + user_input
        
        try:
            response = self.agent.invoke({"input": full_input})
            return response["output"]
        except Exception as e:
            return f"I apologize, but I encountered an error processing your request. Please try rephrasing your question. Error: {str(e)}"
    
    def get_daily_insights(self, cycle_data: CycleData, upcoming_tasks: List[Dict] = None) -> str:
        """Generate daily insights for the user"""
        current_phase = self.cycle_manager.get_current_phase(cycle_data)
        profile = self.cycle_manager.PHASE_PROFILES[current_phase]
        
        if upcoming_tasks is None:
            upcoming_tasks = []
        
        return self.bedrock_service.generate_daily_insights(
            current_phase.value,
            upcoming_tasks,
            profile.energy_level
        )