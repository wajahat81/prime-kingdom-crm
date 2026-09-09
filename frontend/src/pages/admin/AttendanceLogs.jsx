import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import PageWrapper from '../../components/layout/PageWrapper';
import { supabase } from '../../services/supabaseClient';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext'; 

const getLocalDateStr = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
};

// Limit increased to 365 days (1 year)
const getDatesInRange = (startStr, endStr) => {
    const arr = [];
    let current = new Date(`${startStr}T00:00:00`);
    const end = new Date(`${endStr}T00:00:00`);
    
    let safetyCounter = 0; 
    while (current <= end && safetyCounter < 365) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        arr.push(`${year}-${month}-${day}`);
        current.setDate(current.getDate() + 1);
        safetyCounter++;
    }
    return arr;
};

const AttendanceLogs = () => {
    const { user } = useAuth(); 
    const [employees, setEmployees] = useState([]);
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('all'); 
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    
    const [filterMode, setFilterMode] = useState('date'); 
    const [specificDate, setSpecificDate] = useState(getLocalDateStr());
    const [fromDate, setFromDate] = useState(getLocalDateStr());
    const [toDate, setToDate] = useState(getLocalDateStr());
    
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
    
    // NEW: Cache architecture for lazy page-by-page loading
    const [attendanceCache, setAttendanceCache] = useState({});
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [officeSettings, setOfficeSettings] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [editCheckIn, setEditCheckIn] = useState('');
    const [editCheckOut, setEditCheckOut] = useState('');

    const [now, setNow] = useState(new Date());

    const [page, setPage] = useState(1);
    const limit = 50;
    
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await apiClient.get('/api/v1/users/');
                const allUsers = response.data.data || response.data || [];
                const filteredUsers = allUsers.filter(u => u.role === 'employee' || u.role === 'closer' || u.role === 'admin');
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

    // Reset pagination on filter change
    useEffect(() => {
        setPage(1);
    }, [selectedRoleFilter, selectedEmployee, selectedStatusFilter, filterMode, specificDate, fromDate, toDate]);

    // Realtime Sync directly to Cache
    useEffect(() => {
        const attendanceChannel = supabase
            .channel('live-attendance')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, (payload) => {
                setAttendanceCache((prevCache) => {
                    const record = payload.new || payload.old;
                    const date = record.date;
                    if (!prevCache[date]) return prevCache; 

                    let currentLogs = [...prevCache[date]];
                    if (payload.eventType === 'INSERT') {
                        currentLogs.push(payload.new);
                    } else if (payload.eventType === 'UPDATE') {
                        currentLogs = currentLogs.map(l => l.id === payload.new.id ? payload.new : l);
                    } else if (payload.eventType === 'DELETE') {
                        currentLogs = currentLogs.filter(l => l.id !== payload.old.id);
                    }
                    
                    return { ...prevCache, [date]: currentLogs };
                });
            })
            .subscribe();

        return () => supabase.removeChannel(attendanceChannel);
    }, []);

    const handleDirectStatusUpdate = async (logId, actionType) => {
        setStatusMessage(null);
        try {
            await apiClient.put(`/api/v1/attendance/${logId}/status`, { status: actionType });
            setStatusMessage({ type: 'success', text: `Timesheet securely ${actionType}.` });
            
            // Update cache locally
            setAttendanceCache(prev => {
                const newCache = { ...prev };
                for (const date in newCache) {
                    const idx = newCache[date].findIndex(l => l.id === logId);
                    if (idx !== -1) {
                        newCache[date] = [...newCache[date]];
                        newCache[date][idx] = { ...newCache[date][idx], status: actionType };
                        break;
                    }
                }
                return newCache;
            });
        } catch (error) {
            setStatusMessage({ type: 'error', text: error.response?.data?.detail || `Failed to ${actionType} attendance record.` });
        }
    };

    const openEditModal = (log) => {
        setEditingLog(log);
        const toPKTInputString = (isoString) => {
            if (!isoString) return '';
            const date = new Date(isoString);
            const options = { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
            const formatter = new Intl.DateTimeFormat('en-CA', options);
            const parts = formatter.formatToParts(date);
            const getPart = (type) => parts.find(p => p.type === type)?.value || '';
            return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}`;
        };
        setEditCheckIn(toPKTInputString(log.check_in));
        setEditCheckOut(toPKTInputString(log.check_out));
        setIsEditModalOpen(true);
    };

    const handleSaveTimes = async (e) => {
        e.preventDefault();
        if (!editingLog) return;
        try {
            const formatForBackend = (localDateTimeStr) => {
                if (!localDateTimeStr) return null;
                return new Date(`${localDateTimeStr}+05:00`).toISOString();
            };
            const payload = {
                check_in: formatForBackend(editCheckIn),
                check_out: formatForBackend(editCheckOut)
            };
            await apiClient.put(`/api/v1/attendance/${editingLog.id}`, payload);
            setStatusMessage({ type: 'success', text: 'Attendance times updated successfully.' });
            setIsEditModalOpen(false);
            
            // Force refetch of that specific date
            if (editingLog.date) {
                setAttendanceCache(prev => {
                    const nc = { ...prev };
                    delete nc[editingLog.date]; // Deleting it from cache forces the lazy loader to fetch it again
                    return nc;
                });
            }
        } catch (err) {
            setStatusMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update attendance times.' });
        }
    };

    const calculateTimeSpent = (checkIn, checkOut, status) => {
        if (!checkIn) return { text: '-', mins: 0 };
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

    const checkIsLate = (log) => {
        if (!log || !log.check_in) return false;
        
        const cIn = new Date(log.check_in);
        const pktTimeStr = cIn.toLocaleString('en-US', { timeZone: 'Asia/Karachi', hour12: false });
        
        const timePart = pktTimeStr.includes(', ') ? pktTimeStr.split(', ')[1] : pktTimeStr.split(' ')[1];
        if (!timePart) return false;
        
        const [cInHour, cInMin] = timePart.split(':').map(Number);

        const rules = officeSettings || {
            standard: { start_time: "13:00", grace_mins: 10, req_hours: 9 },
            friday: { start_time: "15:00", grace_mins: 10, req_hours: 7 },
            saturday: { start_time: "14:00", grace_mins: 10, req_hours: 5.75 }
        };

        const dayOfWeekStr = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', weekday: 'short' }).format(cIn);
        let dayOfWeek = cIn.getDay();
        if (dayOfWeekStr === 'Sun') dayOfWeek = 0;
        else if (dayOfWeekStr === 'Mon') dayOfWeek = 1;
        else if (dayOfWeekStr === 'Tue') dayOfWeek = 2;
        else if (dayOfWeekStr === 'Wed') dayOfWeek = 3;
        else if (dayOfWeekStr === 'Thu') dayOfWeek = 4;
        else if (dayOfWeekStr === 'Fri') dayOfWeek = 5;
        else if (dayOfWeekStr === 'Sat') dayOfWeek = 6;

        let dayProfile = rules.standard;
        if (dayOfWeek === 5) dayProfile = rules.friday;
        if (dayOfWeek === 6) dayProfile = rules.saturday;

        if (!dayProfile || !dayProfile.start_time) return false;

        const [startHour, startMin] = dayProfile.start_time.split(':').map(Number);
        const totalGraceMinutes = (startHour * 60 + startMin) + (dayProfile.grace_mins || 10);
        const actualCheckInMinutes = cInHour * 60 + cInMin;

        return actualCheckInMinutes > totalGraceMinutes;
    };

    // --- VIRTUAL ROWS GENERATION ---
    const filteredEmployeesByRole = employees.filter(emp => {
        if (selectedRoleFilter === 'all') return true;
        if (selectedRoleFilter === 'employee') return emp.role === 'employee';
        if (selectedRoleFilter === 'closer') return emp.role === 'closer';
        if (selectedRoleFilter === 'admin') return emp.role === 'admin';
        return true;
    });

    const datesToRender = filterMode === 'date' 
        ? [specificDate || getLocalDateStr()] 
        : getDatesInRange(fromDate || getLocalDateStr(), toDate || getLocalDateStr());
    
    const employeesToProcess = selectedEmployee === 'all' 
        ? filteredEmployeesByRole 
        : [employees.find(e => e.id === selectedEmployee)].filter(Boolean);

    let allVirtualRows = [];
    datesToRender.forEach(dateStr => {
        employeesToProcess.forEach(emp => {
            allVirtualRows.push({ uniqueKey: `${emp.id}-${dateStr}`, employee: emp, recordDate: dateStr });
        });
    });

    allVirtualRows.sort((a, b) => {
        const dateDiff = new Date(b.recordDate) - new Date(a.recordDate);
        if (dateDiff !== 0) return dateDiff;
        return (a.employee.full_name || '').localeCompare(b.employee.full_name || '');
    });

    // Map logs from cache
    const virtualRowsWithLogs = allVirtualRows.map(row => {
        const dayLogs = attendanceCache[row.recordDate] || [];
        const log = dayLogs.find(l => l.employee_id === row.employee.id) || null;
        return { ...row, log };
    });

    // Apply Status Filter
    const filteredRows = virtualRowsWithLogs.filter(item => {
        if (selectedStatusFilter === 'all') return true;
        if (selectedStatusFilter === 'absent') return !item.log;
        if (selectedStatusFilter === 'present') return !!item.log;
        if (selectedStatusFilter === 'late') return item.log && checkIsLate(item.log);
        return true;
    });

    // Handle Client-Side Pagination
    const totalRecords = filteredRows.length;
    const paginatedData = filteredRows.slice((page - 1) * limit, page * limit);

    // --- LAZY PAGE-BY-PAGE FETCHING (For Default View) ---
    useEffect(() => {
        if (selectedStatusFilter !== 'all') return; // Managed by batch fetcher

        const datesOnPage = [...new Set(paginatedData.map(r => r.recordDate))];
        const datesToFetch = datesOnPage.filter(d => !attendanceCache[d]);

        if (datesToFetch.length > 0) {
            setLoading(true);
            Promise.all(datesToFetch.map(d => apiClient.get(`/api/v1/attendance/date/${d}`)))
                .then(results => {
                    setAttendanceCache(prev => {
                        const newCache = { ...prev };
                        results.forEach((res, i) => {
                            newCache[datesToFetch[i]] = res.data.data || [];
                        });
                        return newCache;
                    });
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [paginatedData, attendanceCache, selectedStatusFilter]);

    // --- BATCH FETCHING (For Filtered Views to prevent crashing) ---
    useEffect(() => {
        if (selectedStatusFilter === 'all') return;
        
        const missingDates = datesToRender.filter(d => !attendanceCache[d]);
        if (missingDates.length === 0) return;

        const fetchInBatches = async () => {
            setLoading(true);
            const chunkArray = (arr, size) => arr.length ? [arr.slice(0, size), ...chunkArray(arr.slice(size), size)] : [];
            const batches = chunkArray(missingDates, 15); // Process 15 days at a time
            
            let tempCache = {};
            for (const batch of batches) {
                try {
                    const promises = batch.map(d => apiClient.get(`/api/v1/attendance/date/${d}`));
                    const results = await Promise.all(promises);
                    results.forEach((res, i) => {
                        tempCache[batch[i]] = res.data.data || [];
                    });
                } catch (err) {
                    console.error('Batch error', err);
                }
            }
            
            setAttendanceCache(prev => ({ ...prev, ...tempCache }));
            setLoading(false);
        };

        fetchInBatches();
    }, [selectedStatusFilter, datesToRender, attendanceCache]);


    const handleExportCSV = () => {
        // Export uses all filteredRows, not just the paginated slice
        if (filteredRows.length === 0) {
            setStatusMessage({ type: 'error', text: 'No data available to export.' });
            return;
        }
        const headers = ['Date', 'Employee Name', 'Role', 'Check In', 'Check Out', 'Total Time', 'Status'];
        const csvRows = filteredRows.map(({ employee, log, recordDate }) => {
            const dateStr = recordDate || new Date().toISOString().split('T')[0];
            const empName = employee?.full_name || 'N/A';
            const role = employee?.role || 'N/A';
            let checkInStr = '-';
            let checkOutStr = '-';
            let totalTimeStr = '-';
            let statusStr = 'Not Checked In';

            if (log) {
                checkInStr = log.check_in ? new Date(log.check_in).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }) : '-';
                checkOutStr = log.check_out ? new Date(log.check_out).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }) : '-';
                statusStr = log.status;
                const timeObj = calculateTimeSpent(log.check_in ? new Date(log.check_in) : null, log.check_out ? new Date(log.check_out) : null, log.status);
                totalTimeStr = timeObj.text;
            }

            return [ `"${dateStr}"`, `"${empName}"`, `"${role}"`, `"${checkInStr}"`, `"${checkOutStr}"`, `"${totalTimeStr}"`, `"${statusStr}"` ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Attendance_Export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <PageWrapper title="Attendance Auditing">
            <div className="flex justify-between items-center mb-8 px-2">
                <h1 className="text-2xl font-bold text-prime-text">Attendance Logs</h1>
                <button onClick={handleExportCSV} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export CSV
                </button>
            </div>

            {statusMessage && (
                <div className={`px-6 py-3 mb-6 rounded-full text-sm font-medium text-center ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {statusMessage.text}
                </div>
            )}

            {isEditModalOpen && createPortal(
                <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-card max-w-md w-full p-8 border border-prime-border">
                        <h2 className="text-xl font-bold text-prime-text mb-4">Edit Attendance Times</h2>
                        <form onSubmit={handleSaveTimes} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Check-In Time</label>
                                <input type="datetime-local" value={editCheckIn} onChange={(e) => setEditCheckIn(e.target.value)} className="input-base w-full"/>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Check-Out Time</label>
                                <input type="datetime-local" value={editCheckOut} onChange={(e) => setEditCheckOut(e.target.value)} className="input-base w-full"/>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-prime-primary text-white rounded-full text-sm font-bold hover:bg-prime-secondary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* FILTERS PANEL */}
            <div className="card-base p-6 mb-8 bg-white space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Role Filter</label>
                        <select value={selectedRoleFilter} onChange={(e) => { setSelectedRoleFilter(e.target.value); setSelectedEmployee('all'); }} className="input-base cursor-pointer">
                            <option value="all">All Roles</option>
                            <option value="employee">Agent (Employee)</option>
                            <option value="closer">Closer</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Employee Filter</label>
                        <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="input-base cursor-pointer">
                            <option value="all">
                                All {selectedRoleFilter === 'all' ? 'Employees' : selectedRoleFilter === 'employee' ? 'Agents' : selectedRoleFilter === 'closer' ? 'Closers' : 'Admins'}
                            </option>
                            {filteredEmployeesByRole.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role.replace('_', ' ')})</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Status Filter</label>
                        <select value={selectedStatusFilter} onChange={(e) => setSelectedStatusFilter(e.target.value)} className="input-base cursor-pointer">
                            <option value="all">All Statuses</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Filter Mode</label>
                        <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} className="input-base cursor-pointer">
                            <option value="date">Specific Date</option>
                            <option value="range">Time Period (Range)</option>
                        </select>
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center gap-4">
                    {filterMode === 'date' ? (
                        <div className="w-full md:w-1/3">
                            <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Select Date</label>
                            <input type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} className="input-base shadow-sm !w-full font-semibold cursor-pointer" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-2/3">
                            <div>
                                <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">From Date</label>
                                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input-base shadow-sm !w-full font-semibold cursor-pointer" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">To Date</label>
                                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input-base shadow-sm !w-full font-semibold cursor-pointer" />
                            </div>
                        </div>
                    )}
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
                                <tr><td colSpan="6" className="px-8 py-20 text-center text-prime-muted text-sm">Loading records...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan="6" className="px-8 py-32 text-center text-prime-primary/60 text-sm font-medium">No records found.</td></tr>
                            ) : (
                                paginatedData.map(({ uniqueKey, employee, log, recordDate }) => {
                                    const displayDateObj = recordDate ? new Date(recordDate) : new Date();
                                    const formattedDate = displayDateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

                                    if (!log) {
                                        return (
                                            <tr key={uniqueKey} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors bg-red-50/30">
                                                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-semibold">{formattedDate}</td>
                                                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-800 font-bold">{employee.full_name} <span className="text-[10px] text-gray-400 font-normal block capitalize">{employee.role}</span></td>
                                                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-400">-</td>
                                                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-400">-</td>
                                                <td className="px-6 py-5 whitespace-nowrap"><span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase">Not Checked In</span></td>
                                                <td className="px-6 py-5 whitespace-nowrap text-right">-</td>
                                            </tr>
                                        );
                                    }

                                    const isCheckedIn = log.status === 'checked_in';
                                    const cIn = log.check_in ? new Date(log.check_in) : null;
                                    const cOut = (log.check_out && !isCheckedIn) ? new Date(log.check_out) : null;
                                    const timeObj = calculateTimeSpent(cIn, cOut, log.status);

                                    const isLate = checkIsLate(log);
                                    let isEarlyCheckout = false;

                                    if (cIn && cOut && !isCheckedIn) {
                                        const rules = officeSettings || {
                                            standard: { req_hours: 9 },
                                            friday: { req_hours: 7 },
                                            saturday: { req_hours: 5.75 }
                                        };
                                        const dayOfWeekStr = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', weekday: 'short' }).format(cIn);
                                        let dayProfile = rules.standard;
                                        if (dayOfWeekStr === 'Fri') dayProfile = rules.friday;
                                        if (dayOfWeekStr === 'Sat') dayProfile = rules.saturday;

                                        if (timeObj.mins < Math.floor(dayProfile.req_hours * 60)) isEarlyCheckout = true;
                                    }
                                    
                                    return (
                                        <tr key={uniqueKey} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-semibold">{formattedDate}</td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-800 font-bold">{employee.full_name} <span className="text-[10px] text-gray-400 font-normal block capitalize">{employee.role}</span></td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={isLate ? 'text-red-500 font-bold' : ''}>{cIn ? cIn.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</span>
                                                    {isLate && <span className="bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Late</span>}
                                                    <span className="mx-1 text-gray-300">→</span> 
                                                    <span className={isEarlyCheckout ? 'text-amber-600 font-bold' : ''}>{cOut ? cOut.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}</span>
                                                    {isEarlyCheckout && <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Incomplete Shift</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-prime-primary">{timeObj.text}</td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                {isCheckedIn ? <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase">Active Shift</span>
                                                : log.status === 'approved' || log.status === 'auto-approved' ? <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase">Approved</span>
                                                : log.status === 'rejected' ? <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase">Rejected</span>
                                                : <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold uppercase">Needs Approval</span>}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-right">
                                                {log.employee_id === user?.id ? (
                                                    <span className="text-xs text-red-400 font-semibold uppercase block mt-2">Cannot Self-Approve</span>
                                                ) : (
                                                    <div className="flex justify-end gap-2 items-center">
                                                        <button onClick={() => openEditModal(log)} title="Edit Times" className="p-1.5 bg-gray-100 text-gray-600 hover:bg-prime-primary hover:text-white rounded-lg transition-colors">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        </button>

                                                        {!isCheckedIn && (
                                                            <>
                                                                <button onClick={() => handleDirectStatusUpdate(log.id, 'approved')} className="text-green-600 hover:text-green-800 text-xs font-bold uppercase">Approve</button>
                                                                <button onClick={() => handleDirectStatusUpdate(log.id, 'rejected')} className="text-red-600 hover:text-red-800 text-xs font-bold uppercase mx-1">Reject</button>
                                                            </>
                                                        )}
                                                        
                                                        {log.status === 'checked_out' && (
                                                            <button 
                                                                onClick={async () => {
                                                                    try {
                                                                        await apiClient.put(`/api/v1/attendance/${log.id}/reopen`);
                                                                        // Update cache manually
                                                                        setAttendanceCache(prev => {
                                                                            const nc = { ...prev };
                                                                            for (const date in nc) {
                                                                                const idx = nc[date].findIndex(l => l.id === log.id);
                                                                                if (idx !== -1) {
                                                                                    nc[date] = [...nc[date]];
                                                                                    nc[date][idx] = { ...nc[date][idx], check_out: null, status: 'checked_in' };
                                                                                    break;
                                                                                }
                                                                            }
                                                                            return nc;
                                                                        });
                                                                    } catch (error) {
                                                                        console.error("Failed to reopen shift", error);
                                                                    }
                                                                }} 
                                                                className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase ml-1"
                                                            >
                                                                Reopen
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls Footer */}
                <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl mt-auto">
                    <span className="text-xs text-gray-500 font-medium">Page {page} • Showing {paginatedData.length} of {totalRecords} records</span>
                    <div className="flex gap-2">
                        <button 
                            disabled={page === 1} 
                            onClick={() => setPage(page - 1)} 
                            className="px-4 py-1.5 text-xs font-semibold shadow-sm bg-white border border-gray-200 rounded text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                        >
                            Previous
                        </button>
                        <button 
                            disabled={page * limit >= totalRecords} 
                            onClick={() => setPage(page + 1)} 
                            className="px-4 py-1.5 text-xs font-semibold shadow-sm bg-white border border-gray-200 rounded text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default AttendanceLogs;