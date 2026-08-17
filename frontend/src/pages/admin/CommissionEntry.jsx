import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

const CommissionEntry = () => {
    const [formData, setFormData] = useState({
        employee_id: '',
        total_retained_calls: 0,
        month: new Date().toISOString().slice(0, 7) // YYYY-MM format
    });
    
    const [employees, setEmployees] = useState([]);
    const [status, setStatus] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [payoutResult, setPayoutResult] = useState(null);

    useEffect(() => {
        // Mock fetch - In reality, fetch from an /api/v1/employees list endpoint
        setEmployees([
            { id: '123e4567-e89b-12d3-a456-426614174000', name: 'John Doe' },
            { id: '987fcdeb-51a2-43d7-9012-345678901234', name: 'Jane Smith' }
        ]);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);
        setPayoutResult(null);

        try {
            const response = await apiClient.post('/api/v1/commissions/', formData);
            setStatus({ type: 'success', text: 'Commission successfully logged.' });
            setPayoutResult(response.data.data.payout_amount);
            
            setFormData(prev => ({ ...prev, total_retained_calls: 0 }));
        } catch (error) {
            setStatus({ 
                type: 'error', 
                text: error.response?.data?.detail || 'Failed to process commission.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8 mt-10 bg-white rounded-lg shadow-md border-t-4 border-green-600">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Process Agent Commission</h2>
            
            {status && (
                <div className={`p-4 mb-6 rounded ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {status.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
                        <select 
                            name="employee_id" 
                            value={formData.employee_id} 
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                        >
                            <option value="" disabled>Select agent...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Billing Month</label>
                        <input 
                            type="month" 
                            name="month" 
                            value={formData.month} 
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Retained Calls</label>
                    <input 
                        type="number" 
                        name="total_retained_calls" 
                        value={formData.total_retained_calls} 
                        onChange={handleChange}
                        required
                        min="0"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
                >
                    {isSubmitting ? 'Processing...' : 'Calculate & Save Commission'}
                </button>
            </form>

            {payoutResult !== null && (
                <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wide">Final Calculated Payout</h3>
                    <p className="text-4xl font-extrabold text-green-600 mt-2">${payoutResult.toFixed(2)}</p>
                </div>
            )}
        </div>
    );
};

export default CommissionEntry;