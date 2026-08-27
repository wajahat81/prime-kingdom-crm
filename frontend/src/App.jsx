import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import useIdleTimeout from './utils/useIdleTimeout'; // Import the hook you created

// Inner component to safely use router hooks like useNavigate inside Router context
function MainLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Automatically triggers logout if the user is idle
    useIdleTimeout();

    return (
        <div className="flex min-h-screen bg-prime-bg text-prime-text">
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