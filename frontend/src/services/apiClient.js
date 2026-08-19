import axios from 'axios';

// Public VITE keys are safe; private API keys stay on the backend
const apiClient = axios.create({
    baseURL: 'http://192.168.18.76:8000', 
    headers: {
        'Content-Type': 'application/json'
    }
});

// Automatically inject JWT token for server-side auth
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default apiClient;