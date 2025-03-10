/**
 * Configuration Settings for ML March
 * 
 * This file loads environment variables or defaults for the application.
 * In a real production environment, these would be loaded from .env file
 * or provided by the hosting platform.
 */

// For simplicity in this demo, we're defining the API URL directly
// In production, this would come from environment variables
const API_CONFIG = {
    // Default to the Streamlit Cloud URL (update when deployed)
    STREAMLIT_API_URL: 'https://your-streamlit-app-url.streamlit.app',
    
    // For local development, uncomment this line:
    // STREAMLIT_API_URL: 'http://localhost:8501',
};

export default API_CONFIG;