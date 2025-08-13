import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Components
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import CycleSetup from './components/CycleSetup';
import TaskManager from './components/TaskManager';
import VoiceInterface from './components/VoiceInterface';
import Calendar from './components/Calendar';
import Insights from './components/Insights';
import Chat from './components/Chat';
import LoadingSpinner from './components/LoadingSpinner';

// Types
interface User {
  id: string;
  name: string;
  cycleSetup: boolean;
}

interface CycleData {
  phase: string;
  day_in_cycle: number;
  energy_level: number;
  focus_level: number;
  characteristics: string[];
  optimal_tasks: string[];
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cycleData, setCycleData] = useState<CycleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize user session
  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      // For demo purposes, create a default user
      // In production, this would handle authentication
      const defaultUser: User = {
        id: 'user_demo_001',
        name: 'Demo User',
        cycleSetup: false
      };

      // Check if user has cycle data
      try {
        const response = await axios.get(`/api/cycle/${defaultUser.id}/current`);
        if (response.data) {
          setCycleData(response.data);
          defaultUser.cycleSetup = true;
        }
      } catch (err) {
        // User hasn't set up cycle yet
        console.log('No cycle data found - user needs to set up');
      }

      setUser(defaultUser);
    } catch (err) {
      setError('Failed to initialize application');
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCycleSetup = async (cycleInfo: any) => {
    try {
      const response = await axios.post('/api/cycle/setup', {
        user_id: user?.id,
        ...cycleInfo
      });

      if (response.data) {
        // Update user and cycle data
        setUser(prev => prev ? { ...prev, cycleSetup: true } : null);
        
        // Fetch current phase data
        const cycleResponse = await axios.get(`/api/cycle/${user?.id}/current`);
        setCycleData(cycleResponse.data);
      }
    } catch (err) {
      console.error('Cycle setup error:', err);
      setError('Failed to set up cycle data');
    }
  };

  const refreshCycleData = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`/api/cycle/${user.id}/current`);
      setCycleData(response.data);
    } catch (err) {
      console.error('Failed to refresh cycle data:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to SyncTracker</h2>
          <p className="text-gray-600 mb-6">
            Your AI-powered hormonal cycle-aware task organizer
          </p>
          <button 
            onClick={initializeUser}
            className="btn-primary"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <Navbar user={user} cycleData={cycleData} />
        
        <main className="container mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            <Routes>
              <Route 
                path="/" 
                element={
                  user.cycleSetup ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Navigate to="/setup" replace />
                  )
                } 
              />
              
              <Route 
                path="/setup" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CycleSetup onComplete={handleCycleSetup} />
                  </motion.div>
                } 
              />
              
              <Route 
                path="/dashboard" 
                element={
                  user.cycleSetup ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Dashboard 
                        user={user} 
                        cycleData={cycleData} 
                        onRefreshCycle={refreshCycleData}
                      />
                    </motion.div>
                  ) : (
                    <Navigate to="/setup" replace />
                  )
                } 
              />
              
              <Route 
                path="/tasks" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TaskManager user={user} cycleData={cycleData} />
                  </motion.div>
                } 
              />
              
              <Route 
                path="/voice" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <VoiceInterface user={user} cycleData={cycleData} />
                  </motion.div>
                } 
              />
              
              <Route 
                path="/calendar" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Calendar user={user} cycleData={cycleData} />
                  </motion.div>
                } 
              />
              
              <Route 
                path="/insights" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Insights user={user} cycleData={cycleData} />
                  </motion.div>
                } 
              />
              
              <Route 
                path="/chat" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Chat user={user} cycleData={cycleData} />
                  </motion.div>
                } 
              />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </Router>
  );
};

export default App;