import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus({ type: 'success', text: 'If an account exists, a recovery email has been dispatched.' });
        setEmail('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-prime-bg px-4 py-12 page-transition">
            <div className="max-w-md w-full space-y-8 card-base p-10 relative overflow-hidden">
                {/* Decorative Accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-prime-navy via-prime-green to-prime-gold"></div>
                
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <svg className="w-8 h-8 text-prime-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    </div>
                    <h2 className="text-2xl font-extrabold text-prime-text tracking-tight">Account Recovery</h2>
                    <p className="mt-2 text-sm font-medium text-prime-muted">Enter your registered workspace email.</p>
                </div>

                {status && (
                    <div className="bg-prime-green/10 border border-prime-green/20 text-prime-green p-3 rounded-lg text-sm font-semibold animate-fade-in text-center">
                        {status.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                    <div>
                        <label className="block text-sm font-medium text-prime-text mb-1">Email Address</label>
                        <input 
                            type="email" 
                            required 
                            className="input-base"
                            placeholder="name@primekingdom.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <Button type="submit" variant="primary" className="w-full py-3">Send Recovery Link</Button>
                </form>

                <div className="mt-8 text-center border-t border-gray-100 pt-6">
                    <Link to="/login" className="text-sm font-semibold text-prime-navy hover:text-prime-gold transition-colors flex items-center justify-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Return to Authentication
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;