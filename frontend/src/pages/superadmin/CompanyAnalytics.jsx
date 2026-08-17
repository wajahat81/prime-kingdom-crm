import React, { useState, useEffect } from 'react';

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
        <div className="flex justify-center items-center h-screen w-full page-transition">
            <div className="w-8 h-8 border-4 border-prime-navy/20 border-t-prime-navy rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-8 w-full page-transition">
            <div className="mb-8 border-b border-gray-100 pb-5">
                <h1 className="text-3xl font-extrabold text-prime-text tracking-tight mb-1">Company Overview</h1>
                <p className="text-sm font-medium text-prime-muted">Executive metrics and system-wide performance aggregations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="card-base p-8 border-t-4 border-t-prime-navy bg-white">
                    <h3 className="text-prime-muted text-xs font-bold uppercase tracking-wider">Total Call Volume</h3>
                    <p className="text-4xl font-black text-prime-text mt-3">{stats.totalCalls.toLocaleString()}</p>
                </div>
                <div className="card-base p-8 border-t-4 border-t-prime-green bg-white">
                    <h3 className="text-prime-muted text-xs font-bold uppercase tracking-wider">Global Retention Rate</h3>
                    <p className="text-4xl font-black text-prime-green mt-3">{stats.retentionRate}%</p>
                </div>
                <div className="card-base p-8 bg-gradient-to-br from-prime-navy to-[#2a3f6b] text-white border-0 shadow-lg transform hover:-translate-y-1 transition-transform">
                    <h3 className="text-prime-gold text-xs font-bold uppercase tracking-wider">Commissions Paid (YTD)</h3>
                    <p className="text-4xl font-black mt-3 tracking-tight">${stats.totalCommissionsPaid.toLocaleString()}</p>
                </div>
            </div>

            <div className="card-base p-8">
                <h3 className="text-lg font-bold text-prime-text mb-4">Recent System Activity</h3>
                <div className="p-8 bg-gray-50/50 border border-dashed border-gray-200 rounded-lg text-center">
                    <p className="text-sm text-prime-muted font-medium">
                        Connect this module to a websocket or activity log endpoint for live updates on check-ins and call uploads.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CompanyAnalytics;