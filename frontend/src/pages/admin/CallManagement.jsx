import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import PageWrapper from '../../components/layout/PageWrapper';

const CallManagement = () => {
    const [calls, setCalls] = useState([]);
    
    // Separated user lists for dropdowns
    const [agents, setAgents] = useState([]);
    const [closers, setClosers] = useState([]);
    
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
        client_name: '', employee_id: '', status: 'retained', commission: '',
        handy_id: '', closer_id: '', doc_sign_id: ''
    });

    const fetchCallsAndUsers = async () => {
        setLoading(true);
        try {
            const [callsRes, usersRes] = await Promise.all([
                apiClient.get('/api/v1/calls/'),
                apiClient.get('/api/v1/users/')
            ]);
            setCalls(callsRes.data.data || []);
            
            const staff = (usersRes.data.data || usersRes.data || []);
            
            // Agents can be employees or closers
            setAgents(staff.filter(u => u.role === 'employee' || u.role === 'closer'));
            // Support roles are strictly closers
            setClosers(staff.filter(u => u.role === 'closer'));
            
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
        setFormData({ 
            client_name: '', employee_id: '', status: 'pending', commission: '',
            handy_id: '', closer_id: '', doc_sign_id: ''
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
            doc_sign_id: call.doc_sign_id || ''
        });
        setIsModalOpen(true);
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                commission: formData.status === 'retained' ? (parseFloat(formData.commission) || 0) : 0,
                handy_id: formData.handy_id || null,
                closer_id: formData.closer_id || null,
                doc_sign_id: formData.doc_sign_id || null
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

    // Helper to translate Support IDs into names for the table
    const getCloserName = (id) => {
        if (!id) return null;
        const found = closers.find(c => c.id === id);
        return found ? (found.full_name || found.email) : 'Unknown';
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <option value="pending">Pending</option>
                                <option value="retained">Retained</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-1">Commission (Rs. )</label>
                            <input type="number" step="0.01" min="0" name="commission" value={formData.commission} onChange={handleChange} disabled={formData.status !== 'retained'} className="input-base disabled:opacity-50" />
                        </div>

                        {/* NEW SPLIT FIELDS */}
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
                                <th className="px-4 md:px-6 py-6 text-left text-[13px] font-bold text-gray-400">Support Team</th>
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
                                        
                                        {/* NEW: Displays the attached closers */}
                                        <td className="px-4 md:px-6 py-5 whitespace-nowrap">
                                            <div className="flex flex-col gap-1 text-[11px] font-medium text-gray-500">
                                                {call.handy_id && <span><b className="text-prime-primary mr-1">H:</b> {getCloserName(call.handy_id)}</span>}
                                                {call.closer_id && <span><b className="text-prime-primary mr-1">C:</b> {getCloserName(call.closer_id)}</span>}
                                                {call.doc_sign_id && <span><b className="text-prime-primary mr-1">DS:</b> {getCloserName(call.doc_sign_id)}</span>}
                                                {!call.handy_id && !call.closer_id && !call.doc_sign_id && <span className="text-gray-300">-</span>}
                                            </div>
                                        </td>

                                        <td className="px-4 md:px-6 py-5 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${call.status === 'retained' ? 'bg-green-50 text-green-600' : call.status === 'not_retained' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                                {call.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-6 py-5 whitespace-nowrap font-bold text-gray-700 text-sm">
                                            {call.status === 'retained' ? `Rs. ${parseFloat(call.commission || 0).toFixed(2)}` : '-'}
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