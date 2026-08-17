import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import AnnouncementBanner from '../../components/layout/AnnouncementBanner';
import CheckInOutCard from '../../components/attendance/CheckInOutCard';
import AnnouncementModal from '../../components/layout/AnnouncementModal';

const Dashboard = () => {
    const [metrics, setMetrics] = useState({
        total: 0, retained: 0, pending: 0, not_retained: 0
    });
    const [weeklyMetrics, setWeeklyMetrics] = useState({
        total: 0, retained: 0, pending: 0, not_retained: 0
    });
    const [commission, setCommission] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getWeekRange = () => {
        const now = new Date();
        const day = now.getDay();
        const diff = day === 0 ? 6 : day - 1;
        const monday = new Date(now);
        monday.setDate(now.getDate() - diff);
        monday.setHours(0, 0, 0, 0);
        
        const saturday = new Date(monday);
        saturday.setDate(monday.getDate() + 5);
        saturday.setHours(23, 59, 59, 999);
        
        return { monday, saturday };
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiClient.get('/api/v1/calls/me');
                const calls = response.data.data || [];

                const calculatedMetrics = calls.reduce((acc, call) => {
                    acc.total += 1;
                    if (call.status === 'retained') {
                        acc.retained += 1;
                        acc.totalCommission = (acc.totalCommission || 0) + (call.commission || 0);
                    }
                    if (call.status === 'pending') acc.pending += 1;
                    if (call.status === 'not_retained') acc.not_retained += 1;
                    return acc;
                }, { total: 0, retained: 0, pending: 0, not_retained: 0, totalCommission: 0 });
                
                setMetrics({
                    total: calculatedMetrics.total,
                    retained: calculatedMetrics.retained,
                    pending: calculatedMetrics.pending,
                    not_retained: calculatedMetrics.not_retained
                });
                
                setCommission(calculatedMetrics.totalCommission || 0);

                const { monday, saturday } = getWeekRange();
                const weekCalls = calls.filter(call => {
                    const callDate = new Date(call.created_at);
                    return callDate >= monday && callDate <= saturday;
                });

                const weekMetrics = weekCalls.reduce((acc, call) => {
                    acc.total += 1;
                    if (call.status === 'retained') acc.retained += 1;
                    if (call.status === 'pending') acc.pending += 1;
                    if (call.status === 'not_retained') acc.not_retained += 1;
                    return acc;
                }, { total: 0, retained: 0, pending: 0, not_retained: 0 });
                setWeeklyMetrics(weekMetrics);

            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load performance metrics.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-prime-bg text-prime-navy">
            <div className="w-10 h-10 border-4 border-prime-navy/20 border-t-prime-navy rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-prime-bg page-transition">
            <AnnouncementModal />
            <AnnouncementBanner />
            
            <main className="flex-grow p-8 max-w-7xl mx-auto w-full">
                {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg">{error}</div>}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-prime-text tracking-tight mb-2">My Performance</h1>
                        <p className="text-prime-muted font-medium">Review your historical call data and current shift status.</p>
                    </div>
                    <div className="w-full md:w-auto">
                        <CheckInOutCard />
                    </div>
                </div>

                {/* Commission Summary Hero Card */}
                <div className="bg-gradient-to-r from-prime-primary to-prime-secondary rounded-2xl p-8 mb-10 text-white relative overflow-hidden shadow-lg shadow-blue-500/20 transform transition-transform hover:-translate-y-1 duration-300">
                    <div className="relative z-10">
                        <h3 className="text-white/90 text-sm font-bold uppercase tracking-widest mb-1">Total Financial Impact</h3>
                        <p className="text-5xl font-black mt-2 tracking-tight drop-shadow-md">${commission.toFixed(2)}</p>
                    </div>
                    {/* Light Decorative Element */}
                    <div className="absolute right-0 top-0 w-64 h-full bg-white/10 transform skew-x-12 translate-x-10 backdrop-blur-sm"></div>
                </div>

                {/* Scorecard Grid - All Time */}
                <h2 className="text-xl font-bold text-prime-text mb-4">All-Time Global Stats</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="card-base p-6 border-t-4 border-t-prime-navy">
                        <h3 className="text-prime-muted text-xs font-bold uppercase tracking-wider">Total Handled</h3>
                        <p className="text-3xl font-bold text-prime-text mt-3">{metrics.total}</p>
                    </div>
                    <div className="card-base p-6 border-t-4 border-t-prime-green">
                        <h3 className="text-prime-muted text-xs font-bold uppercase tracking-wider">Retained</h3>
                        <p className="text-3xl font-black text-prime-green mt-3">{metrics.retained}</p>
                    </div>
                    <div className="card-base p-6 border-t-4 border-t-prime-gold">
                        <h3 className="text-prime-muted text-xs font-bold uppercase tracking-wider">Pending Review</h3>
                        <p className="text-3xl font-bold text-prime-gold mt-3">{metrics.pending}</p>
                    </div>
                    <div className="card-base p-6 border-t-4 border-t-red-500">
                        <h3 className="text-prime-muted text-xs font-bold uppercase tracking-wider">Not Retained</h3>
                        <p className="text-3xl font-bold text-red-500 mt-3">{metrics.not_retained}</p>
                    </div>
                </div>

                {/* Scorecard Grid - This Week */}
                <h2 className="text-xl font-bold text-prime-text mb-4">Current Week (Mon - Sat)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-prime-muted text-xs font-bold uppercase tracking-wider">Total Calls</h3>
                        <p className="text-2xl font-bold text-prime-text mt-2">{weeklyMetrics.total}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-prime-muted text-xs font-bold uppercase tracking-wider">Retained</h3>
                        <p className="text-2xl font-bold text-prime-text mt-2">{weeklyMetrics.retained}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-prime-muted text-xs font-bold uppercase tracking-wider">Pending</h3>
                        <p className="text-2xl font-bold text-prime-text mt-2">{weeklyMetrics.pending}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-prime-muted text-xs font-bold uppercase tracking-wider">Not Retained</h3>
                        <p className="text-2xl font-bold text-prime-text mt-2">{weeklyMetrics.not_retained}</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;