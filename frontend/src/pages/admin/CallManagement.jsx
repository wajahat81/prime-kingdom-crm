import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import PageWrapper from '../../components/layout/PageWrapper';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const CallManagement = () => {
    const { user } = useAuth();
    const [calls, setCalls] = useState([]);
    const [agents, setAgents] = useState([]);
    const [closers, setClosers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');

    // Filter & Pagination States
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [specificDate, setSpecificDate] = useState('');
    
    const [page, setPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const limit = 50;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentCallId, setCurrentCallId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmDeleteDialog, setConfirmDeleteDialog] = useState({ isOpen: false, callId: null });

    const [formData, setFormData] = useState({
        client_name: '', employee_id: '', status: 'retained', commission: '',
        handy_id: '', closer_id: '', doc_sign_id: '',
        date: new Date().toISOString().split('T')[0] 
    });

    const fetchCallsAndUsers = async () => {
        setLoading(true);
        try {
            // Fetch dynamically based on role
            const endpoint = user?.role === 'employee' 
                ? `/api/v1/calls/me?page=${page}&limit=${limit}`
                : `/api/v1/calls/?page=${page}&limit=${limit}`;

            const [callsRes, usersRes] = await Promise.all([
                apiClient.get(endpoint),
                apiClient.get('/api/v1/users/')
            ]);
            
            setCalls(callsRes.data.data || []);
            setTotalRecords(callsRes.data.total || 0);

            const staff = (usersRes.data.data || usersRes.data || []);
            const sortByName = (a, b) => (a.full_name || a.email || '').localeCompare(b.full_name || b.email || '');

            setAgents(staff.filter(u => u.role === 'employee' || u.role === 'closer').sort(sortByName));
            setClosers(staff.filter(u => u.role === 'closer').sort(sortByName));

            setError(null);
        } catch (err) {
            setError('Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    // Refetch when page changes
    useEffect(() => {
        fetchCallsAndUsers();
    }, [page]);

    // Setup real-time listener ONLY once on mount
    useEffect(() => {
        const callsChannel = supabase
            .channel('call-management-live')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'calls' },
                (payload) => {
                    setCalls((prevCalls) => {
                        if (payload.eventType === 'INSERT') return [payload.new, ...prevCalls];
                        else if (payload.eventType === 'UPDATE') return prevCalls.map((call) => call.id === payload.new.id ? payload.new : call);
                        else if (payload.eventType === 'DELETE') return prevCalls.filter((call) => call.id !== payload.old.id);
                        return prevCalls;
                    });
                }
            )
            .subscribe();

        return () => supabase.removeChannel(callsChannel);
    }, []);

    const getEmployeeName = (call) => {
    let name = 'Unknown';
    let dialingId = null;

    if (call.profiles && call.profiles.full_name) {
        name = call.profiles.full_name;
        dialingId = call.profiles.dialing_id;
    } else if (call.employee_name) {
        name = call.employee_name;
    } else if (call.employee_id) {
        const foundAgent = agents.find(a => a.id === call.employee_id);
        if (foundAgent) {
            name = foundAgent.full_name || foundAgent.email;
            dialingId = foundAgent.dialing_id;
        } else {
            return call.employee_id.substring(0, 8) + '...';
        }
    }

    return dialingId ? `${name} (#${dialingId})` : name;
};

const getCloserName = (id) => {
    if (!id) return null;
    const found = closers.find(c => c.id === id);
    if (!found) return 'Unknown';
    
    const name = found.full_name || found.email;
    return found.dialing_id ? `${name} (#${found.dialing_id})` : name;
};

    const filteredCalls = calls.filter(call => {
        if (statusFilter !== 'all' && call.status !== statusFilter) return false;

        const agentName = getEmployeeName(call);
        const handyName = getCloserName(call.handy_id) || '';
        const closerName = getCloserName(call.closer_id) || '';
        const docSignName = getCloserName(call.doc_sign_id) || '';
        
        const searchString = `${call.client_name || ''} ${agentName} ${handyName} ${closerName} ${docSignName} ${call.status || ''} ${call.date || ''}`.toLowerCase();
        const matchesSearch = searchTerm === '' || searchString.includes(searchTerm.toLowerCase());

        const rawDate = call.date || call.created_at;
        const callDateStr = rawDate ? rawDate.split('T')[0] : '';

        const matchesFrom = fromDate ? (callDateStr && callDateStr >= fromDate) : true;
        const matchesTo = toDate ? (callDateStr && callDateStr <= toDate) : true;
        const matchesSpecificDate = specificDate ? (callDateStr === specificDate) : true; 

        return matchesSearch && matchesFrom && matchesTo && matchesSpecificDate;
    });

    const handleOpenAdd = () => {
        setModalMode('add');
        setFormData({
            client_name: '', employee_id: '', status: 'retained', commission: '',
            handy_id: '', closer_id: '', doc_sign_id: '',
            date: new Date().toISOString().split('T')[0]
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (call) => {
        setModalMode('edit');
        setCurrentCallId(call.id);
        setFormData({
            client_name: call.client_name,
            employee_id: call.employee_id || '',
            status: call.status,
            commission: call.commission || '',
            handy_id: call.handy_id || '',
            closer_id: call.closer_id || '',
            doc_sign_id: call.doc_sign_id || '',
            date: call.date || new Date().toISOString().split('T')[0]
        });
        setIsModalOpen(true);
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                commission: parseFloat(formData.commission) || 0,
                handy_id: formData.handy_id || null,
                closer_id: formData.closer_id || null,
                doc_sign_id: formData.doc_sign_id || null,
                date: formData.date || new Date().toISOString().split('T')[0]
            };

            if (modalMode === 'add') {
                await apiClient.post('/api/v1/calls/', payload);
            } else {
                await apiClient.put(`/api/v1/calls/${currentCallId}`, payload);
            }
            setIsModalOpen(false);
            fetchCallsAndUsers(); // Refetch to guarantee correct page sync
        } catch (err) {
            setError('Failed to save call log.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const executeDelete = async () => {
        try {
            await apiClient.delete(`/api/v1/calls/${confirmDeleteDialog.callId}`);
            fetchCallsAndUsers();
        } catch (err) {
            setError('Failed to delete call log.');
        } finally {
            setConfirmDeleteDialog({ isOpen: false, callId: null });
        }
    };

    const handleExportCSV = () => {
        if (filteredCalls.length === 0) {
            setError('No data available to export.');
            return;
        }

        const headers = ['Date', 'Client Name', 'Agent', 'Handy', 'Closer', 'Doc Sign', 'Status', 'Commission'];
        const csvRows = filteredCalls.map((call) => {
            return [
                `"${call.date || 'N/A'}"`,
                `"${call.client_name || 'N/A'}"`,
                `"${getEmployeeName(call)}"`,
                `"${getCloserName(call.handy_id) || '-'}"`,
                `"${getCloserName(call.closer_id) || '-'}"`,
                `"${getCloserName(call.doc_sign_id) || '-'}"`,
                `"${call.status}"`,
                `"${call.commission || 0}"`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.setAttribute('href', url);
        link.setAttribute('download', `Call_Logs_Export_${new Date().toISOString().split('T')[0]}.csv`);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <PageWrapper title="Call Logs">
            <Modal
                isOpen={confirmDeleteDialog.isOpen}
                onClose={() => setConfirmDeleteDialog({ isOpen: false, callId: null })}
                title="Delete Call Log"
                onConfirm={executeDelete}
                confirmText="Delete"
            >
                <p className="text-sm font-medium text-prime-muted">Are you sure you want to permanently delete this call log?</p>
            </Modal>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalMode === 'add' ? "Add Call Log" : "Edit Call Log"}
                onConfirm={handleSubmit}
                confirmText={isSubmitting ? "Saving..." : "Save"}
            >
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-1">Date</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} required className="input-base" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-1">Agent</label>
                            <select name="employee_id" value={formData.employee_id} onChange={handleChange} required className="input-base cursor-pointer">
                                <option value="">Select Agent...</option>
                                {agents.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-1">Client Name</label>
                            <input type="text" name="client_name" value={formData.client_name} onChange={handleChange} required className="input-base" />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-1">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="input-base cursor-pointer">
                                <option value="retained">Retained</option>
                                <option value="clawed_back">Clawed Back</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-1">Commission (Rs. )</label>
                            <input type="number" step="0.01" min="0" name="commission" value={formData.commission} onChange={handleChange} className="input-base" />
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                            <div>
                                <label className="block text-[10px] font-bold text-prime-primary uppercase mb-1">Handy</label>
                                <select name="handy_id" value={formData.handy_id} onChange={handleChange} className="input-base text-xs py-2 px-2 cursor-pointer bg-blue-50/50">
                                    <option value="">None</option>
                                    {closers.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-prime-primary uppercase mb-1">Closer</label>
                                <select name="closer_id" value={formData.closer_id} onChange={handleChange} className="input-base text-xs py-2 px-2 cursor-pointer bg-blue-50/50">
                                    <option value="">None</option>
                                    {closers.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-prime-primary uppercase mb-1">Doc Sign</label>
                                <select name="doc_sign_id" value={formData.doc_sign_id} onChange={handleChange} className="input-base text-xs py-2 px-2 cursor-pointer bg-blue-50/50">
                                    <option value="">None</option>
                                    {closers.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 px-2 gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Call Logs</h1>
                    <span className="text-[13px] text-gray-500 font-semibold bg-white px-4 py-1.5 rounded-full border border-gray-200 shadow-sm">
                        {totalRecords} Total Records
                    </span>
                </div>

                <div className="flex items-center justify-end gap-3 w-full md:w-auto flex-wrap">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-gray-200 text-sm font-semibold text-gray-600 rounded-full px-4 py-2 cursor-pointer shadow-sm outline-none focus:border-prime-primary"
                    >
                        <option value="all">All Statuses</option>
                        <option value="retained">Retained</option>
                        {user?.role !== 'employee' && <option value="clawed_back">Clawed Back</option>}
                    </select>

                    <Button onClick={handleExportCSV} variant="primary" className="rounded-full px-4 font-bold shadow-sm text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        CSV
                    </Button>

                    <Button onClick={handleOpenAdd} variant="primary" className="rounded-full px-6 font-semibold shadow-sm text-sm whitespace-nowrap">
                        + Add Log
                    </Button>
                </div>
            </div>

            <div className="card-base mb-6 p-4 bg-white flex flex-col md:flex-row gap-4 items-center justify-between rounded-2xl border border-gray-200 shadow-sm">
                <div className="relative w-full md:w-1/4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search current page..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-prime-primary text-sm"
                    />
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
                    <div className="flex flex-col border-r border-gray-200 pr-4">
                        <label className="text-[10px] font-bold text-prime-primary uppercase mb-1">Specific Date</label>
                        <input
                            type="date"
                            value={specificDate}
                            onChange={(e) => {
                                setSpecificDate(e.target.value);
                                setFromDate('');
                                setToDate('');
                            }}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-prime-primary"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">From</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => {
                                    setFromDate(e.target.value);
                                    setSpecificDate(''); 
                                }}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-prime-primary"
                            />
                        </div>
                        <span className="text-gray-400 mt-5">-</span>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">To</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => {
                                    setToDate(e.target.value);
                                    setSpecificDate(''); 
                                }}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-prime-primary"
                            />
                        </div>
                    </div>

                    {(fromDate || toDate || searchTerm || specificDate) && (
                        <button 
                            onClick={() => { setFromDate(''); setToDate(''); setSearchTerm(''); setSpecificDate(''); }}
                            className="mt-5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 px-6 py-3 rounded-full mb-6 text-sm font-medium text-center">{error}</div>
            )}

            <div className="card-base flex flex-col min-h-[500px] w-full">
                <div className="overflow-x-auto w-full flex-grow">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 md:px-6 py-6 text-left text-[13px] font-bold text-gray-400">Date</th>
                                <th className="px-4 md:px-6 py-6 text-left text-[13px] font-bold text-gray-400">Client</th>
                                <th className="px-4 md:px-6 py-6 text-left text-[13px] font-bold text-gray-400">Agent</th>
                                <th className="px-4 md:px-6 py-6 text-left text-[13px] font-bold text-gray-400">Support Team</th>
                                <th className="px-4 md:px-6 py-6 text-left text-[13px] font-bold text-gray-400">Status</th>
                                <th className="px-4 md:px-6 py-6 text-left text-[13px] font-bold text-gray-400">Commission</th>
                                <th className="px-4 md:px-6 py-6 text-right text-[13px] font-bold text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {loading ? (
                                <tr><td colSpan="7" className="px-6 py-20 text-center text-gray-400 text-sm">Loading records...</td></tr>
                            ) : filteredCalls.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-32 text-center text-gray-400 text-sm font-medium">No matching records found.</td></tr>
                            ) : (
                                filteredCalls.map((call) => (
                                    <tr key={call.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
    <td className="px-4 md:px-6 py-5 whitespace-nowrap text-gray-500 font-medium text-sm">
        {formatDate(call.date)}
    </td>
    <td className="px-4 md:px-6 py-5 whitespace-nowrap font-bold text-gray-800 text-sm">{call.client_name}</td>
    <td className="px-4 md:px-6 py-5 whitespace-nowrap text-gray-500 font-medium text-sm">{getEmployeeName(call)}</td>

    <td className="px-4 md:px-6 py-5 whitespace-nowrap">
        <div className="flex flex-col gap-1 text-[11px] font-medium text-gray-500">
            {call.handy_id && <span><b className="text-prime-primary mr-1">H:</b> {getCloserName(call.handy_id)}</span>}
            {call.closer_id && <span><b className="text-prime-primary mr-1">C:</b> {getCloserName(call.closer_id)}</span>}
            {call.doc_sign_id && <span><b className="text-prime-primary mr-1">DS:</b> {getCloserName(call.doc_sign_id)}</span>}
            {!call.handy_id && !call.closer_id && !call.doc_sign_id && <span className="text-gray-300">-</span>}
        </div>
    </td>

    <td className="px-4 md:px-6 py-5 whitespace-nowrap">
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${call.status === 'retained' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {call.status.replace('_', ' ')}
        </span>
    </td>

    <td className="px-4 md:px-6 py-5 whitespace-nowrap font-bold text-gray-700 text-sm">
        {`Rs. ${parseFloat(call.commission || 0).toFixed(2)}`}
    </td>

    <td className="px-4 md:px-6 py-5 whitespace-nowrap text-right">
        <div className="flex justify-end gap-2 items-center">
            <button onClick={() => handleOpenEdit(call)} className="text-gray-400 hover:text-prime-primary p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button onClick={() => setConfirmDeleteDialog({ isOpen: true, callId: call.id })} className="text-gray-400 hover:text-red-500 p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
    </td>
</tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* 🚨 Pagination Controls Footer */}
                <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl mt-auto">
                    <span className="text-xs text-gray-500 font-medium">Page {page} • Showing {calls.length} of {totalRecords} records</span>
                    <div className="flex gap-2">
                        <Button 
                            disabled={page === 1} 
                            onClick={() => setPage(page - 1)} 
                            variant="secondary" 
                            className="px-4 py-1.5 text-xs font-semibold shadow-sm"
                        >
                            Previous
                        </Button>
                        <Button 
                            disabled={calls.length < limit || calls.length === 0} 
                            onClick={() => setPage(page + 1)} 
                            variant="secondary" 
                            className="px-4 py-1.5 text-xs font-semibold shadow-sm"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default CallManagement;