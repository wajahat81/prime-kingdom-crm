import apiClient from './apiClient';
import { API_ROUTES } from '../utils/constants';

export const getMyCalls = async () => {
    const response = await apiClient.get(API_ROUTES.CALLS_ME);
    return response.data.data || response.data;
};

export const uploadCallLog = async (callData) => {
    const response = await apiClient.post(API_ROUTES.CALLS, callData);
    return response.data;
};

export const getAllCalls = async () => {
    const response = await apiClient.get(API_ROUTES.CALLS);
    return response.data.data || response.data;
};

export const getCallById = async (callId) => {
    const response = await apiClient.get(`${API_ROUTES.CALLS}${callId}`);
    return response.data;
};

export const updateCall = async (callId, callData) => {
    const response = await apiClient.put(`${API_ROUTES.CALLS}${callId}`, callData);
    return response.data;
};

export const deleteCall = async (callId) => {
    const response = await apiClient.delete(`${API_ROUTES.CALLS}${callId}`);
    return response.data;
};