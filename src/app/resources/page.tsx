'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { resourceAPI } from '@/lib/api';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  url: string;
  category: string;
  accessLevel: string;
}

const ResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadResources();
    }
  }, [user]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const response = await resourceAPI.getAllResources({ visibleTo: 'user' });
      if (response.success && response.data) {
        // Map API response to match our interface
        const resources = response.data.map((r: any) => ({
          id: r._id || r.id,
          title: r.title,
          description: r.description,
          type: r.fileUrl ? 'pdf' : 'link', // Determine type based on URL
          url: r.fileUrl,
          category: r.category || 'General',
          accessLevel: r.visibleTo?.includes('user') ? 'user' : 'admin',
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



  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'link':
        return '🔗';
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      default:
        return '📁';
    }
  };

  const handleResourceClick = (resource: Resource) => {
    if (resource.type === 'link') {
      window.open(resource.url, '_blank');
    } else {
      // Handle file download or view
      window.open(resource.url, '_blank');
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Resources</h1>
            <p className="text-text-secondary">
              Access onboarding materials and company resources
            </p>
          </div>
        </div>



        {/* Resources Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        ) : resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.map((resource) => (
              <div
                key={resource.id}
                onClick={() => handleResourceClick(resource)}
                className="glass-card p-8 rounded-3xl hover-scale cursor-pointer group relative overflow-hidden"
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-accent/20 to-purple/10 rounded-full blur-2xl group-hover:scale-110 transition-all duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-purple/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <span className="text-4xl">{getResourceIcon(resource.type)}</span>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-accent/20 to-purple/20 text-accent font-semibold capitalize border border-accent/20">
                        {resource.category}
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-surface text-text-muted uppercase font-medium border border-accent/10">
                        {resource.type}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-accent transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-text-secondary text-base mb-6 line-clamp-3 leading-relaxed">
                    {resource.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-accent/20">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-success/20 flex items-center justify-center">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                      </div>
                      <span className="text-sm text-text-secondary font-medium capitalize">
                        {resource.accessLevel} Access
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-accent group-hover:text-accent-light transition-colors">
                      <span className="font-semibold">Open</span>
                      <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 rounded-xl text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No resources found
            </h3>
            <p className="text-text-secondary">
              No resources are available at the moment.
            </p>
          </div>
        )}

        {/* Resource Categories Overview */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl mb-2">📄</div>
            <div className="text-xl font-bold text-text-primary">
              {resources.filter(r => r.type === 'pdf').length}
            </div>
            <div className="text-text-muted">Documents</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl mb-2">🔗</div>
            <div className="text-xl font-bold text-text-primary">
              {resources.filter(r => r.type === 'link').length}
            </div>
            <div className="text-text-muted">Links</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl mb-2">🎥</div>
            <div className="text-xl font-bold text-text-primary">
              {resources.filter(r => r.type === 'video').length}
            </div>
            <div className="text-text-muted">Videos</div>
          </div>
        </div> */}


      </div>
    </Layout>
  );
};

export default ResourcesPage;