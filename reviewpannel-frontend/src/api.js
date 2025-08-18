// src/utils/api.js
const API_BASE_URL =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_API_BASE_URL
    : import.meta.env.VITE_API_BASE_URL_PROD;

export const apiRequest = async (endpoint, method = "GET", body = null, token = null) => {
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, options);

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok || data.success === false) {
      // ✅ Instead of throwing only Error, return full response
      return {
        success: false,
        message: data?.message || "API request failed",
      };
    }

    return data;
  } catch (error) {
    console.error("API Error:", error.message);
    return {
      success: false,
      message: error.message || "Network error",
    };
  }
};
