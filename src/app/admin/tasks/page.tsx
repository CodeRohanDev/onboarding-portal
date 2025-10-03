'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { taskAPI, userAPI } from '@/lib/api';


interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  assignedTo: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  type: 'daily' | 'form';
  picture?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

interface GroupedTask {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  type: 'daily' | 'form';
  picture?: string;
  createdAt: string;
  assignedUsers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    status: 'pending' | 'in-progress' | 'completed';
    updatedAt: string;
  }>;
  [key: string]: unknown;
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
  const [groupedTasks, setGroupedTasks] = useState<GroupedTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTaskDetailsModalOpen, setIsTaskDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<GroupedTask | null>(null);
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [taskSearchTerm, setTaskSearchTerm] = useState('');

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

  // Filter grouped tasks based on search and filters
  const filteredTasks = groupedTasks.filter(task => {
    const matchesSearch = taskSearchTerm === '' || 
      task.title.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
      task.assignedUsers.some(user => user.name.toLowerCase().includes(taskSearchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      task.assignedUsers.some(user => user.status === statusFilter);
    
    return matchesSearch && matchesStatus;
  });

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

  // Function to group tasks by title and description
  const groupTasksByContent = (tasks: Task[]): GroupedTask[] => {
    const taskMap = new Map<string, GroupedTask>();

    tasks.forEach(task => {
      const key = `${task.title}-${task.description}`;
      
      if (taskMap.has(key)) {
        // Add user to existing task group
        const existingTask = taskMap.get(key)!;
        existingTask.assignedUsers.push({
          _id: task.assignedTo._id,
          name: task.assignedTo.name,
          email: task.assignedTo.email,
          role: task.assignedTo.role,
          status: task.status,
          updatedAt: task.updatedAt,
        });
      } else {
        // Create new task group
        taskMap.set(key, {
          _id: task._id,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          type: task.type,
          picture: task.picture,
          createdAt: task.createdAt,
          assignedUsers: [{
            _id: task.assignedTo._id,
            name: task.assignedTo.name,
            email: task.assignedTo.email,
            role: task.assignedTo.role,
            status: task.status,
            updatedAt: task.updatedAt,
          }],
        });
      }
    });

    return Array.from(taskMap.values());
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksResponse, usersResponse] = await Promise.all([
        taskAPI.getAllTasks(),
        userAPI.getAllUsers({ role: 'user' }),
      ]);

      if (tasksResponse.success && tasksResponse.data) {
        // API returns tasks directly as an array
        setTasks(tasksResponse.data);
        // Group tasks by content
        const grouped = groupTasksByContent(tasksResponse.data);
        setGroupedTasks(grouped);
      } else {
        console.error('Failed to load tasks:', tasksResponse.error);
        setTasks([]);
        setGroupedTasks([]);
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
      } else {
        console.error('Failed to load users:', usersResponse.error);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setTasks([]);
      setGroupedTasks([]);
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

  const handleViewTask = (task: GroupedTask) => {
    setSelectedTask(task);
    setIsTaskDetailsModalOpen(true);
  };

  const handleUserStatusUpdate = async (userId: string, taskTitle: string, newStatus: 'pending' | 'in-progress' | 'completed') => {
    try {
      // Find the specific task for this user
      const userTask = tasks.find(t => 
        t.assignedTo._id === userId && 
        t.title === taskTitle
      );
      
      if (!userTask) {
        alert('Task not found');
        return;
      }

      const response = await taskAPI.updateTaskStatus(userTask._id, newStatus);
      
      if (response.success) {
        // Reload data to refresh the grouped tasks
        loadData();
        alert('Task status updated successfully!');
      } else {
        alert(response.error || 'Error updating task status.');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Error updating task status.');
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Task',
      render: (value: unknown, row: Record<string, unknown>) => (
        <div>
          <div className="text-text-primary font-medium">{String(value)}</div>
          <div className="text-text-muted text-sm line-clamp-2">{String(row.description)}</div>
        </div>
      ),
    },
    {
      key: 'assignedUsers',
      label: 'Assigned To',
      render: (value: unknown, row: Record<string, unknown>) => {
        const assignedUsers = row.assignedUsers as Array<{name: string; status: string}>;
        const totalUsers = assignedUsers?.length || 0;
        const displayLimit = 3;
        
        return (
          <div className="flex flex-wrap gap-1">
            {assignedUsers && assignedUsers.length > 0 ? (
              <>
                {assignedUsers.slice(0, displayLimit).map((user, index) => (
                  <span key={index} className="status-badge bg-accent/20 text-accent border-accent/30 text-xs">
                    {user.name}
                  </span>
                ))}
                {totalUsers > displayLimit && (
                  <span className="status-badge bg-surface-light text-text-muted border-border-secondary text-xs">
                    +{totalUsers - displayLimit} more
                  </span>
                )}
              </>
            ) : (
              <span className="text-text-secondary">Unassigned</span>
            )}
          </div>
        );
      },
    },

    {
      key: 'dueDate',
      label: 'Due Date',
      render: (value: unknown) => (
        <span className="text-text-secondary">
          {value ? new Date(String(value)).toLocaleDateString() + ' ' + new Date(String(value)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No due date'}
        </span>
      ),
    },

    {
      key: 'actions',
      label: 'Actions',
      render: (value: unknown, row: Record<string, unknown>) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewTask(row as GroupedTask);
          }}
          className="btn-modern text-xs px-3 py-1"
        >
          View Details
        </button>
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
            <div className="text-3xl font-bold text-text-primary">{groupedTasks.length}</div>
            <div className="text-text-muted text-sm">Unique Tasks</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-info">{tasks.length}</div>
            <div className="text-text-muted text-sm">Total Assignments</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-success">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-text-muted text-sm">Completed</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-danger">
              {tasks.filter(t => t.status === 'pending').length}
            </div>
            <div className="text-text-muted text-sm">Pending</div>
          </div>
        </div>

        {/* Tasks Table */}
        {/* Search and Filters */}
        <div className="glass-card p-6 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">
                Search Tasks
              </label>
              <input
                type="text"
                value={taskSearchTerm}
                onChange={(e) => setTaskSearchTerm(e.target.value)}
                className="modern-input"
                placeholder="Search by title, description, or assignee..."
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="modern-input"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setTaskSearchTerm('');
                  setStatusFilter('all');
                }}
                className="w-full px-4 py-3 rounded-lg border border-accent/30 text-text-secondary hover:text-text-primary hover:border-accent/50 transition-all duration-300"
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          {/* Results Summary */}
          <div className="mt-4 pt-4 border-t border-accent/20">
            <p className="text-text-muted text-sm">
              Showing {filteredTasks.length} of {groupedTasks.length} unique tasks
              {taskSearchTerm && ` matching "${taskSearchTerm}"`}
              {statusFilter !== 'all' && ` with status "${statusFilter}"`}
            </p>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredTasks as Record<string, unknown>[]}
          loading={loading}
          onRowClick={(row: Record<string, unknown>) => {
            handleViewTask(row as GroupedTask);
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

      {/* Task Details Modal */}
      <Modal
        isOpen={isTaskDetailsModalOpen}
        onClose={() => {
          setIsTaskDetailsModalOpen(false);
          setSelectedTask(null);
        }}
        title="Task Details & User Progress"
        size="xl"
      >
        {selectedTask && (
          <div className="space-y-6">
            {/* Task Info */}
            <div className="glass-card p-6 rounded-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-text-primary mb-2">{selectedTask.title}</h3>
                  <p className="text-text-secondary mb-4">{selectedTask.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`status-badge ${selectedTask.type === 'daily' ? 'bg-info/20 text-info border-info/30' : 'bg-warning/20 text-warning border-warning/30'}`}>
                      {selectedTask.type}
                    </span>
                    <span className="text-text-muted">
                      Due: {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() + ' ' + new Date(selectedTask.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No due date'}
                    </span>
                  </div>
                </div>
                {selectedTask.picture && (
                  <img
                    src={selectedTask.picture}
                    alt="Task"
                    className="w-20 h-20 object-cover rounded-lg border border-accent/20 ml-4"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>

              {/* Progress Summary */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-accent/20">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {selectedTask.assignedUsers.filter(u => u.status === 'completed').length}
                  </div>
                  <div className="text-text-muted text-sm">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">
                    {selectedTask.assignedUsers.filter(u => u.status === 'in-progress').length}
                  </div>
                  <div className="text-text-muted text-sm">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-danger">
                    {selectedTask.assignedUsers.filter(u => u.status === 'pending').length}
                  </div>
                  <div className="text-text-muted text-sm">Pending</div>
                </div>
              </div>
            </div>

            {/* User Progress List */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-text-primary">Assigned Users Progress</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedTask.assignedUsers.map((user, index) => (
                  <div key={index} className="glass-card p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{user.name}</div>
                          <div className="text-sm text-text-muted">{user.email}</div>
                          <div className="text-xs text-text-muted">
                            Last updated: {new Date(user.updatedAt).toLocaleDateString()} {new Date(user.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(user.status)}
                        <select
                          value={user.status}
                          onChange={(e) => handleUserStatusUpdate(user._id, selectedTask.title, e.target.value as 'pending' | 'in-progress' | 'completed')}
                          className="text-xs px-2 py-1 rounded border border-accent/30 bg-surface text-text-primary focus:outline-none focus:border-accent"
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end pt-6 border-t border-accent/20">
              <button
                onClick={() => {
                  setIsTaskDetailsModalOpen(false);
                  setSelectedTask(null);
                }}
                className="btn-modern"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default AdminTasksPage;