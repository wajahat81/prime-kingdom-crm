import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

const AttendanceLogs = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await apiClient.get('/api/v1/users/?role=employee');
            setEmployees(response.data.data || []);
            setLoadingEmployees(false);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            setLoadingEmployees(false);
        }
    };

    const fetchAttendanceLogs = async (employeeId) => {
        if (!employeeId) {
            setAttendanceLogs([]);
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await apiClient.get(`/api/v1/attendance/history/${employeeId}`);
            setAttendanceLogs(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch attendance logs:', error);
            setError('Failed to load attendance logs');
            setAttendanceLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEmployeeChange = (e) => {
        const employeeId = e.target.value;
        setSelectedEmployee(employeeId);
        if (employeeId) {
            fetchAttendanceLogs(employeeId);
        } else {
            setAttendanceLogs([]);
        }
    };

    const getEmployeeName = (id) => {
        const emp = employees.find(e => e.id === id);
        return emp ? emp.full_name || emp.email || id : id;
    };

    if (loadingEmployees) {
        return (
            <div className="flex justify-center items-center h-64 w-full page-transition">
                <div className="w-8 h-8 border-4 border-prime-navy/20 border-t-prime-navy rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full page-transition">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-prime-text tracking-tight mb-1">Attendance Auditing</h1>
                <p className="text-sm text-prime-muted">Review historical shift logs and time tracking data.</p>
            </div>

            {/* Target Selector */}
            <div className="card-base p-6 mb-8 max-w-2xl">
                <label className="block text-sm font-bold text-prime-text mb-2">
                    Target Audit Subject
                </label>
                <select
                    value={selectedEmployee}
                    onChange={handleEmployeeChange}
                    className="input-base cursor-pointer shadow-sm"
                >
                    <option value="">Select an employee to generate report...</option>
                    {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                            {emp.full_name || emp.email}
                        </option>
                    ))}
                </select>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Reporting Table */}
            {selectedEmployee && (
                <div className="card-base overflow-hidden animate-fade-in">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-prime-text">
                            Shift Records: <span className="text-prime-navy">{getEmployeeName(selectedEmployee)}</span>
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-16 text-center">
                            <div className="w-6 h-6 border-2 border-prime-navy/20 border-t-prime-navy rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-sm font-medium text-prime-muted">Querying database...</p>
                        </div>
                    ) : attendanceLogs.length === 0 ? (
                        <div className="p-16 text-center text-prime-muted text-sm font-medium">
                            No shift records found for this subject.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-white">
                                    <tr>
                                        {['Date', 'Day', 'Clock In', 'Clock Out', 'Status'].map((head) => (
                                            <th key={head} className="px-6 py-4 text-left text-xs font-bold text-prime-muted uppercase tracking-wider">
                                                {head}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                    {attendanceLogs.map((log) => {
                                        const checkIn = log.check_in ? new Date(log.check_in) : null;
                                        const checkOut = log.check_out ? new Date(log.check_out) : null;
                                        const isCheckedIn = log.status === 'checked_in';
                                        
                                        return (
                                            <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-prime-text font-medium">
                                                    {checkIn ? checkIn.toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-prime-muted text-sm">
                                                    {checkIn ? checkIn.toLocaleDateString('en-US', { weekday: 'long' }) : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-prime-navy font-semibold">
                                                    {checkIn ? checkIn.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-prime-muted">
                                                    {checkOut ? checkOut.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                                                        isCheckedIn ? 'bg-prime-green/10 text-prime-green border-prime-green/20' : 'bg-gray-100 text-gray-600 border-gray-200'
                                                    }`}>
                                                        {isCheckedIn ? 'ACTIVE SHIFT' : 'COMPLETED'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AttendanceLogs;