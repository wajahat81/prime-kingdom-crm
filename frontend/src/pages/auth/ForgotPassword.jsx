import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import PageWrapper from '../../components/layout/PageWrapper';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus({ type: 'success', text: 'If an account exists, a recovery email has been sent.' });
        setEmail('');
    };

    return (
        <PageWrapper title="Account Recovery">
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="max-w-md w-full space-y-8 card-base p-10 relative">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-prime-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-prime-text tracking-tight">Account Recovery</h2>
                        <p className="mt-1 text-xs text-prime-muted font-semibold uppercase tracking-widest">Enter your email</p>
                    </div>

                    {status && (
                        <div className="px-6 py-3 mb-6 rounded-full text-sm font-medium text-center bg-green-50 text-green-700">
                            {status.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-1">Email Address</label>
                            <input 
                                type="email" 
                                required 
                                className="input-base"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="pt-2">
                            <Button type="submit" variant="primary" className="w-full py-3">Send Recovery Link</Button>
                        </div>
                    </form>

                    <div className="mt-8 text-center pt-6">
                        <Link to="/login" className="text-sm font-semibold text-prime-primary hover:text-prime-secondary transition-colors">
                            Return to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default ForgotPassword;