import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';
import { jwtDecode } from 'jwt-decode';

const safeDecodeToken = (token) => {
  try {
    return jwtDecode(token);
  } catch (error) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (fallbackError) {
      console.error('Failed to decode JWT token', { error, fallbackError });
      return { error: 'Could not decode token' };
    }
  }
};

const TokenDebugger = () => {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token') || localStorage.getItem('student_token');

  useEffect(() => {
    if (token) {
      const decoded = safeDecodeToken(token);

      if (decoded?.error) {
        setTokenInfo(decoded);
        return;
      }

      const hasExp = typeof decoded?.exp === 'number';
      const hasIat = typeof decoded?.iat === 'number';

      setTokenInfo({
        ...decoded,
        expiresAt: hasExp ? new Date(decoded.exp * 1000).toLocaleString() : 'N/A',
        issuedAt: hasIat ? new Date(decoded.iat * 1000).toLocaleString() : 'N/A',
        isExpired: hasExp ? decoded.exp < Date.now() / 1000 : false
      });
    }
  }, [token]);

  const validateToken = async () => {
    setLoading(true);
    try {
      const result = await apiRequest('/api/auth/validate', 'POST', { token });
      setApiResponse(result);
    } catch (error) {
      setApiResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async () => {
    setLoading(true);
    try {
      const result = await apiRequest('/api/auth/me', 'GET');
      setApiResponse(result);
    } catch (error) {
      setApiResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Token Debugger</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Stored Token</h2>
        {token ? (
          <div>
            <div className="bg-gray-100 p-3 rounded mb-4 overflow-auto">
              <code className="text-sm break-all">{token}</code>
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Decoded Token</h3>
            {tokenInfo && (
              <div className="bg-gray-100 p-3 rounded overflow-auto">
                <pre className="text-sm">
                  {JSON.stringify(tokenInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="text-red-500">No token found in localStorage</div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Authentication</h2>
        <div className="flex space-x-4 mb-4">
          <button
            onClick={validateToken}
            disabled={loading || !token}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Validate Token
          </button>
          <button
            onClick={getCurrentUser}
            disabled={loading || !token}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Get Current User
          </button>
        </div>

        {loading && <div className="animate-pulse">Loading...</div>}
        
        {apiResponse && (
          <div className="bg-gray-100 p-3 rounded overflow-auto">
            <pre className="text-sm">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenDebugger;