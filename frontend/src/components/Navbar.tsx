import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  CalendarIcon,
  MicrophoneIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ListBulletIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface NavbarProps {
  user: { id: string; name: string };
  cycleData: any;
}

const Navbar: React.FC<NavbarProps> = ({ user, cycleData }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Voice Input', href: '/voice', icon: MicrophoneIcon },
    { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Tasks', href: '/tasks', icon: ListBulletIcon },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { name: 'Insights', href: '/insights', icon: ChartBarIcon },
  ];

  const getPhaseColor = (phase: string) => {
    const colors = {
      menstrual: 'bg-red-100 text-red-800',
      follicular: 'bg-green-100 text-green-800',
      ovulatory: 'bg-yellow-100 text-yellow-800',
      luteal: 'bg-blue-100 text-blue-800'
    };
    return colors[phase as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ST</span>
            </div>
            <span className="text-xl font-bold text-gradient">SyncTracker</span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 bg-primary-50 rounded-lg -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            {/* Current Phase Indicator */}
            {cycleData && (
              <div className={`hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getPhaseColor(cycleData.phase)}`}>
                <span>{getPhaseEmoji(cycleData.phase)}</span>
                <span>{cycleData.phase.charAt(0).toUpperCase() + cycleData.phase.slice(1)}</span>
                <span>Day {cycleData.day_in_cycle}</span>
              </div>
            )}

            {/* User Avatar */}
            <div className="flex items-center space-x-2">
              <UserCircleIcon className="w-8 h-8 text-gray-400" />
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {user.name}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-100 py-2">
          <div className="flex items-center justify-between space-x-1">
            {navigation.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative flex flex-col items-center space-y-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-primary-600'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.name}</span>
                  
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full"
                      layoutId="mobile-navbar-active"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;