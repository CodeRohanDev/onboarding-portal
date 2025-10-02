'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { formatDate } from '@/lib/onboardingUtils';
import { taskAPI } from '@/lib/api';

interface Task {
  _id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  type: string;
  createdAt: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: 'Engineering',
    position: 'Software Developer',
    bio: 'Passionate developer with expertise in React and Node.js',
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    completedTasks: 0,
    pendingTasks: 0,
    totalTasks: 0,
    completionRate: 0,
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);

  const fetchUserData = async () => {
    if (!user?.id) return;

    try {
      const tasksResult = await taskAPI.getUserTasks(user.id);
      if (tasksResult.success && tasksResult.data) {
        const completed = tasksResult.data.filter((task: Task) => task.status === 'completed').length;
        const pending = tasksResult.data.filter((task: Task) => task.status === 'pending').length;
        const total = tasksResult.data.length;

        setStats({
          completedTasks: completed,
          pendingTasks: pending,
          totalTasks: total,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
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
      department: 'Engineering',
      position: 'Software Developer',
      bio: 'Passionate developer with expertise in React and Node.js',
    });
    setIsEditing(false);
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
            <h1 className="text-3xl font-bold text-text-primary">Profile</h1>
            <p className="text-text-secondary">
              Manage your personal information and account settings
            </p>
          </div>
        </div>

        {/* Profile Header */}
        <div className="profile-header">
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-6 sm:space-y-0 sm:space-x-8 mb-6 lg:mb-0">
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="profile-avatar">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-3xl"
                      />
                    ) : (
                      <span>
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-3xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-white text-sm font-medium">Change Photo</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-text-primary mb-3">{user.name}</h2>
                  <p className="text-xl text-text-secondary mb-4">{formData.position}</p>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="status-badge bg-accent/20 text-accent border-accent/30 capitalize">
                      {user.role}
                    </span>
                    <span className="status-completed">
                      Active
                    </span>
                    <span className="status-badge bg-info/20 text-info border-info/30">
                      {formData.department}
                    </span>
                  </div>
                  {user.startDate && (
                    <p className="text-text-muted">
                      Member since {formatDate(user.startDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="p-6 rounded-xl bg-surface/40 border border-accent/10">
              <p className="text-text-secondary italic text-lg leading-relaxed">{formData.bio}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Information */}
            <div className="glass-card p-8 rounded-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-text-primary">Personal Information</h3>
                {/* {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-primary px-6 py-3 rounded-lg font-semibold"
                  >
                    Edit Profile
                  </button>
                )} */}
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="modern-input"
                      />
                    ) : (
                      <div className="modern-input bg-surface/50 border-border-secondary">
                        {user.name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-2">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="modern-input"
                      />
                    ) : (
                      <div className="modern-input bg-surface/50 border-border-secondary">
                        {user.email}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-2">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="modern-input"
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <div className="modern-input bg-surface/50 border-border-secondary">
                        {user.phone || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-2">
                      Position
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.position}
                        onChange={(e) => handleInputChange('position', e.target.value)}
                        className="modern-input"
                        placeholder="Enter position"
                      />
                    ) : (
                      <div className="modern-input bg-surface/50 border-border-secondary">
                        {formData.position}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-2">
                      Department
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        className="modern-input"
                        placeholder="Enter department"
                      />
                    ) : (
                      <div className="modern-input bg-surface/50 border-border-secondary">
                        {formData.department}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-2">
                      Role
                    </label>
                    <div className="modern-input bg-surface/50 border-border-secondary capitalize">
                      {user.role}
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-2">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={3}
                      className="modern-input resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <div className="modern-input bg-surface/50 border-border-secondary">
                      {formData.bio}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-accent/20">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancel}
                        className="px-6 py-3 rounded-lg border border-accent/30 text-text-secondary hover:text-text-primary hover:border-accent/50 transition-all duration-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`btn-modern ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn-modern"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Profile Summary */}
            {/* <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-text-primary mb-4">Profile Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface/30">
                  <span className="text-text-secondary">Tasks Completed</span>
                  <span className="text-success font-bold">{stats.completedTasks}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface/30">
                  <span className="text-text-secondary">Tasks Pending</span>
                  <span className="text-warning font-bold">{stats.pendingTasks}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface/30">
                  <span className="text-text-secondary">Success Rate</span>
                  <span className="text-accent font-bold">{stats.completionRate}%</span>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;