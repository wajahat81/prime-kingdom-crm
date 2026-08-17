import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import Button from '../../components/common/Button';

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
            setStatus({ type: 'success', text: `Account for ${formData.full_name} provisioned successfully.` });
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
        <div className="max-w-3xl mx-auto p-10 mt-10 card-base page-transition">
            <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
                <div>
                    <h2 className="text-2xl font-extrabold text-prime-text tracking-tight">System User Provisioning</h2>
                    <p className="text-sm font-medium text-prime-muted mt-1">Create new authenticated accounts with role-based access control.</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-sm font-semibold text-prime-navy hover:text-prime-gold transition-colors flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Return
                </button>
            </div>
            
            {status && (
                <div className={`p-4 mb-8 rounded-lg text-sm font-semibold border flex items-center gap-2 animate-fade-in ${status.type === 'success' ? 'bg-prime-green/10 text-prime-green border-prime-green/20' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {typeof status.text === 'string' ? status.text : 'An error occurred'}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-prime-muted uppercase tracking-wider mb-2">Legal Full Name</label>
                        <input 
                            type="text" 
                            name="full_name" 
                            value={formData.full_name} 
                            onChange={handleChange}
                            required
                            className="input-base"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-prime-muted uppercase tracking-wider mb-2">Security Clearance Role</label>
                        <select 
                            name="role" 
                            value={formData.role} 
                            onChange={handleChange}
                            className="input-base cursor-pointer"
                        >
                            <option value="employee">Agent (Employee)</option>
                            <option value="admin">Manager (Admin)</option>
                            <option value="super_admin">System Owner (Super Admin)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-prime-muted uppercase tracking-wider mb-2">Work Email Address</label>
                        <input 
                            type="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleChange}
                            required
                            className="input-base"
                            placeholder="name@primekingdom.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-prime-muted uppercase tracking-wider mb-2">Temporary Access Password</label>
                        <input 
                            type="password" 
                            name="password" 
                            value={formData.password} 
                            onChange={handleChange}
                            required
                            minLength={8}
                            className="input-base"
                            placeholder="Min. 8 characters"
                        />
                    </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100">
                    <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        variant="primary"
                        className="w-full py-3"
                    >
                        {isSubmitting ? 'Generating Account Keys...' : 'Provision Secure Account'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default UserManagement;