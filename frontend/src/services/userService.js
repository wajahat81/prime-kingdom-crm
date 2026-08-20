import apiClient from './apiClient';

// Fetch all users for the management table
export const getUsers = async () => {
    try {
        const response = await apiClient.get('/api/v1/users/');
        return response.data;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

// The new Trusted Device API Call
export const trustDeviceForUser = async (profileId) => {
    try {
        const response = await apiClient.post(`/api/v1/users/${profileId}/trust-device`);
        
        // Automatically save the token into the browser's memory!
        const generatedToken = response.data.device_token;
        localStorage.setItem('trusted_device_token', generatedToken);
        
        return { success: true, message: 'Device trusted successfully!' };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.detail || 'Failed to trust device' 
        };
    }
};