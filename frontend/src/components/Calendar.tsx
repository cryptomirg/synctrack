import React from 'react';

interface CalendarProps {
  user: { id: string; name: string };
  cycleData: any;
}

const Calendar: React.FC<CalendarProps> = ({ user, cycleData }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold text-gradient mb-4">Calendar</h1>
        <p className="text-gray-600">
          View your optimally scheduled tasks aligned with your hormonal cycle.
        </p>
        <div className="mt-8 text-center py-12">
          <p className="text-gray-500">Calendar interface coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Calendar;