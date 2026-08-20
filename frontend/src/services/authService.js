import apiClient from './apiClient';
import { API_ROUTES } from '../utils/constants';

export const login = async (email, password) => {
    // Check if this computer has a hardware token stored
    const deviceToken = localStorage.getItem('trusted_device_token');
    
    // Send the token securely in the headers
    const response = await apiClient.post('/api/v1/auth/login', 
        { username: email, password: password }, 
        { 
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Device-Token': deviceToken || '' // Send it if it exists
            } 
        }
    );
    return response.data;
};

export const registerUser = async (userData) => {
    const response = await apiClient.post(API_ROUTES.REGISTER || '/api/v1/auth/register', userData);
    return response.data;
};

export const logout = async () => {
    try {
        const response = await apiClient.post(API_ROUTES.LOGOUT || '/api/v1/auth/logout');
        return response.data;
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    } finally {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
    }
};

export const getCurrentUser = async () => {
    const response = await apiClient.get(API_ROUTES.ME || '/api/v1/auth/me');
    return response.data;
};