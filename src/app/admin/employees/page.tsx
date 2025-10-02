'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { userAPI, authAPI, taskAPI } from '@/lib/api';
import { formatDate } from '@/lib/onboardingUtils';

interface Employee {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'admin' | 'user';
    startDate: string;
    department?: string;
    [key: string]: unknown; // Add index signature
}

interface Task {
    id: string;
    title: string;
    description: string;
    status: string;
    dueDate: string;
    category: string;
    priority: string;
}

interface BulkUploadEmployee {
    name: string;
    email: string;
    password: string;
    phone: string;
    startDate: string;
    status?: string;
    error?: string;
}

const AdminEmployeesPage: React.FC = () => {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [employeeTasks, setEmployeeTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [bulkUploadData, setBulkUploadData] = useState<BulkUploadEmployee[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        department: '',
        startDate: '',
    });

    useEffect(() => {
        if (user?.role === 'admin') {
            loadEmployees();
        }
    }, [user]);

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const response = await userAPI.getAllUsers({ role: 'user' });
            if (response.success && response.data) {
                // Map API response to match our interface
                const employees = response.data.map((u: Record<string, unknown>) => ({
                    id: u._id || u.id,
                    name: u.name,
                    email: u.email,
                    phone: u.phone,
                    role: u.role,
                    startDate: u.startDate,
                    department: u.department,
                }));
                setEmployees(employees);
            }
        } catch (error) {
            console.error('Error loading employees:', error);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEmployee = async () => {
        try {
            const response = await authAPI.signup({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: 'user',
                phone: formData.phone,
                startDate: formData.startDate,
            });

            if (response.success) {
                setIsCreateModalOpen(false);
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    phone: '',
                    department: '',
                    startDate: '',
                });
                loadEmployees();
                alert('Employee created successfully!');
            } else {
                alert(response.error || 'Error creating employee. Please try again.');
            }
        } catch (error) {
            console.error('Error creating employee:', error);
            alert('Error creating employee. Please try again.');
        }
    };

    // CSV Template Download
    const downloadCSVTemplate = () => {
        const csvContent = [
            'name,email,password,phone,startDate',
            'John Doe,john.doe@company.com,StrongPass123!,1234567890,2025-01-15',
            'Jane Smith,jane.smith@company.com,SecurePass456!,0987654321,2025-01-20'
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'employee_template.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    // Parse CSV file
    const parseCSV = (text: string): BulkUploadEmployee[] => {
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const data: BulkUploadEmployee[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length === headers.length) {
                const row: Record<string, string> = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });

                // Validate and create BulkUploadEmployee object
                if (row.name && row.email && row.password && row.phone && row.startDate) {
                    const employee: BulkUploadEmployee = {
                        name: row.name,
                        email: row.email,
                        password: row.password,
                        phone: row.phone,
                        startDate: row.startDate,
                    };
                    data.push(employee);
                }
            }
        }
        return data;
    };

    // Handle file drop
    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));

        if (csvFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const data = parseCSV(text);
                setBulkUploadData(data);
            };
            reader.readAsText(csvFile);
        } else {
            alert('Please upload a CSV file');
        }
    };

    // Handle file input change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const data = parseCSV(text);
                setBulkUploadData(data);
            };
            reader.readAsText(file);
        }
    };

    // Process bulk upload
    const processBulkUpload = async () => {
        if (bulkUploadData.length === 0) return;

        setIsProcessing(true);
        setUploadProgress(0);

        const results = [];
        const total = bulkUploadData.length;

        for (let i = 0; i < bulkUploadData.length; i++) {
            const employee = bulkUploadData[i];
            try {
                const response = await authAPI.signup({
                    name: employee.name,
                    email: employee.email,
                    password: employee.password,
                    role: 'user',
                    phone: employee.phone,
                    startDate: employee.startDate,
                });

                results.push({
                    ...employee,
                    status: response.success ? 'success' : 'failed',
                    error: response.success ? null : response.error
                });
            } catch (error) {
                results.push({
                    ...employee,
                    status: 'failed',
                    error: 'Network error'
                });
            }

            setUploadProgress(Math.round(((i + 1) / total) * 100));
        }

        const successful = results.filter(r => r.status === 'success').length;
        const failed = results.filter(r => r.status === 'failed').length;

        alert(`Upload completed!\nSuccessful: ${successful}\nFailed: ${failed}`);

        if (successful > 0) {
            loadEmployees();
        }

        setIsProcessing(false);
        setIsBulkUploadModalOpen(false);
        setBulkUploadData([]);
        setUploadProgress(0);
    };

    const handleViewProfile = async (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsProfileModalOpen(true);

        // Load employee tasks
        try {
            const response = await taskAPI.getUserTasks(employee.id);
            if (response.success && response.data) {
                const tasks = response.data.map((t: Record<string, unknown>) => ({
                    id: t._id || t.id,
                    title: t.title,
                    description: t.description,
                    status: t.status,
                    dueDate: t.dueDate,
                    category: t.type || t.category,
                    priority: t.priority || 'medium',
                }));
                setEmployeeTasks(tasks);
            }
        } catch (err) {
            console.error('Error loading employee tasks:', err);
            setEmployeeTasks([]);
        }
    };

    // Filter employees based on search term
    const filteredEmployees = employees.filter(employee => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        return (
            employee.name?.toLowerCase().includes(searchLower) ||
            employee.email?.toLowerCase().includes(searchLower) ||
            employee.phone?.toLowerCase().includes(searchLower) ||
            employee.department?.toLowerCase().includes(searchLower)
        );
    });

    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (value: unknown, row: Record<string, unknown>) => {
                const name = value as string;
                const employee = row as Employee;
                return (
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                                {name?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <span className="text-text-primary font-medium">{name}</span>
                            <div className="text-text-muted text-xs">{employee.department || 'No department'}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'email',
            label: 'Email',
            render: (value: unknown) => (
                <span className="text-text-secondary">{value as string}</span>
            ),
        },
        {
            key: 'startDate',
            label: 'Start Date',
            render: (value: unknown) => {
                const dateValue = value as string;
                return (
                    <span className="text-text-secondary">
                        {dateValue ? formatDate(dateValue) : 'Not set'}
                    </span>
                );
            },
        },
        {
            key: 'status',
            label: 'Status',
            render: () => (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/20 text-success">
                    Active
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_value: unknown, row: Record<string, unknown>) => {
                const employee = row as Employee;
                return (
                    <button
                        onClick={() => handleViewProfile(employee)}
                        className="px-4 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-all duration-200 text-sm font-medium"
                    >
                        View Profile
                    </button>
                );
            },
        },
    ];

    return (
        <ProtectedRoute requiredRole="admin">
            <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Employee Management</h1>
                        <p className="text-text-secondary">
                            Manage employee accounts and onboarding status
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setIsBulkUploadModalOpen(true)}
                            className="px-4 py-2 rounded-lg bg-secondary/50 text-text-primary hover:bg-secondary/70 transition-all duration-200 text-sm font-medium border border-accent/20"
                        >
                            Bulk Upload
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="btn-modern"
                        >
                            Add New Employee
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="modern-input pl-10"
                                placeholder="Search employees by name, email, phone, or department..."
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    <svg className="h-5 w-5 text-text-muted hover:text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    {searchTerm && (
                        <div className="text-text-secondary text-sm ml-4">
                            Showing {filteredEmployees.length} of {employees.length} employees
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass-card p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-text-primary">{employees.length}</div>
                        <div className="text-text-muted text-sm">Total Employees</div>
                    </div>
                    <div className="glass-card p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-success">{employees.length}</div>
                        <div className="text-text-muted text-sm">Active</div>
                    </div>
                    <div className="glass-card p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-warning">0</div>
                        <div className="text-text-muted text-sm">Inactive</div>
                    </div>
                    <div className="glass-card p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-accent">
                            {employees.filter(e => {
                                const startDate = new Date(e.startDate);
                                const now = new Date();
                                const diffTime = now.getTime() - startDate.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                return diffDays <= 30;
                            }).length}
                        </div>
                        <div className="text-text-muted text-sm">New (30 days)</div>
                    </div>
                </div>

                {/* Employees Table */}
                <div className="space-y-4">
                    <Table
                        columns={columns}
                        data={filteredEmployees as unknown as Record<string, unknown>[]}
                        loading={loading}
                        onRowClick={(employee: Record<string, unknown>) => {
                            console.log('Employee clicked:', employee);
                        }}
                    />

                    {filteredEmployees.length === 0 && !loading && searchTerm && (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-4">🔍</div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">
                                No employees found
                            </h3>
                            <p className="text-text-secondary mb-4">
                                No employees match your search for &quot;{searchTerm}&quot;
                            </p>
                            <button
                                onClick={() => setSearchTerm('')}
                                className="px-4 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-all duration-200 text-sm font-medium"
                            >
                                Clear Search
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Employee Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Add New Employee"
                size="lg"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-text-secondary text-sm font-medium mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="modern-input"
                                placeholder="Enter full name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-text-secondary text-sm font-medium mb-2">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="modern-input"
                                placeholder="Enter email address"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-text-secondary text-sm font-medium mb-2">
                                Password *
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                className="modern-input"
                                placeholder="Enter password (min 8 characters)"
                                required
                                minLength={8}
                            />
                            <p className="text-xs text-text-muted mt-1">
                                Password should contain uppercase, lowercase, number and special character
                            </p>
                        </div>

                        <div>
                            <label className="block text-text-secondary text-sm font-medium mb-2">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                className="modern-input"
                                placeholder="Enter phone number"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-text-secondary text-sm font-medium mb-2">
                                Department
                            </label>
                            <select
                                value={formData.department}
                                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                className="modern-input"
                            >
                                <option value="">Select department</option>
                                <option value="Engineering">Engineering</option>
                                <option value="Design">Design</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Sales">Sales</option>
                                <option value="HR">Human Resources</option>
                                <option value="Finance">Finance</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-text-secondary text-sm font-medium mb-2">
                                Start Date *
                            </label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                className="modern-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-accent/20">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-6 py-3 rounded-lg border border-accent/30 text-text-secondary hover:text-text-primary hover:border-accent/50 transition-all duration-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateEmployee}
                            disabled={!formData.name || !formData.email || !formData.password || !formData.phone || !formData.startDate}
                            className={`btn-modern ${!formData.name || !formData.email || !formData.password || !formData.phone || !formData.startDate
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                                }`}
                        >
                            Create Employee
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Employee Profile Modal */}
            <Modal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                title="Employee Profile"
                size="xl"
            >
                {selectedEmployee && (
                    <div className="space-y-6">
                        {/* Employee Header */}
                        <div className="flex items-center space-x-6 p-6 rounded-xl bg-secondary/30">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center">
                                <span className="text-3xl font-bold text-white">
                                    {selectedEmployee.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-text-primary mb-1">
                                    {selectedEmployee.name}
                                </h2>
                                <p className="text-text-secondary mb-2">{selectedEmployee.email}</p>
                                <div className="flex items-center space-x-4 text-sm">
                                    <span className="px-2 py-1 rounded-full bg-success/20 text-success capitalize">
                                        {selectedEmployee.role}
                                    </span>
                                    <span className="text-text-muted">
                                        Started: {selectedEmployee.startDate ? formatDate(selectedEmployee.startDate) : 'Not set'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Employee Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-text-primary">Contact Information</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                                        <span className="text-text-muted">Email</span>
                                        <span className="text-text-primary">{selectedEmployee.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                                        <span className="text-text-muted">Phone</span>
                                        <span className="text-text-primary">{selectedEmployee.phone || 'Not provided'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                                        <span className="text-text-muted">Department</span>
                                        <span className="text-text-primary">{selectedEmployee.department || 'Not assigned'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-text-primary">Task Summary</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="text-center p-3 rounded-lg bg-success/20">
                                        <div className="text-xl font-bold text-success">
                                            {employeeTasks.filter(t => t.status === 'completed').length}
                                        </div>
                                        <div className="text-xs text-text-muted">Completed</div>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-warning/20">
                                        <div className="text-xl font-bold text-warning">
                                            {employeeTasks.filter(t => t.status === 'in-progress').length}
                                        </div>
                                        <div className="text-xs text-text-muted">In Progress</div>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-danger/20">
                                        <div className="text-xl font-bold text-danger">
                                            {employeeTasks.filter(t => t.status === 'pending').length}
                                        </div>
                                        <div className="text-xs text-text-muted">Pending</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Employee Tasks */}
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-4">Assigned Tasks</h3>
                            {employeeTasks.length > 0 ? (
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {employeeTasks.map((task) => (
                                        <div key={task.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/20">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${task.status === 'completed' ? 'bg-success/20' :
                                                    task.status === 'in-progress' ? 'bg-warning/20' : 'bg-danger/20'
                                                    }`}>
                                                    <span className="text-sm">
                                                        {task.status === 'completed' ? '✅' :
                                                            task.status === 'in-progress' ? '🔄' : '⏳'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-text-primary font-medium">{task.title}</p>
                                                    <p className="text-text-muted text-sm">{task.category}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${task.status === 'completed' ? 'bg-success/20 text-success' :
                                                    task.status === 'in-progress' ? 'bg-warning/20 text-warning' :
                                                        'bg-danger/20 text-danger'
                                                    }`}>
                                                    {task.status.replace('-', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">📋</div>
                                    <p className="text-text-secondary">No tasks assigned yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Bulk Upload Modal */}
            <Modal
                isOpen={isBulkUploadModalOpen}
                onClose={() => {
                    setIsBulkUploadModalOpen(false);
                    setBulkUploadData([]);
                    setUploadProgress(0);
                }}
                title="Bulk Employee Upload"
                size="xl"
            >
                <div className="space-y-6">
                    {/* Instructions */}
                    <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-text-primary mb-2">Instructions</h3>
                        <ol className="list-decimal list-inside space-y-1 text-text-secondary text-sm">
                            <li>Download the CSV template below</li>
                            <li>Fill in employee details (name, email, password, phone, startDate)</li>
                            <li>Upload the completed CSV file using drag & drop or file picker</li>
                            <li>Review the data and click "Process Upload"</li>
                        </ol>
                    </div>

                    {/* Download Template */}
                    <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                        <div>
                            <h4 className="font-medium text-text-primary">CSV Template</h4>
                            <p className="text-sm text-text-muted">Download the template with sample data</p>
                        </div>
                        <button
                            onClick={downloadCSVTemplate}
                            className="px-4 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-all duration-200 text-sm font-medium"
                        >
                            Download Template
                        </button>
                    </div>

                    {/* File Upload Area */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${isDragOver
                            ? 'border-accent bg-accent/10'
                            : 'border-accent/30 hover:border-accent/50'
                            }`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                        }}
                        onDrop={handleFileDrop}
                    >
                        <div className="space-y-4">
                            <div className="text-4xl">📁</div>
                            <div>
                                <h3 className="text-lg font-semibold text-text-primary mb-2">
                                    Drop your CSV file here
                                </h3>
                                <p className="text-text-muted mb-4">
                                    or click to browse files
                                </p>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="csv-upload"
                                />
                                <label
                                    htmlFor="csv-upload"
                                    className="inline-block px-6 py-3 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-all duration-200 cursor-pointer font-medium"
                                >
                                    Choose File
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Data Preview */}
                    {bulkUploadData.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-text-primary">
                                    Data Preview ({bulkUploadData.length} employees)
                                </h3>
                                <button
                                    onClick={() => setBulkUploadData([])}
                                    className="text-danger hover:text-danger/80 text-sm"
                                >
                                    Clear Data
                                </button>
                            </div>

                            <div className="max-h-60 overflow-y-auto border border-accent/20 rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-secondary/30 sticky top-0">
                                        <tr>
                                            <th className="text-left p-3 font-medium text-text-primary">Name</th>
                                            <th className="text-left p-3 font-medium text-text-primary">Email</th>
                                            <th className="text-left p-3 font-medium text-text-primary">Phone</th>
                                            <th className="text-left p-3 font-medium text-text-primary">Start Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bulkUploadData.map((employee, index) => (
                                            <tr key={index} className="border-t border-accent/10">
                                                <td className="p-3 text-text-primary">{employee.name}</td>
                                                <td className="p-3 text-text-secondary">{employee.email}</td>
                                                <td className="p-3 text-text-secondary">{employee.phone}</td>
                                                <td className="p-3 text-text-secondary">{employee.startDate}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {isProcessing && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-text-secondary">Processing employees...</span>
                                <span className="text-accent font-medium">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-secondary/30 rounded-full h-2">
                                <div
                                    className="bg-accent h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-accent/20">
                        <button
                            onClick={() => {
                                setIsBulkUploadModalOpen(false);
                                setBulkUploadData([]);
                                setUploadProgress(0);
                            }}
                            disabled={isProcessing}
                            className="px-6 py-3 rounded-lg border border-accent/30 text-text-secondary hover:text-text-primary hover:border-accent/50 transition-all duration-300 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={processBulkUpload}
                            disabled={bulkUploadData.length === 0 || isProcessing}
                            className={`btn-modern ${bulkUploadData.length === 0 || isProcessing
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                                }`}
                        >
                            {isProcessing ? 'Processing...' : 'Process Upload'}
                        </button>
                    </div>
                </div>
            </Modal>
            </Layout>
        </ProtectedRoute>
    );
};

export default AdminEmployeesPage;