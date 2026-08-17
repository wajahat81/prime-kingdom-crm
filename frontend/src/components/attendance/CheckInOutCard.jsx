import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Button from '../common/Button';

const CheckInOutCard = () => {
    const [shiftStatus, setShiftStatus] = useState('not_checked_in'); 
    const [checkInTime, setCheckInTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false); 
    const [timerInterval, setTimerInterval] = useState(null);
    const [error, setError] = useState(null);

    const WORK_HOURS = 9;
    const WORK_SECONDS = WORK_HOURS * 3600;

    useEffect(() => {
        fetchAttendanceStatus();
        return () => {
            if (timerInterval) clearInterval(timerInterval);
        };
    }, []);

    useEffect(() => {
        if (shiftStatus === 'checked_in' && checkInTime) {
            const interval = setInterval(() => {
                const now = new Date();
                const diff = (now - new Date(checkInTime)) / 1000;
                setElapsedTime(Math.min(diff, WORK_SECONDS));
                
                if (diff >= WORK_SECONDS) {
                    handleAutoCheckout();
                }
            }, 1000);
            setTimerInterval(interval);
            
            return () => clearInterval(interval);
        } else {
            if (timerInterval) {
                clearInterval(timerInterval);
                setTimerInterval(null);
            }
        }
    }, [shiftStatus, checkInTime]);

    const fetchAttendanceStatus = async () => {
        try {
            setError(null);
            const response = await apiClient.get('/api/v1/attendance/status');
            const data = response.data;
            
            if (data) {
                setShiftStatus(data.status);
                
                if (data.status === 'checked_in' && data.check_in_time) {
                    setCheckInTime(data.check_in_time);
                    const diff = (new Date() - new Date(data.check_in_time)) / 1000;
                    setElapsedTime(Math.min(diff, WORK_SECONDS));
                } else if (data.status === 'checked_out') {
                    setElapsedTime(WORK_SECONDS);
                }
            }
        } catch (error) {
            console.error('Failed to fetch attendance status:', error);
            setError('Failed to load attendance status');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (isProcessing) return; 
        setIsProcessing(true);
        setError(null);
        
        try {
            const response = await apiClient.post('/api/v1/attendance/check-in');
            const data = response.data;
            
            if (data && data.status === 'checked_in') {
                setShiftStatus('checked_in');
                setCheckInTime(data.check_in_time || new Date().toISOString());
                setElapsedTime(0);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Failed to check in. Please try again.';
            setError(errorMsg);
        } finally {
            setIsProcessing(false); 
        }
    };

    const handleAutoCheckout = async () => {
        try {
            await apiClient.post('/api/v1/attendance/check-out');
            setShiftStatus('checked_out');
            setCheckInTime(null);
            setElapsedTime(WORK_SECONDS);
            if (timerInterval) {
                clearInterval(timerInterval);
                setTimerInterval(null);
            }
        } catch (error) {
            console.error('Auto checkout failed:', error);
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const getProgressPercentage = () => {
        return Math.min((elapsedTime / WORK_SECONDS) * 100, 100);
    };

    if (loading) {
        return (
            <div className="card-base p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                <div className="w-8 h-8 border-4 border-prime-navy/20 border-t-prime-navy rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-medium text-prime-muted">Synchronizing shift data...</p>
            </div>
        );
    }

    return (
        <div className="card-base p-8 min-w-[280px] relative overflow-hidden transition-all duration-300">
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2 rounded-lg mb-4 text-center font-medium">
                    {error}
                </div>
            )}
            
            {/* STATE 1: Ready to start shift */}
            {shiftStatus === 'not_checked_in' && (
                <div className="text-center page-transition">
                    <div className="w-16 h-16 bg-prime-bg rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-prime-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-prime-text mb-1">Ready for your shift?</h3>
                    <p className="text-sm text-prime-muted mb-6">Log your attendance to begin tracking hours.</p>
                    <Button 
                        onClick={handleCheckIn}
                        disabled={isProcessing}
                        variant="success"
                        className="w-full text-base py-3"
                    >
                        {isProcessing ? 'Authenticating...' : 'Commence Shift'}
                    </Button>
                </div>
            )}

            {/* STATE 2: Actively working */}
            {shiftStatus === 'checked_in' && (
                <div className="text-center page-transition">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-prime-green/10 text-prime-green rounded-full mb-6 border border-prime-green/20">
                        <span className="w-2 h-2 rounded-full bg-prime-green animate-pulse"></span>
                        <span className="text-xs font-bold uppercase tracking-wider">Active Shift</span>
                    </div>
                    
                    <p className="text-4xl font-mono font-bold text-prime-navy tracking-tight mb-6">
                        {formatTime(elapsedTime)}
                    </p>

                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs font-medium text-prime-muted">
                            <span>Started: {new Date(checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <span>{WORK_HOURS}h Target</span>
                        </div>
                        <div className="relative w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="absolute top-0 left-0 h-full bg-prime-green rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${getProgressPercentage()}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* STATE 3: Shift completed for the day */}
            {shiftStatus === 'checked_out' && (
                <div className="text-center page-transition">
                    <div className="w-16 h-16 bg-prime-navy/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-prime-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-prime-text mb-1">Shift Completed</h3>
                    <p className="text-sm text-prime-muted mb-4">
                        You have successfully logged your {WORK_HOURS}-hour shift today.
                    </p>
                    <p className="text-2xl font-mono font-bold text-gray-300">
                        {formatTime(WORK_HOURS * 3600)}
                    </p>
                </div>
            )}
        </div>
    );
};

export default CheckInOutCard;