import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import PageWrapper from '../../components/layout/PageWrapper';

const Attendance = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

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
    }, []);

    const calculateTimeSpent = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return { text: '-', mins: 0 };
        const diffMs = new Date(checkOut) - new Date(checkIn);
        const diffMins = Math.floor(diffMs / 60000);
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return { text: `${hrs}h ${mins}m`, mins: diffMins };
    };

    return (
        <PageWrapper title="Attendance Management">
            <div className="max-w-4xl mx-auto w-full">
                <div className="mb-8 px-2">
                    <h1 className="text-2xl font-bold text-prime-text tracking-tight mb-1">Attendance Management</h1>
                    <p className="text-sm font-medium text-prime-muted">Review your shift history below. Use the button in the top navigation bar to start or end your active shift.</p>
                </div>
                
                <div className="card-base flex flex-col min-h-[300px] overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide">Recent Shift History</h3>
                    </div>
                    
                    <div className="overflow-x-auto w-full flex-grow">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-8 py-4 text-left text-[12px] font-bold text-gray-400">Date</th>
                                    <th className="px-8 py-4 text-left text-[12px] font-bold text-gray-400">Check In / Out</th>
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
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-16 text-center text-prime-primary/60 font-medium">
                                            Your past check-ins and check-outs will appear here.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => {
                                        const cIn = log.check_in ? new Date(log.check_in) : null;
                                        const cOut = log.check_out ? new Date(log.check_out) : null;
                                        const timeObj = calculateTimeSpent(cIn, cOut);
                                        const isCheckedIn = log.status === 'checked_in';

                                        // FIX: Securely format the actual database 'date' column using UTC 
                                        // so it never shifts due to local timezones!
                                        const displayDate = log.date 
                                            ? new Date(log.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
                                            : '-';

                                        return (
                                            <tr key={log.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                                                
                                                {/* FIX: Now using the displayDate variable we created above */}
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