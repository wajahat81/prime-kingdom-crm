import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

const Login = () => {
    const [email, setEmail] = useState('');
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
            const result = await login(email, password);
            if (result.success) {
                navigate('/dashboard');
            } else {
                const errorMessage = typeof result.error === 'string' 
                    ? result.error 
                    : result.error?.detail || 'Login failed. Please try again.';
                setError(errorMessage);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-prime-bg py-12 px-4 sm:px-6 lg:px-8 page-transition">
            <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 relative overflow-hidden border border-blue-50">
                {/* Decorative Gradient Accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-prime-primary to-prime-accent"></div>
                
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-prime-primary to-prime-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30 transform rotate-3">
                        <span className="text-3xl font-bold text-white -rotate-3">P</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-prime-text tracking-tight">
                        Prime CRM
                    </h2>
                    <p className="mt-2 text-sm text-prime-primary font-bold uppercase tracking-wider">
                        Workspace Authentication
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-prime-text mb-1">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-base"
                                placeholder="name@company.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-prime-text mb-1">
                                Secure Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-base"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm font-medium text-center bg-red-50/50 border border-red-100 p-3 rounded-lg animate-fade-in">
                            {error}
                        </div>
                    )}

                    <div>
                        <Button
                            type="submit"
                            disabled={loading}
                            variant="primary"
                            className="w-full text-base py-3 shadow-md"
                        >
                            {loading ? 'Authenticating Session...' : 'Sign In to Workspace'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;