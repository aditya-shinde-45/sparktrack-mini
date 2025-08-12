const API_BASE_URL = 'https://sparktrack-mini.onrender.com';

export const testAPI = async () => {
  try {
    // Test GET endpoint
    const getResponse = await fetch(`${API_BASE_URL}/test`);
    if (!getResponse.ok) throw new Error(`GET failed: ${getResponse.status}`);
    
    // Test POST endpoint
    const postResponse = await fetch(`${API_BASE_URL}/api/test-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });
    if (!postResponse.ok) throw new Error(`POST failed: ${postResponse.status}`);
    
    return await getResponse.json();
  } catch (error) {
    console.error('API Test Failed:', error);
    throw error;
  }
};