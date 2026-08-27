import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import PageWrapper from '../../components/layout/PageWrapper';
import { supabase } from '../../services/supabaseClient';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filter and Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('all');

    const fetchLogs = useCallback(async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            const response = await apiClient.get('/api/v1/audit/');
            setLogs(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch audit logs", error);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial Fetch
        fetchLogs(true);

        // Real-time Subscription
        const auditChannel = supabase
            .channel('live-audit-logs')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'audit_logs' },
                () => {
                    // Re-fetch to ensure we get the joined profile full_name correctly
                    fetchLogs(false); 
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(auditChannel);
        };
    }, [fetchLogs]);

    // Extract unique action types dynamically for the dropdown
    const uniqueActions = [...new Set(logs.map(log => log.action_type))].filter(Boolean).sort();

    // Apply Search and Filter logic
    const filteredLogs = logs.filter(log => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = 
            (log.description?.toLowerCase().includes(query)) || 
            (log.profiles?.full_name?.toLowerCase().includes(query));
            
        const matchesAction = actionFilter === 'all' || log.action_type === actionFilter;
        
        return matchesSearch && matchesAction;
    });

    return (
        <PageWrapper title="System Audit Logs">
            <div className="mb-8 px-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-prime-text">Audit & Activity Log</h1>
                    <p className="text-sm text-gray-500 mt-1">Real-time tracking of administrative actions.</p>
                </div>
            </div>

            {/* FILTER & SEARCH BAR */}
            <div className="card-base p-4 md:px-6 mb-6 bg-white flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-grow w-full md:w-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by description or admin name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-prime-primary text-sm transition-all shadow-sm"
                    />
                </div>

                <div className="w-full md:w-64">
                    <select 
                        value={actionFilter} 
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="input-base w-full cursor-pointer shadow-sm"
                    >
                        <option value="all">All Action Types</option>
                        {uniqueActions.map(action => (
                            <option key={action} value={action}>{action}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="card-base w-full overflow-hidden bg-white rounded-3xl border border-gray-200 shadow-sm min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Admin Name</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Action Type</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider w-1/2">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="px-6 py-20 text-center text-gray-400 text-sm">Listening for activity...</td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-32 text-center text-gray-400 text-sm font-medium">
                                        {searchTerm || actionFilter !== 'all' ? 'No logs match your filters.' : 'No activity logged yet.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap font-medium">
                                            {new Date(log.created_at).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-800 whitespace-nowrap">
                                            {log.profiles?.full_name || 'Unknown Admin'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 bg-prime-primary/10 text-prime-primary rounded-full text-[10px] font-bold uppercase">
                                                {log.action_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {log.description}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </PageWrapper>
    );
};

export default AuditLogs;