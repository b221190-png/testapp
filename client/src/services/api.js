import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.patch('/auth/profile', userData);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.patch('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/auth/stats');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

// Interview API
export const interviewAPI = {
  create: async (interviewData) => {
    const response = await api.post('/interviews', interviewData);
    return response.data;
  },

  getByInterviewer: async (email, params = {}) => {
    const response = await api.get(`/interviews/interviewer/${email}`, { params });
    return response.data;
  },

  getByLink: async (interviewLink) => {
    const response = await api.get(`/interviews/link/${interviewLink}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/interviews/${id}`);
    return response.data;
  },

  start: async (id) => {
    const response = await api.patch(`/interviews/${id}/start`);
    return response.data;
  },

  end: async (id, notes = '') => {
    const response = await api.patch(`/interviews/${id}/end`, { notes });
    return response.data;
  },

  updateSettings: async (id, settings) => {
    const response = await api.patch(`/interviews/${id}/settings`, { settings });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/interviews/${id}`);
    return response.data;
  },

  getStats: async (id) => {
    const response = await api.get(`/interviews/${id}/stats`);
    return response.data;
  }
};

// Events API
export const eventsAPI = {
  log: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  logBulk: async (events) => {
    const response = await api.post('/events/bulk', { events });
    return response.data;
  },

  getByInterview: async (interviewId, params = {}) => {
    const response = await api.get(`/events/interview/${interviewId}`, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  resolve: async (id, resolvedBy, notes = '') => {
    const response = await api.patch(`/events/${id}/resolve`, { resolvedBy, notes });
    return response.data;
  },

  getCritical: async (interviewId) => {
    const response = await api.get(`/events/interview/${interviewId}/critical`);
    return response.data;
  },

  getStats: async (interviewId) => {
    const response = await api.get(`/events/interview/${interviewId}/stats`);
    return response.data;
  },

  getTimeline: async (interviewId, startTime, endTime) => {
    const response = await api.get(`/events/interview/${interviewId}/timeline`, {
      params: { startTime, endTime }
    });
    return response.data;
  },

  cleanup: async (olderThanDays = 30) => {
    const response = await api.delete('/events/cleanup', {
      params: { olderThanDays }
    });
    return response.data;
  }
};

// Reports API
export const reportsAPI = {
  generatePDF: async (interviewId) => {
    const response = await api.get(`/reports/interview/${interviewId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  generateCSV: async (interviewId) => {
    const response = await api.get(`/reports/interview/${interviewId}/csv`, {
      responseType: 'blob'
    });
    return response.data;
  },

  getSummary: async (interviewId) => {
    const response = await api.get(`/reports/interview/${interviewId}/summary`);
    return response.data;
  },

  generateBatch: async (interviewIds, format = 'csv') => {
    const response = await api.post('/reports/batch', {
      interviewIds,
      format
    }, {
      responseType: 'blob'
    });
    return response.data;
  }
};

// Utility functions
export const apiUtils = {
  // Download blob as file
  downloadBlob: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Handle API errors
  handleError: (error) => {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
      return {
        message,
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'Network error - please check your connection',
        status: 0,
        data: null
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'An unexpected error occurred',
        status: -1,
        data: null
      };
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    return !!(token && userData);
  },

  // Get user data from storage
  getUserData: () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  // Set auth data
  setAuthData: (token, userData) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
  },

  // Clear auth data
  clearAuthData: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw apiUtils.handleError(error);
    }
  }
};

export default api;
