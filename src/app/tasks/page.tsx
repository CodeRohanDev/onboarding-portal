'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import { taskAPI } from '@/lib/api';
import { getTasksByStatus } from '@/lib/onboardingUtils';

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

const TasksPage: React.FC = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [filter, setFilter] = useState('all');
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

    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        return task.status === filter;
    });

    const taskStats = getTasksByStatus(tasks);

    const filterOptions = [
        { value: 'all', label: 'All Tasks', count: tasks.length },
        { value: 'pending', label: 'Pending', count: taskStats.pending },
        { value: 'in-progress', label: 'In Progress', count: taskStats.inProgress },
        { value: 'completed', label: 'Completed', count: taskStats.completed },
    ];

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">My Tasks</h1>
                        <p className="text-text-secondary">
                            Manage your onboarding tasks and track progress
                        </p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="glass-card p-4 rounded-2xl">
                    <div className="flex flex-wrap gap-3">
                        {filterOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setFilter(option.value)}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all ${filter === option.value
                                    ? 'bg-gradient-accent text-white shadow-lg'
                                    : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-light border border-accent/20'
                                    }`}
                            >
                                {option.label}
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${filter === option.value ? 'bg-white/20' : 'bg-accent/20 text-accent'
                                    }`}>
                                    {option.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tasks Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                    </div>
                ) : filteredTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onClick={() => handleTaskClick(task)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="glass-card p-12 rounded-xl text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-semibold text-text-primary mb-2">
                            No tasks found
                        </h3>
                        <p className="text-text-secondary">
                            {filter === 'all'
                                ? "You don't have any tasks yet."
                                : `No ${filter.replace('-', ' ')} tasks at the moment.`}
                        </p>
                    </div>
                )}

                {/* Task Statistics */}
                {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass-card p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-text-primary">{tasks.length}</div>
                        <div className="text-text-muted text-sm">Total Tasks</div>
                    </div>
                    <div className="glass-card p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-success">{taskStats.completed}</div>
                        <div className="text-text-muted text-sm">Completed</div>
                    </div>
                    <div className="glass-card p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-warning">{taskStats.inProgress}</div>
                        <div className="text-text-muted text-sm">In Progress</div>
                    </div>
                    <div className="glass-card p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-danger">{taskStats.pending}</div>
                        <div className="text-text-muted text-sm">Pending</div>
                    </div>
                </div> */}
            </div>

            {/* Task Modal */}
            <TaskModal
                task={selectedTask}
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onTaskUpdate={handleTaskUpdate}
            />
        </Layout>
    );
};

export default TasksPage;