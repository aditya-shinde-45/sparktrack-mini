import API_BASE_URL from './config';

// Test API connection
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};