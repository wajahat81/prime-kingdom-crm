import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

const ChangePassword = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        // Basic Validation
        if (formData.newPassword !== formData.confirmPassword) {
            return setStatus({ type: 'error', message: 'New passwords do not match.' });
        }
        if (formData.newPassword.length < 6) {
            return setStatus({ type: 'error', message: 'Password must be at least 6 characters long.' });
        }

        setIsSubmitting(true);
        try {
            // Note: Ensure your FastAPI backend has an endpoint to handle this request!
            await apiClient.post('/api/v1/auth/change-password', {
                current_password: formData.currentPassword,
                new_password: formData.newPassword
            });
            
            setStatus({ type: 'success', message: 'Password successfully updated!' });
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            
            // Redirect back to dashboard after 2 seconds
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (error) {
            setStatus({ 
                type: 'error', 
                message: error.response?.data?.detail || 'Failed to update password. Check your current password.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-8 w-full max-w-lg mx-auto mt-4 md:mt-10">
            <div className="bg-white rounded-2xl shadow-sm border border-prime-border p-6 md:p-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-prime-text">Change Password</h2>
                    <p className="text-sm text-prime-muted mt-1">Ensure your account is using a long, random password to stay secure.</p>
                </div>
                
                {status.message && (
                    <div className={`p-4 mb-6 rounded-xl text-sm font-semibold flex items-start gap-3 ${status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-prime-text mb-1.5">Current Password</label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 border border-prime-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prime-primary/20 focus:border-prime-primary transition-all text-sm"
                            placeholder="Enter current password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-prime-text mb-1.5">New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 border border-prime-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prime-primary/20 focus:border-prime-primary transition-all text-sm"
                            placeholder="Enter new password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-prime-text mb-1.5">Confirm New Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 border border-prime-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prime-primary/20 focus:border-prime-primary transition-all text-sm"
                            placeholder="Confirm new password"
                        />
                    </div>
                    
                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-prime-border mt-6">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-5 py-2.5 text-sm font-semibold text-prime-muted hover:text-prime-text hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-prime-primary text-white rounded-xl text-sm font-semibold hover:bg-prime-secondary transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                    Updating...
                                </>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;