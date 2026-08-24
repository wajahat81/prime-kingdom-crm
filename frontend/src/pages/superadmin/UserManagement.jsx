import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import PageWrapper from '../../components/layout/PageWrapper';
import { useAuth } from '../../context/AuthContext';
import { trustDeviceForUser } from '../../services/userService';


const UserManagement = () => {
    const { user: currentUser } = useAuth();
    
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [formData, setFormData] = useState({ email: '', password: '', full_name: '', role: 'employee', dialing_id: '' });
    const [searchTerm, setSearchTerm] = useState('');

    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({ full_name: '', email: '', password: '', role: '', dialing_id: '' });
    
    const [status, setStatus] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', action: null });

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const response = await apiClient.get('/api/v1/users/'); 
            setUsers(response.data.data || response.data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleAddChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const triggerAddUser = (e) => {
        e.preventDefault();
        setConfirmDialog({
            isOpen: true,
            title: "Provision this new user account?",
            action: async () => {
                setIsSubmitting(true);
                try {
                    await apiClient.post('/api/v1/auth/register', formData);
                    setStatus({ type: 'success', text: 'User created successfully.' });
                    setFormData({ email: '', password: '', full_name: '', role: 'employee', dialing_id: '' });
                    fetchUsers();
                } catch (error) {
                    const errorMsg = error.response?.data?.detail || 'Failed to create user.';
                    setStatus({ type: 'error', text: errorMsg });
                } finally {
                    setIsSubmitting(false);
                    setConfirmDialog({ isOpen: false, title: '', action: null });
                }
            }
        });
    };

    const triggerDelete = (userId) => {
        setConfirmDialog({
            isOpen: true,
            title: "Permanently delete this account?",
            action: async () => {
                try {
                    await apiClient.delete(`/api/v1/users/${userId}`);
                    setStatus({ type: 'success', text: 'User deleted successfully.' });
                    fetchUsers();
                } catch (error) {
                    setStatus({ type: 'error', text: 'Failed to delete user.' });
                } finally {
                    setConfirmDialog({ isOpen: false, title: '', action: null });
                }
            }
        });
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setEditFormData({ 
            full_name: user.full_name || '', 
            email: user.email || '', 
            password: '', 
            role: user.role || 'employee',
            dialing_id: user.dialing_id || ''
        });
    };

    const handleEditChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

    const handleUpdateUser = async () => {
        setIsSubmitting(true);
        setStatus(null);
        try {
            const payload = { ...editFormData };
            if (!payload.password) delete payload.password; 
            if (!payload.dialing_id) payload.dialing_id = null;

            await apiClient.put(`/api/v1/users/${editingUser.id}`, payload);
            setStatus({ type: 'success', text: 'User updated successfully.' });
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Failed to update user.';
            setStatus({ type: 'error', text: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const canEditOrDelete = (targetUser) => {
        if (!currentUser) return false;
        if (currentUser.role === 'super_admin') return true; 
        if (currentUser.role === 'admin') {
            if (targetUser.id === currentUser.id) return false;
            if (targetUser.role === 'super_admin') return false; 
            return true;
        }
        return false;
    };

    // --- NEW TRUSTED DEVICE LOGIC ---
    const handleTrustDevice = async (userId, userName) => {
        const confirmAction = window.confirm(
            `Are you sure you want to lock ${userName}'s account to THIS physical computer?`
        );
        if (!confirmAction) return;

        const result = await trustDeviceForUser(userId);
        
        if (result.success) {
            alert(`Success! This computer is now bound to ${userName}. You can safely log out.`);
        } else {
            alert(`Error: ${result.error}`);
        }
    };
    // --------------------------------
    const filteredUsers = users.filter((user) => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        const matchName = user.full_name?.toLowerCase().includes(lowerCaseSearch);
        const matchDialingId = user.dialing_id?.includes(lowerCaseSearch);
        return matchName || matchDialingId;
    });
    
    return (
        <PageWrapper title="Manage Users">
            <Modal 
                isOpen={confirmDialog.isOpen} 
                onClose={() => setConfirmDialog({ isOpen: false, title: '', action: null })} 
                title={confirmDialog.title}
                onConfirm={confirmDialog.action}
                confirmText="Proceed"
            >
                <p className="text-sm font-medium text-prime-muted">Please confirm you wish to execute this action.</p>
            </Modal>

            <Modal 
                isOpen={!!editingUser} 
                onClose={() => setEditingUser(null)} 
                title="Update User Profile"
                onConfirm={handleUpdateUser}
                confirmText={isSubmitting ? "Saving..." : "Save Changes"}
            >
                {editingUser && (
                    <div className="space-y-4 py-2">
                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">Full Name</label>
                            <input type="text" name="full_name" value={editFormData.full_name} onChange={handleEditChange} className="input-base" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">Dialing ID (4 Digits)</label>
                            <input type="text" name="dialing_id" value={editFormData.dialing_id} onChange={handleEditChange} pattern="\d{4}" maxLength="4" placeholder="e.g. 1024" className="input-base" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">Email Address</label>
                            <input type="email" name="email" value={editFormData.email} onChange={handleEditChange} className="input-base" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">Change Password</label>
                            <input type="password" name="password" value={editFormData.password} onChange={handleEditChange} placeholder="Enter new password or leave blank" className="input-base" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">Security Role</label>
                            <select name="role" value={editFormData.role} onChange={handleEditChange} className="input-base cursor-pointer">
                                <option value="employee">Agent</option>
                                <option value="admin">Admin</option>
                                {currentUser?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                            </select>
                        </div>
                    </div>
                )}
            </Modal>

            <div className="flex justify-between items-center mb-8 px-2">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">System Users</h1>
                <Button onClick={fetchUsers} variant="outline" className="rounded-full px-6 text-sm">Refresh List</Button>
            </div>

            {status && (
                <div className={`px-6 py-3 mb-6 rounded-full text-sm font-medium text-center ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {status.text}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-1">
                    <div className="card-base p-8 sticky top-24 bg-white">
                        <h2 className="text-lg font-bold text-prime-text mb-6">Create New Account</h2>
                        <form onSubmit={triggerAddUser} className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-2">Full Name</label>
                                <input type="text" name="full_name" value={formData.full_name} onChange={handleAddChange} required className="input-base" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-2">Dialing ID (4 Digits)</label>
                                <input type="text" name="dialing_id" value={formData.dialing_id} onChange={handleAddChange} pattern="\d{4}" maxLength="4" placeholder="e.g. 1024" className="input-base" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-2">Role</label>
                                <select name="role" value={formData.role} onChange={handleAddChange} className="input-base cursor-pointer">
                                    <option value="employee">Agent</option>
                                    <option value="admin">Admin</option>
                                    {currentUser?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-2">Email Address (Optional)</label>
                                <input type="email" name="email" value={formData.email} onChange={handleAddChange} className="input-base" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-2">Temporary Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleAddChange} required minLength={8} className="input-base" />
                            </div>
                            <Button type="submit" disabled={isSubmitting} variant="primary" className="w-full py-3">Create User</Button>
                        </form>
                    </div>
                </div>

                <div className="xl:col-span-2">
                    <div className="card-base flex flex-col min-h-[500px] w-full overflow-hidden">

                        {/* --- SEARCH BAR UI --- */}
                        <div className="p-4 md:px-6 border-b border-gray-100 bg-gray-50/50">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by Name or Dialing ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg w-full sm:w-2/3 focus:outline-none focus:ring-2 focus:ring-prime-primary focus:border-transparent text-sm transition-all"
                                />
                            </div>
                        </div>
                        {/* --------------------- */}

                        <div className="overflow-x-auto w-full flex-grow">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="px-4 md:px-6 py-6 text-left text-[13px] font-bold text-gray-400">User Details</th>
                                        <th className="px-4 md:px-6 py-6 text-left text-[13px] font-bold text-gray-400">Dialing ID</th>
                                        <th className="px-4 md:px-6 py-6 text-left text-[13px] font-bold text-gray-400">Role</th>
                                        <th className="px-4 md:px-6 py-6 text-right text-[13px] font-bold text-gray-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {/* CHANGED FROM users.map TO filteredUsers.map */}
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors group">
                                            <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-800">{u.full_name || 'N/A'}</div>
                                                <div className="text-xs font-medium text-gray-500 mt-0.5">{u.email}</div>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600">
                                                {u.dialing_id ? `#${u.dialing_id}` : '-'}
                                            </td>
                                            <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-600`}>
                                                    {u.role ? u.role.replace('_', ' ') : 'employee'}
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">

                                                    {u.role !== 'admin' && u.role !== 'super_admin' && (
                                                        <button
                                                            onClick={() => handleTrustDevice(u.id, u.full_name)}
                                                            className="bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 transition-colors shadow-sm text-xs font-bold mr-2"
                                                            title="Lock account to this physical computer"
                                                        >
                                                            Trust Device
                                                        </button>
                                                    )}

                                                    {canEditOrDelete(u) && (
                                                        <>
                                                            <button onClick={() => openEditModal(u)} className="text-gray-300 hover:text-prime-primary p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                            <button onClick={() => triggerDelete(u.id)} className="text-gray-300 hover:text-red-500 p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* UPDATE EMPTY STATE TO CHECK FILTERED USERS */}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                                {searchTerm ? `No users found matching "${searchTerm}"` : 'No users found.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default UserManagement;