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
                {/* Changed to min-h-screen and removed overflow-hidden */}
                <div className="flex min-h-screen bg-prime-bg text-prime-text">
                    
                    {/* Mobile Overlay - Closes menu when clicking outside */}
                    {isMobileMenuOpen && (
                        <div 
                            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in" 
                            onClick={() => setIsMobileMenuOpen(false)}
                        ></div>
                    )}

                    {/* Sidebar Container - Changed lg:static to lg:sticky lg:top-0 lg:h-screen to pin it on desktop */}
                    <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                        <Sidebar closeMobileMenu={() => setIsMobileMenuOpen(false)} />
                    </div>

                    {/* Main Content Area - Removed overflow-hidden */}
                    <div className="flex-1 flex flex-col min-w-0">
                        
                        {/* Made Navbar sticky so it stays visible while scrolling the body */}
                        <div className="sticky top-0 z-30 bg-prime-bg">
                            <Navbar toggleMobileMenu={() => setIsMobileMenuOpen(true)} />
                        </div>
                        
                        {/* Removed overflow-y-auto so it scrolls with the natural body */}
                        <div className="flex-1">
                            <AppRouter />
                        </div>
                    </div>
                    
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;