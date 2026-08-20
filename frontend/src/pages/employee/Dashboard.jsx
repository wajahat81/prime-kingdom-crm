import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import AnnouncementBanner from '../../components/layout/AnnouncementBanner';
import AnnouncementModal from '../../components/layout/AnnouncementModal';
import PageWrapper from '../../components/layout/PageWrapper';
import { useAuth } from '../../context/AuthContext';

// Helper to get local date string YYYY-MM-DD
const getLocalDateStr = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
};

// Helper to get current ISO week string YYYY-Www
const getCurrentWeekStr = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
};

// Helper to parse YYYY-Www into Sunday-Saturday range
const parseWeek = (weekStr) => {
    if (!weekStr) {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { startOfWeek: start, endOfWeek: end };
    }
    const [year, week] = weekStr.split('-W');
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    
    if (dow <= 4) {
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    
    // Shift from ISO Monday start to Sunday start
    const startOfWeek = new Date(ISOweekStart);
    startOfWeek.setDate(startOfWeek.getDate() - 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { startOfWeek, endOfWeek };
};

const Dashboard = () => {
    const { user } = useAuth();
    const isAdminOrSuper = user?.role === 'admin' || user?.role === 'super_admin';

    const [staffList, setStaffList] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    
    // Date Filters
    const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
    const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekStr());
    
    // Call Data
    const [allCalls, setAllCalls] = useState([]);
    
    // Processed Metrics
    const [metrics, setMetrics] = useState({ retained: 0, pending: 0 });
    const [weeklyMetrics, setWeeklyMetrics] = useState({ retained: 0, pending: 0 });
    const [dailyMetrics, setDailyMetrics] = useState({ retained: 0, pending: 0 });
    const [commission, setCommission] = useState({ total: 0, weekly: 0, daily: 0 });
    const [dailyEmployeeStats, setDailyEmployeeStats] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [needsToStartShift, setNeedsToStartShift] = useState(false);
    const [isStartingShift, setIsStartingShift] = useState(false);

    const [allTimeFilter, setAllTimeFilter] = useState('all');


    useEffect(() => {
        const checkShiftStatus = async () => {
            if (!user) return; 
            if (user.role !== 'employee') return; 

            try {
                const response = await apiClient.get('/api/v1/attendance/status');
                if (response.data && response.data.status === 'not_checked_in') {
                    setNeedsToStartShift(true);
                }
            } catch (err) {
                console.error("Failed to check shift status", err);
            }
        };
        checkShiftStatus();
    }, [user]);

    const handleStartShift = async () => {
        setIsStartingShift(true);
        try {
            await apiClient.post('/api/v1/attendance/check-in');
            setNeedsToStartShift(false);
        } catch (err) {
            console.error("Failed to start shift", err);
        } finally {
            setIsStartingShift(false);
        }
    };

    useEffect(() => {
        if (isAdminOrSuper) {
            const fetchStaff = async () => {
                try {
                    const res = await apiClient.get('/api/v1/users/');
                    const allUsers = res.data.data || res.data || [];
                    
                    const employeesOnly = allUsers.filter(u => u.role === 'employee');
                    setStaffList(employeesOnly);
                    
                    if (employeesOnly.length > 0) {
                        setSelectedEmployeeId(employeesOnly[0].id);
                    }
                } catch (err) {
                    console.error('Failed to fetch staff list:', err);
                }
            };
            fetchStaff();
        }
    }, [isAdminOrSuper]);

    // Fetch all calls ONCE
    useEffect(() => {
        const fetchAllCalls = async () => {
            if (!user) return;
            setLoading(true);
            try {
                let endpoint = isAdminOrSuper ? '/api/v1/calls/' : '/api/v1/calls/me';
                const response = await apiClient.get(endpoint);
                setAllCalls(response.data.data || []);
                setError(null);
            } catch (err) {
                setError('Failed to load metrics.');
            } finally {
                setLoading(false);
            }
        };
        fetchAllCalls();
    }, [user, isAdminOrSuper]);

    // Compute metrics instantly when dates or selected employee change
    useEffect(() => {
        if (!allCalls) return;

        let targetCalls = allCalls;
        if (isAdminOrSuper && selectedEmployeeId) {
            targetCalls = allCalls.filter(c => c.employee_id === selectedEmployeeId);
        }

        // Daily Time Boundaries
        const [year, month, day] = selectedDate.split('-');
        const targetDayStart = new Date(year, month - 1, day, 0, 0, 0);
        const targetDayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);

        // Weekly Time Boundaries
        const { startOfWeek, endOfWeek } = parseWeek(selectedWeek);

        let totalComm = 0, weeklyComm = 0, dailyComm = 0;


       // All-Time (with Month Filter)
        let filteredAllCalls = targetCalls;
        if (allTimeFilter !== 'all') {
            const monthsToSubtract = parseInt(allTimeFilter);
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - monthsToSubtract);
            filteredAllCalls = targetCalls.filter(c => new Date(c.created_at) >= cutoffDate);
        }

        const calcAll = filteredAllCalls.reduce((acc, call) => {
            if (call.status === 'retained') {
                acc.retained += 1;
                totalComm += (call.commission || 0);
            }
            if (call.status === 'pending') acc.pending += 1;
            return acc;
        }, { retained: 0, pending: 0 });

        // Weekly
        const weekCalls = targetCalls.filter(call => {
            const callDate = new Date(call.created_at);
            return callDate >= startOfWeek && callDate <= endOfWeek;
        });
        const calcWeek = weekCalls.reduce((acc, call) => {
            if (call.status === 'retained') {
                acc.retained += 1;
                weeklyComm += (call.commission || 0);
            }
            if (call.status === 'pending') acc.pending += 1;
            return acc;
        }, { retained: 0, pending: 0 });

        // Daily
        const dayCalls = targetCalls.filter(call => {
            const callDate = new Date(call.created_at);
            return callDate >= targetDayStart && callDate <= targetDayEnd;
        });
        const calcDay = dayCalls.reduce((acc, call) => {
            if (call.status === 'retained') {
                acc.retained += 1;
                dailyComm += (call.commission || 0);
            }
            if (call.status === 'pending') acc.pending += 1;
            return acc;
        }, { retained: 0, pending: 0 });

        setMetrics(calcAll);
        setWeeklyMetrics(calcWeek);
        setDailyMetrics(calcDay);
        setCommission({ total: totalComm, weekly: weeklyComm, daily: dailyComm });
        
        // Admin Table: Calculate ALL agents for the selected DATE
        if (isAdminOrSuper && staffList.length > 0) {
             const allDayCalls = allCalls.filter(call => {
                 const callDate = new Date(call.created_at);
                 return callDate >= targetDayStart && callDate <= targetDayEnd;
             });
             
             const tableData = staffList.map(emp => {
                 const empCalls = allDayCalls.filter(c => c.employee_id === emp.id);
                 let empRetained = 0, empPending = 0, empComm = 0;
                 
                 empCalls.forEach(call => {
                     if (call.status === 'retained') {
                         empRetained += 1;
                         empComm += (call.commission || 0);
                     }
                     if (call.status === 'pending') empPending += 1;
                 });
                 
                 return {
                     id: emp.id,
                     name: emp.full_name || emp.email,
                     dialingId: emp.dialing_id || 'N/A',
                     retained: empRetained,
                     pending: empPending,
                     commission: empComm
                 };
             });
             
             setDailyEmployeeStats(tableData);
        }
    }, [allCalls, selectedEmployeeId, selectedDate, selectedWeek, isAdminOrSuper, staffList]);

    const handleNextEmployee = () => {
        if (!staffList.length) return;
        const currentIndex = staffList.findIndex(emp => emp.id === selectedEmployeeId);
        const nextIndex = (currentIndex + 1) % staffList.length;
        setSelectedEmployeeId(staffList[nextIndex].id);
    };

    const handlePrevEmployee = () => {
        if (!staffList.length) return;
        const currentIndex = staffList.findIndex(emp => emp.id === selectedEmployeeId);
        const prevIndex = (currentIndex - 1 + staffList.length) % staffList.length;
        setSelectedEmployeeId(staffList[prevIndex].id);
    };

    const currentViewedEmployee = staffList.find(e => e.id === selectedEmployeeId);

    if (loading && !staffList.length && isAdminOrSuper) return (
        <div className="flex justify-center items-center h-[60vh] w-full">
            <div className="w-8 h-8 border-4 border-prime-primary/20 border-t-prime-primary rounded-full animate-spin"></div>
        </div>
    );

    return (
        <PageWrapper title="Dashboard">
            <AnnouncementModal />
            <AnnouncementBanner />
            
            {needsToStartShift && (
                <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-card max-w-sm w-full p-8 text-center border border-prime-border transform transition-all">
                        <div className="w-16 h-16 bg-prime-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-prime-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-prime-text mb-2 tracking-tight">Shift Not Started</h2>
                        <p className="text-prime-muted text-sm mb-8 font-medium px-2">
                            Kindly start your shift for today to unlock your workspace.
                        </p>
                        <button
                            onClick={handleStartShift}
                            disabled={isStartingShift}
                            className="w-full py-3.5 px-4 bg-prime-primary text-white rounded-full font-bold hover:bg-prime-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isStartingShift ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Commencing...
                                </>
                            ) : 'Commence Shift'}
                        </button>
                    </div>
                </div>
            )}
            
            <div className="w-full pt-4">
                {error && <div className="mb-8 bg-red-50 text-red-600 px-6 py-3 rounded-full text-sm font-medium text-center">{error}</div>}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 px-2 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-prime-text tracking-tight mb-1">
                            {isAdminOrSuper 
                                ? `Dashboard: ${currentViewedEmployee?.full_name || 'Agent'}` 
                                : 'My Performance'}
                        </h1>
                    </div>

                    {isAdminOrSuper && staffList.length > 0 && (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <button 
                                onClick={handlePrevEmployee}
                                className="p-2.5 bg-white border border-gray-200 rounded-full text-gray-400 hover:bg-gray-50 hover:text-prime-primary shadow-sm transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            
                            <select 
                                value={selectedEmployeeId} 
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                className="input-base cursor-pointer bg-white font-semibold text-sm min-w-[220px] shadow-sm"
                            >
                                {staffList.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.full_name || emp.email} {emp.dialing_id ? `(#${emp.dialing_id})` : ''}
                                    </option>
                                ))}
                            </select>
                            
                            <button 
                                onClick={handleNextEmployee}
                                className="p-2.5 bg-white border border-gray-200 rounded-full text-gray-400 hover:bg-gray-50 hover:text-prime-primary shadow-sm transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 px-2">
                    <div className="bg-prime-primary rounded-2xl p-8 text-white border-0 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-white/90 text-xs font-bold uppercase tracking-widest mb-2">Total Commission Earned</h3>
                            <p className="text-5xl font-bold tracking-tight">Rs. {commission.total.toFixed(2)}</p>
                        </div>
                        <div className="absolute right-0 top-0 w-64 h-full bg-white/10 transform skew-x-12 translate-x-10"></div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Earned This Week</h3>
                            <p className="text-5xl font-bold tracking-tight text-prime-primary">Rs. {commission.weekly.toFixed(2)}</p>
                        </div>
                        <div className="absolute right-0 top-0 w-32 h-full bg-prime-primary/5 transform -skew-x-12 translate-x-4"></div>
                    </div>
                </div>

                {/* DAILY STATS: New Date Max Constraint & Commission Box */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 mb-4 gap-4">
                    <h2 className="text-lg font-semibold text-gray-800">Daily Stats</h2>
                    <input 
                        type="date" 
                        value={selectedDate}
                        max={getLocalDateStr()}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="input-base text-sm py-2 px-4 shadow-sm w-full sm:w-auto font-semibold cursor-pointer"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 px-2">
                    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-3">Commission</h3>
                        <p className="text-4xl font-bold text-prime-primary">Rs. {commission.daily.toFixed(2)}</p>
                    </div>
                    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-3">Retained</h3>
                        <p className="text-4xl font-bold text-emerald-500">{dailyMetrics.retained}</p>
                    </div>
                    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-3">Pending Review</h3>
                        <p className="text-4xl font-bold text-yellow-500">{dailyMetrics.pending}</p>
                    </div>
                </div>

                {/* WEEKLY STATS: New Week Max Constraint */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 mb-4 gap-4">
                    <h2 className="text-lg font-semibold text-gray-800">Weekly Stats</h2>
                    <input 
                        type="week" 
                        value={selectedWeek}
                        max={getCurrentWeekStr()}
                        onChange={(e) => setSelectedWeek(e.target.value)}
                        className="input-base text-sm py-2 px-4 shadow-sm w-full sm:w-auto font-semibold cursor-pointer"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 px-2">
                    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-3">Retained</h3>
                        <p className="text-4xl font-bold text-emerald-500">{weeklyMetrics.retained}</p>
                    </div>
                    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-3">Pending Review</h3>
                        <p className="text-4xl font-bold text-yellow-500">{weeklyMetrics.pending}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 mb-4 gap-4">
                    <h2 className="text-lg font-semibold text-gray-800">All-Time Stats</h2>
                    <select 
                        value={allTimeFilter}
                        onChange={(e) => setAllTimeFilter(e.target.value)}
                        className="input-base text-sm py-2 px-4 shadow-sm w-full sm:w-auto font-semibold cursor-pointer"
                    >
                        <option value="all">All Time</option>
                        <option value="1">Past 1 Month</option>
                        <option value="2">Past 2 Months</option>
                        <option value="3">Past 3 Months</option>
                        <option value="6">Past 6 Months</option>
                        <option value="9">Past 9 Months</option>
                        <option value="12">Past 12 Months</option>
                    </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 px-2">
                    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-3">Retained</h3>
                        <p className="text-4xl font-bold text-emerald-500">{metrics.retained}</p>
                    </div>
                    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-3">Pending Review</h3>
                        <p className="text-4xl font-bold text-yellow-500">{metrics.pending}</p>
                    </div>
                </div>
                

                {isAdminOrSuper && (
                    <div className="mt-8 px-2 pb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">All Agents Daily Record ({selectedDate})</h2>
                        </div>
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Agent Name</th>
                                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Dialing ID</th>
                                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Retained</th>
                                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</th>
                                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Daily Comm.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {dailyEmployeeStats.length > 0 ? (
                                            dailyEmployeeStats.map(emp => (
                                                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="p-4 text-sm font-semibold text-gray-800">{emp.name}</td>
                                                    <td className="p-4 text-sm text-gray-600">{emp.dialingId !== 'N/A' ? `#${emp.dialingId}` : '-'}</td>
                                                    <td className="p-4 text-sm font-bold text-emerald-600">{emp.retained}</td>
                                                    <td className="p-4 text-sm font-bold text-yellow-600">{emp.pending}</td>
                                                    <td className="p-4 text-sm font-bold text-prime-primary">Rs. {emp.commission.toFixed(2)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="p-8 text-center text-sm text-gray-500">
                                                    No agents available.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                
            </div>
        </PageWrapper>
    );
};

export default Dashboard;