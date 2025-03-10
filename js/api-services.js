/**
 * API Service for ML March
 * Handles all communication with the Streamlit backend
 */

import API_CONFIG from './config.js';

// Get API URL from config
const API_BASE_URL = API_CONFIG.STREAMLIT_API_URL;

/**
 * Helper function to make API requests to the Streamlit backend
 * @param {string} path - API endpoint path
 * @param {string} method - HTTP method (GET, POST, DELETE)
 * @param {Object} data - Optional data to send with the request
 * @returns {Promise} - Promise that resolves with the API response
 */
async function apiRequest(path, method = 'GET', data = null) {
  let url = new URL(API_BASE_URL);
  
  // Set path and method as query parameters for Streamlit to parse
  url.searchParams.append('path', path);
  url.searchParams.append('method', method);
  
  // For POST and DELETE requests with data, add it as a query parameter
  if (data && (method === 'POST' || method === 'DELETE')) {
    url.searchParams.append('data', JSON.stringify(data));
  }
  
  try {
    console.log(`Making ${method} request to ${path}`, data ? 'with data' : '');
    const response = await fetch(url);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'API request failed');
    }
    
    return result;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * User-related API functions
 */
export const userAPI = {
  /**
   * Get a user by email
   * @param {string} email - User's email
   * @returns {Promise} - Promise that resolves with user data
   */
  async getUser(email) {
    return apiRequest(`/api/users/${email}`);
  },
  
  /**
   * Create or update a user
   * @param {Object} userData - User data to save
   * @returns {Promise} - Promise that resolves with the result
   */
  async saveUser(userData) {
    return apiRequest('/api/users', 'POST', userData);
  },
  
  /**
   * Sync Firebase user data with the Streamlit backend
   * @param {Object} firebaseUserData - User data from Firebase
   * @returns {Promise} - Promise that resolves with the synced user data
   */
  async syncUser(firebaseUserData) {
    console.log("Syncing user data with backend:", firebaseUserData);
    
    // First check if user exists
    try {
      const user = await this.getUser(firebaseUserData.email);
      console.log("User found in backend:", user);
      
      // Update with latest Firebase data
      const updatedData = await this.saveUser({
        ...user,
        ...firebaseUserData
      });
      
      return updatedData;
    } catch (error) {
      // User doesn't exist yet, create new
      if (error.message && error.message.includes('not found')) {
        console.log("Creating new user in backend");
        return this.saveUser(firebaseUserData);
      }
      throw error;
    }
  }
};

/**
 * Session-related API functions
 */
export const sessionAPI = {
  /**
   * Get all sessions
   * @returns {Promise} - Promise that resolves with array of sessions
   */
  async getAllSessions() {
    return apiRequest('/api/sessions');
  },
  
  /**
   * Get a specific session by ID
   * @param {string} sessionId - Session ID
   * @returns {Promise} - Promise that resolves with session data
   */
  async getSession(sessionId) {
    return apiRequest(`/api/sessions/${sessionId}`);
  },
  
  /**
   * Get all sessions registered by a user
   * @param {string} email - User's email
   * @returns {Promise} - Promise that resolves with array of user's sessions
   */
  async getUserSessions(email) {
    return apiRequest(`/api/user-sessions/${email}`);
  },
  
  /**
   * Register a user for a session
   * @param {string} email - User's email
   * @param {string} sessionId - Session ID
   * @returns {Promise} - Promise that resolves with the result
   */
  async registerForSession(email, sessionId) {
    return apiRequest('/api/register', 'POST', { email, session_id: sessionId });
  },
  
  /**
   * Unregister a user from a session
   * @param {string} email - User's email
   * @param {string} sessionId - Session ID
   * @returns {Promise} - Promise that resolves with the result
   */
  async unregisterFromSession(email, sessionId) {
    return apiRequest('/api/register', 'DELETE', { email, session_id: sessionId });
  }
};

export default {
  user: userAPI,
  session: sessionAPI
};