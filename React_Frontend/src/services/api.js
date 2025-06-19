import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock user for authentication (in real app, this would be from login)
const MOCK_USER = 'netrunnerX';

// Add auth header to all requests
api.interceptors.request.use((config) => {
  config.headers['Authorization'] = `Bearer ${MOCK_USER}`;
  return config;
});

// API endpoints
export const disasterAPI = {
  // Get all disasters
  getAll: (params = {}) => api.get('/disasters', { params }),
  
  // Get specific disaster
  getById: (id) => api.get(`/disasters/${id}`),
  
  // Create new disaster
  create: (data) => api.post('/disasters', data),
  
  // Update disaster
  update: (id, data) => api.put(`/disasters/${id}`, data),
  
  // Delete disaster
  delete: (id) => api.delete(`/disasters/${id}`),
  
  // Get reports for disaster
  getReports: (id, params = {}) => api.get(`/disasters/${id}/reports`, { params }),
};

export const socialMediaAPI = {
  // Get social media reports for disaster
  getReports: (disasterId, keywords = []) => 
    api.get(`/social-media/disasters/${disasterId}/social-media`, { 
      params: { keywords: keywords.join(',') } 
    }),
};

export const resourcesAPI = {
  // Get resources for disaster
  getResources: (disasterId, params = {}) => 
    api.get(`/resources/disasters/${disasterId}/resources`, { params }),
};

export const updatesAPI = {
  // Get official updates for disaster
  getUpdates: (disasterId) => 
    api.get(`/updates/disasters/${disasterId}/official-updates`),
};

export const verificationAPI = {
  // Verify image
  verifyImage: (disasterId, imageUrl) => 
    api.post(`/verification/verify-image`, { image_url: imageUrl }),
};

export const geocodingAPI = {
  // Geocode location
  geocode: (location) => api.get(`/geocode/${encodeURIComponent(location)}`),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api; 