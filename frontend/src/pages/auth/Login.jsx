import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import PageWrapper from '../../components/layout/PageWrapper';

const Login = () => {
    // Changed state name from 'email' to 'identifier' to reflect dual login
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(identifier, password);
            if (result.success) {
                navigate('/dashboard');
            } else {
                setError('Invalid credentials.');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageWrapper title="Sign In">
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="max-w-md w-full space-y-8 card-base p-10 relative">
                    <div className="text-center flex flex-col items-center">
                        <div className="w-52 h-16 flex items-center justify-center mx-auto mb-4">
                            <img src="/prime-kingdom-logo.png" alt="Prime Kingdom" className="w-full h-full object-contain" />
                        </div>
                        <p className="mt-1 text-xs text-prime-muted font-semibold uppercase tracking-widest">
                            Secure Workspace
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                {/* Updated Label */}
                                <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-1">
                                    Email Address or Dialing ID
                                </label>
                                {/* Updated input type from "email" to "text" */}
                                <input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="e.g. name@primekingdom.com or 1024"
                                    className="input-base"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2 ml-1">
                                    <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider">
                                        Password
                                    </label>
                                    <Link to="/forgot-password" className="text-xs font-semibold text-prime-primary hover:text-prime-secondary transition-colors">
                                        Forgot Password?
                                    </Link>
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-base"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm font-medium text-center bg-red-50/80 px-6 py-3 rounded-full">
                                {error}
                            </div>
                        )}

                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={loading}
                                variant="primary"
                                className="w-full text-base py-3"
                            >
                                {loading ? 'Loading...' : 'Sign In'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </PageWrapper>
    );
};

export default Login;