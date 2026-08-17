import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

const UserManagement = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'employee'
    });
    
    const [status, setStatus] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            await apiClient.post('/api/v1/auth/register', formData);
            setStatus({ type: 'success', text: `Account for ${formData.full_name} created successfully.` });
            setFormData({ email: '', password: '', full_name: '', role: 'employee' });
        } catch (error) {
            setStatus({ 
                type: 'error', 
                text: error.response?.data?.detail || 'Failed to create user account.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-8 mt-10 bg-white rounded-lg shadow-md border-t-4 border-purple-600">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">System User Management</h2>
                    <p className="text-gray-500 text-sm">Provision new accounts for employees and administrators.</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border rounded hover:bg-gray-50"
                >
                    ← Back to Dashboard
                </button>
            </div>
            
            {status && (
    <div className={`p-4 mb-6 rounded ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {typeof status.text === 'string' ? status.text : 'An error occurred'}
    </div>
)}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input 
                            type="text" 
                            name="full_name" 
                            value={formData.full_name} 
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Role</label>
                        <select 
                            name="role" 
                            value={formData.role} 
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="employee">Employee (Agent)</option>
                            <option value="admin">Admin (Manager)</option>
                            <option value="super_admin">Super Admin</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                        <input 
                            type="password" 
                            name="password" 
                            value={formData.password} 
                            onChange={handleChange}
                            required
                            minLength={8}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? 'Provisioning...' : 'Create User Account'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserManagement;