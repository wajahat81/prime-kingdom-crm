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
            setError('Failed to load status');
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
            setError(error.response?.data?.detail || 'Failed to check in.');
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
                <div className="w-8 h-8 border-4 border-prime-primary/20 border-t-prime-primary rounded-full animate-spin mb-4"></div>
            </div>
        );
    }

    return (
        <div className="card-base p-8 min-w-[280px] relative overflow-hidden bg-white">
            {error && (
                <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-full mb-4 text-center font-medium">
                    {error}
                </div>
            )}
            
            {shiftStatus === 'not_checked_in' && (
                <div className="text-center">
                    <h3 className="text-lg font-bold text-prime-text mb-1">Ready for your shift?</h3>
                    <p className="text-sm text-prime-muted mb-6">Log your attendance to begin tracking hours.</p>
                    <Button 
                        onClick={handleCheckIn}
                        disabled={isProcessing}
                        variant="primary"
                        className="w-full text-base py-3"
                    >
                        {isProcessing ? 'Authenticating...' : 'Check-in'}
                    </Button>
                </div>
            )}

            {shiftStatus === 'checked_in' && (
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-prime-primary/10 text-prime-primary rounded-full mb-6">
                        <span className="w-2 h-2 rounded-full bg-prime-primary animate-pulse"></span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Active Shift</span>
                    </div>
                    
                    <p className="text-4xl font-mono font-bold text-prime-text tracking-tight mb-6">
                        {formatTime(elapsedTime)}
                    </p>

                    <div className="space-y-2 mb-2">
                        <div className="flex justify-between text-[11px] font-semibold text-prime-muted uppercase tracking-wider">
                            <span>Started: {new Date(checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <span>{WORK_HOURS}h Target</span>
                        </div>
                        <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="absolute top-0 left-0 h-full bg-prime-primary rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${getProgressPercentage()}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {shiftStatus === 'checked_out' && (
                <div className="text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-prime-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-prime-text mb-1">Shift Completed</h3>
                    <p className="text-sm text-prime-muted mb-4">
                        You have successfully logged your {WORK_HOURS}-hour shift today.
                    </p>
                </div>
            )}
        </div>
    );
};

export default CheckInOutCard;