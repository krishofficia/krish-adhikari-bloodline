// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create a configured fetch function
export const apiFetch = (endpoint, options = {}) => {
  const url = endpoint.startsWith('/') 
    ? `${API_BASE_URL}${endpoint}`
    : `${API_BASE_URL}/${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log('🔗 API Request:', url, config.method || 'GET');
  
  return fetch(url, config);
};

// Export the base URL for reference
export { API_BASE_URL };
