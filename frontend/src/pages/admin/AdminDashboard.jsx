import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import AnnouncementBanner from '../../components/layout/AnnouncementBanner';
import AnnouncementModal from '../../components/layout/AnnouncementModal';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalCalls: 0,
        retained: 0,
        pending: 0,
        notRetained: 0,
        totalCommission: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await apiClient.get('/api/v1/calls/');
                const calls = response.data.data || [];
                
                const stats = calls.reduce((acc, call) => {
                    acc.totalCalls += 1;
                    if (call.status === 'retained') {
                        acc.retained += 1;
                        acc.totalCommission += (call.commission || 0);
                    }
                    if (call.status === 'pending') acc.pending += 1;
                    if (call.status === 'not_retained') acc.notRetained += 1;
                    return acc;
                }, { totalCalls: 0, retained: 0, pending: 0, notRetained: 0, totalCommission: 0 });
                
                setStats(stats);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-screen w-full page-transition">
            <div className="w-8 h-8 border-4 border-prime-navy/20 border-t-prime-navy rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-prime-bg page-transition">
            <AnnouncementModal />
            <AnnouncementBanner />
            
            <main className="flex-grow p-8 max-w-7xl mx-auto w-full">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-prime-text tracking-tight mb-1">Administrator Dashboard</h1>
                    <p className="text-prime-muted font-medium">System-wide overview of call logging and commission tracking.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="card-base p-6 border-t-4 border-t-prime-navy">
                        <h3 className="text-prime-muted text-xs font-bold uppercase tracking-wider">Total Calls</h3>
                        <p className="text-3xl font-bold text-prime-text mt-3">{stats.totalCalls}</p>
                    </div>
                    <div className="card-base p-6 border-t-4 border-t-prime-green">
                        <h3 className="text-prime-muted text-xs font-bold uppercase tracking-wider">Retained</h3>
                        <p className="text-3xl font-black text-prime-green mt-3">{stats.retained}</p>
                    </div>
                    <div className="card-base p-6 border-t-4 border-t-prime-gold">
                        <h3 className="text-prime-muted text-xs font-bold uppercase tracking-wider">Pending</h3>
                        <p className="text-3xl font-bold text-prime-gold mt-3">{stats.pending}</p>
                    </div>
                    <div className="card-base p-6 border-t-4 border-t-red-500">
                        <h3 className="text-prime-muted text-xs font-bold uppercase tracking-wider">Not Retained</h3>
                        <p className="text-3xl font-bold text-red-500 mt-3">{stats.notRetained}</p>
                    </div>
                    <div className="card-base p-6 bg-gradient-to-br from-prime-navy to-[#2a3f6b] text-white border-0 shadow-lg transform hover:-translate-y-1 transition-transform">
                        <h3 className="text-prime-gold text-xs font-bold uppercase tracking-wider">Total Commission</h3>
                        <p className="text-3xl font-black mt-3 tracking-tight">${stats.totalCommission.toFixed(2)}</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;