const API_BASE_URL = 'https://edunutshell-backend.onrender.com';

const getAuthHeaders = () => {
  // Only access localStorage on client side
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Enhanced error message handling
const getErrorMessage = (error: any, defaultMessage: string = 'An error occurred') => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return defaultMessage;
};

// Generic API call utility
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const config: RequestInit = {
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle non-JSON responses (like HTML error pages)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { 
        success: false, 
        error: `Server error (${response.status}): Invalid response format` 
      };
    }
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { 
        success: false, 
        error: getErrorMessage(data, `Request failed (${response.status})`), 
        data 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: getErrorMessage(error, 'Network connection failed') 
    };
  }
};

// Authentication APIs
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.message || 'Login failed' };
    }
  },

  signup: async (userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: 'admin' | 'user';
    startDate: string;
  }) => {
    return apiCall('/api/users/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        phone: userData.phone,
        startDate: userData.startDate,
      }),
    });
  },
};

// User Management APIs
export const userAPI = {
  getAllUsers: async (params?: {
    role?: 'admin' | 'user';
    status?: 'active' | 'inactive' | 'pending';
    limit?: number;
    page?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/api/users${queryString ? `?${queryString}` : ''}`;
    
    return apiCall(endpoint);
  },

  getUser: async (userId: string) => {
    return apiCall(`/api/users/${userId}`);
  },

  updateUser: async (userId: string, userData: {
    name?: string;
    email?: string;
    phone?: string;
    startDate?: string;
  }) => {
    return apiCall(`/api/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },
};

// Task Management APIs
export const taskAPI = {
  getUserTasks: async (userId: string, params?: {
    status?: 'pending' | 'in-progress' | 'completed';
    type?: string;
    limit?: number;
    sort?: 'dueDate' | 'createdAt' | 'title';
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    
    const queryString = queryParams.toString();
    const endpoint = `/api/tasks/${userId}${queryString ? `?${queryString}` : ''}`;
    
    return apiCall(endpoint);
  },

  getAllTasks: async (params?: {
    assignedTo?: string;
    status?: 'pending' | 'in-progress' | 'completed';
    type?: string;
    limit?: number;
    page?: number;
    sort?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.assignedTo) queryParams.append('assignedTo', params.assignedTo);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    
    const queryString = queryParams.toString();
    // Use the correct endpoint that exists on the server
    const endpoint = `/api/tasks/all${queryString ? `?${queryString}` : ''}`;
    
    return apiCall(endpoint);
  },

  createTask: async (taskData: {
    title: string;
    description: string;
    assignedTo: string[];
    dueDate: string;
    picture?: string;
  }) => {
    return apiCall('/api/tasks/create', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  updateTaskStatus: async (taskId: string, status: 'pending' | 'in-progress' | 'completed') => {
    return apiCall(`/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Resource Management APIs
export const resourceAPI = {
  getAllResources: async (params?: {
    language?: string;
    visibleTo?: 'user' | 'admin';
    limit?: number;
    sort?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.language) queryParams.append('language', params.language);
    if (params?.visibleTo) queryParams.append('visibleTo', params.visibleTo);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    
    const queryString = queryParams.toString();
    const endpoint = `/api/resources${queryString ? `?${queryString}` : ''}`;
    
    return apiCall(endpoint);
  },

  uploadResource: async (resourceData: {
    title: string;
    description: string;
    fileUrl: string;
    visibleTo: string[];
    language?: string;
  }) => {
    return apiCall('/api/resources/upload', {
      method: 'POST',
      body: JSON.stringify(resourceData),
    });
  },

  deleteResource: async (resourceId: string) => {
    // Try the documented endpoint first, fallback to alternative if needed
    return apiCall(`/api/resources/${resourceId}`, {
      method: 'DELETE',
    });
  },
};

// Feedback Form APIs
export const formAPI = {
  getAllForms: async (params?: {
    assignedTo?: 'user' | 'admin' | 'both';
    active?: boolean;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.assignedTo) queryParams.append('assignedTo', params.assignedTo);
    if (params?.active !== undefined) queryParams.append('active', params.active.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/api/forms${queryString ? `?${queryString}` : ''}`;
    
    return apiCall(endpoint);
  },

  createForm: async (formData: {
    title: string;
    description: string;
    assignedTo: 'user' | 'admin' | 'both';
    fields: Array<{
      label: string;
      type: 'text' | 'radio';
      options?: string[];
      required?: boolean;
    }>;
  }) => {
    return apiCall('/api/forms/create', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  submitForm: async (formId: string, answers: Array<{
    fieldId: string;
    answer: string;
  }>) => {
    return apiCall(`/api/forms/${formId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  getFormResponses: async (formId: string, params?: {
    userId?: string;
    limit?: number;
    sort?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    
    const queryString = queryParams.toString();
    const endpoint = `/api/forms/${formId}/responses${queryString ? `?${queryString}` : ''}`;
    
    return apiCall(endpoint);
  },
};