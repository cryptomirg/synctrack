import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  CalendarIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

interface InsightsProps {
  user: { id: string; name: string };
  cycleData: any;
}

interface PhaseInsight {
  phase: string;
  emoji: string;
  name: string;
  energyLevel: number;
  focusLevel: number;
  optimalTasks: string[];
  characteristics: string[];
  tips: string[];
}

const Insights: React.FC<InsightsProps> = ({ user, cycleData }) => {
  const [insights, setInsights] = useState<string>('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInsights = useCallback(async () => {
    try {
      // Load insights
      const insightsResponse = await axios.get(`/api/cycle/${user.id}/insights`);
      setInsights(insightsResponse.data.insights);
      
      // Load recommendations
      const recommendationsResponse = await axios.get(`/api/optimize/${user.id}/task-recommendations`);
      setRecommendations(recommendationsResponse.data.recommended_tasks || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const phaseInsights: PhaseInsight[] = [
    {
      phase: 'menstrual',
      emoji: '🌙',
      name: 'Menstrual Phase',
      energyLevel: 3,
      focusLevel: 6,
      optimalTasks: ['Planning', 'Analysis', 'Reflection', 'Organization'],
      characteristics: [
        'Introspective and reflective',
        'Good for planning and organizing',
        'Lower energy but high focus',
        'Excellent for detail-oriented work'
      ],
      tips: [
        'Focus on planning and strategizing',
        'Do detailed analytical work',
        'Take time for reflection',
        'Work in quiet, comfortable environments'
      ]
    },
    {
      phase: 'follicular',
      emoji: '🌱',
      name: 'Follicular Phase',
      energyLevel: 7,
      focusLevel: 8,
      optimalTasks: ['Creative Work', 'Learning', 'New Projects', 'Innovation'],
      characteristics: [
        'Rising energy and optimism',
        'Peak creativity and innovation',
        'Great for new projects',
        'High learning capacity'
      ],
      tips: [
        'Start new projects and initiatives',
        'Brainstorm and generate ideas',
        'Learn new skills or take courses',
        'Take on challenging problems'
      ]
    },
    {
      phase: 'ovulatory',
      emoji: '☀️',
      name: 'Ovulatory Phase',
      energyLevel: 9,
      focusLevel: 7,
      optimalTasks: ['Presentations', 'Meetings', 'Networking', 'Communication'],
      characteristics: [
        'Peak energy and confidence',
        'Excellent for communication',
        'Great for presentations and meetings',
        'High social energy'
      ],
      tips: [
        'Schedule presentations and meetings',
        'Network and build relationships',
        'Handle difficult conversations',
        'Take leadership roles'
      ]
    },
    {
      phase: 'luteal',
      emoji: '🍂',
      name: 'Luteal Phase',
      energyLevel: 5,
      focusLevel: 9,
      optimalTasks: ['Completion', 'Admin Work', 'Editing', 'Organization'],
      characteristics: [
        'High attention to detail',
        'Excellent for administrative tasks',
        'Good for editing and reviewing',
        'Strong analytical thinking'
      ],
      tips: [
        'Focus on finishing and completing tasks',
        'Do detailed editing and proofreading',
        'Organize files and systems',
        'Handle administrative tasks'
      ]
    }
  ];

  const getCurrentPhaseInsight = () => {
    if (!cycleData) return phaseInsights[0];
    return phaseInsights.find(insight => insight.phase === cycleData.phase) || phaseInsights[0];
  };

  const getPhaseColor = (phase: string) => {
    const colors = {
      menstrual: 'from-red-400 to-red-600',
      follicular: 'from-green-400 to-green-600',
      ovulatory: 'from-yellow-400 to-yellow-600',
      luteal: 'from-blue-400 to-blue-600'
    };
    return colors[phase as keyof typeof colors] || 'from-gray-400 to-gray-600';
  };

  const formatTaskType = (taskType: string) => {
    return taskType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentInsight = getCurrentPhaseInsight();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-2">Cycle Insights</h1>
        <p className="text-gray-600">
          Understand your productivity patterns and optimize your workflow
        </p>
      </div>

      {/* Current Phase Detailed Insight */}
      {cycleData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card bg-gradient-to-br ${getPhaseColor(cycleData.phase)} text-white relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 text-6xl opacity-20">
            {currentInsight.emoji}
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {currentInsight.emoji} {currentInsight.name}
                </h2>
                <p className="text-white/90">Day {cycleData.day_in_cycle} of your cycle</p>
              </div>
              <div className="text-right">
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-sm text-white/80">Energy</div>
                  <div className="text-xl font-bold">{currentInsight.energyLevel}/10</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Optimal for:</h4>
                <div className="flex flex-wrap gap-2">
                  {currentInsight.optimalTasks.map((task, index) => (
                    <span key={index} className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      {task}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Key Characteristics:</h4>
                <ul className="space-y-1 text-sm text-white/90">
                  {currentInsight.characteristics.slice(0, 2).map((char, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-white/60 rounded-full mr-2"></span>
                      {char}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Insights */}
      {insights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-4">
            <SparklesIcon className="w-6 h-6 text-primary-500" />
            <h3 className="text-xl font-semibold">AI Insights</h3>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700">
            {insights.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-3">{paragraph}</p>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Tips */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-4">
            <BoltIcon className="w-6 h-6 text-yellow-500" />
            <h3 className="text-xl font-semibold">Productivity Tips</h3>
          </div>
          <div className="space-y-3">
            {currentInsight.tips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Task Recommendations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-4">
            <ChartBarIcon className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-semibold">Recommended Tasks</h3>
          </div>
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.slice(0, 4).map((rec, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-blue-900">
                      {formatTaskType(rec.task_type)}
                    </h4>
                    <div className="flex space-x-2 text-xs">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        Energy: {rec.energy_requirement}/10
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700">{rec.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No specific recommendations available
            </p>
          )}
        </motion.div>
      </div>

      {/* Phase Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <h3 className="text-xl font-semibold mb-6">Complete Cycle Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {phaseInsights.map((insight, index) => (
            <div
              key={insight.phase}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                cycleData?.phase === insight.phase
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="text-center mb-3">
                <div className="text-2xl mb-1">{insight.emoji}</div>
                <h4 className="font-semibold text-sm">{insight.name}</h4>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Energy:</span>
                  <span className="font-medium">{insight.energyLevel}/10</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Focus:</span>
                  <span className="font-medium">{insight.focusLevel}/10</span>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xs text-gray-600 mb-1">Best for:</div>
                <div className="flex flex-wrap gap-1">
                  {insight.optimalTasks.slice(0, 2).map((task, taskIndex) => (
                    <span key={taskIndex} className="text-xs bg-white px-2 py-1 rounded text-gray-700">
                      {task}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Cycle Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="card text-center">
          <CalendarIcon className="w-8 h-8 text-primary-500 mx-auto mb-3" />
          <div className="text-2xl font-bold text-primary-600">
            {cycleData?.cycle_length || 28}
          </div>
          <div className="text-sm text-gray-600">Average Cycle Length</div>
        </div>

        <div className="card text-center">
          <ClockIcon className="w-8 h-8 text-green-500 mx-auto mb-3" />
          <div className="text-2xl font-bold text-green-600">
            {cycleData?.day_in_cycle || 1}
          </div>
          <div className="text-sm text-gray-600">Current Cycle Day</div>
        </div>

        <div className="card text-center">
          <ArrowTrendingUpIcon className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
          <div className="text-2xl font-bold text-yellow-600">
            {currentInsight.energyLevel}/10
          </div>
          <div className="text-sm text-gray-600">Current Energy Level</div>
        </div>
      </motion.div>
    </div>
  );
};

export default Insights;