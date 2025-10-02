'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { taskAPI, userAPI } from '@/lib/api';
import { formatDate } from '@/lib/onboardingUtils';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  userId?: string | string[];
  picture?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  startDate: string;
  department?: string;
}

const AdminTasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignedTo: [] as string[],
    picture: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllEmployees, setShowAllEmployees] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  // Filter employees based on search term (only users, not admins)
  const filteredEmployees = employees
    .filter(emp => emp.role === 'user') // Only show employees, not admins
    .filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Get displayed employees (filtered or limited)
  const displayedEmployees = showAllEmployees ? filteredEmployees : filteredEmployees.slice(0, 5);

  // Check if all displayed employees are selected
  const allDisplayedSelected = displayedEmployees.length > 0 && 
    displayedEmployees.every(emp => formData.assignedTo.includes(emp.id));

  // Handle select all toggle
  const handleSelectAll = () => {
    if (allDisplayedSelected) {
      // Deselect all displayed employees
      setFormData(prev => ({
        ...prev,
        assignedTo: prev.assignedTo.filter(id => !displayedEmployees.map(emp => emp.id).includes(id))
      }));
    } else {
      // Select all displayed employees
      const newAssignedTo = [...formData.assignedTo];
      displayedEmployees.forEach(emp => {
        if (!newAssignedTo.includes(emp.id)) {
          newAssignedTo.push(emp.id);
        }
      });
      setFormData(prev => ({
        ...prev,
        assignedTo: newAssignedTo
      }));
    }
  };

  // Handle individual employee selection
  const handleEmployeeToggle = (employeeId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(employeeId)
        ? prev.assignedTo.filter(id => id !== employeeId)
        : [...prev.assignedTo, employeeId]
    }));
  };

  // Reset form and search when modal closes
  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setSearchTerm('');
    setShowAllEmployees(false);
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      assignedTo: [],
      picture: '',
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksResponse, usersResponse] = await Promise.all([
        taskAPI.getAllTasks(),
        userAPI.getAllUsers({ role: 'user' }),
      ]);

      if (tasksResponse.success && tasksResponse.data) {
        // Map API response to match our interface
        const tasks = tasksResponse.data.map((t: any) => ({
          id: t._id || t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          dueDate: t.dueDate,
          userId: t.assignedTo,
          picture: t.picture,
        }));
        setTasks(tasks);
      }

      if (usersResponse.success && usersResponse.data) {
        // Map API response to match our interface
        const employees = usersResponse.data.map((u: any) => ({
          id: u._id || u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          startDate: u.startDate,
          department: u.department,
        }));
        setEmployees(employees);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setTasks([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      const response = await taskAPI.createTask({
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        assignedTo: formData.assignedTo,
        picture: formData.picture,
      });

      if (response.success) {
        handleModalClose();
        loadData();
        alert('Task created successfully!');
      } else {
        alert(response.error || 'Error creating task. Please try again.');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'status-pending',
      'in-progress': 'status-in-progress', 
      completed: 'status-completed',
    };

    return (
      <span className={`status-badge ${statusColors[status as keyof typeof statusColors]}`}>
        {status.replace('-', ' ')}
      </span>
    );
  };

  const columns = [
    {
      key: 'title',
      label: 'Task',
      render: (value: string, row: Task) => (
        <div>
          <div className="text-text-primary font-medium">{value}</div>
          <div className="text-text-muted text-sm line-clamp-2">{row.description}</div>
        </div>
      ),
    },
    {
      key: 'userId',
      label: 'Assigned To',
      render: (value: any, row: Task) => {
        const assignedIds = Array.isArray(row.userId) ? row.userId : (row.userId ? [row.userId] : []);
        const assignedEmployees = assignedIds.map(id => employees.find(emp => emp.id === id)).filter(Boolean);
        
        return (
          <div className="flex flex-wrap gap-1">
            {assignedEmployees.length > 0 ? (
              assignedEmployees.map((employee, index) => (
                <span key={index} className="status-badge bg-accent/20 text-accent border-accent/30">
                  {employee?.name}
                </span>
              ))
            ) : (
              <span className="text-text-secondary">Unassigned</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (value: string) => (
        <span className="text-text-secondary">
          {value ? new Date(value).toLocaleDateString() + ' ' + new Date(value).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No due date'}
        </span>
      ),
    },
    {
      key: 'picture',
      label: 'Image',
      render: (value: string) => (
        value ? (
          <img
            src={value}
            alt="Task"
            className="w-10 h-10 object-cover rounded-lg border border-accent/20"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span className="text-text-muted text-sm">No image</span>
        )
      ),
    },
  ];

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-danger">Access Denied</h1>
          <p className="text-text-secondary">You don't have permission to access this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Task Management</h1>
            <p className="text-text-secondary">
              Create and manage onboarding tasks for employees
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-modern"
          >
            Create New Task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-text-primary">{tasks.length}</div>
            <div className="text-text-muted text-sm">Total Tasks</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-success">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-text-muted text-sm">Completed</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-warning">
              {tasks.filter(t => t.status === 'in-progress').length}
            </div>
            <div className="text-text-muted text-sm">In Progress</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-danger">
              {tasks.filter(t => t.status === 'pending').length}
            </div>
            <div className="text-text-muted text-sm">Pending</div>
          </div>
        </div>

        {/* Tasks Table */}
        <Table
          columns={columns}
          data={tasks}
          loading={loading}
          onRowClick={(task: Task) => {
            console.log('Task clicked:', task);
          }}
        />
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        title="Create & Assign Task"
        size="xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="modern-input"
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="modern-input resize-none"
              rows={4}
              placeholder="Enter task description"
              required
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">
              Due Date *
            </label>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="modern-input"
              required
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-3">
              Assign To Employees (Multiple Selection)
            </label>
            
            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="modern-input pl-10"
                  placeholder="Search employees by name, email, or department..."
                />
                <svg 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Selection Controls */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-accent hover:text-accent-light font-medium transition-colors"
                >
                  {allDisplayedSelected ? 'Deselect All' : 'Select All'}
                </button>
                {filteredEmployees.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllEmployees(!showAllEmployees)}
                    className="text-sm text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showAllEmployees ? 'Show Less' : `Show All (${filteredEmployees.length})`}
                  </button>
                )}
              </div>
              <div className="text-sm text-text-muted">
                {filteredEmployees.length} employee(s) found
              </div>
            </div>

            {/* Employee List */}
            <div className="space-y-2 max-h-60 overflow-y-auto border border-accent/20 rounded-lg p-3 bg-surface">
              {displayedEmployees.length > 0 ? (
                displayedEmployees.map((employee) => (
                  <label key={employee.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-surface-hover transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.assignedTo.includes(employee.id)}
                      onChange={() => handleEmployeeToggle(employee.id)}
                      className="w-4 h-4 text-accent bg-surface border-accent/30 rounded focus:ring-accent focus:ring-2"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-text-primary font-medium truncate">{employee.name}</span>
                        {employee.department && (
                          <span className="status-badge bg-info/20 text-info border-info/30 text-xs">
                            {employee.department}
                          </span>
                        )}
                      </div>
                      <div className="text-text-muted text-sm truncate">{employee.email}</div>
                    </div>
                  </label>
                ))
              ) : (
                <div className="text-center py-6">
                  <div className="text-text-muted text-sm">
                    {searchTerm ? 'No employees found matching your search.' : 'No employees available.'}
                  </div>
                </div>
              )}
            </div>

            {/* Selection Summary */}
            {formData.assignedTo.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                <div className="flex items-center justify-between">
                  <span className="text-text-primary text-sm font-medium">
                    Selected: {formData.assignedTo.length} employee(s)
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, assignedTo: [] }))}
                    className="text-xs text-danger hover:text-danger/80 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {formData.assignedTo.map(id => {
                    const employee = employees.find(emp => emp.id === id);
                    return employee ? (
                      <span key={id} className="status-badge bg-accent/20 text-accent border-accent/30 text-xs">
                        {employee.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">
              Picture URL (Optional)
            </label>
            <input
              type="url"
              value={formData.picture}
              onChange={(e) => setFormData(prev => ({ ...prev, picture: e.target.value }))}
              className="modern-input"
              placeholder="https://example.com/task-image.png"
            />
            {formData.picture && (
              <div className="mt-2">
                <img
                  src={formData.picture}
                  alt="Task preview"
                  className="w-20 h-20 object-cover rounded-lg border border-accent/20"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-accent/20">
            <button
              onClick={handleModalClose}
              className="px-6 py-3 rounded-lg border border-accent/30 text-text-secondary hover:text-text-primary hover:border-accent/50 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTask}
              disabled={!formData.title || !formData.description || !formData.dueDate}
              className={`btn-modern ${
                !formData.title || !formData.description || !formData.dueDate
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              Create Task
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default AdminTasksPage;