import React from 'react';
import { Task } from '../types';
import { CheckCircle, Circle, Clock, Flag, Bell, Calendar } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onTaskUpdate }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-amber-600 bg-amber-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in-progress': return Clock;
      default: return Circle;
    }
  };

  const handleStatusChange = (taskId: string, status: Task['status']) => {
    onTaskUpdate(taskId, { status, updatedAt: new Date() });
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks yet</h3>
        <p className="mt-1 text-sm text-gray-500">Submit a request to generate tasks</p>
      </div>
    );
  }

  const groupedTasks = {
    pending: tasks.filter(t => t.status === 'pending'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    completed: tasks.filter(t => t.status === 'completed')
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedTasks).map(([status, statusTasks]) => {
        if (statusTasks.length === 0) return null;
        
        return (
          <div key={status} className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
              {status.replace('-', ' ')} ({statusTasks.length})
            </h3>
            <div className="space-y-2">
              {statusTasks.map((task) => {
                const StatusIcon = getStatusIcon(task.status);
                return (
                  <div
                    key={task.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200"
                  >
                    <div className="flex items-start space-x-4">
                      <button
                        onClick={() => {
                          const nextStatus = task.status === 'pending' 
                            ? 'in-progress' 
                            : task.status === 'in-progress' 
                            ? 'completed' 
                            : 'pending';
                          handleStatusChange(task.id, nextStatus);
                        }}
                        className="flex-shrink-0 mt-1"
                      >
                        <StatusIcon className={`h-5 w-5 ${
                          task.status === 'completed' 
                            ? 'text-green-600' 
                            : task.status === 'in-progress'
                            ? 'text-blue-600'
                            : 'text-gray-400 hover:text-gray-600'
                        }`} />
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            <Flag className="w-3 h-3 mr-1" />
                            {task.priority}
                          </span>
                          <span className="text-xs text-gray-500">
                            {task.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                          {task.content}
                        </p>
                        
                        {task.dueDate && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Due: {task.dueDate.toLocaleDateString()} at {task.dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                        
                        {task.reminderTime && !task.reminderSent && (
                          <p className="text-xs text-blue-600 mt-1 flex items-center">
                            <Bell className="w-3 h-3 mr-1" />
                            Reminder: {task.reminderTime.toLocaleDateString()} at {task.reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                        
                        <div className="mt-2 text-xs text-gray-400">
                          Applied {task.appliedRules.length} rule{task.appliedRules.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};