import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import PageWrapper from '../../components/layout/PageWrapper';

const CallLogUpload = () => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0], // Defaults to today
        client_name: '',
        employee_id: '',
        status: 'retained',
        commission: '',
        handy_id: '',
        closer_id: '',
        doc_sign_id: ''
    });

    const [agents, setAgents] = useState([]);
    const [closers, setClosers] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [statusMessage, setStatusMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState(false);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const response = await apiClient.get('/api/v1/users/');
                const data = response.data.data || response.data || [];

                const sortByName = (a, b) => (a.full_name || a.email || '').localeCompare(b.full_name || b.email || '');

                const sortedAgents = data.filter(u => u.role === 'employee' || u.role === 'closer').sort(sortByName);
                const sortedClosers = data.filter(u => u.role === 'closer').sort(sortByName);

                setAgents(sortedAgents);
                setClosers(sortedClosers);
                setLoadingEmployees(false);
            } catch (error) {
                console.error('Failed to fetch staff:', error);
                setAgents([]);
                setClosers([]);
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
                handy_id: formData.handy_id || null,
                closer_id: formData.closer_id || null,
                doc_sign_id: formData.doc_sign_id || null,
                date: formData.date
            });
            setStatusMessage({ type: 'success', text: 'Call logged successfully.' });

            setFormData({
                date: new Date().toISOString().split('T')[0], 
                client_name: '', employee_id: '', status: 'retained', commission: '', handy_id: '', closer_id: '', doc_sign_id: ''
            });
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
                            <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Date</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} required className="input-base" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Assigned Agent</label>
                            <select name="employee_id" value={formData.employee_id} onChange={handleChange} required className="input-base cursor-pointer">
                                <option value="" disabled>Select the Agent...</option>
                                {agents.map(emp => (
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
                            <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="input-base cursor-pointer">
                                <option value="retained">Retained</option>
                                <option value="clawed_back">Clawed Back</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Commission (Rs)</label>
                            <input type="number" step="0.01" min="0" name="commission" value={formData.commission} onChange={handleChange} className="input-base" />
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                            <div>
                                <label className="block text-xs font-semibold text-prime-primary uppercase tracking-wider mb-2 ml-2">Handy</label>
                                <select name="handy_id" value={formData.handy_id} onChange={handleChange} className="input-base cursor-pointer bg-blue-50/50">
                                    <option value="">None</option>
                                    {closers.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-prime-primary uppercase tracking-wider mb-2 ml-2">Closer</label>
                                <select name="closer_id" value={formData.closer_id} onChange={handleChange} className="input-base cursor-pointer bg-blue-50/50">
                                    <option value="">None</option>
                                    {closers.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-prime-primary uppercase tracking-wider mb-2 ml-2">Doc Sign</label>
                                <select name="doc_sign_id" value={formData.doc_sign_id} onChange={handleChange} className="input-base cursor-pointer bg-blue-50/50">
                                    <option value="">None</option>
                                    {closers.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 mt-2">
                        <Button type="submit" disabled={isSubmitting || agents.length === 0} variant="primary" className="w-full py-3">
                            {isSubmitting ? 'Saving...' : 'Save Call Log'}
                        </Button>
                    </div>
                </form>
            </div>
        </PageWrapper>
    );
};

export default CallLogUpload;