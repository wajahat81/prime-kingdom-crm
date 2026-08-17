import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Button from '../../components/common/Button';
import { CALL_STATUS } from '../../utils/constants';

const CallRow = ({ call, fetchCalls }) => {
    const [commission, setCommission] = useState(call.commission ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState(call.status);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const isRetained = status === CALL_STATUS.RETAINED;

    const handleStatusChange = async (newStatus) => {
        setUpdatingStatus(true);
        try {
            await apiClient.put(`/api/v1/calls/${call.id}/status`, { status: newStatus });
            setStatus(newStatus);
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const saveCommission = async () => {
        const value = parseFloat(commission);
        if (isNaN(value) || value < 0) {
            alert('Please enter a valid commission amount');
            return;
        }

        setIsSaving(true);
        try {
            await apiClient.put(`/api/v1/calls/${call.id}/commission`, { commission: value });
        } catch (err) {
            console.error('Error updating commission:', err);
            alert('Failed to update commission');
        } finally {
            setIsSaving(false);
        }
    };

    const getBadgeStyle = (currentStatus) => {
        switch(currentStatus) {
            case 'retained': return 'bg-prime-green/10 text-prime-green border-prime-green/20';
            case 'pending': return 'bg-prime-gold/10 text-prime-gold border-prime-gold/20';
            case 'not_retained': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getEmployeeName = () => {
        if (call.profiles && call.profiles.full_name) return call.profiles.full_name;
        if (call.employee_name) return call.employee_name;
        return call.employee_id ? call.employee_id.substring(0, 8) + '...' : 'Unknown';
    };

    return (
        <tr className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0 group">
            <td className="px-6 py-4 whitespace-nowrap">
                <span className="font-semibold text-prime-text">{call.client_name}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-prime-muted text-sm font-medium">
                {getEmployeeName()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getBadgeStyle(status)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                    {status.replace('_', ' ').toUpperCase()}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-prime-muted">
                {call.call_duration || '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3 opacity-100 sm:opacity-60 group-hover:opacity-100 transition-opacity">
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={commission}
                        onChange={(e) => setCommission(e.target.value)}
                        disabled={!isRetained || isSaving}
                        className={`w-28 px-3 py-1.5 border rounded-lg text-sm font-medium transition-all ${
                            isRetained 
                                ? 'bg-white border-gray-200 text-prime-text focus:ring-2 focus:ring-prime-navy/20 focus:border-prime-navy outline-none' 
                                : 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        placeholder={isRetained ? '$ 0.00' : 'N/A'}
                    />
                    {isRetained && (
                        <button
                            onClick={saveCommission}
                            disabled={isSaving || commission === '' || commission == call.commission}
                            className="px-3 py-1.5 bg-prime-navy text-white text-xs font-semibold rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            {isSaving ? '...' : 'Save'}
                        </button>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-prime-muted">
                {new Date(call.created_at).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updatingStatus}
                    className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-prime-text focus:outline-none focus:border-prime-navy focus:ring-2 focus:ring-prime-navy/20 cursor-pointer transition-all"
                >
                    <option value={CALL_STATUS.PENDING}>Pending Review</option>
                    <option value={CALL_STATUS.RETAINED}>Retained</option>
                    <option value={CALL_STATUS.NOT_RETAINED}>Not Retained</option>
                </select>
            </td>
        </tr>
    );
};

const CallManagement = () => {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCalls = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/v1/calls/');
            setCalls(response.data.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching calls:', err);
            setError('Failed to load call logs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalls();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto w-full page-transition">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-prime-text mb-1 tracking-tight">Call Operations</h1>
                    <p className="text-sm text-prime-muted">Review logs, update statuses, and process financial commissions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-4 py-2 bg-white border border-gray-200 text-prime-muted text-sm font-medium rounded-lg shadow-sm">
                        Total Records: <strong className="text-prime-text">{calls.length}</strong>
                    </span>
                    <Button onClick={fetchCalls} variant="primary" className="gap-2 shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Sync Records
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-2 animate-fade-in">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            )}

            <div className="card-base overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/80">
                            <tr>
                                {['Client', 'Agent', 'Status', 'Duration', 'Commission', 'Date Logged', 'Workflow'].map((head) => (
                                    <th key={head} className="px-6 py-4 text-left text-xs font-bold text-prime-muted uppercase tracking-wider">
                                        {head}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center">
                                        <div className="inline-flex items-center gap-3 text-prime-muted font-medium">
                                            <div className="w-5 h-5 border-2 border-prime-navy/20 border-t-prime-navy rounded-full animate-spin"></div>
                                            Retrieving operational data...
                                        </div>
                                    </td>
                                </tr>
                            ) : calls.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-prime-muted text-sm font-medium">
                                        No call records found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                calls.map((call) => <CallRow key={call.id} call={call} fetchCalls={fetchCalls} />)
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CallManagement;