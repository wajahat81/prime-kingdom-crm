import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import PageWrapper from '../../components/layout/PageWrapper';

const LeaveRequest = () => {
    const [leaves, setLeaves] = useState([]);
    const [formData, setFormData] = useState({ start_date: '', end_date: '', reason: '' });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });
        
        if (new Date(formData.end_date) < new Date(formData.start_date)) {
            return setStatus({ type: 'error', message: 'End date cannot be before start date.' });
        }

        setIsSubmitting(true);
        try {
            await apiClient.post('/api/v1/leaves/', formData);
            setStatus({ type: 'success', message: 'Leave request submitted successfully!' });
            setFormData({ start_date: '', end_date: '', reason: '' });
            fetchLeaves(); // Refresh the list
        } catch (error) {
            setStatus({ type: 'error', message: 'Failed to submit leave request.' });
        } finally {
            setIsSubmitting(false);
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
        <PageWrapper title="Leave Requests">
            <div className="w-full max-w-5xl mx-auto space-y-8">
                
                {/* Request Form */}
                <div className="bg-white rounded-3xl shadow-sm border border-prime-border p-6 md:p-8">
                    <h2 className="text-xl font-bold text-prime-text mb-6">Apply for Leave</h2>
                    
                    {status.message && (
                        <div className={`p-4 mb-6 rounded-xl text-sm font-semibold flex items-start gap-3 ${status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                            {status.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-prime-text mb-1.5">Start Date</label>
                                <input type="date" name="start_date" required value={formData.start_date} onChange={handleChange} className="input-base" min={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-prime-text mb-1.5">End Date</label>
                                <input type="date" name="end_date" required value={formData.end_date} onChange={handleChange} className="input-base" min={formData.start_date || new Date().toISOString().split('T')[0]} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-prime-text mb-1.5">Reason for Leave</label>
                            <textarea name="reason" required value={formData.reason} onChange={handleChange} rows="3" className="w-full px-5 py-3 bg-white border border-prime-border rounded-2xl text-sm text-prime-text focus:outline-none focus:border-prime-primary resize-none" placeholder="Please provide details..."></textarea>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-prime-primary text-white rounded-full font-bold hover:bg-prime-secondary transition-colors disabled:opacity-50">
                                {isSubmitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* History Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-prime-border overflow-hidden">
                    <div className="p-6 border-b border-prime-border">
                        <h2 className="text-xl font-bold text-prime-text">My Leave History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Dates</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Reason</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Applied On</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-sm text-gray-500">Loading...</td></tr>
                                ) : leaves.length > 0 ? (
                                    leaves.map(leave => (
                                        <tr key={leave.id} className="hover:bg-gray-50/50">
                                            <td className="p-4 text-sm font-semibold text-gray-800">
                                                {formatToDDMMYYYY(leave.start_date)} <span className="text-gray-400 font-normal">to</span> {formatToDDMMYYYY(leave.end_date)}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 max-w-xs truncate">{leave.reason}</td>
                                            <td className="p-4 text-sm text-gray-500">{new Date(leave.created_at).toLocaleDateString('en-GB')}</td>
                                            <td className="p-4 text-right">{getStatusBadge(leave.status)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="p-8 text-center text-sm text-gray-500">No leave requests found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default LeaveRequest;