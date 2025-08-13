import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

interface CalendarProps {
  user: { id: string; name: string };
  cycleData: any;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  phase: string;
  tasks: any[];
  cycleDay?: number;
}

const Calendar: React.FC<CalendarProps> = ({ user, cycleData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUpcomingTasks = useCallback(async () => {
    try {
      const response = await axios.get(`/api/tasks/${user.id}/upcoming`);
      setUpcomingTasks(response.data.upcoming_tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const generateCalendar = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();
    
    // Default cycle data if not provided
    const defaultCycleData = {
      last_period_start: new Date(2025, 7, 1), // August 1, 2025
      cycle_length: 28
    };
    
    const cycleInfo = cycleData || defaultCycleData;
    const lastPeriodDate = new Date(cycleInfo.last_period_start);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      // Calculate cycle day and phase
      const daysSinceLastPeriod = Math.floor((date.getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24));
      const cycleDay = ((daysSinceLastPeriod % cycleInfo.cycle_length) + cycleInfo.cycle_length) % cycleInfo.cycle_length + 1;
      
      let phase = 'luteal';
      if (cycleDay >= 1 && cycleDay <= 5) phase = 'menstrual';
      else if (cycleDay >= 6 && cycleDay <= 13) phase = 'follicular';
      else if (cycleDay >= 14 && cycleDay <= 16) phase = 'ovulatory';

      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        phase,
        cycleDay: date.getMonth() === month ? cycleDay : undefined,
        tasks: upcomingTasks.filter(task => 
          task.start_time && new Date(task.start_time).toDateString() === date.toDateString()
        )
      });
    }

    setCalendarDays(days);
  }, [currentDate, cycleData, upcomingTasks]);

  useEffect(() => {
    generateCalendar();
    loadUpcomingTasks();
  }, [generateCalendar, loadUpcomingTasks]);

  // Always generate calendar on mount
  useEffect(() => {
    generateCalendar();
  }, []);

  const getPhaseColor = (phase: string, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return 'bg-gray-50';
    
    const colors = {
      menstrual: 'bg-red-50 border-red-200',
      follicular: 'bg-green-50 border-green-200',
      ovulatory: 'bg-yellow-50 border-yellow-200',
      luteal: 'bg-blue-50 border-blue-200'
    };
    return colors[phase as keyof typeof colors] || 'bg-gray-50';
  };

  const getPhaseEmoji = (phase: string) => {
    const emojis = {
      menstrual: '🌙',
      follicular: '🌱',
      ovulatory: '☀️',
      luteal: '🍂'
    };
    return emojis[phase as keyof typeof emojis] || '';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatTaskType = (taskType: string) => {
    return taskType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Remove loading state that prevents calendar from showing

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Cycle Calendar</h1>
          <p className="text-gray-600">
            View your tasks aligned with your hormonal cycle phases
          </p>
        </div>
      </div>

      {/* Current Phase Info */}
      <div className="card bg-gradient-to-r from-primary-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-primary-900">
              Current Phase: {getPhaseEmoji(cycleData?.phase || 'follicular')} {(cycleData?.phase || 'follicular').charAt(0).toUpperCase() + (cycleData?.phase || 'follicular').slice(1)}
            </h3>
            <p className="text-primary-700 text-sm">
              Day {cycleData?.day_in_cycle || 8} of your {cycleData?.cycle_length || 28}-day cycle
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-primary-600">Energy: {cycleData?.energy_level || 7}/10</p>
            <p className="text-sm text-primary-600">Focus: {cycleData?.focus_level || 8}/10</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <div className="card">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className={`
                    min-h-24 p-2 border rounded-lg transition-all duration-200 hover:shadow-sm
                    ${getPhaseColor(day.phase, day.isCurrentMonth)}
                    ${day.isToday ? 'ring-2 ring-primary-500' : ''}
                    ${!day.isCurrentMonth ? 'opacity-50' : ''}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="text-sm font-medium">
                      {day.date.getDate()}
                    </div>
                    {day.isCurrentMonth && (
                      <div className="text-xs">
                        {getPhaseEmoji(day.phase)}
                      </div>
                    )}
                  </div>
                  
                  {day.cycleDay && day.isCurrentMonth && (
                    <div className="text-xs text-gray-500 mt-1">
                      Day {day.cycleDay}
                    </div>
                  )}

                  {/* Tasks for this day */}
                  {day.tasks.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {day.tasks.slice(0, 2).map((task, taskIndex) => (
                        <div
                          key={taskIndex}
                          className="text-xs bg-primary-100 text-primary-800 px-1 py-0.5 rounded truncate"
                        >
                          {task.title}
                        </div>
                      ))}
                      {day.tasks.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{day.tasks.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Phase Legend */}
          <div className="card">
            <h3 className="font-semibold mb-4">Cycle Phases</h3>
            <div className="space-y-3">
              {[
                { phase: 'menstrual', name: 'Menstrual', emoji: '🌙', desc: 'Rest & Reflect' },
                { phase: 'follicular', name: 'Follicular', emoji: '🌱', desc: 'Create & Learn' },
                { phase: 'ovulatory', name: 'Ovulatory', emoji: '☀️', desc: 'Connect & Present' },
                { phase: 'luteal', name: 'Luteal', emoji: '🍂', desc: 'Focus & Complete' }
              ].map(({ phase, name, emoji, desc }) => (
                <div key={phase} className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${getPhaseColor(phase, true)}`}></div>
                  <div>
                    <div className="text-sm font-medium">{emoji} {name}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="card">
            <h3 className="font-semibold mb-4">Upcoming Tasks</h3>
            {upcomingTasks.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming tasks</p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.slice(0, 5).map((task, index) => (
                  <div key={index} className="border-l-4 border-primary-500 pl-3">
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <CalendarIcon className="w-3 h-3 mr-1" />
                      {new Date(task.start_time).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <ClockIcon className="w-3 h-3 mr-1" />
                      {formatTaskType(task.task_type)}
                    </div>
                  </div>
                ))}
                {upcomingTasks.length > 5 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{upcomingTasks.length - 5} more tasks
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;