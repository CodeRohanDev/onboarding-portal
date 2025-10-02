'use client';

import React from 'react';
import { formatDate, getDaysUntilDue, getStatusColor, getPriorityColor } from '@/lib/onboardingUtils';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const daysUntilDue = getDaysUntilDue(task.dueDate);
  const isOverdue = daysUntilDue < 0 && task.status !== 'completed';
  const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0 && task.status !== 'completed';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in-progress':
        return '🔄';
      case 'pending':
        return '⏳';
      default:
        return '📋';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return (
    <div
      className={`glass-card rounded-2xl p-6 hover-scale cursor-pointer transition-all duration-300 relative overflow-hidden ${
        task.status === 'completed' ? 'opacity-80' : ''
      }`}
      onClick={onClick}
    >
      {/* Simple background decoration */}
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl ${
        task.status === 'completed' ? 'bg-success/20' :
        task.status === 'in-progress' ? 'bg-info/20' : 'bg-warning/20'
      }`}></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              task.status === 'completed' ? 'bg-success/20' :
              task.status === 'in-progress' ? 'bg-info/20' : 'bg-warning/20'
            }`}>
              <span className="text-2xl">{getStatusIcon(task.status)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-text-primary mb-2 leading-tight">
                {task.title}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-1 rounded-full bg-surface border border-accent/20 text-text-secondary">
                  {task.category}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                  task.status === 'completed' ? 'status-completed' :
                  task.status === 'in-progress' ? 'status-in-progress' : 'status-pending'
                }`}>
                  {task.status.replace('-', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-text-secondary text-sm mb-4 line-clamp-2 leading-relaxed">
          {task.description}
        </p>

        {/* Progress bar for in-progress tasks */}
        {task.status === 'in-progress' && (
          <div className="mb-4">
            <div className="w-full bg-surface rounded-full h-2 border border-accent/10">
              <div className="bg-gradient-accent h-2 rounded-full transition-all duration-500" style={{ width: '60%' }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-accent/20">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-text-muted">
              {formatDate(task.dueDate)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {isOverdue && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-danger text-white">
                Overdue
              </span>
            )}
            {isDueSoon && !isOverdue && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-warning text-white">
                Due Soon
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;