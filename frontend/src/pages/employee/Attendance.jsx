import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import PageWrapper from '../../components/layout/PageWrapper';
import { supabase } from '../../services/supabaseClient';

const Attendance = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState(''); 
    
    // NEW: Live clock to keep active shift timers ticking
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000); // Ticks every 60 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchMyHistory = async () => {
            try {
                const response = await apiClient.get('/api/v1/attendance/history/me');
                setLogs(response.data.data || []);
            } catch (error) {
                console.error('Failed to fetch attendance history', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyHistory();

        // INSTANT SYNC: Refresh the table instantly when Navbar buttons are clicked
        window.addEventListener('shift-started-event', fetchMyHistory);
        window.addEventListener('shift-ended-event', fetchMyHistory);

        const myAttendanceChannel = supabase
            .channel('employee-my-attendance')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'attendance' },
                (payload) => {
                    setLogs((prevLogs) => {
                        if (payload.eventType === 'INSERT') {
                            return [payload.new, ...prevLogs];
                        } 
                        else if (payload.eventType === 'UPDATE') {
                            return prevLogs.map((log) => 
                                log.id === payload.new.id ? payload.new : log
                            );
                        } 
                        else if (payload.eventType === 'DELETE') {
                            return prevLogs.filter((log) => log.id !== payload.old.id);
                        }
                        return prevLogs;
                    });
                }
            )
            .subscribe();

        return () => {
            window.removeEventListener('shift-started-event', fetchMyHistory);
            window.removeEventListener('shift-ended-event', fetchMyHistory);
            supabase.removeChannel(myAttendanceChannel);
        };
    }, []);

    // FIXED: Uses the live 'now' clock for active shifts to count up dynamically
    const calculateTimeSpent = (checkIn, checkOut, status) => {
        if (!checkIn) return { text: '-', mins: 0 };
        
        const isCurrentlyActive = status === 'checked_in';
        const endTime = isCurrentlyActive ? now : (checkOut ? new Date(checkOut) : now);
        
        if (!endTime || isNaN(endTime)) return { text: '-', mins: 0 };
        
        let diffMs = endTime - new Date(checkIn);
        if (diffMs < 0) diffMs = 0; // Prevent negative math

        const diffMins = Math.floor(diffMs / 60000);
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        
        return { text: `${hrs}h ${mins}m`, mins: diffMins };
    };

    const filteredLogs = dateFilter 
        ? logs.filter(log => log.date === dateFilter) 
        : logs;

    return (
        <PageWrapper title="Attendance Management">
            <div className="max-w-4xl mx-auto w-full">
                <div className="mb-8 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-prime-text tracking-tight mb-1">Attendance Management</h1>
                        <p className="text-sm font-medium text-prime-muted">Review your shift history below.</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-prime-muted">Filter by Date:</label>
                        <input 
                            type="date" 
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="input-base text-sm py-2 px-3 shadow-sm cursor-pointer"
                        />
                        {dateFilter && (
                            <button 
                                onClick={() => setDateFilter('')} 
                                className="text-xs font-bold text-red-500 hover:text-red-700 underline"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="card-base flex flex-col min-h-[300px] overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide">
                            {dateFilter ? `Shift History for ${dateFilter}` : 'All-Time Shift History'}
                        </h3>
                    </div>
                    
                    <div className="overflow-x-auto w-full flex-grow">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-8 py-4 text-left text-[12px] font-bold text-gray-400">Date</th>
                                    <th className="px-8 py-4 text-left text-[12px] font-bold text-gray-400">Clock In / Out</th>
                                    <th className="px-8 py-4 text-left text-[12px] font-bold text-gray-400">Total Time</th>
                                    <th className="px-8 py-4 text-left text-[12px] font-bold text-gray-400">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-12 text-center text-prime-muted text-sm">
                                            Loading history...
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-16 text-center text-prime-primary/60 font-medium">
                                            {dateFilter ? `No records found for ${dateFilter}.` : 'Your past check-ins and check-outs will appear here.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => {
                                        const isCheckedIn = log.status === 'checked_in';
                                        
                                        const cIn = log.check_in ? new Date(log.check_in) : null;
                                        
                                        // FIXED: Force checkOut to null if shift is active, blocking any ghost timestamps
                                        const cOut = (log.check_out && !isCheckedIn) ? new Date(log.check_out) : null;
                                        
                                        const timeObj = calculateTimeSpent(cIn, cOut, log.status);

                                        const displayDate = log.date 
                                            ? new Date(log.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
                                            : '-';

                                        return (
                                            <tr key={log.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-800 font-medium">
                                                    {displayDate}
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500">
                                                    {cIn ? cIn.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'} 
                                                    <span className="mx-2 text-gray-300">→</span> 
                                                    {cOut ? cOut.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-prime-primary">
                                                    {timeObj.text}
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap">
                                                    {isCheckedIn ? (
                                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase">Active Shift</span>
                                                    ) : log.status === 'approved' || log.status === 'auto-approved' ? (
                                                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase">Approved</span>
                                                    ) : log.status === 'rejected' ? (
                                                        <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase">Rejected</span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold uppercase">Pending</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default Attendance;