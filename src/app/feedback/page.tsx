'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { formAPI } from '@/lib/api';

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

interface Form {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
}

const FeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formResponses, setFormResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadForms();
    }
  }, [user]);

  const loadForms = async () => {
    setLoading(true);
    try {
      // Determine which forms to load based on user role
      const params = user?.role === 'admin' 
        ? {} // Admins can see all forms
        : { assignedTo: 'user' as const }; // Regular users see user-assigned forms
      
      const response = await formAPI.getAllForms(params);
      if (response.success && response.data) {
        // Handle both direct array and nested forms property
        const formsData = response.data.forms || response.data;
        
        console.log('User Feedback - Raw forms data:', formsData);
        
        // Ensure each form and its fields have proper IDs
        const processedForms = formsData.map((form: any) => ({
          ...form,
          id: form._id || form.id,
          fields: form.fields.map((field: any, index: number) => ({
            ...field,
            id: field._id || field.id || `field_${index}`, // Fallback to index-based ID
          }))
        }));
        
        // Filter forms based on user role
        const filteredForms = processedForms.filter((form: any) => {
          if (user?.role === 'admin') {
            // Admins can see forms assigned to 'admin' or 'both'
            return form.assignedTo === 'admin' || form.assignedTo === 'both';
          } else {
            // Regular users can see forms assigned to 'user' or 'both'
            return form.assignedTo === 'user' || form.assignedTo === 'both';
          }
        });
        
        console.log('User Feedback - Processed forms:', processedForms);
        console.log('User Feedback - Filtered forms for', user?.role, ':', filteredForms);
        console.log('User Feedback - Forms by assignment:', {
          user: processedForms.filter((f: any) => f.assignedTo === 'user').length,
          admin: processedForms.filter((f: any) => f.assignedTo === 'admin').length,
          both: processedForms.filter((f: any) => f.assignedTo === 'both').length,
          total: processedForms.length,
          filtered: filteredForms.length
        });
        
        setForms(filteredForms as Form[]);
      }
    } catch (error) {
      console.error('Error loading forms:', error);
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormClick = (form: Form) => {
    setSelectedForm(form);
    setFormResponses({});
    setIsFormModalOpen(true);
  };

  const handleModalClose = () => {
    setIsFormModalOpen(false);
    setFormResponses({});
    setSelectedForm(null);
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmitForm = async () => {
    if (!selectedForm || !user) return;

    setSubmitting(true);
    try {
      // Convert form responses to the expected API format
      const answers = Object.entries(formResponses).map(([fieldKey, answer]) => {
        // Find the actual field to get its proper ID
        const fieldIndex = fieldKey.startsWith('field_') ? parseInt(fieldKey.split('_')[1]) : -1;
        const field = fieldIndex >= 0 ? selectedForm.fields[fieldIndex] : selectedForm.fields.find(f => f.id === fieldKey);
        
        return {
          fieldId: field?.id || fieldKey, // Use the actual field ID or fallback to fieldKey
          answer: answer,
        };
      }).filter(item => item.fieldId && item.answer.trim()); // Filter out empty responses

      console.log('Submitting form:', {
        formId: selectedForm.id,
        answers: answers,
        formResponses: formResponses
      });

      const response = await formAPI.submitForm(selectedForm.id, answers);

      if (response.success) {
        handleModalClose();
        alert('Feedback submitted successfully!');
      } else {
        console.error('Form submission error:', response.error);
        alert(response.error || 'Error submitting feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    if (!selectedForm) return false;
    
    const requiredFields = selectedForm.fields.filter(field => field.required);
    return requiredFields.every((field, index) => {
      const fieldKey = field.id || `field_${index}`;
      return formResponses[fieldKey]?.trim();
    });
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
            <h1 className="text-3xl font-bold text-text-primary">Feedback</h1>
            <p className="text-text-secondary">
              {user?.role === 'admin' 
                ? 'Complete feedback forms and share your insights'
                : 'Share your thoughts and help us improve your onboarding experience'
              }
            </p>
          </div>
        </div>

        {/* Available Forms */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        ) : forms.length > 0 ? (
          <div className="feedback-grid">
            {forms.map((form) => (
              <div
                key={form.id}
                onClick={() => handleFormClick(form)}
                className="feedback-card"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                  <span className="status-badge bg-accent/20 text-accent border-accent/30">
                    {form.fields.length} questions
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-text-primary mb-3">
                  {form.title}
                </h3>
                <p className="text-text-secondary text-sm mb-6 line-clamp-3">
                  {form.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">
                    Required: {form.fields.filter(f => f.required).length}
                  </span>
                  <div className="flex items-center space-x-2 text-accent text-sm font-medium">
                    <span>Fill out</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 rounded-xl text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No feedback forms available
            </h3>
            <p className="text-text-secondary">
              {user?.role === 'admin' 
                ? 'No forms are currently assigned to admins. Check the feedback management page to create or assign forms.'
                : 'Check back later for feedback opportunities.'
              }
            </p>
            {user?.role === 'admin' && (
              <button 
                onClick={() => window.location.href = '/admin/feedback'}
                className="btn-modern mt-4"
              >
                Manage Forms
              </button>
            )}
          </div>
        )}

        {/* Feedback Tips */}
        <div className="glass-card p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            💡 Feedback Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                <div>
                  <p className="text-text-primary font-medium">Be Specific</p>
                  <p className="text-text-secondary text-sm">
                    Provide detailed examples to help us understand your experience better.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                <div>
                  <p className="text-text-primary font-medium">Be Honest</p>
                  <p className="text-text-secondary text-sm">
                    Your honest feedback helps us improve the onboarding process.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                <div>
                  <p className="text-text-primary font-medium">Suggest Improvements</p>
                  <p className="text-text-secondary text-sm">
                    Share ideas on how we can make things better for future employees.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                <div>
                  <p className="text-text-primary font-medium">Regular Updates</p>
                  <p className="text-text-secondary text-sm">
                    Check back regularly for new feedback opportunities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={handleModalClose}
        title={selectedForm?.title}
        size="lg"
      >
        {selectedForm && (
          <div className="space-y-6">
            <p className="text-text-secondary">{selectedForm.description}</p>

            <div className="space-y-4">
              {selectedForm.fields.map((field, index) => {
                // Create a unique field identifier
                const fieldKey = field.id || `field_${index}`;
                const inputId = `${selectedForm.id}_${fieldKey}`;
                
                return (
                  <div key={fieldKey}>
                    <label htmlFor={inputId} className="block text-text-primary font-medium mb-2">
                      {field.label}
                      {field.required && <span className="text-danger ml-1">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        id={inputId}
                        name={inputId}
                        value={formResponses[fieldKey] || ''}
                        onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                        className="modern-input resize-none"
                        rows={4}
                        placeholder={`Enter your ${field.label.toLowerCase()}...`}
                        autoComplete="off"
                      />
                    ) : field.type === 'select' || field.type === 'radio' ? (
                      <select
                        id={inputId}
                        name={inputId}
                        value={formResponses[fieldKey] || ''}
                        onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                        className="modern-input"
                        autoComplete="off"
                      >
                        <option value="">Select an option...</option>
                        {field.options?.map((option, optionIndex) => (
                          <option key={`${fieldKey}_option_${optionIndex}`} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={inputId}
                        name={inputId}
                        type="text"
                        value={formResponses[fieldKey] || ''}
                        onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                        className="modern-input"
                        placeholder={`Enter your ${field.label.toLowerCase()}...`}
                        autoComplete="off"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-accent/20">
              <button
                onClick={handleModalClose}
                className="px-6 py-3 rounded-lg border border-accent/30 text-text-secondary hover:text-text-primary hover:border-accent/50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitForm}
                disabled={!isFormValid() || submitting}
                className={`btn-modern ${
                  !isFormValid() || submitting
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default FeedbackPage;