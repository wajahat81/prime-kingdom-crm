import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';

function App() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <AuthProvider>
            <Router>
                <div className="flex h-screen overflow-hidden bg-prime-bg text-prime-text">
                    
                    {/* Mobile Overlay - Closes menu when clicking outside */}
                    {isMobileMenuOpen && (
                        <div 
                            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in" 
                            onClick={() => setIsMobileMenuOpen(false)}
                        ></div>
                    )}

                    {/* Sidebar Container - Slides in on mobile, static on desktop */}
                    <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                        <Sidebar closeMobileMenu={() => setIsMobileMenuOpen(false)} />
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                        <Navbar toggleMobileMenu={() => setIsMobileMenuOpen(true)} />
                        
                        <div className="flex-1 overflow-y-auto">
                            <AppRouter />
                        </div>
                    </div>
                    
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;