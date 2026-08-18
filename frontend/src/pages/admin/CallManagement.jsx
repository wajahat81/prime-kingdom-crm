import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import PageWrapper from '../../components/layout/PageWrapper';

const CallManagement = () => {
    const [calls, setCalls] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Edit/Add Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); 
    const [currentCallId, setCurrentCallId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete Modal State
    const [confirmDeleteDialog, setConfirmDeleteDialog] = useState({ isOpen: false, callId: null });

    const [formData, setFormData] = useState({
        client_name: '', employee_id: '', call_duration: '', status: 'pending', commission: ''
    });

    const fetchCallsAndUsers = async () => {
        setLoading(true);
        try {
            const [callsRes, usersRes] = await Promise.all([
                apiClient.get('/api/v1/calls/'),
                apiClient.get('/api/v1/users/')
            ]);
            setCalls(callsRes.data.data || []);
            
            const staff = (usersRes.data.data || usersRes.data || []).filter(u => u.role === 'employee' || u.role === 'admin');
            setUsers(staff);
            setError(null);
        } catch (err) {
            setError('Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCallsAndUsers(); }, []);

    const filteredCalls = calls.filter(call => {
        if (statusFilter === 'all') return true;
        return call.status === statusFilter;
    });

    const handleOpenAdd = () => {
        setModalMode('add');
        setFormData({ client_name: '', employee_id: '', call_duration: '', status: 'pending', commission: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (call) => {
        setModalMode('edit');
        setCurrentCallId(call.id);
        setFormData({
            client_name: call.client_name,
            employee_id: call.employee_id || '',
            call_duration: call.call_duration || '',
            status: call.status,
            commission: call.commission || ''
        });
        setIsModalOpen(true);
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                commission: formData.status === 'retained' ? (parseFloat(formData.commission) || 0) : 0
            };

            if (modalMode === 'add') {
                await apiClient.post('/api/v1/calls/', payload);
            } else {
                await apiClient.put(`/api/v1/calls/${currentCallId}`, payload);
            }
            setIsModalOpen(false);
            fetchCallsAndUsers();
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

    const getEmployeeName = (call) => {
        if (call.profiles && call.profiles.full_name) return call.profiles.full_name;
        if (call.employee_name) return call.employee_name;
        return call.employee_id ? call.employee_id.substring(0, 8) + '...' : 'Unknown';
    };

    return (
        <PageWrapper title="Call Logs">
            {/* Delete Confirmation Modal */}
            <Modal 
                isOpen={confirmDeleteDialog.isOpen} 
                onClose={() => setConfirmDeleteDialog({ isOpen: false, callId: null })} 
                title="Delete Call Log"
                onConfirm={executeDelete}
                confirmText="Delete"
            >
                <p className="text-sm font-medium text-prime-muted">Are you sure you want to permanently delete this call log?</p>
            </Modal>

            {/* Add / Edit Form Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={modalMode === 'add' ? "Add Call Log" : "Edit Call Log"}
                onConfirm={handleSubmit}
                confirmText={isSubmitting ? "Saving..." : "Save"}
            >
                <div className="space-y-4 py-2">
                    <div>
                        <label className="block text-xs font-semibold text-prime-muted uppercase mb-1">Agent</label>
                        <select name="employee_id" value={formData.employee_id} onChange={handleChange} required className="input-base">
                            <option value="">Select Agent...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-prime-muted uppercase mb-1">Client Name</label>
                        <input type="text" name="client_name" value={formData.client_name} onChange={handleChange} required className="input-base" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-prime-muted uppercase mb-1">Duration</label>
                        <input type="text" name="call_duration" value={formData.call_duration} onChange={handleChange} placeholder="MM:SS" className="input-base" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-prime-muted uppercase mb-1">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="input-base">
                            <option value="pending">Pending</option>
                            <option value="retained">Retained</option>
                            <option value="not_retained">Not Retained</option>
                        </select>
                    </div>
                    {formData.status === 'retained' && (
                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-1">Commission ($)</label>
                            <input type="number" step="0.01" min="0" name="commission" value={formData.commission} onChange={handleChange} className="input-base" />
                        </div>
                    )}
                </div>
            </Modal>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 px-2 gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Call Logs</h1>
                    <span className="text-[13px] text-gray-500 font-semibold bg-white px-4 py-1.5 rounded-full border border-gray-200 shadow-sm">
                        {filteredCalls.length} Records
                    </span>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-gray-200 text-sm font-semibold text-gray-600 rounded-full px-4 py-2 cursor-pointer shadow-sm outline-none focus:border-prime-primary"
                    >
                        <option value="all">All Statuses</option>
                        <option value="retained">Retained</option>
                        <option value="pending">Pending</option>
                        <option value="not_retained">Not Retained</option>
                    </select>
                    <Button onClick={handleOpenAdd} variant="primary" className="rounded-full px-6 font-semibold shadow-sm text-sm whitespace-nowrap">
                        + Add Log
                    </Button>
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
                                <th className="px-4 md:px-6 py-6 text-left text-[13px] font-bold text-gray-400">Client</th>
                                <th className="px-4 md:px-6 py-6 text-left text-[13px] font-bold text-gray-400">Agent</th>
                                <th className="px-4 md:px-6 py-6 text-left text-[13px] font-bold text-gray-400">Duration</th>
                                <th className="px-4 md:px-6 py-6 text-left text-[13px] font-bold text-gray-400">Status</th>
                                <th className="px-4 md:px-6 py-6 text-left text-[13px] font-bold text-gray-400">Commission</th>
                                <th className="px-4 md:px-6 py-6 text-right text-[13px] font-bold text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-20 text-center text-gray-400 text-sm">Loading records...</td></tr>
                            ) : filteredCalls.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-32 text-center text-gray-400 text-sm font-medium">No records yet.</td></tr>
                            ) : (
                                filteredCalls.map((call) => (
                                    <tr key={call.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                                        <td className="px-4 md:px-6 py-5 whitespace-nowrap font-bold text-gray-800 text-sm">{call.client_name}</td>
                                        <td className="px-4 md:px-6 py-5 whitespace-nowrap text-gray-500 font-medium text-sm">{getEmployeeName(call)}</td>
                                        <td className="px-4 md:px-6 py-5 whitespace-nowrap text-gray-500 font-medium text-sm">{call.call_duration || '-'}</td>
                                        <td className="px-4 md:px-6 py-5 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${call.status === 'retained' ? 'bg-green-50 text-green-600' : call.status === 'not_retained' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                                {call.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-6 py-5 whitespace-nowrap font-bold text-gray-700 text-sm">
                                            {call.status === 'retained' ? `$${parseFloat(call.commission || 0).toFixed(2)}` : '-'}
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
            </div>
        </PageWrapper>
    );
};

export default CallManagement;