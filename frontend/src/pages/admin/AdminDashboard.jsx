import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import AnnouncementBanner from '../../components/layout/AnnouncementBanner';
import AnnouncementModal from '../../components/layout/AnnouncementModal';
import PageWrapper from '../../components/layout/PageWrapper';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalCalls: 0, retained: 0, pending: 0, notRetained: 0, totalCommission: 0
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
        <div className="flex justify-center items-center h-[60vh] w-full">
            <div className="w-8 h-8 border-4 border-prime-primary/20 border-t-prime-primary rounded-full animate-spin"></div>
        </div>
    );

    return (
        <PageWrapper title="Admin Dashboard">
            <AnnouncementModal />
            <AnnouncementBanner />
            
            <div className="w-full pt-4">
                <div className="mb-8 px-2">
                    <h1 className="text-2xl font-bold text-prime-text tracking-tight mb-1">Administrator Dashboard</h1>
                    <p className="text-sm text-prime-muted font-medium">System-wide overview of call logging and commission tracking.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10 px-2">
                    <div className="card-base p-6 bg-white">
                        <h3 className="text-prime-muted text-xs font-semibold uppercase tracking-wider mb-2">Total Calls</h3>
                        <p className="text-3xl font-bold text-prime-text">{stats.totalCalls}</p>
                    </div>
                    <div className="card-base p-6 border-t-4 border-t-emerald-500 bg-white">
                        <h3 className="text-prime-muted text-xs font-semibold uppercase tracking-wider mb-2">Retained</h3>
                        <p className="text-3xl font-bold text-emerald-600">{stats.retained}</p>
                    </div>
                    <div className="card-base p-6 border-t-4 border-t-yellow-400 bg-white">
                        <h3 className="text-prime-muted text-xs font-semibold uppercase tracking-wider mb-2">Pending</h3>
                        <p className="text-3xl font-bold text-yellow-500">{stats.pending}</p>
                    </div>
                    <div className="card-base p-6 border-t-4 border-t-rose-500 bg-white">
                        <h3 className="text-prime-muted text-xs font-semibold uppercase tracking-wider mb-2">Not Retained</h3>
                        <p className="text-3xl font-bold text-rose-500">{stats.notRetained}</p>
                    </div>
                    <div className="card-base p-6 bg-gradient-to-r from-prime-primary to-prime-secondary text-white border-0">
                        <h3 className="text-white/90 text-xs font-semibold uppercase tracking-wider mb-2">Total Commission</h3>
                        <p className="text-3xl font-bold tracking-tight">${stats.totalCommission.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default AdminDashboard;