import React from 'react';

interface TaskManagerProps {
  user: { id: string; name: string };
  cycleData: any;
}

const TaskManager: React.FC<TaskManagerProps> = ({ user, cycleData }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold text-gradient mb-4">Task Manager</h1>
        <p className="text-gray-600">
          Manage and organize your tasks with cycle-aware scheduling.
        </p>
        <div className="mt-8 text-center py-12">
          <p className="text-gray-500">Task management interface coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default TaskManager;