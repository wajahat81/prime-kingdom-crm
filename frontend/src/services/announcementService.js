import apiClient from './apiClient';
import { API_ROUTES } from '../utils/constants';

export const getActiveAnnouncement = async () => {
    const response = await apiClient.get(API_ROUTES.ANNOUNCEMENTS_ACTIVE);
    return response.data;
};

export const broadcastAnnouncement = async (message) => {
    const response = await apiClient.post(API_ROUTES.ANNOUNCEMENTS || '/api/v1/announcements/', { message });
    return response.data;
};

export const getAllAnnouncements = async () => {
    const response = await apiClient.get(API_ROUTES.ANNOUNCEMENTS || '/api/v1/announcements/');
    return response.data;
};

export const deleteAnnouncement = async (announcementId) => {
    const response = await apiClient.delete(`${API_ROUTES.ANNOUNCEMENTS || '/api/v1/announcements/'}${announcementId}`);
    return response.data;
};