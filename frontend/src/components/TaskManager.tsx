import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

interface TaskManagerProps {
  user: { id: string; name: string };
  cycleData: any;
}

interface Task {
  id?: string;
  title: string;
  description?: string;
  task_type: string;
  estimated_duration: number;
  priority: number;
  deadline?: string;
  scheduled_at?: string;
  completed: boolean;
  phase?: string;
}

const TaskManager: React.FC<TaskManagerProps> = ({ user, cycleData }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    task_type: 'administrative',
    estimated_duration: 60,
    priority: 3,
    completed: false
  });
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    try {
      const response = await axios.get(`/api/tasks/${user.id}`);
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const addTask = async () => {
    if (!newTask.title?.trim()) return;

    try {
      const response = await axios.post('/api/tasks/schedule', {
        user_id: user.id,
        task: newTask
      });

      setTasks(prev => [...prev, response.data.task]);
      setNewTask({
        title: '',
        description: '',
        task_type: 'administrative',
        estimated_duration: 60,
        priority: 3,
        completed: false
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleComplete = (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const getPhaseColor = (phase: string) => {
    const colors = {
      menstrual: 'bg-red-100 text-red-800 border-red-200',
      follicular: 'bg-green-100 text-green-800 border-green-200',
      ovulatory: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      luteal: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[phase as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'bg-red-100 text-red-800 border-red-200';
    if (priority >= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const formatTaskType = (taskType: string) => {
    return taskType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Task Manager</h1>
          <p className="text-gray-600">
            Organize your tasks with cycle-aware scheduling
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Current Phase Info */}
      {cycleData && (
        <div className="card bg-gradient-to-r from-primary-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-primary-900">
                Current Phase: {cycleData.phase.charAt(0).toUpperCase() + cycleData.phase.slice(1)}
              </h3>
              <p className="text-primary-700 text-sm">
                Energy: {cycleData.energy_level}/10 | Focus: {cycleData.focus_level}/10
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-600">Day {cycleData.day_in_cycle} of cycle</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card"
          >
            <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTask.title || ''}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title..."
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTask.description || ''}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Task description (optional)..."
                  rows={3}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Type
                  </label>
                  <select
                    value={newTask.task_type || 'administrative'}
                    onChange={(e) => setNewTask(prev => ({ ...prev, task_type: e.target.value }))}
                    className="input-field"
                  >
                    <option value="creative">Creative</option>
                    <option value="analytical">Analytical</option>
                    <option value="physical">Physical</option>
                    <option value="social">Social</option>
                    <option value="administrative">Administrative</option>
                    <option value="strategic">Strategic</option>
                    <option value="communication">Communication</option>
                    <option value="learning">Learning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={newTask.estimated_duration || 60}
                    onChange={(e) => setNewTask(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) }))}
                    min="15"
                    max="480"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTask.priority || 3}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    className="input-field"
                  >
                    <option value={1}>Low</option>
                    <option value={2}>Medium-Low</option>
                    <option value={3}>Medium</option>
                    <option value={4}>High</option>
                    <option value={5}>Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={addTask}
                  className="btn-primary"
                >
                  Add Task
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="card text-center py-12">
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-500 mb-4">Add your first task to get started with cycle-aware scheduling</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Add Your First Task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Your Tasks ({tasks.length})</h3>
            {tasks.map((task, index) => (
              <motion.div
                key={task.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`card transition-all duration-200 ${
                  task.completed ? 'opacity-75 bg-gray-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <button
                      onClick={() => toggleComplete(task.id || '')}
                      className={`mt-1 flex-shrink-0 ${
                        task.completed ? 'text-green-500' : 'text-gray-300 hover:text-green-500'
                      }`}
                    >
                      <CheckCircleIcon className="w-6 h-6" />
                    </button>

                    <div className="flex-1">
                      <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          Priority {task.priority}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          {formatTaskType(task.task_type)}
                        </span>
                        {task.phase && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPhaseColor(task.phase)}`}>
                            {task.phase}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 flex items-center">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {task.estimated_duration}m
                        </span>
                        {task.scheduled_at && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {new Date(task.scheduled_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => deleteTask(task.id || '')}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;