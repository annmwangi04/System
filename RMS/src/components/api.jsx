import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from './config';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token with every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.authToken);
    if (token) {
      config.headers.Authorization = `Token ${token}`; // Change 'Bearer' to 'Token'
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors globally
    if (error.response && error.response.status === 401) {
      // Clear auth data
      localStorage.removeItem(STORAGE_KEYS.authToken);
      localStorage.removeItem(STORAGE_KEYS.userRole);
      localStorage.removeItem(STORAGE_KEYS.userInfo);
      
      // Redirect to login page
      // We use window.location instead of navigate because this might be called outside of a React component
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Common API request methods
const apiService = {
  // GET request
  get: async (endpoint) => {
    try {
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error(`GET request to ${endpoint} failed:`, error);
      throw error;
    }
  },
  
  // POST request
  post: async (endpoint, data) => {
    try {
      const response = await api.post(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`POST request to ${endpoint} failed:`, error);
      throw error;
    }
  },
  
  // PUT request
  put: async (endpoint, data) => {
    try {
      const response = await api.put(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`PUT request to ${endpoint} failed:`, error);
      throw error;
    }
  },
  
  // PATCH request
  patch: async (endpoint, data) => {
    try {
      const response = await api.patch(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`PATCH request to ${endpoint} failed:`, error);
      throw error;
    }
  },
  
  // DELETE request
  delete: async (endpoint) => {
    try {
      const response = await api.delete(endpoint);
      return response.data;
    } catch (error) {
      console.error(`DELETE request to ${endpoint} failed:`, error);
      throw error;
    }
  },
  
  // File upload
  uploadFile: async (endpoint, file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress
      });
      return response.data;
    } catch (error) {
      console.error(`File upload to ${endpoint} failed:`, error);
      throw error;
    }
  }
};

export default apiService;