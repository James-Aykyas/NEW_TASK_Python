import React, { useState, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { ReminderService, Reminder } from '../services/reminderService';

interface ReminderPanelProps {
  reminderService: ReminderService;
}

export const ReminderPanel: React.FC<ReminderPanelProps> = ({ reminderService }) => {
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const updateReminders = () => {
      setUpcomingReminders(reminderService.getUpcomingReminders(24));
    };

    // Initial load
    updateReminders();

    // Update every minute
    const interval = setInterval(updateReminders, 60000);

    // Listen for reminder events
    const handleReminderSent = () => {
      updateReminders();
    };

    window.addEventListener('reminderSent', handleReminderSent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('reminderSent', handleReminderSent);
    };
  }, [reminderService]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-100 border-amber-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return AlertTriangle;
      case 'medium': return Clock;
      case 'low': return CheckCircle;
      default: return Bell;
    }
  };

  const formatTimeUntil = (date: Date): string => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff < 0) return 'Overdue';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const dismissReminder = (reminderId: string) => {
    reminderService.cancelReminder(reminderId);
    setUpcomingReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
      >
        <Bell className="h-6 w-6" />
        {upcomingReminders.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {upcomingReminders.length}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Upcoming Reminders</h3>
              <button
                onClick={() => setShowPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {upcomingReminders.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming reminders</h3>
                <p className="mt-1 text-sm text-gray-500">You're all caught up!</p>
              </div>
            ) : (
              <div className="p-2">
                {upcomingReminders.map((reminder) => {
                  const PriorityIcon = getPriorityIcon(reminder.priority);
                  return (
                    <div
                      key={reminder.id}
                      className={`p-3 mb-2 rounded-lg border ${getPriorityColor(reminder.priority)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <PriorityIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {reminder.message}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs opacity-75">
                                {formatTimeUntil(reminder.scheduledTime)}
                              </span>
                              <span className="text-xs opacity-75">
                                {reminder.scheduledTime.toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => dismissReminder(reminder.id)}
                          className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => reminderService.requestNotificationPermission()}
              className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Enable Browser Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};