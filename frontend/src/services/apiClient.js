import axios from 'axios';

// Public VITE keys are safe; private API keys stay on the backend
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true, // CRITICAL: This tells the browser to send HttpOnly cookies cross-subdomain!
    headers: {
        'Content-Type': 'application/json'
    }
});

// We no longer need the interceptor because the browser handles the HttpOnly cookie automatically!

export default apiClient;