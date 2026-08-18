import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import AnnouncementBanner from '../../components/layout/AnnouncementBanner';
import AnnouncementModal from '../../components/layout/AnnouncementModal';
import PageWrapper from '../../components/layout/PageWrapper';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const isAdminOrSuper = user?.role === 'admin' || user?.role === 'super_admin';

    const [staffList, setStaffList] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    
    const [metrics, setMetrics] = useState({ total: 0, retained: 0, pending: 0, not_retained: 0 });
    const [weeklyMetrics, setWeeklyMetrics] = useState({ total: 0, retained: 0, pending: 0, not_retained: 0 });
    const [commission, setCommission] = useState({ total: 0, weekly: 0 });
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getWeekRange = () => {
        const now = new Date();
        const day = now.getDay();
        const diff = day === 0 ? 0 : day; 
        const sunday = new Date(now);
        sunday.setDate(now.getDate() - diff);
        sunday.setHours(0, 0, 0, 0);
        
        const nextSaturday = new Date(sunday);
        nextSaturday.setDate(sunday.getDate() + 6);
        nextSaturday.setHours(23, 59, 59, 999);
        
        return { startOfWeek: sunday, endOfWeek: nextSaturday };
    };

    // Fetch staff list if user is admin
    useEffect(() => {
        if (isAdminOrSuper) {
            const fetchStaff = async () => {
                try {
                    const res = await apiClient.get('/api/v1/users/');
                    setStaffList(res.data.data || res.data || []);
                } catch (err) {
                    console.error('Failed to fetch staff list:', err);
                }
            };
            fetchStaff();
        }
    }, [isAdminOrSuper]);

    // Fetch call data based on viewing mode (self or selected employee)
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let endpoint = '/api/v1/calls/me';
                if (isAdminOrSuper && selectedEmployeeId) {
                    // Admins view all calls; we filter on the frontend by the selected ID
                    endpoint = '/api/v1/calls/';
                }

                const response = await apiClient.get(endpoint);
                let calls = response.data.data || [];

                if (isAdminOrSuper && selectedEmployeeId) {
                    calls = calls.filter(c => c.employee_id === selectedEmployeeId);
                }

                const { startOfWeek, endOfWeek } = getWeekRange();

                let totalComm = 0;
                let weeklyComm = 0;

                const calculatedMetrics = calls.reduce((acc, call) => {
                    acc.total += 1;
                    if (call.status === 'retained') {
                        acc.retained += 1;
                        totalComm += (call.commission || 0);
                    }
                    if (call.status === 'pending') acc.pending += 1;
                    if (call.status === 'not_retained') acc.not_retained += 1;
                    return acc;
                }, { total: 0, retained: 0, pending: 0, not_retained: 0 });

                const weekCalls = calls.filter(call => {
                    const callDate = new Date(call.created_at);
                    return callDate >= startOfWeek && callDate <= endOfWeek;
                });

                const weekMetrics = weekCalls.reduce((acc, call) => {
                    acc.total += 1;
                    if (call.status === 'retained') {
                        acc.retained += 1;
                        weeklyComm += (call.commission || 0);
                    }
                    if (call.status === 'pending') acc.pending += 1;
                    if (call.status === 'not_retained') acc.not_retained += 1;
                    return acc;
                }, { total: 0, retained: 0, pending: 0, not_retained: 0 });

                setMetrics(calculatedMetrics);
                setWeeklyMetrics(weekMetrics);
                setCommission({ total: totalComm, weekly: weeklyComm });
                setError(null);
            } catch (err) {
                setError('Failed to load metrics.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedEmployeeId, isAdminOrSuper]);

    if (loading && !staffList.length && isAdminOrSuper) return (
        <div className="flex justify-center items-center h-[60vh] w-full">
            <div className="w-8 h-8 border-4 border-prime-primary/20 border-t-prime-primary rounded-full animate-spin"></div>
        </div>
    );

    return (
        <PageWrapper title="Dashboard">
            <AnnouncementModal />
            <AnnouncementBanner />
            
            <div className="w-full pt-4">
                {error && <div className="mb-8 bg-red-50 text-red-600 px-6 py-3 rounded-full text-sm font-medium text-center">{error}</div>}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 px-2 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-prime-text tracking-tight mb-1">
                            {isAdminOrSuper && selectedEmployeeId ? 'Viewing Staff Dashboard' : 'My Performance'}
                        </h1>
                    </div>

                    {/* Admin / SuperAdmin Employee Selector Dropdown */}
                    {isAdminOrSuper && (
                        <div className="w-full md:w-72">
                            <select 
                                value={selectedEmployeeId} 
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                className="input-base cursor-pointer bg-white font-semibold text-sm"
                            >
                                <option value="">-- View My Dashboard --</option>
                                {staffList.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.full_name || emp.email} ({emp.role})
                                    </option>
                                ))}
                            </select>
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

                <h2 className="text-lg font-semibold text-gray-800 mb-4 px-2">All-Time Records</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 px-2">
                    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-3">Total Handled</h3>
                        <p className="text-4xl font-bold text-gray-700">{metrics.total}</p>
                    </div>
                    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-3">Retained</h3>
                        <p className="text-4xl font-bold text-emerald-500">{metrics.retained}</p>
                    </div>
                    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-3">Pending Review</h3>
                        <p className="text-4xl font-bold text-yellow-500">{metrics.pending}</p>
                    </div>
                    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-3">Not Retained</h3>
                        <p className="text-4xl font-bold text-rose-500">{metrics.not_retained}</p>
                    </div>
                </div>

                <h2 className="text-lg font-semibold text-gray-800 mb-4 px-2">This Week Records</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 px-2">
                    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-3">Total Handled</h3>
                        <p className="text-4xl font-bold text-gray-700">{weeklyMetrics.total}</p>
                    </div>
                    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-3">Retained</h3>
                        <p className="text-4xl font-bold text-emerald-500">{weeklyMetrics.retained}</p>
                    </div>
                    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-3">Pending Review</h3>
                        <p className="text-4xl font-bold text-yellow-500">{weeklyMetrics.pending}</p>
                    </div>
                    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-3">Not Retained</h3>
                        <p className="text-4xl font-bold text-rose-500">{weeklyMetrics.not_retained}</p>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default Dashboard;