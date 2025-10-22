import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Event {
  id: number;
  type: string;
  status: 'success' | 'error';
  details: string;
  created_at: string;
}

interface EventsSidebarProps {
  axiosInstance: any;
}

const EventsSidebar: React.FC<EventsSidebarProps> = ({ axiosInstance }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
    // Poll for new events every 30 seconds
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axiosInstance.get('/api/events');
      setEvents(response.data);
    } catch (err: any) {
      setError('Error fetching events');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getEventIcon = (status: string) => {
    if (status === 'success') {
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto h-screen p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h2>
      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}
      <div className="space-y-4">
        {events.map(event => (
          <div
            key={event.id}
            className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
          >
            <div className="flex-shrink-0 mt-1">
              {getEventIcon(event.status)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {event.type.split('_').map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </p>
              <p className="text-sm text-gray-500">{event.details}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(event.created_at)}
              </p>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No events to display
          </p>
        )}
      </div>
    </div>
  );
};

export default EventsSidebar;