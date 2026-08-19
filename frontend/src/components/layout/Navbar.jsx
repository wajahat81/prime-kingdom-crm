import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const confirmLogout = () => {
        setIsLogoutModalOpen(false);
        logout();
    };

    return (
        <>
            <Modal 
                isOpen={isLogoutModalOpen} 
                onClose={() => setIsLogoutModalOpen(false)} 
                title="Sign Out"
                onConfirm={confirmLogout}
                confirmText="Sign Out"
            >
                <p className="text-sm font-medium text-prime-muted">Are you sure you want to log out of your secure workspace?</p>
            </Modal>

            <header className="h-16 bg-white border-b border-prime-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
                {/* Logo Section */}
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="flex items-center group">
                        <div className="w-[240px] sm:w-[360px] h-12 flex items-center justify-start overflow-hidden">
                            <img 
                                src="/prime-kingdom-logo.png" 
                                alt="Prime Kingdom" 
                                className="w-full h-full object-fill object-left scale-125 origin-left" 
                            />
                        </div>
                    </Link>
                </div>

                {/* Profile Section on Top Right */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-prime-text">{user?.name || 'User'}</p>
                            <p className="text-xs text-prime-muted capitalize">{user?.role?.replace('_', ' ') || 'Role'}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-prime-primary/10 flex items-center justify-center text-prime-primary font-bold">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-prime-border rounded-2xl shadow-lg py-2 z-50">
                            <div className="px-4 py-2 border-b border-prime-border sm:hidden">
                                <p className="text-sm font-semibold text-prime-text">{user?.name}</p>
                                <p className="text-xs text-prime-muted capitalize">{user?.role?.replace('_', ' ')}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    setIsLogoutModalOpen(true);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </header>
        </>
    );
};

export default Navbar;