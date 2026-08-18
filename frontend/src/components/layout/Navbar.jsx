import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import Modal from '../common/Modal';

const Navbar = ({ toggleMobileMenu }) => {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [shiftStatus, setShiftStatus] = useState('not_checked_in'); 
    const [checkInTime, setCheckInTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [confirmAction, setConfirmAction] = useState({ isOpen: false, type: null });
    const [errorMsg, setErrorMsg] = useState(null);

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

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    if (!user) return null;

    return (
        <header className={`bg-white h-[72px] border-b border-prime-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
            
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

            <div className="flex items-center gap-4">
                {/* Drawer Button now ALWAYS visible on all screen sizes */}
                <button 
                    onClick={toggleMobileMenu} 
                    className="text-prime-muted hover:text-prime-primary transition-colors focus:outline-none p-1"
                    title="Toggle Sidebar"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <Link to="/dashboard" className="flex items-center gap-3 group">
                    {/* Expanded horizontal container size for the logo */}
                    <div className="w-36 h-10 flex items-center justify-start">
                        <img src="/prime-kingdom-logo.png" alt="Prime Kingdom" className="w-full h-full object-contain object-left" />
                    </div>
                </Link>
            </div>
            
            <div className="flex items-center space-x-4 md:space-x-8">
                <div className="hidden sm:flex items-center">
                    {shiftStatus === 'not_checked_in' && (
                        <button onClick={() => setConfirmAction({ isOpen: true, type: 'in' })} disabled={isProcessing} className="px-4 py-1.5 bg-prime-primary text-white hover:bg-prime-secondary rounded-full text-xs font-bold transition-colors">
                            Commence Shift
                        </button>
                    )}
                    {shiftStatus === 'checked_in' && (
                        <button onClick={() => setConfirmAction({ isOpen: true, type: 'out' })} disabled={isProcessing} className="flex items-center gap-2 px-4 py-1.5 bg-prime-primary/10 text-prime-primary hover:bg-red-50 hover:text-red-600 rounded-full text-xs font-bold uppercase tracking-wider transition-colors group">
                            <span className="w-2 h-2 rounded-full bg-prime-primary animate-pulse group-hover:hidden"></span>
                            <span className="group-hover:hidden">{formatTime(elapsedTime)}</span>
                            <span className="hidden group-hover:block">End Shift</span>
                        </button>
                    )}
                    {shiftStatus === 'checked_out' && (
                        <span className="px-4 py-1.5 bg-gray-100 text-gray-500 rounded-full text-xs font-bold uppercase tracking-wider">Shift Complete</span>
                    )}
                </div>

                <div className="flex items-center gap-3 border-l border-gray-200 pl-4 md:pl-8">
                    <div className="w-9 h-9 rounded-full border border-prime-border bg-gray-50 text-prime-primary flex items-center justify-center font-bold text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div className="flex flex-col text-left hidden md:flex">
                        <span className="text-sm font-semibold text-prime-text">{user?.full_name || 'System User'}</span>
                        <span className="text-[11px] font-medium text-prime-muted capitalize">{user?.role?.replace('_', ' ')}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;