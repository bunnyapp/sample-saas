/**
 * API Configuration
 *
 * This file handles the configuration of the API server URL.
 * In development, it defaults to localhost:3051.
 * In production, it uses the REACT_APP_API_URL environment variable.
 */

const getApiUrl = (): string => {
  // In production, use the environment variable
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'http://localhost:3051';
  }

  // In development, use localhost by default
  return process.env.REACT_APP_API_URL || 'http://localhost:3051';
};

export const API_URL = getApiUrl();

// Helper function to create axios instance with proper configuration
export const createApiClient = (token?: string) => {
  const axios = require('axios');
  return axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
};
