import apiClient from './apiClient';
import { API_ROUTES } from '../utils/constants';

export const login = async (email, password) => {
    // OAuth2PasswordRequestForm expects 'username' field
    const formData = new FormData();
    formData.append('username', email);  // ✅ Use 'username' not 'email'
    formData.append('password', password);
    
    const response = await apiClient.post(API_ROUTES.LOGIN, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',  // ✅ Required for OAuth2 form
        }
    });
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