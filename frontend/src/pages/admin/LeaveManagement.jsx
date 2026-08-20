import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import PageWrapper from '../../components/layout/PageWrapper';

const LeaveManagement = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaves = async () => {
        try {
            const response = await apiClient.get('/api/v1/leaves/');
            setLeaves(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch leaves", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleAction = async (id, newStatus) => {
        try {
            await apiClient.put(`/api/v1/leaves/${id}/status`, { status: newStatus });
            // Update local state without full reload
            setLeaves(leaves.map(leave => leave.id === id ? { ...leave, status: newStatus } : leave));
        } catch (error) {
            alert('Failed to update leave status.');
        }
    };

    const getStatusBadge = (leaveStatus) => {
        switch (leaveStatus) {
            case 'approved': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Approved</span>;
            case 'rejected': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Rejected</span>;
            default: return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Pending</span>;
        }
    };

    // Helper to format YYYY-MM-DD to DD/MM/YYYY
    const formatToDDMMYYYY = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-'); 
        return `${day}/${month}/${year}`;
    };

    return (
        <PageWrapper title="Manage Leaves">
            <div className="w-full mx-auto">
                <div className="flex items-center justify-between mb-8 px-2">
                    <h1 className="text-2xl font-bold text-prime-text tracking-tight">Leave Management</h1>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-prime-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Employee</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Dates</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Reason</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-sm text-gray-500">Loading...</td></tr>
                                ) : leaves.length > 0 ? (
                                    leaves.map(leave => (
                                        <tr key={leave.id} className="hover:bg-gray-50/50">
                                            <td className="p-4">
                                                <div className="font-semibold text-gray-800">{leave.profiles?.full_name || 'Unknown User'}</div>
                                                <div className="text-xs text-gray-500">{leave.profiles?.email}</div>
                                                <div className="text-xs text-gray-400 mt-1">Applied: {new Date(leave.created_at).toLocaleDateString('en-GB')}</div>
                                            </td>
                                            <td className="p-4 text-sm font-semibold text-gray-800 whitespace-nowrap">
                                                {formatToDDMMYYYY(leave.start_date)} <br/><span className="text-gray-400 font-normal text-xs">to</span> {formatToDDMMYYYY(leave.end_date)}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 max-w-xs">{leave.reason}</td>
                                            <td className="p-4">{getStatusBadge(leave.status)}</td>
                                            <td className="p-4 text-right whitespace-nowrap">
                                                {leave.status === 'pending' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleAction(leave.id, 'approved')} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-full transition-colors" title="Approve">
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                        </button>
                                                        <button onClick={() => handleAction(leave.id, 'rejected')} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition-colors" title="Reject">
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Processed</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="5" className="p-8 text-center text-sm text-gray-500">No leave requests found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default LeaveManagement;