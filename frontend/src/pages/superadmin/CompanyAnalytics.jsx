import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';

const CompanyAnalytics = () => {
    const [stats, setStats] = useState({
        totalCalls: 0,
        retentionRate: 0,
        totalCommissionsPaid: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setTimeout(() => {
                    setStats({
                        totalCalls: 12450,
                        retentionRate: 68.5,
                        totalCommissionsPaid: 45200.00
                    });
                    setLoading(false);
                }, 800);
            } catch (error) {
                console.error("Failed to load analytics");
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh] w-full">
            <div className="w-8 h-8 border-4 border-prime-primary/20 border-t-prime-primary rounded-full animate-spin"></div>
        </div>
    );

    return (
        <PageWrapper title="Company Analytics">
            <div className="flex justify-between items-center mb-8 px-2">
                <div className="flex items-center gap-6">
                    <h1 className="text-xl font-semibold text-prime-text">Company Overview</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="card-base p-8 bg-white">
                    <h3 className="text-prime-muted text-xs font-semibold uppercase tracking-wider">Total Call Volume</h3>
                    <p className="text-4xl font-bold text-prime-text mt-2">{stats.totalCalls.toLocaleString()}</p>
                </div>
                <div className="card-base p-8 bg-white">
                    <h3 className="text-prime-muted text-xs font-semibold uppercase tracking-wider">Global Retention Rate</h3>
                    <p className="text-4xl font-bold text-prime-primary mt-2">{stats.retentionRate}%</p>
                </div>
                <div className="card-base p-8 bg-gradient-to-r from-prime-primary to-prime-secondary text-white border-0">
                    <h3 className="text-white/90 text-xs font-semibold uppercase tracking-wider">Commissions Paid (YTD)</h3>
                    <p className="text-4xl font-bold mt-2 tracking-tight">${stats.totalCommissionsPaid.toLocaleString()}</p>
                </div>
            </div>

            <div className="card-base flex flex-col min-h-[300px]">
                <div className="px-8 py-6 border-b border-gray-100">
                    <h3 className="text-[13px] font-semibold text-prime-muted tracking-wide">Recent System Activity</h3>
                </div>
                <div className="flex-grow flex items-center justify-center p-8">
                    <p className="text-sm text-prime-primary/60 font-medium text-center max-w-sm">
                        Connect this module to a websocket or activity log endpoint for live updates.
                    </p>
                </div>
            </div>
        </PageWrapper>
    );
};

export default CompanyAnalytics;