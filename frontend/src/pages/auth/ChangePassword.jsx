import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

const ChangePassword = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    // Visibility toggle states
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        if (formData.newPassword !== formData.confirmPassword) {
            return setStatus({ type: 'error', message: 'New passwords do not match.' });
        }
        if (formData.newPassword.length < 6) {
            return setStatus({ type: 'error', message: 'Password must be at least 6 characters long.' });
        }

        setIsSubmitting(true);
        try {
            await apiClient.post('/api/v1/auth/change-password', {
                current_password: formData.currentPassword,
                new_password: formData.newPassword
            });
            
            setStatus({ type: 'success', message: 'Password successfully updated!' });
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            
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

    // Helper to render the eye icon based on visibility state
    const renderEyeIcon = (isVisible) => (
        isVisible ? (
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
        ) : (
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
        )
    );

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
                    {/* Current Password Field */}
                    <div>
                        <label className="block text-sm font-semibold text-prime-text mb-1.5">Current Password</label>
                        <div className="relative">
                            <input
                                type={showCurrent ? "text" : "password"}
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 pr-12 border border-prime-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prime-primary/20 focus:border-prime-primary transition-all text-sm"
                                placeholder="Enter current password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {renderEyeIcon(showCurrent)}
                            </button>
                        </div>
                    </div>
                    
                    {/* New Password Field */}
                    <div>
                        <label className="block text-sm font-semibold text-prime-text mb-1.5">New Password</label>
                        <div className="relative">
                            <input
                                type={showNew ? "text" : "password"}
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 pr-12 border border-prime-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prime-primary/20 focus:border-prime-primary transition-all text-sm"
                                placeholder="Enter new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {renderEyeIcon(showNew)}
                            </button>
                        </div>
                    </div>
                    
                    {/* Confirm Password Field */}
                    <div>
                        <label className="block text-sm font-semibold text-prime-text mb-1.5">Confirm New Password</label>
                        <div className="relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 pr-12 border border-prime-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prime-primary/20 focus:border-prime-primary transition-all text-sm"
                                placeholder="Confirm new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {renderEyeIcon(showConfirm)}
                            </button>
                        </div>
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