import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import PageWrapper from '../../components/layout/PageWrapper';

const CallLogUpload = () => {
    const [formData, setFormData] = useState({
        client_name: '',
        employee_id: '',
        status: 'pending',
        call_duration: '',
        commission: ''
    });
    
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [statusMessage, setStatusMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState(false);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                // Fetch both employees and admins to log calls for
                const response = await apiClient.get('/api/v1/users/');
                const data = response.data.data || response.data || [];
                const staff = data.filter(u => u.role === 'employee' || u.role === 'admin');
                setEmployees(staff);
                setLoadingEmployees(false);
            } catch (error) {
                console.error('Failed to fetch staff:', error);
                setEmployees([]);
                setLoadingEmployees(false);
            }
        };
        fetchStaff();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const triggerSubmit = (e) => {
        e.preventDefault();
        setConfirmDialog(true);
    };

    const confirmSubmit = async () => {
        setIsSubmitting(true);
        setStatusMessage(null);

        try {
            await apiClient.post('/api/v1/calls/', {
                ...formData,
                commission: formData.commission ? parseFloat(formData.commission) : 0,
                call_duration: formData.call_duration || null
            });
            setStatusMessage({ type: 'success', text: 'Call logged successfully.' });
            
            setFormData(prev => ({ 
                ...prev, client_name: '', status: 'pending', call_duration: '', commission: ''
            }));
        } catch (error) {
            setStatusMessage({ type: 'error', text: 'Failed to log call.' });
        } finally {
            setIsSubmitting(false);
            setConfirmDialog(false);
        }
    };

    if (loadingEmployees) {
        return (
            <div className="flex justify-center items-center h-[60vh] w-full">
                <div className="w-8 h-8 border-4 border-prime-primary/20 border-t-prime-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <PageWrapper title="Log Call">
            <Modal 
                isOpen={confirmDialog} 
                onClose={() => setConfirmDialog(false)} 
                title="Save Call Log"
                onConfirm={confirmSubmit}
                confirmText="Proceed"
            >
                <p className="text-sm text-prime-muted">Are you sure you want to log this client interaction?</p>
            </Modal>

            <div className="max-w-2xl mx-auto card-base p-10 bg-white">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-prime-text tracking-tight mb-2">Log New Interaction</h2>
                    <p className="text-sm font-medium text-prime-muted">Record a client call securely into the CRM.</p>
                </div>
                
                {statusMessage && (
                    <div className={`px-6 py-3 mb-8 rounded-full text-sm font-medium text-center ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {statusMessage.text}
                    </div>
                )}

                <form onSubmit={triggerSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Assigned Agent</label>
                            <select name="employee_id" value={formData.employee_id} onChange={handleChange} required className="input-base cursor-pointer">
                                <option value="" disabled></option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.full_name || emp.email} ({emp.role})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Client Name</label>
                            <input type="text" name="client_name" value={formData.client_name} onChange={handleChange} required minLength={2} className="input-base" />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Duration (MM:SS)</label>
                            <input type="text" name="call_duration" value={formData.call_duration} onChange={handleChange} className="input-base" />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Outcome</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="input-base cursor-pointer">
                                <option value="pending">Pending</option>
                                <option value="retained">Retained</option>
                                <option value="not_retained">Not Retained</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Commission ($)</label>
                            <input type="number" step="0.01" min="0" name="commission" value={formData.commission} onChange={handleChange} className="input-base" />
                        </div>
                    </div>

                    <div className="pt-6 mt-2">
                        <Button type="submit" disabled={isSubmitting || employees.length === 0} variant="primary" className="w-full py-3">
                            {isSubmitting ? 'Saving...' : 'Save Call Log'}
                        </Button>
                    </div>
                </form>
            </div>
        </PageWrapper>
    );
};

export default CallLogUpload;