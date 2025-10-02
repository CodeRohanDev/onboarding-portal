'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProgressBar from '@/components/ProgressBar';
import { userAPI, taskAPI, formAPI } from '@/lib/api';
import { calculateOnboardingProgress, getTasksByStatus } from '@/lib/onboardingUtils';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  startDate: string;
  department?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  category: string;
  priority: string;
  userId?: string;
}

interface Form {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  fields: any[];
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [usersResponse, tasksResponse, formsResponse] = await Promise.all([
        userAPI.getAllUsers({ role: 'user' }),
        taskAPI.getAllTasks(),
        formAPI.getAllForms(),
      ]);

      if (usersResponse.success && usersResponse.data) {
        // Map API response to match our interface
        const users = usersResponse.data.map((u: any) => ({
          id: u._id || u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          startDate: u.startDate,
          department: u.department,
        }));
        setEmployees(users);
      }

      if (tasksResponse.success && tasksResponse.data) {
        // Map API response to match our interface
        const tasks = tasksResponse.data.map((t: any) => ({
          id: t._id || t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          dueDate: t.dueDate,
          category: t.type || t.category,
          priority: t.priority || 'medium',
          userId: t.assignedTo,
        }));
        setAllTasks(tasks);
      }

      if (formsResponse.success && formsResponse.data) {
        const formsData = formsResponse.data.forms || formsResponse.data;
        console.log('Admin Dashboard - Raw forms data:', formsData);

        const forms = formsData.map((f: any) => ({
          id: f._id || f.id,
          title: f.title,
          description: f.description,
          assignedTo: f.assignedTo,
          fields: f.fields || [],
          createdAt: f.createdAt,
        }));

        console.log('Admin Dashboard - Processed forms:', forms);
        console.log('Forms by assignment:', {
          user: forms.filter((f: Form) => f.assignedTo === 'user').length,
          admin: forms.filter((f: Form) => f.assignedTo === 'admin').length,
          both: forms.filter((f: Form) => f.assignedTo === 'both').length,
          total: forms.length
        });

        setForms(forms);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setEmployees([]);
      setAllTasks([]);
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeStats = () => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => {
      const empTasks = allTasks.filter((task: Task) => task.userId === emp.id);
      const progress = calculateOnboardingProgress(empTasks);
      return progress > 0 && progress < 100;
    }).length;

    const completedEmployees = employees.filter(emp => {
      const empTasks = allTasks.filter((task: Task) => task.userId === emp.id);
      const progress = calculateOnboardingProgress(empTasks);
      return progress === 100;
    }).length;

    return { totalEmployees, activeEmployees, completedEmployees };
  };

  const getTaskStats = () => {
    return getTasksByStatus(allTasks);
  };

  const getRecentEmployees = () => {
    return employees
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 5);
  };

  const employeeStats = getEmployeeStats();
  const taskStats = getTaskStats();
  const recentEmployees = getRecentEmployees();

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="glass-card p-8 rounded-2xl relative overflow-hidden mb-8">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/20 to-purple-deep/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-deep/20 to-accent/20 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-6 mb-6 lg:mb-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-lg">
                  <span className="text-3xl">👨‍💼</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-text-primary mb-2">
                    Admin Dashboard
                  </h1>
                  <p className="text-text-secondary text-lg">
                    Overview of onboarding progress and employee management
                  </p>
                  <p className="text-text-muted text-sm">
                    Welcome back, {user?.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-2xl font-bold text-text-primary">{employeeStats.totalEmployees}</div>
            <div className="text-text-muted">Total Employees</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl mb-2">🔄</div>
            <div className="text-2xl font-bold text-warning">{employeeStats.activeEmployees}</div>
            <div className="text-text-muted">Active Onboarding</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-success">{employeeStats.completedEmployees}</div>
            <div className="text-text-muted">Completed</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-2xl font-bold text-accent">{allTasks.length}</div>
            <div className="text-text-muted">Total Tasks</div>
          </div>
        </div>



        {/* Management Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Tasks Management Card */}
          <div className="glass-card p-6 rounded-xl hover-scale cursor-pointer" onClick={() => window.location.href = '/admin/tasks'}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">Task Management</h3>
                  <p className="text-text-secondary text-sm">Manage and assign tasks</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-success">{taskStats.completed}</div>
                <div className="text-text-muted text-xs">Completed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-warning">{taskStats.inProgress}</div>
                <div className="text-text-muted text-xs">In Progress</div>
              </div>
              <div>
                <div className="text-lg font-bold text-danger">{taskStats.pending}</div>
                <div className="text-text-muted text-xs">Pending</div>
              </div>
            </div>
          </div>

          {/* Resources Management Card */}
          <div className="glass-card p-6 rounded-xl hover-scale cursor-pointer" onClick={() => window.location.href = '/admin/resources'}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                  <span className="text-2xl">📁</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">Resource Management</h3>
                  <p className="text-text-secondary text-sm">Manage onboarding resources</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-sm">Click to manage resources</span>
              <div className="flex items-center space-x-1 text-accent">
                <span className="text-sm">Manage</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Feedback Management Card */}
          <div className="glass-card p-6 rounded-xl hover-scale cursor-pointer" onClick={() => window.location.href = '/admin/feedback'}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">Feedback Management</h3>
                  <p className="text-text-secondary text-sm">Create and manage feedback forms</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div>
                <div className="text-lg font-bold text-success">{forms.length}</div>
                <div className="text-text-muted text-xs">Total Forms</div>
              </div>
              <div>
                <div className="text-lg font-bold text-accent">{forms.filter((f: Form) => f.assignedTo === 'user').length}</div>
                <div className="text-text-muted text-xs">User Forms</div>
              </div>
              <div>
                <div className="text-lg font-bold text-warning">{forms.filter((f: Form) => f.assignedTo === 'admin').length}</div>
                <div className="text-text-muted text-xs">Admin Forms</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-sm">Click to manage feedback forms</span>
              <div className="flex items-center space-x-1 text-success">
                <span className="text-sm">Manage</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Forms Section */}
        <div className="glass-card p-8 rounded-2xl mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-primary">Feedback Forms</h2>
            <button
              onClick={() => window.location.href = '/admin/feedback'}
              className="text-accent hover:text-accent-light text-sm font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {forms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forms.slice(0, 6).map((form) => (
                <div key={form.id} className="p-6 rounded-xl bg-surface border border-accent/10 hover:border-accent/20 transition-all hover-scale cursor-pointer"
                  onClick={() => window.location.href = '/admin/feedback'}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                      <span className="text-2xl">📝</span>
                    </div>
                    <span className="status-badge bg-accent/20 text-accent border-accent/30">
                      {form.fields.length} questions
                    </span>
                  </div>
                  <h3 className="text-text-primary font-semibold mb-2 line-clamp-2">{form.title}</h3>
                  <p className="text-text-secondary text-sm mb-3 line-clamp-2">{form.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="status-badge bg-info/20 text-info border-info/30 capitalize text-xs">
                      {form.assignedTo}
                    </span>
                    <span className="text-text-muted text-xs">
                      {new Date(form.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No feedback forms created yet
              </h3>
              <p className="text-text-secondary mb-4">
                Create your first feedback form to start collecting employee feedback.
              </p>
              <button
                onClick={() => window.location.href = '/admin/feedback'}
                className="btn-modern"
              >
                Create First Form
              </button>
            </div>
          )}
        </div>

        {/* Recent Employees */}
        <div className="glass-card p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-primary">Recent Employees</h2>
            <button
              onClick={() => window.location.href = '/admin/employees'}
              className="text-accent hover:text-accent-light text-sm font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentEmployees.map((employee) => {
              const empTasks = allTasks.filter((task: Task) => task.userId === employee.id);
              const progress = calculateOnboardingProgress(empTasks);

              return (
                <div key={employee.id} className="p-6 rounded-xl bg-surface border border-accent/10 hover:border-accent/20 transition-all hover-scale">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-purple flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {employee.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-text-primary font-semibold mb-1">{employee.name}</h3>
                      <p className="text-text-muted text-sm mb-2">{employee.email}</p>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-secondary rounded-full h-2">
                          <div
                            className="progress-bar h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-accent font-semibold text-sm">{progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-8 rounded-2xl">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <button
              onClick={() => window.location.href = '/admin/employees'}
              className="p-6 rounded-xl bg-gradient-surface hover-scale transition-all text-center border border-accent/20 hover:border-accent/40"
            >
              <div className="text-3xl mb-3">👤</div>
              <div className="text-text-primary font-semibold">Add Employee</div>
            </button>
            <button
              onClick={() => window.location.href = '/admin/tasks'}
              className="p-6 rounded-xl bg-gradient-surface hover-scale transition-all text-center border border-accent/20 hover:border-accent/40"
            >
              <div className="text-3xl mb-3">📋</div>
              <div className="text-text-primary font-semibold">Create Task</div>
            </button>
            <button
              onClick={() => window.location.href = '/admin/resources'}
              className="p-6 rounded-xl bg-gradient-surface hover-scale transition-all text-center border border-accent/20 hover:border-accent/40"
            >
              <div className="text-3xl mb-3">📁</div>
              <div className="text-text-primary font-semibold">Upload Resource</div>
            </button>
            <button
              onClick={() => window.location.href = '/admin/feedback'}
              className="p-6 rounded-xl bg-gradient-surface hover-scale transition-all text-center border border-accent/20 hover:border-accent/40"
            >
              <div className="text-3xl mb-3">📝</div>
              <div className="text-text-primary font-semibold">Create Form</div>
            </button>
          </div>
        </div>
      </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default AdminDashboard;