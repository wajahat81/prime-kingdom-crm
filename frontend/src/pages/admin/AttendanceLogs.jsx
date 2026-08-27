import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import PageWrapper from '../../components/layout/PageWrapper';
import { supabase } from '../../services/supabaseClient';

const getLocalDateStr = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
};

const AttendanceLogs = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
    
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [officeSettings, setOfficeSettings] = useState(null);

    // NEW: Live clock to keep active timers ticking
    const [now, setNow] = useState(new Date());
    
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000); // Ticks every 60 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedEmployee === 'all') {
            if (!selectedDate) setSelectedDate(getLocalDateStr());
        } else {
            setSelectedDate('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEmployee]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await apiClient.get('/api/v1/users/');
                const allUsers = response.data.data || response.data || [];
                
                const filteredUsers = allUsers.filter(u => u.role === 'employee' || u.role === 'closer' || u.role === 'admin');
                
                // Sort employees alphabetically by full name
                filteredUsers.sort((a, b) => (a.full_name || a.email || '').localeCompare(b.full_name || b.email || ''));
                
                setEmployees(filteredUsers);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await apiClient.get('/api/v1/attendance/settings');
                setOfficeSettings(res.data.data.setting_value);
            } catch (error) {
                console.error("Failed to load settings", error);
            }
        };
        fetchSettings();
    }, []);

    const fetchAttendanceData = async () => {
        setLoading(true);
        setStatusMessage(null);
        try {
            if (selectedEmployee === 'all') {
                const targetDate = selectedDate || getLocalDateStr();
                const response = await apiClient.get(`/api/v1/attendance/date/${targetDate}`);
                setAttendanceLogs(response.data.data || []);
            } else {
                const response = await apiClient.get(`/api/v1/attendance/history/${selectedEmployee}`);
                setAttendanceLogs(response.data.data || []);
            }
        } catch (error) {
            setAttendanceLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Subscribe to real-time changes on the attendance table
        const attendanceChannel = supabase
            .channel('live-attendance')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'attendance' },
                (payload) => {
                    console.log('Live Attendance Update:', payload);

                    // Use functional state update to modify the array directly
                    setAttendanceLogs((prevLogs) => {
                        
                        if (payload.eventType === 'INSERT') {
                            // Someone checked in: Add the new record to the top of the list
                            return [payload.new, ...prevLogs];
                        } 
                        
                        else if (payload.eventType === 'UPDATE') {
                            // Someone checked out or Admin approved: Replace only the changed row
                            return prevLogs.map((log) => 
                                log.id === payload.new.id ? payload.new : log
                            );
                        } 
                        
                        else if (payload.eventType === 'DELETE') {
                            // Admin deleted a record: Remove it from the UI instantly
                            return prevLogs.filter((log) => log.id !== payload.old.id);
                        }

                        return prevLogs;
                    });
                }
            )
            .subscribe();

        // Cleanup the connection when leaving the page
        return () => {
            supabase.removeChannel(attendanceChannel);
        };
    }, []); 

    useEffect(() => {
        if (selectedEmployee === 'all' && !selectedDate) return; 
        fetchAttendanceData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEmployee, selectedDate]);

    const handleDirectStatusUpdate = async (logId, actionType) => {
        setStatusMessage(null);
        try {
            await apiClient.put(`/api/v1/attendance/${logId}/status`, { status: actionType });
            setStatusMessage({ type: 'success', text: `Timesheet securely ${actionType}.` });
            
            // Update ONLY this specific row in local state
            setAttendanceLogs(prevLogs => prevLogs.map(item => 
                item.id === logId 
                    ? { ...item, status: actionType } 
                    : item
            ));
            
        } catch (error) {
            setStatusMessage({ type: 'error', text: `Failed to ${actionType} attendance record.` });
        }
    };

    const calculateTimeSpent = (checkIn, checkOut, status) => {
        if (!checkIn) return { text: '-', mins: 0 };
        
        // ULTIMATE FAILSAFE: If the status is checked_in, completely ignore any ghost checkout times from the DB
        const isCurrentlyActive = status === 'checked_in';
        const endTime = isCurrentlyActive ? now : (checkOut ? new Date(checkOut) : now);
        
        if (!endTime || isNaN(endTime)) return { text: '-', mins: 0 };
        
        let diffMs = endTime - new Date(checkIn);
        if (diffMs < 0) diffMs = 0;

        const diffMins = Math.floor(diffMs / 60000);
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        
        return { text: `${hrs}h ${mins}m`, mins: diffMins };
    };

    let displayData = [];
    if (selectedEmployee === 'all') {
        const targetDate = selectedDate || getLocalDateStr();
        displayData = employees.map(emp => {
            const log = attendanceLogs.find(l => l.employee_id === emp.id);
            return { uniqueKey: emp.id, employee: emp, log: log || null, recordDate: targetDate };
        });
        
        // Sort displayData alphabetically by employee name
        displayData.sort((a, b) => (a.employee.full_name || '').localeCompare(b.employee.full_name || ''));
    } else {
        const emp = employees.find(e => e.id === selectedEmployee);
        const filteredLogs = selectedDate ? attendanceLogs.filter(l => l.date === selectedDate) : attendanceLogs;
        
        if (selectedDate && filteredLogs.length === 0) {
            displayData = [{ uniqueKey: 'empty', employee: emp, log: null, recordDate: selectedDate }];
        } else {
            displayData = filteredLogs.map(log => ({ uniqueKey: log.id, employee: emp, log: log, recordDate: log.date }));
        }
    }

    return (
        <PageWrapper title="Attendance Auditing">
            <div className="flex justify-between items-center mb-8 px-2">
                <h1 className="text-2xl font-bold text-prime-text">Attendance Logs</h1>
            </div>

            {statusMessage && (
                <div className={`px-6 py-3 mb-6 rounded-full text-sm font-medium text-center ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {statusMessage.text}
                </div>
            )}

            <div className="card-base p-6 mb-8 bg-white flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 w-full min-w-[200px]">
                    <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Employee Filter</label>
                    <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="input-base cursor-pointer">
                        <option value="all">All Employees</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role.replace('_', ' ')})</option>
                        ))}
                    </select>
                </div>
                <div className="w-full md:w-auto">
                    <div className="flex items-center justify-between mb-2 ml-2">
                        <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider">Date Filter</label>
                        {selectedEmployee !== 'all' && selectedDate && (
                            <button onClick={() => setSelectedDate('')} className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider">
                                Clear Date
                            </button>
                        )}
                    </div>
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)} 
                        className="input-base shadow-sm !w-full md:!w-fit font-semibold cursor-pointer" 
                    />
                </div>
            </div>

            <div className="card-base flex flex-col min-h-[400px] w-full overflow-hidden">
                <div className="overflow-x-auto w-full flex-grow">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-6 text-left text-[13px] font-bold text-gray-400">Date</th>
                                <th className="px-6 py-6 text-left text-[13px] font-bold text-gray-400">Employee</th>
                                <th className="px-6 py-6 text-left text-[13px] font-bold text-gray-400">Check In / Out</th>
                                <th className="px-6 py-6 text-left text-[13px] font-bold text-gray-400">Total Time</th>
                                <th className="px-6 py-6 text-left text-[13px] font-bold text-gray-400">Status</th>
                                <th className="px-6 py-6 text-right text-[13px] font-bold text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {loading ? (
                                <tr><td colSpan="6" className="px-8 py-20 text-center text-prime-muted text-sm">Querying database...</td></tr>
                            ) : displayData.length === 0 ? (
                                <tr><td colSpan="6" className="px-8 py-32 text-center text-prime-primary/60 text-sm font-medium">No records found.</td></tr>
                            ) : (
                                displayData.map(({ uniqueKey, employee, log, recordDate }) => {
                                    
                                    const displayDateObj = recordDate ? new Date(recordDate) : new Date();
                                    const formattedDate = displayDateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

                                    if (!log) {
                                        return (
                                            <tr key={uniqueKey} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors bg-red-50/30">
                                                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-semibold">{formattedDate}</td>
                                                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-800 font-bold">{employee.full_name} <span className="text-[10px] text-gray-400 font-normal block capitalize">{employee.role}</span></td>
                                                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-400">-</td>
                                                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-400">-</td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase">Not Checked In</span>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-right">-</td>
                                            </tr>
                                        );
                                    }

                                    const isCheckedIn = log.status === 'checked_in';

                                    const cIn = log.check_in ? new Date(log.check_in) : null;
                                    
                                    // FIXED REOPEN BUG: Force cOut to be strictly null if the shift is currently active, ignoring old DB timestamps
                                    const cOut = (log.check_out && !isCheckedIn) ? new Date(log.check_out) : null;
                                    
                                    const timeObj = calculateTimeSpent(cIn, cOut, log.status);

                                    // Dynamic Late Calculation (Check-in rules)
                                    const rules = officeSettings || {
                                        standard: { start_time: "13:00", grace_mins: 10, req_hours: 9 },
                                        friday: { start_time: "15:00", grace_mins: 10, req_hours: 7 },
                                        saturday: { start_time: "14:00", grace_mins: 10, req_hours: 5.75 }
                                    };

                                    let isLate = false;
                                    let isEarlyCheckout = false;

                                    if (cIn) {
                                        const dayOfWeek = cIn.getDay(); 
                                        
                                        // Determine which day profile to use
                                        let dayProfile = rules.standard;
                                        if (dayOfWeek === 5) dayProfile = rules.friday;
                                        if (dayOfWeek === 6) dayProfile = rules.saturday;

                                        // 1. DYNAMIC LATE CALCULATION
                                        const [startHour, startMin] = dayProfile.start_time.split(':').map(Number);
                                        const cInHour = cIn.getHours();
                                        const cInMin = cIn.getMinutes();
                                        
                                        // Late if hour is greater, OR if hour is same but minutes exceed grace period
                                        if (cInHour > startHour || (cInHour === startHour && cInMin > startMin + dayProfile.grace_mins)) {
                                            isLate = true;
                                        }

                                        // 2. DYNAMIC EARLY OUT CALCULATION
                                        if (cOut && !isCheckedIn) {
                                            const totalMins = timeObj.mins;
                                            const requiredMins = dayProfile.req_hours * 60;
                                            isEarlyCheckout = totalMins < requiredMins;
                                        }
                                    }
                                    
                                    return (
                                        <tr key={uniqueKey} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-semibold">{formattedDate}</td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-800 font-bold">{employee.full_name} <span className="text-[10px] text-gray-400 font-normal block capitalize">{employee.role}</span></td>
                                            
                                            {/* Apply Late Highlighting to text and add 'Late' badge only */}
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={isLate ? 'text-red-500 font-bold' : ''}>
                                                        {cIn ? cIn.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'} 
                                                    </span>
                                                    {isLate && (
                                                        <span className="bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Late</span>
                                                    )}
                                                    <span className="mx-1 text-gray-300">→</span> 
                                                    <span className={isEarlyCheckout ? 'text-amber-600 font-bold' : ''}>
                                                        {cOut ? cOut.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}
                                                    </span>
                                                    {isEarlyCheckout && (
                                                        <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                            Incomplete Shift
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-prime-primary">
                                                {timeObj.text}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                {isCheckedIn ? (
                                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase">Active Shift</span>
                                                ) : log.status === 'approved' || log.status === 'auto-approved' ? (
                                                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase">Approved</span>
                                                ) : log.status === 'rejected' ? (
                                                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase">Rejected</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold uppercase">Needs Approval</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2 items-center">
                                                    {!isCheckedIn && (
                                                        <>
                                                            <button onClick={() => handleDirectStatusUpdate(log.id, 'approved')} className="text-green-600 hover:text-green-800 text-xs font-bold uppercase">Approve</button>
                                                            <button onClick={() => handleDirectStatusUpdate(log.id, 'rejected')} className="text-red-600 hover:text-red-800 text-xs font-bold uppercase mx-2">Reject</button>
                                                        </>
                                                    )}
                                                    
                                                    {/* Reopen Button for prematurely closed shifts */}
                                                    {log.status === 'checked_out' && (
                                                    <button 
                                                    onClick={async () => {
                                                        try {
                                                            // Hit the specific FastAPI reopen route
                                                            await apiClient.put(`/api/v1/attendance/${log.id}/reopen`);
                                                            
                                                            // Instantly update the Admin UI
                                                            setAttendanceLogs(prevLogs => prevLogs.map(item => 
                                                                item.id === log.id 
                                                                    ? { ...item, check_out: null, status: 'checked_in' } 
                                                                    : item
                                                            ));
                                                        } catch (error) {
                                                            console.error("Failed to reopen shift", error);
                                                        }
                                                    }} 
                                                    className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase ml-2"
                                                >
                                                    Reopen
                                                </button>
                                            )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </PageWrapper>
    );
};

export default AttendanceLogs;