import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginService, logout as logoutService } from '../services/authService';
import { ROLES } from '../utils/constants';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsedUser);
                console.log('Restored user from storage:', parsedUser);
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await loginService(email, password);
            console.log('Login response:', response);
            
            if (response.access_token) {
                // Use the user data from the backend response
                // The backend should return user data with the token
                let userData;
                
                if (response.user) {
                    // If backend returns user object
                    userData = response.user;
                } else {
                    // If backend only returns token, we need to fetch user data
                    // For now, try to get role from the token or response
                    userData = {
                        id: response.id || 'unknown',
                        email: email,
                        role: response.role || ROLES.EMPLOYEE,
                        full_name: response.full_name || response.name || email.split('@')[0]
                    };
                }
                
                console.log('Setting user data:', userData);
                
                setToken(response.access_token);
                setUser(userData);
                localStorage.setItem('access_token', response.access_token);
                localStorage.setItem('user', JSON.stringify(userData));
                
                return { success: true, data: response };
            }
            return { 
                success: false, 
                error: response.detail || 'Invalid credentials' 
            };
        } catch (error) {
            console.error('Login error:', error);
            
            let errorMessage = 'Login failed. Please try again.';
            if (error.response?.data) {
                const data = error.response.data;
                if (typeof data === 'string') {
                    errorMessage = data;
                } else if (data.detail) {
                    errorMessage = typeof data.detail === 'string' 
                        ? data.detail 
                        : JSON.stringify(data.detail);
                } else if (data.message) {
                    errorMessage = data.message;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            return { 
                success: false, 
                error: errorMessage
            };
        }
    };

    const logout = async () => {
        try {
            await logoutService();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setToken(null);
            setUser(null);
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
        }
    };

    const value = {
        user,
        token,
        login,
        logout,
        loading,
        isAuthenticated: !!user && !!token,
        userRole: user?.role,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};