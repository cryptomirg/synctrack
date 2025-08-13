from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import json
import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import pickle
from icalendar import Calendar, Event
from ..models.hormonal_cycle import Task, CycleData, HormonalCycleManager


class CalendarService:
    """Service for calendar integration and task scheduling"""
    
    # Google Calendar API scopes
    SCOPES = ['https://www.googleapis.com/auth/calendar']
    
    def __init__(self):
        self.cycle_manager = HormonalCycleManager()
        self.service = None
        self._initialize_google_calendar()
    
    def _initialize_google_calendar(self):
        """Initialize Google Calendar API service"""
        try:
            creds = None
            token_file = os.getenv('GOOGLE_CALENDAR_TOKEN_FILE', 'token.pickle')
            credentials_file = os.getenv('GOOGLE_CALENDAR_CREDENTIALS_FILE', 'credentials.json')
            
            # Load existing token
            if os.path.exists(token_file):
                with open(token_file, 'rb') as token:
                    creds = pickle.load(token)
            
            # If there are no valid credentials, request authorization
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                elif os.path.exists(credentials_file):
                    flow = InstalledAppFlow.from_client_secrets_file(
                        credentials_file, self.SCOPES)
                    creds = flow.run_local_server(port=0)
                
                # Save credentials for next run
                if creds:
                    with open(token_file, 'wb') as token:
                        pickle.dump(creds, token)
            
            if creds:
                self.service = build('calendar', 'v3', credentials=creds)
                
        except Exception as e:
            print(f"Could not initialize Google Calendar: {e}")
            self.service = None
    
    def create_calendar_event(self, task: Task, scheduled_time: datetime, duration_minutes: int = None) -> Optional[str]:
        """Create a calendar event for a task"""
        if not self.service:
            return None
        
        try:
            duration = duration_minutes or task.estimated_duration
            end_time = scheduled_time + timedelta(minutes=duration)
            
            event = {
                'summary': task.title,
                'description': task.description or f"Optimally scheduled task during your hormonal cycle",
                'start': {
                    'dateTime': scheduled_time.isoformat(),
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': 'UTC',
                },
                'colorId': self._get_color_for_task_type(task.task_type),
                'extendedProperties': {
                    'private': {
                        'taskType': task.task_type.value,
                        'priority': str(task.priority),
                        'syncTrackerTask': 'true'
                    }
                }
            }
            
            # Add reminder based on priority
            if task.priority >= 4:
                event['reminders'] = {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                        {'method': 'popup', 'minutes': 30},      # 30 min before
                    ],
                }
            elif task.priority >= 2:
                event['reminders'] = {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'popup', 'minutes': 15},      # 15 min before
                    ],
                }
            
            created_event = self.service.events().insert(calendarId='primary', body=event).execute()
            return created_event.get('id')
            
        except Exception as e:
            print(f"Error creating calendar event: {e}")
            return None
    
    def _get_color_for_task_type(self, task_type) -> str:
        """Get calendar color ID for task type"""
        color_mapping = {
            'creative': '5',      # Yellow
            'analytical': '9',    # Blue
            'physical': '11',     # Red
            'social': '10',       # Green
            'administrative': '8', # Gray
            'strategic': '3',     # Purple
            'detail_oriented': '6', # Orange
            'communication': '2',  # Sage
            'learning': '4',      # Flamingo
            'reflection': '1'     # Lavender
        }
        return color_mapping.get(task_type.value, '1')
    
    def get_calendar_availability(self, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Get calendar availability for a date range"""
        if not self.service:
            return []
        
        try:
            events_result = self.service.events().list(
                calendarId='primary',
                timeMin=start_date.isoformat() + 'Z',
                timeMax=end_date.isoformat() + 'Z',
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            busy_times = []
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))
                
                if 'T' in start:  # dateTime format
                    start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                    end_dt = datetime.fromisoformat(end.replace('Z', '+00:00'))
                    
                    busy_times.append({
                        'start': start_dt,
                        'end': end_dt,
                        'summary': event.get('summary', 'Busy')
                    })
            
            return busy_times
            
        except Exception as e:
            print(f"Error getting calendar availability: {e}")
            return []
    
    def find_available_slots(self, start_date: datetime, end_date: datetime, 
                           duration_minutes: int, working_hours: tuple = (9, 17)) -> List[Dict]:
        """Find available time slots in calendar"""
        busy_times = self.get_calendar_availability(start_date, end_date)
        available_slots = []
        
        current_date = start_date.date()
        end_date_only = end_date.date()
        
        while current_date <= end_date_only:
            # Skip weekends (optional - can be configured)
            if current_date.weekday() >= 5:  # Saturday = 5, Sunday = 6
                current_date += timedelta(days=1)
                continue
            
            # Check each hour in working hours
            for hour in range(working_hours[0], working_hours[1]):
                slot_start = datetime.combine(current_date, datetime.min.time().replace(hour=hour))
                slot_end = slot_start + timedelta(minutes=duration_minutes)
                
                # Check if slot conflicts with busy times
                is_available = True
                for busy in busy_times:
                    if (slot_start < busy['end'] and slot_end > busy['start']):
                        is_available = False
                        break
                
                if is_available:
                    available_slots.append({
                        'start': slot_start,
                        'end': slot_end,
                        'duration': duration_minutes
                    })
            
            current_date += timedelta(days=1)
        
        return available_slots
    
    def schedule_task_optimally(self, task: Task, cycle_data: CycleData, 
                              days_ahead: int = 14, working_hours: tuple = (9, 17)) -> Optional[Dict]:
        """Schedule a task at the optimal time considering cycle and calendar availability"""
        
        # Get optimal dates from cycle manager
        optimal_dates = self.cycle_manager.get_next_optimal_dates(task, cycle_data, days_ahead)
        
        # Find available slots for each optimal date
        for optimal_date, cycle_score in optimal_dates:
            start_of_day = optimal_date.replace(hour=working_hours[0], minute=0, second=0, microsecond=0)
            end_of_day = optimal_date.replace(hour=working_hours[1], minute=0, second=0, microsecond=0)
            
            available_slots = self.find_available_slots(
                start_of_day, 
                end_of_day, 
                task.estimated_duration,
                working_hours
            )
            
            if available_slots:
                # Choose the first available slot (can be enhanced with preferences)
                best_slot = available_slots[0]
                
                # Create calendar event
                event_id = self.create_calendar_event(task, best_slot['start'], task.estimated_duration)
                
                phase = self.cycle_manager.get_phase_for_date(cycle_data, optimal_date)
                
                return {
                    'scheduled_time': best_slot['start'],
                    'end_time': best_slot['end'],
                    'cycle_score': cycle_score,
                    'hormonal_phase': phase.value,
                    'calendar_event_id': event_id,
                    'reasoning': f"Scheduled during {phase.value} phase for optimal {task.task_type.value} performance"
                }
        
        return None
    
    def update_calendar_event(self, event_id: str, updates: Dict) -> bool:
        """Update an existing calendar event"""
        if not self.service or not event_id:
            return False
        
        try:
            event = self.service.events().get(calendarId='primary', eventId=event_id).execute()
            
            # Apply updates
            for key, value in updates.items():
                if key in ['summary', 'description']:
                    event[key] = value
                elif key == 'start_time':
                    event['start']['dateTime'] = value.isoformat()
                elif key == 'end_time':
                    event['end']['dateTime'] = value.isoformat()
            
            updated_event = self.service.events().update(
                calendarId='primary', 
                eventId=event_id, 
                body=event
            ).execute()
            
            return True
            
        except Exception as e:
            print(f"Error updating calendar event: {e}")
            return False
    
    def delete_calendar_event(self, event_id: str) -> bool:
        """Delete a calendar event"""
        if not self.service or not event_id:
            return False
        
        try:
            self.service.events().delete(calendarId='primary', eventId=event_id).execute()
            return True
        except Exception as e:
            print(f"Error deleting calendar event: {e}")
            return False
    
    def get_upcoming_tasks(self, days_ahead: int = 7) -> List[Dict]:
        """Get upcoming SyncTracker tasks from calendar"""
        if not self.service:
            return []
        
        try:
            start_time = datetime.utcnow()
            end_time = start_time + timedelta(days=days_ahead)
            
            events_result = self.service.events().list(
                calendarId='primary',
                timeMin=start_time.isoformat() + 'Z',
                timeMax=end_time.isoformat() + 'Z',
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            sync_tracker_tasks = []
            
            for event in events:
                # Check if it's a SyncTracker task
                extended_props = event.get('extendedProperties', {}).get('private', {})
                if extended_props.get('syncTrackerTask') == 'true':
                    
                    start = event['start'].get('dateTime', event['start'].get('date'))
                    if 'T' in start:
                        start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                    else:
                        start_dt = datetime.fromisoformat(start)
                    
                    sync_tracker_tasks.append({
                        'title': event.get('summary', 'Task'),
                        'description': event.get('description', ''),
                        'start_time': start_dt,
                        'task_type': extended_props.get('taskType', 'administrative'),
                        'priority': int(extended_props.get('priority', 3)),
                        'event_id': event['id']
                    })
            
            return sync_tracker_tasks
            
        except Exception as e:
            print(f"Error getting upcoming tasks: {e}")
            return []
    
    def export_to_ical(self, tasks: List[Task], cycle_data: CycleData) -> str:
        """Export tasks to iCal format"""
        cal = Calendar()
        cal.add('prodid', '-//SyncTracker//Hormonal Cycle Task Optimizer//EN')
        cal.add('version', '2.0')
        
        for task in tasks:
            optimal_dates = self.cycle_manager.get_next_optimal_dates(task, cycle_data, 30)
            if optimal_dates:
                best_date, score = optimal_dates[0]
                
                event = Event()
                event.add('summary', task.title)
                event.add('description', task.description or f"Optimally scheduled {task.task_type.value} task")
                event.add('dtstart', best_date)
                event.add('dtend', best_date + timedelta(minutes=task.estimated_duration))
                event.add('priority', task.priority)
                
                phase = self.cycle_manager.get_phase_for_date(cycle_data, best_date)
                event.add('categories', [task.task_type.value, phase.value])
                
                cal.add_component(event)
        
        return cal.to_ical().decode('utf-8')