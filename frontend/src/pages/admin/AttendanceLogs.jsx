import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import PageWrapper from '../../components/layout/PageWrapper';

const getLocalDateStr = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
};

const AttendanceLogs = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
    
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await apiClient.get('/api/v1/users/');
                const allUsers = response.data.data || response.data || [];
                // Filter out admins so we only track agents and closers
                setEmployees(allUsers.filter(u => u.role === 'employee' || u.role === 'closer'));
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };
        fetchUsers();
    }, []);

    const fetchDailyData = async () => {
        setLoading(true);
        setStatusMessage(null);
        try {
            const response = await apiClient.get(`/api/v1/attendance/date/${selectedDate}`);
            setAttendanceLogs(response.data.data || []);
        } catch (error) {
            setAttendanceLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedDate) fetchDailyData();
    }, [selectedDate]);

    const handleDirectStatusUpdate = async (logId, actionType) => {
        setStatusMessage(null);
        try {
            await apiClient.put(`/api/v1/attendance/${logId}/status`, { status: actionType });
            setStatusMessage({ type: 'success', text: `Timesheet securely ${actionType}.` });
            fetchDailyData(); 
        } catch (error) {
            setStatusMessage({ type: 'error', text: `Failed to ${actionType} attendance record.` });
        }
    };

    const calculateTimeSpent = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return { text: '-', mins: 0 };
        const diffMs = new Date(checkOut) - new Date(checkIn);
        const diffMins = Math.floor(diffMs / 60000);
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return { text: `${hrs}h ${mins}m`, mins: diffMins };
    };

    const displayData = employees.map(emp => {
        const log = attendanceLogs.find(l => l.employee_id === emp.id);
        return { employee: emp, log: log || null };
    }).filter(data => selectedEmployee === 'all' || data.employee.id === selectedEmployee);

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

            <div className="card-base p-6 mb-8 bg-white flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Employee Filter</label>
                    <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="input-base cursor-pointer">
                        <option value="all">All Employees</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role.replace('_', ' ')})</option>
                        ))}
                    </select>
                </div>
                <div className="w-full sm:w-auto">
                    <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Date Filter</label>
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)} 
                        className="input-base shadow-sm !w-full sm:!w-fit font-semibold cursor-pointer" 
                    />
                </div>
            </div>

            <div className="card-base flex flex-col min-h-[400px] w-full overflow-hidden">
                <div className="overflow-x-auto w-full flex-grow">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-6 text-left text-[13px] font-bold text-gray-400">Employee</th>
                                <th className="px-6 py-6 text-left text-[13px] font-bold text-gray-400">Check In / Out</th>
                                <th className="px-6 py-6 text-left text-[13px] font-bold text-gray-400">Total Time</th>
                                <th className="px-6 py-6 text-left text-[13px] font-bold text-gray-400">Status</th>
                                <th className="px-6 py-6 text-right text-[13px] font-bold text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {loading ? (
                                <tr><td colSpan="5" className="px-8 py-20 text-center text-prime-muted text-sm">Querying database...</td></tr>
                            ) : displayData.length === 0 ? (
                                <tr><td colSpan="5" className="px-8 py-32 text-center text-prime-primary/60 text-sm font-medium">No records found.</td></tr>
                            ) : (
                                displayData.map(({ employee, log }) => {
                                    if (!log) {
                                        return (
                                            <tr key={employee.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors bg-red-50/30">
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

                                    const cIn = log.check_in ? new Date(log.check_in) : null;
                                    const cOut = log.check_out ? new Date(log.check_out) : null;
                                    const timeObj = calculateTimeSpent(cIn, cOut);
                                    const isCheckedIn = log.status === 'checked_in';
                                    
                                    return (
                                        <tr key={log.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-800 font-bold">{employee.full_name} <span className="text-[10px] text-gray-400 font-normal block capitalize">{employee.role}</span></td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                                                {cIn ? cIn.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'} 
                                                <span className="mx-2">→</span> 
                                                {cOut ? cOut.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}
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