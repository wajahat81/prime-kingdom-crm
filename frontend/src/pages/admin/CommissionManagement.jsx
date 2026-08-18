import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import PageWrapper from '../../components/layout/PageWrapper';

const CommissionManagement = () => {
    const [formData, setFormData] = useState({
        employee_id: '', total_retained_calls: '', payout_amount: '', month: ''
    });
    const [employees, setEmployees] = useState([]);
    const [commissions, setCommissions] = useState([]);
    const [status, setStatus] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    const [confirmModal, setConfirmModal] = useState(false);

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
            // Fetch all users, then filter to include only employees and admins (excluding super_admins)
            const response = await apiClient.get('/api/v1/users/');
            const allUsers = response.data.data || response.data || [];
            const eligibleStaff = allUsers.filter(u => u.role === 'employee' || u.role === 'admin');
            setEmployees(eligibleStaff);
        } catch (error) {
            console.error('Failed to fetch staff for commissions:', error);
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

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const triggerSubmit = (e) => {
        e.preventDefault();
        setConfirmModal(true);
    };

    const confirmSubmit = async () => {
        setSubmitting(true);
        setStatus(null);

        try {
            await apiClient.post('/api/v1/commissions/', {
                employee_id: formData.employee_id,
                total_retained_calls: parseInt(formData.total_retained_calls),
                payout_amount: parseFloat(formData.payout_amount),
                month: formData.month
            });
            setStatus({ type: 'success', text: 'Commission saved successfully.' });
            setFormData(prev => ({ ...prev, total_retained_calls: '', payout_amount: '' }));
            fetchCommissions();
        } catch (error) {
            setStatus({ type: 'error', text: 'Failed to save commission.' });
        } finally {
            setSubmitting(false);
            setConfirmModal(false);
        }
    };

    const getEmployeeName = (id) => {
        const emp = employees.find(e => e.id === id);
        return emp ? `${emp.full_name || emp.email} (${emp.role})` : id.substring(0, 8);
    };

    return (
        <PageWrapper title="Commission Operations">
            <Modal 
                isOpen={confirmModal} 
                onClose={() => setConfirmModal(false)} 
                title="Authorize Payout"
                onConfirm={confirmSubmit}
                confirmText="Authorize"
            >
                <p className="text-sm font-medium text-prime-muted">Are you sure you want to authorize this commission payout to the ledger?</p>
            </Modal>

            <div className="flex justify-between items-center mb-8 px-2">
                <div className="flex items-center gap-6">
                    <h1 className="text-xl font-semibold text-prime-text">Financial Ledger</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-1">
                    <div className="card-base p-8 sticky top-24 bg-white">
                        <h2 className="text-lg font-bold text-prime-text mb-6">Allocate Funds</h2>
                        
                        {status && (
                            <div className={`px-4 py-2 mb-6 rounded-full text-xs font-semibold text-center ${status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {status.text}
                            </div>
                        )}

                        <form onSubmit={triggerSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Agent / Admin</label>
                                <select name="employee_id" value={formData.employee_id} onChange={handleChange} required className="input-base cursor-pointer">
                                    <option value="">Select staff member...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.full_name || emp.email} ({emp.role === 'admin' ? 'Admin' : 'Agent'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Retained</label>
                                    <input type="number" name="total_retained_calls" value={formData.total_retained_calls} onChange={handleChange} required min="0" className="input-base text-center" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Cycle</label>
                                    <input type="month" name="month" value={formData.month} onChange={handleChange} required className="input-base text-center" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Total Payout ($)</label>
                                <input type="number" name="payout_amount" value={formData.payout_amount} onChange={handleChange} required min="0" step="0.01" className="input-base text-center font-semibold" />
                            </div>

                            <Button type="submit" disabled={submitting} variant="primary" className="w-full mt-2">
                                {submitting ? 'Saving...' : 'Save Allocation'}
                            </Button>
                        </form>
                    </div>
                </div>

                <div className="xl:col-span-2">
                    <div className="card-base flex flex-col min-h-[500px]">
                        <div className="overflow-x-auto flex-grow">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        {['Staff Member', 'Volume', 'Payout', 'Cycle', 'Date'].map((head) => (
                                            <th key={head} className="px-8 py-6 text-left text-[13px] font-semibold text-prime-muted tracking-wide">{head}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {commissions.length === 0 ? (
                                        <tr><td colSpan="5" className="px-8 py-32 text-center text-prime-primary/60 text-sm font-medium">No records found.</td></tr>
                                    ) : (
                                        commissions.map((comm) => (
                                            <tr key={comm.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                                                <td className="px-8 py-5 whitespace-nowrap font-medium text-sm text-prime-text">{getEmployeeName(comm.employee_id)}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-prime-muted font-medium text-sm">{comm.total_retained_calls}</td>
                                                <td className="px-8 py-5 whitespace-nowrap font-bold text-prime-text text-sm">${comm.payout_amount.toFixed(2)}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-prime-muted">{comm.month}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-xs text-gray-400">{new Date(comm.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default CommissionManagement;