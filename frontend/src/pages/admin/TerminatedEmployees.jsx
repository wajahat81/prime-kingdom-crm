import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import PageWrapper from '../../components/layout/PageWrapper';
import Modal from '../../components/common/Modal';
import { supabase } from '../../services/supabaseClient';

const TerminatedEmployees = () => {
    const [terminatedList, setTerminatedList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({ 
        full_name: '', 
        termination_date: '', 
        termination_reason: '', 
        dialing_id: '' 
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const fetchTerminatedUsers = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/api/v1/users/terminated');
            setTerminatedList(res.data.data || res.data || []);
        } catch (err) {
            console.error("Failed to load terminated employees", err);
            setMessage({ type: 'error', text: 'Failed to load terminated employees list.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTerminatedUsers();

        const terminatedChannel = supabase
            .channel('live-terminated-users')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                (payload) => {
                    setTerminatedList((prevList) => {
                        const updatedUser = payload.new;
                        const oldUser = payload.old;

                        if (payload.eventType === 'UPDATE') {
                            if (updatedUser.is_active === true) {
                                return prevList.filter(u => u.id !== updatedUser.id);
                            }
                            const exists = prevList.some(u => u.id === updatedUser.id);
                            if (exists) {
                                return prevList.map(u => u.id === updatedUser.id ? updatedUser : u);
                            } else if (updatedUser.is_active === false) {
                                return [updatedUser, ...prevList];
                            }
                        } else if (payload.eventType === 'INSERT' && updatedUser.is_active === false) {
                            return [updatedUser, ...prevList];
                        } else if (payload.eventType === 'DELETE') {
                            return prevList.filter(u => u.id !== oldUser.id);
                        }
                        return prevList;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(terminatedChannel);
        };
    }, []);

    const handleRestoreUser = async (userId) => {
        try {
            await apiClient.put(`/api/v1/users/${userId}/restore`, { is_active: true });
            setMessage({ type: 'success', text: 'Employee successfully restored to active status.' });
        } catch (err) {
            console.error("Failed to restore user", err);
            setMessage({ type: 'error', text: 'Failed to restore user account.' });
        }
    };

    const handlePermanentDelete = async (userId) => {
        try {
            await apiClient.delete(`/api/v1/users/${userId}/permanent`);
            setMessage({ type: 'success', text: 'Employee record permanently deleted.' });
            setConfirmDeleteId(null);
        } catch (err) {
            console.error("Failed to permanently delete user", err);
            setMessage({ type: 'error', text: 'Failed to permanently delete record.' });
        }
    };

    const openEditModal = (user) => {
    setEditingUser(user);
    setEditFormData({
        full_name: user.full_name || '',
        termination_date: user.termination_date || '',
        termination_reason: user.termination_reason || '',
        dialing_id: user.dialing_id || '',
        role: user.role || 'employee',       // Required by backend
        email: user.email || null           // Required by backend
    });
};

    const handleUpdateUser = async () => {
        setIsSubmitting(true);
        try {
            // Convert empty strings to null to prevent database unique constraint errors
            const payload = { ...editFormData };
            if (!payload.dialing_id) payload.dialing_id = null;
            if (!payload.cnic) payload.cnic = null;
            if (!payload.termination_date) payload.termination_date = null;
            if (!payload.termination_reason) payload.termination_reason = null;

            await apiClient.put(`/api/v1/users/${editingUser.id}`, payload);
            setMessage({ type: 'success', text: 'Terminated profile updated successfully.' });
            setEditingUser(null);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update user profile.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    const filteredTerminatedList = terminatedList.filter(user => {
        const query = searchTerm.toLowerCase();
        const matchName = user.full_name?.toLowerCase().includes(query);
        const matchDate = user.termination_date?.toLowerCase().includes(query);
        const matchReason = user.termination_reason?.toLowerCase().includes(query);
        const matchDialingId = user.dialing_id?.toString().includes(query);
        return matchName || matchDate || matchReason || matchDialingId;
    });

    return (
        <PageWrapper title="Terminated / Previous Employees">
            <div className="flex justify-between items-center mb-8 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-prime-text">Terminated & Former Employees</h1>
                    <p className="text-sm text-gray-500 mt-1">Archived records of staff members no longer active in the system.</p>
                </div>
            </div>

            {message && (
                <div className={`px-6 py-3 mb-6 rounded-full text-sm font-medium text-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {message.text}
                </div>
            )}

            <Modal 
                isOpen={!!editingUser} 
                onClose={() => setEditingUser(null)} 
                title="Edit Terminated Profile"
                onConfirm={handleUpdateUser}
                confirmText={isSubmitting ? "Saving..." : "Save Changes"}
            >
                {editingUser && (
                    <div className="space-y-4 py-2">
                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">Full Name</label>
                            <input 
                                type="text" 
                                value={editFormData.full_name} 
                                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })} 
                                className="input-base" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">Termination Date</label>
                            <input 
                                type="date" 
                                value={editFormData.termination_date} 
                                onChange={(e) => setEditFormData({ ...editFormData, termination_date: e.target.value })} 
                                className="input-base" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">Reason</label>
                            <input 
                                type="text" 
                                value={editFormData.termination_reason} 
                                onChange={(e) => setEditFormData({ ...editFormData, termination_reason: e.target.value })} 
                                className="input-base" 
                            />
                        </div>
                        
                    </div>
                )}
            </Modal>

            <Modal 
                isOpen={!!confirmDeleteId} 
                onClose={() => setConfirmDeleteId(null)} 
                title="Permanently Delete Record?"
                onConfirm={() => handlePermanentDelete(confirmDeleteId)}
                confirmText="Delete Forever"
            >
                <p className="text-sm font-medium text-red-600">
                    Warning: This action is irreversible. All related history for this employee will be permanently purged from the database.
                </p>
            </Modal>

            <div className="card-base flex flex-col min-h-[400px] w-full overflow-hidden bg-white rounded-3xl border border-gray-200 shadow-sm">
                
                <div className="p-4 md:px-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by Name, Date, Reason, or Dialing ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg w-full sm:w-2/3 focus:outline-none focus:ring-2 focus:ring-prime-primary focus:border-transparent text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto w-full flex-grow">
                    <table className="min-w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Employee Name</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Termination Date</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Reason</th>
                                
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-5 text-right text-[13px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="px-8 py-20 text-center text-gray-400 text-sm">Loading archived records...</td></tr>
                            ) : filteredTerminatedList.length === 0 ? (
                                <tr><td colSpan="6" className="px-8 py-32 text-center text-gray-400 text-sm font-medium">No terminated employees found.</td></tr>
                            ) : (
                                filteredTerminatedList.map(emp => (
                                    <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-800">{emp.full_name || 'N/A'}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-gray-600">{emp.termination_date || 'N/A'}</td>
                                        <td className="px-6 py-5 text-sm text-gray-600 max-w-[250px] truncate" title={emp.termination_reason}>{emp.termination_reason || 'Not Specified'}</td>
                                        
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase">Terminated</span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => openEditModal(emp)} 
                                                    title="Edit Details"
                                                    className="p-1.5 bg-gray-100 text-gray-600 hover:bg-prime-primary hover:text-white rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>

                                                <button 
                                                    onClick={() => handleRestoreUser(emp.id)}
                                                    className="px-3 py-1.5 bg-prime-primary/10 text-prime-primary hover:bg-prime-primary hover:text-white rounded-full text-xs font-bold transition-colors"
                                                >
                                                    Restore
                                                </button>

                                                <button 
                                                    onClick={() => setConfirmDeleteId(emp.id)}
                                                    title="Delete Permanently"
                                                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
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

export default TerminatedEmployees;