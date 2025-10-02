'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { formatDate } from '@/lib/onboardingUtils';

const AdminProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // API call to update profile would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="glass-card p-10 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-accent/20 to-purple/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-8">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-accent via-purple to-emerald flex items-center justify-center shadow-2xl">
                <span className="text-5xl font-bold text-white">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-text-primary to-accent bg-clip-text text-transparent mb-2">
                  Admin Profile
                </h1>
                <p className="text-text-secondary text-xl mb-2">{user.name}</p>
                <div className="flex items-center space-x-4">
                  <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent/20 to-purple/20 text-accent font-semibold border border-accent/20">
                    Administrator
                  </span>
                  <span className="text-text-muted">
                    Member since {user.startDate ? formatDate(user.startDate) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="glass-card p-10 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-text-primary">Personal Information</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary px-6 py-3 rounded-xl font-semibold"
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-text-secondary text-sm font-semibold mb-3">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-5 py-4 rounded-xl bg-surface border border-accent/20 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              ) : (
                <div className="px-5 py-4 rounded-xl bg-surface border border-accent/10 text-text-primary">
                  {user.name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-text-secondary text-sm font-semibold mb-3">
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-5 py-4 rounded-xl bg-surface border border-accent/20 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              ) : (
                <div className="px-5 py-4 rounded-xl bg-surface border border-accent/10 text-text-primary">
                  {user.email}
                </div>
              )}
            </div>

            <div>
              <label className="block text-text-secondary text-sm font-semibold mb-3">
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-5 py-4 rounded-xl bg-surface border border-accent/20 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  placeholder="Enter phone number"
                />
              ) : (
                <div className="px-5 py-4 rounded-xl bg-surface border border-accent/10 text-text-primary">
                  {user.phone || 'Not provided'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-text-secondary text-sm font-semibold mb-3">
                Role
              </label>
              <div className="px-5 py-4 rounded-xl bg-surface border border-accent/10 text-text-primary capitalize">
                {user.role}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center justify-end space-x-4 mt-8 pt-8 border-t border-accent/20">
              <button
                onClick={handleCancel}
                className="px-6 py-3 rounded-xl border border-accent/30 text-text-secondary hover:text-text-primary hover:border-accent/50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  loading
                    ? 'bg-accent/50 text-white cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Admin Statistics */}
        {/* <div className="glass-card p-10 rounded-3xl">
          <h2 className="text-2xl font-bold text-text-primary mb-8">Admin Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-accent/20 to-purple/10 border border-accent/20">
              <div className="text-3xl font-bold text-accent mb-2">12</div>
              <div className="text-text-secondary font-medium">Total Employees</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-success/20 to-emerald/10 border border-success/20">
              <div className="text-3xl font-bold text-success mb-2">45</div>
              <div className="text-text-secondary font-medium">Tasks Created</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-warning/20 to-orange/10 border border-warning/20">
              <div className="text-3xl font-bold text-warning mb-2">8</div>
              <div className="text-text-secondary font-medium">Resources Added</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple/20 to-purple/10 border border-purple/20">
              <div className="text-3xl font-bold text-purple mb-2">3</div>
              <div className="text-text-secondary font-medium">Forms Created</div>
            </div>
          </div>
        </div> */}

        {/* Account Settings */}
        {/* <div className="glass-card p-10 rounded-3xl">
          <h2 className="text-2xl font-bold text-text-primary mb-8">Account Settings</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 rounded-2xl bg-surface border border-accent/10 hover:border-accent/20 transition-colors">
              <div>
                <h3 className="text-text-primary font-semibold mb-1">Change Password</h3>
                <p className="text-text-muted text-sm">Update your account password for security</p>
              </div>
              <button className="px-6 py-3 rounded-xl border border-accent/30 text-accent hover:bg-accent/10 transition-colors font-semibold">
                Change
              </button>
            </div>

            <div className="flex items-center justify-between p-6 rounded-2xl bg-surface border border-accent/10 hover:border-accent/20 transition-colors">
              <div>
                <h3 className="text-text-primary font-semibold mb-1">Notification Preferences</h3>
                <p className="text-text-muted text-sm">Manage email and system notifications</p>
              </div>
              <button className="px-6 py-3 rounded-xl border border-accent/30 text-accent hover:bg-accent/10 transition-colors font-semibold">
                Manage
              </button>
            </div>

            <div className="flex items-center justify-between p-6 rounded-2xl bg-surface border border-accent/10 hover:border-accent/20 transition-colors">
              <div>
                <h3 className="text-text-primary font-semibold mb-1">Security Settings</h3>
                <p className="text-text-muted text-sm">Two-factor authentication and security options</p>
              </div>
              <button className="px-6 py-3 rounded-xl border border-accent/30 text-accent hover:bg-accent/10 transition-colors font-semibold">
                Configure
              </button>
            </div>
          </div>
        </div> */}
      </div>
    </Layout>
  );
};

export default AdminProfilePage;