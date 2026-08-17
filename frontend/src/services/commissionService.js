import apiClient from './apiClient';
import { API_ROUTES } from '../utils/constants';

export const processCommission = async (commissionData) => {
    const response = await apiClient.post(API_ROUTES.COMMISSIONS, commissionData);
    return response.data;
};

export const getMyCommissions = async () => {
    const response = await apiClient.get(`${API_ROUTES.COMMISSIONS}me`);
    return response.data;
};

export const getAllCommissions = async (params) => {
    const response = await apiClient.get(API_ROUTES.COMMISSIONS, { params });
    return response.data;
};

export const getCommissionById = async (commissionId) => {
    const response = await apiClient.get(`${API_ROUTES.COMMISSIONS}${commissionId}`);
    return response.data;
};

export const updateCommission = async (commissionId, commissionData) => {
    const response = await apiClient.put(`${API_ROUTES.COMMISSIONS}${commissionId}`, commissionData);
    return response.data;
};