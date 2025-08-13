import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicrophoneIcon, StopIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import axios from 'axios';

interface VoiceInterfaceProps {
  user: { id: string; name: string };
  cycleData: any;
}

interface TaskAnalysis {
  tasks: Array<{
    title: string;
    description: string;
    task_type: string;
    estimated_duration: number;
    priority: number;
    deadline?: string;
  }>;
  intent: string;
  additional_context: string;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ user, cycleData }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<TaskAnalysis | null>(null);
  const [scheduledTasks, setScheduledTasks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Request microphone permission on component mount
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => console.log('Microphone access granted'))
      .catch(err => console.error('Microphone access denied:', err));
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await axios.post(`/api/tasks/voice?user_id=${user.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setTranscript(response.data.transcribed_text);
      setAnalysis(response.data.analysis);
    } catch (err: any) {
      console.error('Error processing audio:', err);
      setError(err.response?.data?.detail || 'Failed to process audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const scheduleTask = async (task: any) => {
    try {
      const response = await axios.post('/api/tasks/schedule', {
        user_id: user.id,
        task: task,
        working_hours: [9, 17]
      });

      setScheduledTasks(prev => [...prev, response.data]);
    } catch (err: any) {
      console.error('Error scheduling task:', err);
      setError(err.response?.data?.detail || 'Failed to schedule task');
    }
  };

  const scheduleAllTasks = async () => {
    if (!analysis?.tasks) return;

    for (const task of analysis.tasks) {
      await scheduleTask(task);
    }
  };

  const processTextInput = async () => {
    if (!transcript.trim()) return;

    try {
      setIsProcessing(true);
      const response = await axios.post('/api/tasks/analyze', {
        user_id: user.id,
        text: transcript
      });

      setAnalysis(response.data);
    } catch (err: any) {
      console.error('Error analyzing text:', err);
      setError(err.response?.data?.detail || 'Failed to analyze text');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setTranscript('');
    setAnalysis(null);
    setScheduledTasks([]);
    setError(null);
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

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'task-priority-high';
    if (priority >= 2) return 'task-priority-medium';
    return 'task-priority-low';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gradient mb-4">
          Voice Task Assistant
        </h1>
        <p className="text-lg text-gray-600">
          Speak naturally about your tasks, and I'll organize them optimally for your cycle
        </p>
        {cycleData && (
          <div className={`inline-block px-4 py-2 rounded-full text-white font-medium mt-4 bg-gradient-to-r ${getPhaseColor(cycleData.phase)}`}>
            Current Phase: {cycleData.phase.charAt(0).toUpperCase() + cycleData.phase.slice(1)}
          </div>
        )}
      </div>

      {/* Voice Recording Interface */}
      <div className="card text-center">
        <div className="space-y-6">
          {/* Recording Button */}
          <div className="flex justify-center">
            <motion.button
              className={`voice-button ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isRecording ? (
                <StopIcon className="w-8 h-8" />
              ) : (
                <MicrophoneIcon className="w-8 h-8" />
              )}
              
              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-white/30"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.button>
          </div>

          {/* Status Messages */}
          <div className="text-center">
            {isRecording && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-600 font-medium"
              >
                🎤 Recording... Tap to stop
              </motion.p>
            )}
            
            {isProcessing && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-blue-600 font-medium"
              >
                🤖 Processing your request...
              </motion.p>
            )}
            
            {!isRecording && !isProcessing && (
              <p className="text-gray-500">
                Tap the microphone to start recording
              </p>
            )}
          </div>

          {/* Manual Text Input */}
          <div className="border-t pt-6">
            <div className="flex space-x-3">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Or type your task here..."
                className="input-field flex-1"
                onKeyPress={(e) => e.key === 'Enter' && processTextInput()}
              />
              <button
                onClick={processTextInput}
                disabled={!transcript.trim() || isProcessing}
                className="btn-primary px-4 py-3"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"
          >
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript Display */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card"
          >
            <h3 className="text-lg font-semibold mb-3">What you said:</h3>
            <p className="text-gray-700 italic bg-gray-50 p-4 rounded-lg">
              "{transcript}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Analyzed Tasks</h3>
              <div className="space-x-3">
                <button
                  onClick={scheduleAllTasks}
                  className="btn-primary text-sm"
                  disabled={scheduledTasks.length > 0}
                >
                  Schedule All
                </button>
                <button
                  onClick={clearAll}
                  className="btn-secondary text-sm"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {analysis.tasks.map((task, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-lg">{task.title}</h4>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        Priority {task.priority}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {task.task_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="text-gray-600 mb-3">{task.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Duration: {task.estimated_duration} minutes</span>
                    {task.deadline && (
                      <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <button
                      onClick={() => scheduleTask(task)}
                      className="btn-primary text-sm"
                      disabled={scheduledTasks.some(st => st.task.title === task.title)}
                    >
                      {scheduledTasks.some(st => st.task.title === task.title) 
                        ? 'Scheduled ✓' 
                        : 'Schedule Task'
                      }
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {analysis.additional_context && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Additional Context:</h4>
                <p className="text-blue-700">{analysis.additional_context}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scheduled Tasks */}
      <AnimatePresence>
        {scheduledTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card"
          >
            <h3 className="text-xl font-semibold mb-6">Scheduled Tasks</h3>
            <div className="space-y-4">
              {scheduledTasks.map((scheduledTask, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-green-200 bg-green-50 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{scheduledTask.task.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getPhaseColor(scheduledTask.scheduling.hormonal_phase)}`}>
                      {scheduledTask.scheduling.hormonal_phase}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📅 {new Date(scheduledTask.scheduling.scheduled_time).toLocaleString()}</p>
                    <p>⚡ Cycle Score: {(scheduledTask.scheduling.cycle_score * 100).toFixed(0)}%</p>
                    <p>💡 {scheduledTask.explanation}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceInterface;