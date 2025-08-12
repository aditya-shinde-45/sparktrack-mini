const API_BASE_URL = 'https://sparktrack-mini.onrender.com';

export const testAPI = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/test`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API Test Failed:', error);
    throw error;
  }
};