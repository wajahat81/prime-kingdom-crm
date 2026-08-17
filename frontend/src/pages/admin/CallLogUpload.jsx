import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Button from '../../components/common/Button';

const CallLogUpload = () => {
    const [formData, setFormData] = useState({
        client_name: '',
        employee_id: '',
        status: 'pending',
        call_duration: ''
    });
    
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [statusMessage, setStatusMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await apiClient.get('/api/v1/users?role=employee');
                if (response.data && response.data.data) {
                    setEmployees(response.data.data);
                } else if (Array.isArray(response.data)) {
                    setEmployees(response.data);
                } else {
                    setEmployees([]);
                }
                setLoadingEmployees(false);
            } catch (error) {
                console.error('Failed to fetch employees:', error);
                setEmployees([]);
                setLoadingEmployees(false);
            }
        };
        fetchEmployees();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMessage(null);

        try {
            await apiClient.post('/api/v1/calls/', {
                ...formData,
                call_duration: formData.call_duration || null
            });
            setStatusMessage({ type: 'success', text: 'Call log securely uploaded to the database.' });
            
            setFormData(prev => ({ 
                ...prev, 
                client_name: '', 
                status: 'pending',
                call_duration: ''
            }));
        } catch (error) {
            setStatusMessage({ 
                type: 'error', 
                text: error.response?.data?.detail || 'Failed to upload call log.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingEmployees) {
        return (
            <div className="max-w-2xl mx-auto p-8 mt-10 card-base flex justify-center items-center h-48">
                <div className="w-8 h-8 border-4 border-prime-navy/20 border-t-prime-navy rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-10 mt-10 card-base page-transition">
            <div className="mb-8 border-b border-gray-100 pb-5">
                <h2 className="text-2xl font-extrabold text-prime-text tracking-tight">Log Agent Call</h2>
                <p className="text-sm text-prime-muted mt-1 font-medium">Record a new client interaction securely into the CRM.</p>
            </div>
            
            {statusMessage && (
                <div className={`p-4 mb-8 rounded-lg text-sm font-semibold border flex items-center gap-2 ${statusMessage.type === 'success' ? 'bg-prime-green/10 text-prime-green border-prime-green/20' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {statusMessage.type === 'success' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    {statusMessage.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-prime-text mb-2">Assigned Agent</label>
                        <select 
                            name="employee_id" 
                            value={formData.employee_id} 
                            onChange={handleChange}
                            required
                            className="input-base cursor-pointer"
                        >
                            <option value="" disabled>Select an agent...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.full_name || emp.name || emp.email || emp.id}
                                </option>
                            ))}
                        </select>
                        {employees.length === 0 && (
                            <p className="text-xs font-semibold text-prime-gold mt-2 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                No employees found. Please provision users first.
                            </p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-prime-text mb-2">Client Name</label>
                        <input 
                            type="text" 
                            name="client_name" 
                            value={formData.client_name} 
                            onChange={handleChange}
                            required
                            minLength={2}
                            className="input-base"
                            placeholder="e.g., Acme Corporation"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-prime-text mb-2">Call Duration</label>
                        <input 
                            type="text" 
                            name="call_duration" 
                            value={formData.call_duration} 
                            onChange={handleChange}
                            placeholder="05:30"
                            className="input-base"
                        />
                        <p className="text-xs font-medium text-prime-muted mt-2">Format: MM:SS or HH:MM:SS</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-prime-text mb-2">Interaction Outcome</label>
                        <select 
                            name="status" 
                            value={formData.status} 
                            onChange={handleChange}
                            className="input-base cursor-pointer"
                        >
                            <option value="pending">Pending Review</option>
                            <option value="retained">Retained (Success)</option>
                            <option value="not_retained">Not Retained</option>
                        </select>
                    </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100">
                    <Button 
                        type="submit" 
                        disabled={isSubmitting || employees.length === 0}
                        variant="primary"
                        className="w-full py-3"
                    >
                        {isSubmitting ? 'Uploading to Database...' : 'Save Call Log'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CallLogUpload;