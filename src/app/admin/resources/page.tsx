'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { resourceAPI } from '@/lib/api';

interface Resource {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  visibleTo: string[];
  language: string;
  createdAt: string;
}

const AdminResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fileUrl: '',
    visibleTo: ['user'],
    language: 'en',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadResources();
    }
  }, [user]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const response = await resourceAPI.getAllResources();
      if (response.success && response.data) {
        const resources = response.data.map((r: any) => ({
          id: r._id || r.id,
          title: r.title,
          description: r.description,
          fileUrl: r.fileUrl,
          visibleTo: r.visibleTo,
          language: r.language,
          createdAt: r.createdAt,
        }));
        setResources(resources);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = async () => {
    try {
      const response = await resourceAPI.uploadResource(formData);

      if (response.success) {
        setIsCreateModalOpen(false);
        setFormData({
          title: '',
          description: '',
          fileUrl: '',
          visibleTo: ['user'],
          language: 'en',
        });
        loadResources();
        alert('Resource created successfully!');
      } else {
        alert(response.error || 'Error creating resource. Please try again.');
      }
    } catch (error) {
      console.error('Error creating resource:', error);
      alert('Error creating resource. Please try again.');
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const response = await resourceAPI.deleteResource(resourceId);
      if (response.success) {
        loadResources();
        alert('Resource deleted successfully!');
      } else {
        alert(response.error || 'Error deleting resource.');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Error deleting resource.');
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (value: string, row: Resource) => (
        <div>
          <div className="text-text-primary font-medium">{value}</div>
          <div className="text-text-muted text-sm">{row.description}</div>
        </div>
      ),
    },
    {
      key: 'fileUrl',
      label: 'URL',
      render: (value: string) => (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-accent-light text-sm"
        >
          View Resource
        </a>
      ),
    },
    {
      key: 'visibleTo',
      label: 'Visible To',
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.map((role) => (
            <span
              key={role}
              className="px-2 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent capitalize"
            >
              {role}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'language',
      label: 'Language',
      render: (value: string) => (
        <span className="text-text-secondary uppercase">{value}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: Resource) => (
        <button
          onClick={() => handleDeleteResource(row.id)}
          className="px-4 py-2 rounded-lg bg-danger/20 text-danger hover:bg-danger/30 transition-all duration-200 text-sm font-medium"
        >
          Delete
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
            <h1 className="text-3xl font-bold text-text-primary">Resource Management</h1>
            <p className="text-text-secondary">
              Manage onboarding resources and documentation
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-modern"
          >
            Add New Resource
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-text-primary">{resources.length}</div>
            <div className="text-text-muted text-sm">Total Resources</div>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-accent">
              {resources.filter(r => r.visibleTo.includes('user')).length}
            </div>
            <div className="text-text-muted text-sm">User Accessible</div>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-warning">
              {resources.filter(r => r.visibleTo.includes('admin')).length}
            </div>
            <div className="text-text-muted text-sm">Admin Only</div>
          </div>
        </div>

        {/* Resources Table */}
        <Table
          columns={columns}
          data={resources}
          loading={loading}
        />
      </div>

      {/* Create Resource Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Resource"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="modern-input"
              placeholder="Enter resource title"
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
              rows={3}
              placeholder="Enter resource description"
              required
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">
              File URL *
            </label>
            <input
              type="url"
              value={formData.fileUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, fileUrl: e.target.value }))}
              className="modern-input"
              placeholder="https://example.com/resource.pdf"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">
                Visible To
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.visibleTo.includes('user')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, visibleTo: [...prev.visibleTo, 'user'] }));
                      } else {
                        setFormData(prev => ({ ...prev, visibleTo: prev.visibleTo.filter(v => v !== 'user') }));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-text-primary">Users</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.visibleTo.includes('admin')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, visibleTo: [...prev.visibleTo, 'admin'] }));
                      } else {
                        setFormData(prev => ({ ...prev, visibleTo: prev.visibleTo.filter(v => v !== 'admin') }));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-text-primary">Admins</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">
                Language
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                className="modern-input"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
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
              onClick={handleCreateResource}
              disabled={!formData.title || !formData.description || !formData.fileUrl || formData.visibleTo.length === 0}
              className={`btn-modern ${
                !formData.title || !formData.description || !formData.fileUrl || formData.visibleTo.length === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              Create Resource
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default AdminResourcesPage;