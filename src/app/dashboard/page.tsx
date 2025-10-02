'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProgressBar from '@/components/ProgressBar';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import { taskAPI } from '@/lib/api';
import {
  calculateOnboardingProgress,
  getOnboardingPhase,
  getTasksByStatus,
  getUpcomingTasks,
} from '@/lib/onboardingUtils';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  userId?: string;
}

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await taskAPI.getUserTasks(user.id);
      if (response.success && response.data) {
        // Map API response to match our interface
        const tasks = response.data.map((t: any) => ({
          id: t._id || t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          dueDate: t.dueDate,
          category: t.type || t.category,
          priority: t.priority || 'medium',
          userId: t.assignedTo,
        }));
        setTasks(tasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskUpdate = (taskId: string, newStatus: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus as Task['status'] } : task
      )
    );
  };

  const progress = calculateOnboardingProgress(tasks);
  const phase = user?.startDate ? getOnboardingPhase(user.startDate) : 'Getting Started';
  const taskStats = getTasksByStatus(tasks);
  const upcomingTasks = getUpcomingTasks(tasks);

  return (
    <ProtectedRoute requiredRole="user">
      <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="relative z-10">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-10">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-6 sm:space-y-0 sm:space-x-8 mb-8 xl:mb-0">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-2xl group-hover:scale-105 transition-all duration-300">
                    <span className="text-4xl font-bold text-white">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-success rounded-full border-4 border-primary flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-text-primary mb-3">
                    Welcome back, {user.name?.split(' ')[0]}! 
                  </h1>
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">🚀</span>
                    <p className="text-text-secondary text-xl font-medium">
                      {phase}
                    </p>
                  </div>
                  <p className="text-text-muted text-lg">
                    {user.email}
                  </p>
                </div>
              </div>
              
              {/* <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-2xl bg-surface/50 border border-accent/20 mb-4 group">
                  <div className="relative text-center">
                    <p className="text-4xl font-bold text-accent">{progress}%</p>
                    <p className="text-text-muted text-xs mt-1">Complete</p>
                  </div>
                </div>
                <p className="text-text-secondary font-medium">Overall Progress</p>
              </div> */}
            </div>

            <div className="space-y-6">
              <div className="relative">
                <ProgressBar progress={progress} size="lg" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center p-6 rounded-xl bg-surface/50 border border-success/20">
                  <div className="text-3xl font-bold text-success mb-2">{taskStats.completed}</div>
                  <div className="text-text-secondary text-sm font-medium">Completed Tasks</div>
                </div>
                <div className="text-center p-6 rounded-xl bg-surface/50 border border-warning/20">
                  <div className="text-3xl font-bold text-warning mb-2">{taskStats.inProgress}</div>
                  <div className="text-text-secondary text-sm font-medium">In Progress</div>
                </div>
                <div className="text-center p-6 rounded-xl bg-surface/50 border border-danger/20">
                  <div className="text-3xl font-bold text-danger mb-2">{taskStats.pending}</div>
                  <div className="text-text-secondary text-sm font-medium">Pending Tasks</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-success">{taskStats.completed}</div>
            <div className="text-text-muted">Completed</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl mb-2">🔄</div>
            <div className="text-2xl font-bold text-warning">{taskStats.inProgress}</div>
            <div className="text-text-muted">In Progress</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-2xl font-bold text-danger">{taskStats.pending}</div>
            <div className="text-text-muted">Pending</div>
          </div> */}
        </div>

        {/* Recent Tasks */}
        <div className="glass-card p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-primary">Recent Tasks</h2>
            <button 
              onClick={() => window.location.href = '/tasks'}
              className="text-accent hover:text-accent-light font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : tasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.slice(0, 6).map((task) => (
                <div key={task.id} className="p-6 rounded-xl bg-gradient-surface border border-accent/20 hover:border-accent/40 transition-all hover-scale cursor-pointer" onClick={() => handleTaskClick(task)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      task.status === 'completed' ? 'bg-success/20' :
                      task.status === 'in-progress' ? 'bg-info/20' : 'bg-warning/20'
                    }`}>
                      <span className="text-xl">
                        {task.status === 'completed' ? '✅' :
                         task.status === 'in-progress' ? '🔄' : '⏳'}
                      </span>
                    </div>
                    <span className={`status-badge ${
                      task.status === 'completed' ? 'status-completed' :
                      task.status === 'in-progress' ? 'status-in-progress' : 'status-pending'
                    }`}>
                      {task.status.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <h3 className="text-text-primary font-semibold mb-2 line-clamp-2">{task.title}</h3>
                  <p className="text-text-secondary text-sm mb-3 line-clamp-2">{task.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">{task.category}</span>
                    <span className="text-accent font-medium">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">No tasks yet</h3>
              <p className="text-text-secondary">Your tasks will appear here once they're assigned.</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-center">
              <div className="text-2xl mb-2">📋</div>
              <div className="text-text-primary text-sm font-medium">View All Tasks</div>
            </button>
            <button className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-center">
              <div className="text-2xl mb-2">📚</div>
              <div className="text-text-primary text-sm font-medium">Resources</div>
            </button>
            <button className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-center">
              <div className="text-2xl mb-2">💬</div>
              <div className="text-text-primary text-sm font-medium">Feedback</div>
            </button>
            <button className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-center">
              <div className="text-2xl mb-2">👤</div>
              <div className="text-text-primary text-sm font-medium">Profile</div>
            </button>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskUpdate={handleTaskUpdate}
      />
      </Layout>
    </ProtectedRoute>
  );
};

export default EmployeeDashboard;