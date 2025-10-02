'use client';

import React, { useState } from 'react';
import Modal from './Modal';
import { formatDate, getDaysUntilDue } from '@/lib/onboardingUtils';
import { taskAPI } from '@/lib/api';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate?: (taskId: string, newStatus: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdate,
}) => {
  const [loading, setLoading] = useState(false);

  if (!task) return null;

  const daysUntilDue = getDaysUntilDue(task.dueDate);
  const isOverdue = daysUntilDue < 0 && task.status !== 'completed';

  const handleStatusUpdate = async (newStatus: string) => {
    if (!task || loading) return;

    setLoading(true);
    try {
      const response = await taskAPI.updateTaskStatus(task.id, newStatus as 'pending' | 'in-progress' | 'completed');
      if (response.success) {
        onTaskUpdate?.(task.id, newStatus);
        onClose();
      } else {
        console.error('Error updating task status:', response.error);
        alert(response.error || 'Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'in-progress';
      case 'in-progress':
        return 'completed';
      default:
        return null;
    }
  };

  const getStatusButtonText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'Start Task';
      case 'in-progress':
        return 'Mark Complete';
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus(task.status);
  const buttonText = getStatusButtonText(task.status);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Details" size="lg">
      <div className="space-y-6">
        {/* Task Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">{task.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-text-muted">
              {/* <span>Category: {task.category}</span>
              <span>Priority: {task.priority}</span> */}
              <span className={`capitalize ${task.status === 'completed' ? 'text-success' :
                  task.status === 'in-progress' ? 'text-warning' : 'text-danger'
                }`}>
                Status: {task.status.replace('-', ' ')}
              </span>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${task.status === 'completed' ? 'bg-success/20 text-success' :
              task.status === 'in-progress' ? 'bg-warning/20 text-warning' :
                'bg-danger/20 text-danger'
            }`}>
            {task.status.replace('-', ' ').toUpperCase()}
          </div>
        </div>

        {/* Due Date Info */}
        <div className="glass-card p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary">Due Date</p>
              <p className="text-text-primary font-medium">{formatDate(task.dueDate)}</p>
            </div>
            <div className="text-right">
              <p className="text-text-secondary">Days Remaining</p>
              <p className={`font-medium ${isOverdue ? 'text-danger' :
                  daysUntilDue <= 3 ? 'text-warning' : 'text-success'
                }`}>
                {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` :
                  daysUntilDue === 0 ? 'Due today' :
                    `${daysUntilDue} days`}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">Description</h3>
          <div className="glass-card p-4 rounded-lg">
            <p className="text-text-secondary leading-relaxed">{task.description}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-accent/20">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-accent/30 text-text-secondary hover:text-text-primary hover:border-accent/50 transition-colors"
          >
            Close
          </button>

          {nextStatus && buttonText && (
            <button
              onClick={() => handleStatusUpdate(nextStatus)}
              disabled={loading}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${loading
                  ? 'bg-accent/50 text-white cursor-not-allowed'
                  : 'bg-accent hover:bg-accent-light text-white'
                }`}
            >
              {loading ? 'Updating...' : buttonText}
            </button>
          )}

          {task.status === 'completed' && (
            <div className="flex items-center space-x-2 text-success">
              <span className="text-xl">✅</span>
              <span className="font-medium">Task Completed</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TaskModal;