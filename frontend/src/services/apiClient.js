import axios from 'axios';

const apiClient = axios.create({
    // 🚨 FIX: Updated to match your exact environment variable name
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    withCredentials: true, 
});

// --- AUTOMATIC SESSION EXPIRY INTERCEPTOR ---
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalUrl = error.config?.url || '';

        // Bypass login and auth routes entirely so login errors don't trigger a redirect
        if (originalUrl.includes('login') || originalUrl.includes('token') || originalUrl.includes('auth')) {
            return Promise.reject(error);
        }

        // If we get a 401 on a protected route, the cookie has expired or is invalid
        if (error.response && error.response.status === 401) {
            console.error("401 Unauthorized detected on route:", originalUrl);
            
            // Clear the local user data since the session is dead
            localStorage.removeItem('user');
            
            // Force redirect to login if not already there
            if (window.location.pathname !== '/login') {
                window.location.href = '/login?expired=true';
            }
        }
        
        return Promise.reject(error);
    }
);

export default apiClient;