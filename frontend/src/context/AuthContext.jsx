import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginService } from '../services/authService';
import apiClient from '../services/apiClient'; // Ensure apiClient is imported for the refresh endpoint
import { ROLES } from '../utils/constants';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setToken('cookie-managed'); 
                setUser(parsedUser);
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);
    
    // NEW EFFECT: Silent Session Refresh
    useEffect(() => {
        if (!user) return; // Only run if a user is actively logged in

        // Ping the refresh endpoint every 4 hours (14,400,000 milliseconds)
        const refreshInterval = setInterval(async () => {
            try {
                await apiClient.post('/api/v1/auth/refresh');
                console.log('Session silently extended');
            } catch (error) {
                console.error('Session refresh failed. Token might be expired.', error);
                // If the refresh fails (e.g., server restarted, cookie manually deleted), log them out
                logout(); 
            }
        }, 14400000);

        // Cleanup the interval when the component unmounts or user logs out
        return () => clearInterval(refreshInterval);
    }, [user]);

    const login = async (email, password) => {
        try {
            const response = await loginService(email, password);
            
            if (response.user) {
                const userData = response.user;
                
                setToken('cookie-managed');
                setUser(userData);
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

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('user');
        
        // Optional: Ping a backend logout endpoint here if you want to explicitly invalidate the cookie on the server side
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