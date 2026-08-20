import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginService } from '../services/authService';
import { ROLES } from '../utils/constants';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null); // Kept as a dummy value so it doesn't break other components
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // We no longer check for a stored token, only the stored user object!
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

    const login = async (email, password) => {
        try {
            const response = await loginService(email, password);
            
            // SECURITY UPDATE: We now check for response.user instead of response.access_token
            if (response.user) {
                const userData = response.user;
                
                setToken('cookie-managed');
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Note: We no longer set 'access_token' in localStorage because the browser handles the cookie!
                
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