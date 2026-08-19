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
    const [showPassword, setShowPassword] = useState(false);
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
                                <div className="relative">
    <input
        type={showPassword ? "text" : "password"}
        // Keep whatever value, onChange, or other props you already have here:
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        className="input-base pr-10 w-full" // Added pr-10 so text doesn't flow under the icon
    />
    
    <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-prime-primary focus:outline-none transition-colors"
        title={showPassword ? "Hide password" : "Show password"}
    >
        {showPassword ? (
            /* Eye Off Icon (Hide) */
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
        ) : (
            /* Eye Icon (Show) */
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        )}
    </button>
</div>
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