import API_BASE_URL from './config';

// Test API connection
export const testConnection = async () => {
  const response = await fetch(`${API_BASE_URL}/db-test`);
  return response.json();
};

// Health check
export const healthCheck = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
};