import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import Modal from '../common/Modal';

const Navbar = ({ toggleMobileMenu }) => {
    // Added logout to useAuth extraction
    const { user, logout } = useAuth();
    
    // Scroll & Shift State
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [shiftStatus, setShiftStatus] = useState('not_checked_in'); 
    const [checkInTime, setCheckInTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [confirmAction, setConfirmAction] = useState({ isOpen: false, type: null });
    const [errorMsg, setErrorMsg] = useState(null);

    // Dropdown & Logout State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Scroll handler
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 70) setIsVisible(false);
            else setIsVisible(true);
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Attendance fetcher
    useEffect(() => {
        if (!user) return;
        const fetchAttendanceStatus = async () => {
            try {
                const response = await apiClient.get('/api/v1/attendance/status');
                if (response.data) {
                    setShiftStatus(response.data.status);
                    if (response.data.status === 'checked_in' && response.data.check_in_time) {
                        setCheckInTime(response.data.check_in_time);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch attendance status', error);
            }
        };
        fetchAttendanceStatus();
    }, [user]);

    // Timer logic
    useEffect(() => {
        let interval;
        if (shiftStatus === 'checked_in' && checkInTime) {
            interval = setInterval(() => {
                const diff = (new Date() - new Date(checkInTime)) / 1000;
                setElapsedTime(diff);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [shiftStatus, checkInTime]);

    const executeCheckIn = async () => {
        setIsProcessing(true);
        setErrorMsg(null);
        try {
            const response = await apiClient.post('/api/v1/attendance/check-in');
            if (response.data?.status === 'checked_in') {
                setShiftStatus('checked_in');
                setCheckInTime(response.data.check_in_time || new Date().toISOString());
                setElapsedTime(0);
                setConfirmAction({ isOpen: false, type: null });
            }
        } catch (error) {
            setErrorMsg('Failed to communicate with timesheet servers.');
        } finally {
            setIsProcessing(false);
        }
    };

    const executeCheckOut = async () => {
        setIsProcessing(true);
        setErrorMsg(null);
        try {
            await apiClient.post('/api/v1/attendance/check-out');
            setShiftStatus('checked_out');
            setCheckInTime(null);
            setConfirmAction({ isOpen: false, type: null });
        } catch (error) {
            setErrorMsg('Failed to end shift properly.');
        } finally {
            setIsProcessing(false);
        }
    };

    const confirmLogout = () => {
        setIsLogoutModalOpen(false);
        logout();
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    if (!user) return null;

    return (
        <header className={`bg-white min-h-[72px] py-3 border-b border-prime-border flex flex-wrap md:flex-nowrap items-center justify-between px-4 md:px-8 sticky top-0 z-30 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
            
            {/* Shift Modal */}
            <Modal 
                isOpen={confirmAction.isOpen} 
                onClose={() => { setConfirmAction({ isOpen: false, type: null }); setErrorMsg(null); }} 
                title={confirmAction.type === 'in' ? "Start Shift" : "End Shift"}
                onConfirm={confirmAction.type === 'in' ? executeCheckIn : executeCheckOut}
                confirmText={isProcessing ? "Processing..." : "Proceed"}
            >
                <div className="space-y-4">
                    <p className="text-sm text-prime-muted">Are you sure you want to {confirmAction.type === 'in' ? 'start' : 'end'} your shift?</p>
                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-semibold text-center">
                            {errorMsg}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Logout Modal */}
            <Modal 
                isOpen={isLogoutModalOpen} 
                onClose={() => setIsLogoutModalOpen(false)} 
                title="Sign Out"
                onConfirm={confirmLogout}
                confirmText="Sign Out"
            >
                <p className="text-sm font-medium text-prime-muted">Are you sure you want to log out of your secure workspace?</p>
            </Modal>

            {/* Left Section: Menu Toggle & Logo */}
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                <button 
                    onClick={toggleMobileMenu} 
                    className="text-prime-muted hover:text-prime-primary transition-colors focus:outline-none p-1"
                    title="Toggle Sidebar"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <Link to="/dashboard" className="flex items-center group">
                    <div className="w-32 sm:w-52 h-8 sm:h-10 flex items-center justify-start">
                        <img src="/prime-kingdom-logo.png" alt="Prime Kingdom" className="w-full h-full object-contain object-left" />
                    </div>
                </Link>
            </div>
            
            {/* Right Section: Shift Buttons & User Profile */}
            <div className="flex items-center justify-end gap-3 md:space-x-8 mt-2 md:mt-0 flex-grow md:flex-grow-0">
                
                {/* Shift Controls */}
                <div className="flex items-center">
                    {shiftStatus === 'not_checked_in' && (
                        <button onClick={() => setConfirmAction({ isOpen: true, type: 'in' })} disabled={isProcessing} className="px-3 py-1.5 md:px-4 bg-prime-primary text-white hover:bg-prime-secondary rounded-full text-[10px] md:text-xs font-bold transition-colors whitespace-nowrap">
                            Commence Shift
                        </button>
                    )}
                    {shiftStatus === 'checked_in' && (
                        <button onClick={() => setConfirmAction({ isOpen: true, type: 'out' })} disabled={isProcessing} className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 bg-prime-primary/10 text-prime-primary hover:bg-red-50 hover:text-red-600 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors group whitespace-nowrap">
                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-prime-primary animate-pulse group-hover:hidden"></span>
                            <span className="group-hover:hidden">{formatTime(elapsedTime)}</span>
                            <span className="hidden group-hover:block">End Shift</span>
                        </button>
                    )}
                    {shiftStatus === 'checked_out' && (
                        <span className="px-3 md:px-4 py-1.5 bg-gray-100 text-gray-500 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap">Shift Complete</span>
                    )}
                </div>

                {/* User Profile with Dropdown */}
                <div className="relative border-l border-gray-200 pl-3 md:pl-8" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 md:gap-3 p-1 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none text-left"
                    >
                        <div className="w-7 h-7 md:w-9 md:h-9 rounded-full border border-prime-border bg-gray-50 text-prime-primary flex items-center justify-center font-bold text-xs md:text-sm flex-shrink-0">
                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-[11px] md:text-sm font-semibold text-prime-text leading-tight truncate max-w-[80px] md:max-w-none">{user?.full_name || 'System User'}</span>
                            <span className="text-[9px] md:text-[11px] font-medium text-prime-muted capitalize leading-tight">{user?.role?.replace('_', ' ')}</span>
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-prime-border rounded-xl shadow-lg py-1.5 z-50">
                            {/* Change Password Link */}
                            <Link
                                to="/change-password"
                                onClick={() => setIsDropdownOpen(false)}
                                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-prime-text hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Change Password
                            </Link>

                            {/* Sign Out Button */}
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
            </div>
        </header>
    );
};

export default Navbar;