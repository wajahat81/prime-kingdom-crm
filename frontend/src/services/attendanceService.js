import apiClient from './apiClient';
import { API_ROUTES } from '../utils/constants';

export const checkAttendanceStatus = async () => {
    const response = await apiClient.get(API_ROUTES.ATTENDANCE_STATUS);
    return response.data;
};

export const submitCheckIn = async () => {
    const response = await apiClient.post(API_ROUTES.ATTENDANCE_CHECKIN);
    return response.data;
};

export const submitCheckOut = async () => {
    const response = await apiClient.post('/api/v1/attendance/check-out');
    return response.data;
};

export const getAttendanceHistory = async (params) => {
    const response = await apiClient.get('/api/v1/attendance/history', { params });
    return response.data;
};