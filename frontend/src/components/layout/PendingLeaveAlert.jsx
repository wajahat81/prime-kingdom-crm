import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

const PendingLeaveAlert = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [pendingCount, setPendingCount] = useState(0);

    // Only run for admins or super admins
    const isAdminOrSuper = user?.role === 'admin' || user?.role === 'super_admin';

    useEffect(() => {
        if (!isAdminOrSuper) return;

        const fetchPendingLeaves = async () => {
            try {
                const response = await apiClient.get('/api/v1/leaves/');
                const allLeaves = response.data.data || response.data || [];
                // Count how many are pending
                const pending = allLeaves.filter(leave => leave.status === 'pending');
                setPendingCount(pending.length);
            } catch (error) {
                console.error("Failed to fetch leave requests for notification", error);
            }
        };

        fetchPendingLeaves();

        // Optional: Poll every 60 seconds to check for new leave requests automatically
        const interval = setInterval(fetchPendingLeaves, 60000);
        return () => clearInterval(interval);
    }, [isAdminOrSuper, user]);

    if (!isAdminOrSuper || pendingCount === 0) return null;

    return (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-2xl shadow-sm flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold">
                    ⚠️
                </div>
                <div>
                    <p className="text-sm font-bold text-amber-800">
                        {pendingCount} Pending Leave Request{pendingCount > 1 ? 's' : ''} Requires Attention
                    </p>
                    <p className="text-xs text-amber-700">
                        Employees have submitted time-off requests that need your review.
                    </p>
                </div>
            </div>
            <button
                onClick={() => navigate('/admin/leaves')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-full transition-colors uppercase tracking-wider shadow-sm"
            >
                Review Leaves
            </button>
        </div>
    );
};

export default PendingLeaveAlert;