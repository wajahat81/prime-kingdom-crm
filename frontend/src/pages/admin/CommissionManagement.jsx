import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Button from '../../components/common/Button';

const CommissionManagement = () => {
    const [formData, setFormData] = useState({
        employee_id: '',
        total_retained_calls: '',
        payout_amount: '',
        month: ''
    });
    const [employees, setEmployees] = useState([]);
    const [commissions, setCommissions] = useState([]);
    const [status, setStatus] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchEmployees();
        fetchCommissions();
        const now = new Date();
        setFormData(prev => ({
            ...prev,
            month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        }));
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await apiClient.get('/api/v1/users?role=employee');
            setEmployees(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        }
    };

    const fetchCommissions = async () => {
        try {
            const response = await apiClient.get('/api/v1/commissions/');
            setCommissions(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch commissions:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus(null);

        try {
            await apiClient.post('/api/v1/commissions/', {
                employee_id: formData.employee_id,
                total_retained_calls: parseInt(formData.total_retained_calls),
                payout_amount: parseFloat(formData.payout_amount),
                month: formData.month
            });
            setStatus({ type: 'success', text: 'Commission recorded securely in the ledger.' });
            setFormData(prev => ({ ...prev, total_retained_calls: '', payout_amount: '' }));
            fetchCommissions();
        } catch (error) {
            setStatus({ type: 'error', text: error.response?.data?.detail || 'Failed to save commission' });
        } finally {
            setSubmitting(false);
        }
    };

    const getEmployeeName = (id) => {
        const emp = employees.find(e => e.id === id);
        return emp ? emp.full_name || emp.email : id.substring(0, 8);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto w-full page-transition">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-prime-text tracking-tight mb-1">Financial Operations</h1>
                <p className="text-sm text-prime-muted">Process and review agent commission allocations.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="xl:col-span-1">
                    <div className="card-base p-6 sticky top-24">
                        <h2 className="text-lg font-bold text-prime-text mb-6 pb-4 border-b border-gray-100">Allocate Funds</h2>
                        
                        {status && (
                            <div className={`p-3 mb-6 rounded-lg text-sm font-semibold border flex gap-2 items-start ${status.type === 'success' ? 'bg-prime-green/10 text-prime-green border-prime-green/20' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                {status.type === 'success' ? '✓ ' : '⚠ '} {status.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-prime-muted uppercase tracking-wider mb-2">Agent Target</label>
                                <select
                                    name="employee_id"
                                    value={formData.employee_id}
                                    onChange={handleChange}
                                    required
                                    className="input-base cursor-pointer"
                                >
                                    <option value="">Select an agent...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.full_name || emp.email}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-prime-muted uppercase tracking-wider mb-2">Retained Volume</label>
                                    <input
                                        type="number"
                                        name="total_retained_calls"
                                        value={formData.total_retained_calls}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        className="input-base text-lg font-mono font-bold"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-prime-muted uppercase tracking-wider mb-2">Billing Cycle</label>
                                    <input
                                        type="month"
                                        name="month"
                                        value={formData.month}
                                        onChange={handleChange}
                                        required
                                        className="input-base text-center font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-prime-muted uppercase tracking-wider mb-2">Total Payout Allocation ($)</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        name="payout_amount"
                                        value={formData.payout_amount}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        step="0.01"
                                        className="input-base pl-8 text-xl font-black text-prime-navy"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={submitting}
                                variant="primary"
                                className="w-full mt-2 py-3 shadow-md"
                            >
                                {submitting ? 'Processing Transaction...' : 'Authorize Commission'}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Table Section */}
                <div className="xl:col-span-2">
                    <div className="card-base overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-prime-text">Ledger History</h2>
                            <span className="text-xs font-bold bg-white border border-gray-200 px-3 py-1 rounded-full text-prime-muted shadow-sm">
                                {commissions.length} Records
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-white">
                                    <tr>
                                        {['Agent', 'Volume', 'Total Payout', 'Cycle', 'Timestamp'].map((head) => (
                                            <th key={head} className="px-6 py-4 text-left text-xs font-bold text-prime-muted uppercase tracking-wider">
                                                {head}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                    {commissions.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-prime-muted text-sm font-medium">
                                                No financial allocations recorded.
                                            </td>
                                        </tr>
                                    ) : (
                                        commissions.map((comm) => (
                                            <tr key={comm.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-prime-text">{getEmployeeName(comm.employee_id)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-prime-muted font-medium">{comm.total_retained_calls}</td>
                                                <td className="px-6 py-4 whitespace-nowrap font-black text-prime-navy tracking-tight">${comm.payout_amount.toFixed(2)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-prime-muted">{comm.month}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                                                    {new Date(comm.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommissionManagement;