import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CalendarIcon, 
  ClockIcon, 
  ChartBarIcon, 
  SparklesIcon,
  MicrophoneIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface DashboardProps {
  user: { id: string; name: string };
  cycleData: any;
  onRefreshCycle: () => void;
}

interface TaskRecommendation {
  task_type: string;
  description: string;
  energy_requirement: number;
  focus_requirement: number;
}

const Dashboard: React.FC<DashboardProps> = ({ user, cycleData, onRefreshCycle }) => {
  const [insights, setInsights] = useState<string>('');
  const [recommendations, setRecommendations] = useState<TaskRecommendation[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load insights
      const insightsResponse = await axios.get(`/api/cycle/${user.id}/insights`);
      setInsights(insightsResponse.data.insights);
      
      // Load task recommendations
      const recommendationsResponse = await axios.get(`/api/optimize/${user.id}/task-recommendations`);
      setRecommendations(recommendationsResponse.data.recommended_tasks || []);
      
      // Load upcoming tasks
      const upcomingResponse = await axios.get(`/api/tasks/${user.id}/upcoming`);
      setUpcomingTasks(upcomingResponse.data.upcoming_tasks || []);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getPhaseColor = (phase: string) => {
    const colors = {
      menstrual: 'from-red-400 to-red-600',
      follicular: 'from-green-400 to-green-600',
      ovulatory: 'from-yellow-400 to-yellow-600',
      luteal: 'from-blue-400 to-blue-600'
    };
    return colors[phase as keyof typeof colors] || 'from-gray-400 to-gray-600';
  };

  const getPhaseEmoji = (phase: string) => {
    const emojis = {
      menstrual: '🌙',
      follicular: '🌱',
      ovulatory: '☀️',
      luteal: '🍂'
    };
    return emojis[phase as keyof typeof emojis] || '⭐';
  };

  const formatTaskType = (taskType: string) => {
    return taskType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gradient mb-2">
          Welcome back, {user.name}! 👋
        </h1>
        <p className="text-lg text-gray-600">
          Let's make today productive and aligned with your natural rhythm
        </p>
      </motion.div>

      {/* Current Phase Card */}
      {cycleData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`phase-card bg-gradient-to-br ${getPhaseColor(cycleData.phase)} relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 text-6xl opacity-20">
            {getPhaseEmoji(cycleData.phase)}
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {getPhaseEmoji(cycleData.phase)} {cycleData.phase.charAt(0).toUpperCase() + cycleData.phase.slice(1)} Phase
                </h2>
                <p className="text-white/90">Day {cycleData.day_in_cycle} of your cycle</p>
              </div>
              <button
                onClick={onRefreshCycle}
                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm transition-colors"
              >
                Refresh
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-sm text-white/80">Energy Level</div>
                <div className="text-xl font-bold">{cycleData.energy_level}/10</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-sm text-white/80">Focus Level</div>
                <div className="text-xl font-bold">{cycleData.focus_level}/10</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Key Characteristics:</h4>
              <ul className="text-sm text-white/90 space-y-1">
                {cycleData.characteristics.slice(0, 3).map((char: string, index: number) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-white/60 rounded-full mr-2"></span>
                    {char}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Link to="/voice" className="card hover:shadow-xl transition-shadow group">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg group-hover:scale-110 transition-transform">
              <MicrophoneIcon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold">Voice Input</h3>
          </div>
          <p className="text-sm text-gray-600">Speak your tasks naturally</p>
        </Link>

        <Link to="/chat" className="card hover:shadow-xl transition-shadow group">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg group-hover:scale-110 transition-transform">
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <p className="text-sm text-gray-600">Chat about your schedule</p>
        </Link>

        <Link to="/calendar" className="card hover:shadow-xl transition-shadow group">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg group-hover:scale-110 transition-transform">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold">Calendar</h3>
          </div>
          <p className="text-sm text-gray-600">View optimized schedule</p>
        </Link>

        <Link to="/insights" className="card hover:shadow-xl transition-shadow group">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg group-hover:scale-110 transition-transform">
              <ChartBarIcon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold">Insights</h3>
          </div>
          <p className="text-sm text-gray-600">Analyze your patterns</p>
        </Link>
      </motion.div>

      {/* Daily Insights */}
      {insights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-4">
            <SparklesIcon className="w-6 h-6 text-primary-500" />
            <h3 className="text-xl font-semibold">Today's Insights</h3>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700">
            {insights.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-3">{paragraph}</p>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Task Recommendations */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="text-xl font-semibold mb-4">Optimal Tasks for Today</h3>
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.slice(0, 5).map((rec, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-primary-700">
                      {formatTaskType(rec.task_type)}
                    </h4>
                    <div className="flex space-x-2 text-xs">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        Energy: {rec.energy_requirement}/10
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                        Focus: {rec.focus_requirement}/10
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No specific recommendations available
            </p>
          )}
        </motion.div>

        {/* Upcoming Tasks */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Upcoming Tasks</h3>
            <Link to="/tasks" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </Link>
          </div>
          
          {upcomingTasks.length > 0 ? (
            <div className="space-y-3">
              {upcomingTasks.slice(0, 5).map((task, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <ClockIcon className="w-4 h-4" />
                      <span>{new Date(task.start_time).toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                    {formatTaskType(task.task_type)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No upcoming tasks scheduled</p>
              <Link to="/voice" className="btn-primary text-sm">
                Add Your First Task
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Productivity Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card bg-gradient-to-r from-primary-50 to-purple-50 border-primary-100"
      >
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-primary-100 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h4 className="font-semibold text-primary-900 mb-2">💡 Productivity Tip</h4>
            <p className="text-primary-700">
              {cycleData?.phase === 'menstrual' && "This is a great time for reflection and planning. Consider reviewing your goals and organizing your workspace."}
              {cycleData?.phase === 'follicular' && "Your creativity is peaking! Perfect time to start new projects and brainstorm innovative solutions."}
              {cycleData?.phase === 'ovulatory' && "You're at peak energy! Schedule important meetings, presentations, and collaborative work."}
              {cycleData?.phase === 'luteal' && "Excellent focus for detail work! Perfect for editing, organizing, and completing projects."}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;