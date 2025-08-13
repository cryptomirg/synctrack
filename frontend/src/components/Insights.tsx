import React from 'react';

interface InsightsProps {
  user: { id: string; name: string };
  cycleData: any;
}

const Insights: React.FC<InsightsProps> = ({ user, cycleData }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold text-gradient mb-4">Insights</h1>
        <p className="text-gray-600">
          Analyze your productivity patterns and cycle correlations.
        </p>
        <div className="mt-8 text-center py-12">
          <p className="text-gray-500">Analytics and insights coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Insights;