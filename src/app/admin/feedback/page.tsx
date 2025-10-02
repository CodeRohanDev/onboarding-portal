'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { formAPI } from '@/lib/api';

interface FormField {
  id?: string;
  label: string;
  type: 'text' | 'radio';
  options: string[];
  required: boolean;
}

interface Form {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  fields: FormField[];
  createdAt: string;
  [key: string]: unknown; // Add index signature
}

interface FormResponse {
  id: string;
  formId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  answers: Array<{
    fieldId: string;
    question: string;
    answer: string;
  }>;
  submittedAt: string;
  [key: string]: unknown; // Add index signature
}

const AdminFeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResponsesModalOpen, setIsResponsesModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'user' | 'admin' | 'both'>('all');
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    assignedTo: 'user' | 'admin' | 'both';
    fields: FormField[];
  }>({
    title: '',
    description: '',
    assignedTo: 'user',
    fields: [{ label: '', type: 'text', options: [], required: true }],
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadForms();
    }
  }, [user]);

  const loadForms = async () => {
    setLoading(true);
    try {
      const response = await formAPI.getAllForms();
      if (response.success && response.data) {
        const formsData = response.data.forms || response.data;
        console.log('Admin Feedback - Raw forms data:', formsData);

        const forms = formsData.map((f: Record<string, unknown>) => ({
          id: f._id || f.id,
          title: f.title,
          description: f.description,
          assignedTo: f.assignedTo,
          fields: (f.fields as Record<string, unknown>[]).map((field: Record<string, unknown>) => ({
            id: field._id || field.id,
            label: field.label,
            type: field.type,
            options: field.options,
            required: field.required,
          })),
          createdAt: f.createdAt,
        }));

        console.log('Admin Feedback - Processed forms:', forms);
        console.log('Admin Feedback - Forms by assignment:', {
          user: forms.filter((f: Form) => f.assignedTo === 'user').length,
          admin: forms.filter((f: Form) => f.assignedTo === 'admin').length,
          both: forms.filter((f: Form) => f.assignedTo === 'both').length,
          total: forms.length
        });

        setForms(forms);
      }
    } catch (error) {
      console.error('Error loading forms:', error);
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFormResponses = async (formId: string) => {
    try {
      const response = await formAPI.getFormResponses(formId);
      if (response.success && response.data) {
        const responsesData = response.data.responses || response.data;
        const responses = responsesData.map((r: Record<string, unknown>) => {
          const userObj = r.user as Record<string, unknown>;
          return {
            id: r._id || r.id,
            formId: r.formId,
            user: {
              id: userObj._id || userObj.id,
              name: userObj.name,
              email: userObj.email,
            },
            answers: r.answers,
            submittedAt: r.submittedAt,
          };
        });
        setResponses(responses);
      }
    } catch (error) {
      console.error('Error loading form responses:', error);
      setResponses([]);
    }
  };

  const handleCreateForm = async () => {
    try {
      const response = await formAPI.createForm(formData);

      if (response.success) {
        setIsCreateModalOpen(false);
        setFormData({
          title: '',
          description: '',
          assignedTo: 'user',
          fields: [{ label: '', type: 'text', options: [], required: true }],
        });
        loadForms();
        alert('Form created successfully!');
      } else {
        alert(response.error || 'Error creating form. Please try again.');
      }
    } catch (error) {
      console.error('Error creating form:', error);
      alert('Error creating form. Please try again.');
    }
  };

  const handleViewResponses = async (form: Form) => {
    setSelectedForm(form);
    await loadFormResponses(form.id);
    setIsResponsesModalOpen(true);
  };

  const addField = () => {
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, { label: '', type: 'text', options: [], required: true }],
    }));
  };

  const updateField = (index: number, field: Partial<FormField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? { ...f, ...field } : f),
    }));
  };

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  // Filter forms based on active filter
  const filteredForms = forms.filter(form => {
    if (activeFilter === 'all') return true;
    return form.assignedTo === activeFilter;
  });

  const formColumns = [
    {
      key: 'title',
      label: 'Form',
      render: (value: unknown, row: Record<string, unknown>) => {
        const title = value as string;
        const form = row as Form;
        return (
          <div>
            <div className="text-text-primary font-medium">{title}</div>
            <div className="text-text-muted text-sm">{form.description}</div>
          </div>
        );
      },
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: (value: unknown) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent capitalize">
          {value as string}
        </span>
      ),
    },
    {
      key: 'fields',
      label: 'Fields',
      render: (value: unknown) => {
        const fields = value as FormField[];
        return (
          <span className="text-text-secondary">{fields.length} questions</span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value: unknown, row: Record<string, unknown>) => {
        const form = row as Form;
        return (
          <button
            onClick={() => handleViewResponses(form)}
            className="px-4 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-all duration-200 text-sm font-medium"
          >
            View Responses
          </button>
        );
      },
    },
  ];

  const responseColumns = [
    {
      key: 'user',
      label: 'User',
      render: (value: unknown) => {
        const user = value as FormResponse['user'];
        return (
          <div>
            <div className="text-text-primary font-medium">{user.name}</div>
            <div className="text-text-muted text-sm">{user.email}</div>
          </div>
        );
      },
    },
    {
      key: 'submittedAt',
      label: 'Submitted',
      render: (value: unknown) => (
        <span className="text-text-secondary">
          {new Date(value as string).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'answers',
      label: 'Responses',
      render: (value: unknown) => {
        const answers = value as FormResponse['answers'];
        return (
          <span className="text-text-secondary">{answers.length} answers</span>
        );
      },
    },
  ];

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-danger">Access Denied</h1>
          <p className="text-text-secondary">You don&apos;t have permission to access this page.</p>
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
            <h1 className="text-3xl font-bold text-text-primary">Feedback Management</h1>
            <p className="text-text-secondary">
              Create and manage feedback forms and view responses
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-modern"
          >
            Create New Form
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="glass-card p-1 rounded-xl inline-flex">
          {[
            { key: 'all', label: 'All Forms', count: forms.length },
            { key: 'user', label: 'User Forms', count: forms.filter(f => f.assignedTo === 'user').length },
            { key: 'admin', label: 'Admin Forms', count: forms.filter(f => f.assignedTo === 'admin').length },
            { key: 'both', label: 'Both (User & Admin)', count: forms.filter(f => f.assignedTo === 'both').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key as 'all' | 'user' | 'admin' | 'both')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeFilter === tab.key
                ? 'bg-accent text-white shadow-lg'
                : 'text-text-secondary hover:text-text-primary hover:bg-accent/10'
                }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-text-primary">{forms.length}</div>
            <div className="text-text-muted text-sm">Total Forms</div>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-accent">
              {forms.filter(f => f.assignedTo === 'user').length}
            </div>
            <div className="text-text-muted text-sm">User Forms</div>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-warning">
              {forms.filter(f => f.assignedTo === 'admin').length}
            </div>
            <div className="text-text-muted text-sm">Admin Forms</div>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-success">
              {forms.filter(f => f.assignedTo === 'both').length}
            </div>
            <div className="text-text-muted text-sm">Both Forms</div>
          </div>
        </div>

        {/* Forms Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-text-primary">
              {activeFilter === 'all' ? 'All Forms' :
                activeFilter === 'user' ? 'User Forms' :
                  activeFilter === 'admin' ? 'Admin Forms' :
                    'Forms for Both Users & Admins'}
            </h2>
            <div className="text-text-secondary text-sm">
              Showing {filteredForms.length} of {forms.length} forms
            </div>
          </div>

          <Table
            columns={formColumns}
            data={filteredForms as unknown as Record<string, unknown>[]}
            loading={loading}
          />

          {filteredForms.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No forms found
              </h3>
              <p className="text-text-secondary">
                {activeFilter === 'all'
                  ? 'No forms have been created yet.'
                  : `No forms assigned to ${activeFilter === 'both' ? 'both users and admins' : activeFilter + 's'} yet.`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Form Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Form"
        size="xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">
                Form Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="modern-input"
                placeholder="Enter form title"
                required
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">
                Assigned To
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value as 'user' | 'admin' | 'both' }))}
                className="modern-input"
              >
                <option value="user">Users</option>
                <option value="admin">Admins</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="modern-input resize-none"
              rows={3}
              placeholder="Enter form description"
              required
            />
          </div>

          {/* Form Fields */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-text-secondary text-sm font-medium">
                Form Fields
              </label>
              <button
                onClick={addField}
                className="px-3 py-1 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors text-sm"
              >
                Add Field
              </button>
            </div>

            <div className="space-y-4">
              {formData.fields.map((field, index) => (
                <div key={index} className="glass-card p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-text-primary font-medium">Field {index + 1}</span>
                    {formData.fields.length > 1 && (
                      <button
                        onClick={() => removeField(index)}
                        className="text-danger hover:text-danger/80 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-secondary text-xs font-medium mb-1">
                        Question
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-accent/20 text-text-primary text-sm focus:outline-none focus:border-accent"
                        placeholder="Enter question"
                      />
                    </div>

                    <div>
                      <label className="block text-text-secondary text-xs font-medium mb-1">
                        Type
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) => {
                          const newType = e.target.value as 'text' | 'radio';
                          updateField(index, {
                            type: newType,
                            options: newType === 'radio' ? [''] : []
                          });
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-accent/20 text-text-primary text-sm focus:outline-none focus:border-accent"
                      >
                        <option value="text">Text</option>
                        <option value="radio">Multiple Choice</option>
                      </select>
                    </div>
                  </div>

                  {field.type === 'radio' && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-text-secondary text-xs font-medium">
                          Multiple Choice Options
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const currentOptions = field.options || [''];
                            updateField(index, { options: [...currentOptions, ''] });
                          }}
                          className="text-xs text-accent hover:text-accent-light font-medium"
                        >
                          + Add Option
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(field.options || ['']).map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(field.options || [''])];
                                newOptions[optionIndex] = e.target.value;
                                updateField(index, { options: newOptions });
                              }}
                              className="flex-1 px-3 py-2 rounded-lg bg-surface border border-accent/20 text-text-primary text-sm focus:outline-none focus:border-accent"
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                            {(field.options || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = (field.options || []).filter((_, i) => i !== optionIndex);
                                  updateField(index, { options: newOptions });
                                }}
                                className="text-danger hover:text-danger/80 text-sm px-2 py-1"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {(!field.options || field.options.length === 0) && (
                        <p className="text-text-muted text-xs mt-1">
                          Click &quot;Add Option&quot; to create multiple choice options
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-text-primary text-sm">Required field</span>
                    </label>
                  </div>
                </div>
              ))}
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
              onClick={handleCreateForm}
              disabled={!formData.title || !formData.description || formData.fields.some(f => !f.label || (f.type === 'radio' && f.options.filter(o => o.trim()).length < 2))}
              className={`btn-modern ${!formData.title || !formData.description || formData.fields.some(f => !f.label || (f.type === 'radio' && f.options.filter(o => o.trim()).length < 2))
                ? 'opacity-50 cursor-not-allowed'
                : ''
                }`}
            >
              Create Form
            </button>
          </div>
        </div>
      </Modal>

      {/* Form Responses Modal */}
      <Modal
        isOpen={isResponsesModalOpen}
        onClose={() => setIsResponsesModalOpen(false)}
        title={`Responses: ${selectedForm?.title}`}
        size="xl"
      >
        <div className="space-y-4">
          {responses.length > 0 ? (
            <Table
              columns={responseColumns}
              data={responses as unknown as Record<string, unknown>[]}
            />
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No responses yet
              </h3>
              <p className="text-text-secondary">
                This form hasn&apos;t received any responses yet.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
};

export default AdminFeedbackPage;