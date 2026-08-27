import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';

function MainLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showIdleWarning, setShowIdleWarning] = useState(false);
    
    const timeoutRef = useRef(null);
    const logoutRef = useRef(null);

    const IDLE_TIME_LIMIT = 25 * 60 * 1000; // 25 Minutes before warning
    const LOGOUT_COUNTDOWN = 5 * 60 * 1000; // 5 Minutes to click "Stay Logged In"

    const resetIdleTimer = () => {
        // Stop tracking if the warning modal is currently active
        if (showIdleWarning) return; 
        
        clearTimeout(timeoutRef.current);
        clearTimeout(logoutRef.current);

        timeoutRef.current = setTimeout(() => {
            setShowIdleWarning(true);
            
            // Trigger actual logout if no action is taken
            logoutRef.current = setTimeout(() => {
                localStorage.clear();
                window.location.href = '/login?expired=true';
            }, LOGOUT_COUNTDOWN);

        }, IDLE_TIME_LIMIT);
    };

    useEffect(() => {
        // Listen to all standard user interactions to reset the timer
        const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
        
        events.forEach(event => window.addEventListener(event, resetIdleTimer));
        resetIdleTimer();

        return () => {
            events.forEach(event => window.removeEventListener(event, resetIdleTimer));
            clearTimeout(timeoutRef.current);
            clearTimeout(logoutRef.current);
        };
    }, [showIdleWarning]);

    const handleStayLoggedIn = () => {
        setShowIdleWarning(false);
        resetIdleTimer();
    };

    return (
        <div className="flex min-h-screen bg-prime-bg text-prime-text">
            
            {/* INACTIVITY WARNING MODAL */}
            {showIdleWarning && (
                <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center border border-amber-100">
                        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Are you still there?</h2>
                        <p className="text-sm text-gray-500 mb-6">Your session is about to expire due to inactivity to protect sensitive data.</p>
                        <button 
                            onClick={handleStayLoggedIn} 
                            className="w-full py-3 bg-prime-primary text-white font-bold rounded-full hover:bg-prime-secondary transition-colors shadow-md"
                        >
                            Keep Me Logged In
                        </button>
                    </div>
                </div>
            )}

            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in" 
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}

            <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar closeMobileMenu={() => setIsMobileMenuOpen(false)} />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <div className="sticky top-0 z-30 bg-prime-bg">
                    <Navbar toggleMobileMenu={() => setIsMobileMenuOpen(true)} />
                </div>
                <div className="flex-1">
                    <AppRouter />
                </div>
            </div>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <MainLayout />
            </Router>
        </AuthProvider>
    );
}

export default App;