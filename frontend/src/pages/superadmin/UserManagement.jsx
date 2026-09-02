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
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({ joining_date: '', password: '', full_name: '', role: 'employee', dialing_id: '', cnic: '' });

    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({ full_name: '', joining_date: '', password: '', role: '', dialing_id: '', cnic: '' });
    
    const [status, setStatus] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', action: null });

    // Password visibility states
    const [showPassword, setShowPassword] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);

    // 🚨 CNIC Auto-Formatting Helper (15 characters max: 13 digits + 2 dashes)
    const formatCNIC = (value) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length <= 5) {
            return cleaned;
        } else if (cleaned.length <= 12) {
            return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
        } else {
            return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await apiClient.get('/api/v1/users/');
            let usersData = response.data.data || response.data || [];
            
            usersData.sort((a, b) => (a.full_name || a.email || '').localeCompare(b.full_name || b.email || ''));
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleAddChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // 🚨 Specialized handler for CNIC input with auto-formatting
    const handleAddCnicChange = (e) => {
        setFormData({ ...formData, cnic: formatCNIC(e.target.value) });
    };

    const triggerAddUser = async () => {
        setIsSubmitting(true);
        setStatus(null);
        try {
            const payload = { ...formData };
            if (!payload.joining_date) payload.joining_date = null;
            if (!payload.dialing_id) payload.dialing_id = null;
            if (!payload.cnic) payload.cnic = null;

            await apiClient.post('/api/v1/auth/register', payload);
            setStatus({ type: 'success', text: 'User created successfully.' });
            setFormData({ joining_date: '', password: '', full_name: '', role: 'employee', dialing_id: '', cnic: '' });
            setIsAddModalOpen(false);
            fetchUsers();
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Failed to create user.';
            setStatus({ type: 'error', text: errorMsg });
        } finally {
            setIsSubmitting(false);
            setConfirmDialog({ isOpen: false, title: '', action: null });
        }
    };

    const triggerDelete = (userId) => {
        setConfirmDialog({
            isOpen: true,
            title: "Archive/Terminate this account?",
            action: async () => {
                try {
                    await apiClient.delete(`/api/v1/users/${userId}`);
                    setStatus({ type: 'success', text: 'User successfully archived to terminated list.' });
                    fetchUsers();
                } catch (error) {
                    setStatus({ type: 'error', text: 'Failed to archive user.' });
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
            joining_date: user.joining_date || '', 
            password: '', 
            role: user.role || 'employee',
            dialing_id: user.dialing_id || '',
            cnic: user.cnic || ''
        });
    };

    const handleEditChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

    // 🚨 Specialized handler for Edit CNIC input with auto-formatting
    const handleEditCnicChange = (e) => {
        setEditFormData({ ...editFormData, cnic: formatCNIC(e.target.value) });
    };

    const handleUpdateUser = async () => {
        setIsSubmitting(true);
        setStatus(null);
        try {
            const payload = { ...editFormData };
            if (!payload.password) delete payload.password; 
            if (!payload.dialing_id) payload.dialing_id = null;
            if (!payload.joining_date) payload.joining_date = null;
            if (!payload.cnic) payload.cnic = null;

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

    const filteredUsers = users.filter((user) => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    if (!lowerCaseSearch) return true;

    const name = user.full_name?.toLowerCase() || '';
    const dialingId = user.dialing_id?.toString() || '';
    const cnic = user.cnic?.toLowerCase() || '';

    // Check if the search term matches part of the name, starts with or matches the dialing ID, or matches CNIC
    return name.includes(lowerCaseSearch) || dialingId.includes(lowerCaseSearch) || cnic.includes(lowerCaseSearch);
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

            {/* CREATE NEW USER MODAL */}
            <Modal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                title="Create New System Account"
                onConfirm={triggerAddUser}
                confirmText={isSubmitting ? "Creating..." : "Create User"}
            >
                <div className="space-y-4 py-2">
                    <div>
                        <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">Full Name</label>
                        <input type="text" name="full_name" value={formData.full_name} onChange={handleAddChange} required className="input-base" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">CNIC (Unique)</label>
                        <input 
                            type="text" 
                            name="cnic" 
                            value={formData.cnic} 
                            onChange={handleAddCnicChange} 
                            maxLength="15" 
                            placeholder="e.g. 35202-1234567-1" 
                            className="input-base" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">Dialing ID (4 Digits)</label>
                        <input type="text" name="dialing_id" value={formData.dialing_id} onChange={handleAddChange} pattern="\d{4}" maxLength="4" placeholder="e.g. 1024" className="input-base" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">Role</label>
                        <select name="role" value={formData.role} onChange={handleAddChange} className="input-base cursor-pointer">
                            <option value="employee">Agent</option>
                            <option value="closer">Closer</option>
                            <option value="admin">Admin</option>
                            {currentUser?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">Joining Date</label>
                        <input type="date" name="joining_date" value={formData.joining_date} onChange={handleAddChange} className="input-base" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">Temporary Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                name="password" 
                                value={formData.password} 
                                onChange={handleAddChange} 
                                required 
                                minLength={8} 
                                className="input-base pr-10" 
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* EDIT USER PROFILE MODAL */}
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
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">CNIC (Unique)</label>
                            <input 
                                type="text" 
                                name="cnic" 
                                value={editFormData.cnic} 
                                onChange={handleEditCnicChange} 
                                maxLength="15" 
                                placeholder="e.g. 35202-1234567-1" 
                                className="input-base" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">Dialing ID (4 Digits)</label>
                            <input type="text" name="dialing_id" value={editFormData.dialing_id} onChange={handleEditChange} pattern="\d{4}" maxLength="4" placeholder="e.g. 1024" className="input-base" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">Joining Date</label>
                            <input type="date" name="joining_date" value={editFormData.joining_date} onChange={handleEditChange} className="input-base" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">Change Password</label>
                            <div className="relative">
                                <input 
                                    type={showEditPassword ? "text" : "password"} 
                                    name="password" 
                                    value={editFormData.password} 
                                    onChange={handleEditChange} 
                                    placeholder="Enter new password or leave blank" 
                                    className="input-base pr-10" 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowEditPassword(!showEditPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showEditPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-prime-muted uppercase mb-2 ml-1">Security Role</label>
                            <select name="role" value={editFormData.role} onChange={handleEditChange} className="input-base cursor-pointer">
                                <option value="employee">Agent</option>
                                <option value="closer">Closer</option>
                                <option value="admin">Admin</option>
                                {currentUser?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                            </select>
                        </div>
                    </div>
                )}
            </Modal>

            <div className="flex justify-between items-center mb-8 px-2">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">System Users</h1>
                <div className="flex items-center gap-3">
                    <Button onClick={fetchUsers} variant="outline" className="rounded-full px-6 text-sm">Refresh</Button>
                    <Button onClick={() => setIsAddModalOpen(true)} variant="primary" className="rounded-full px-6 text-sm font-semibold shadow-sm">
                        + Add User
                    </Button>
                </div>
            </div>

            {status && (
                <div className={`px-6 py-3 mb-6 rounded-full text-sm font-medium text-center ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {status.text}
                </div>
            )}

            {/* FULL-WIDTH USER LIST TABLE CONTAINER */}
            <div className="card-base flex flex-col min-h-[500px] w-full overflow-hidden">
                <div className="p-4 md:px-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by Name, CNIC, or Dialing ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-prime-primary focus:border-transparent text-sm transition-all"
                        />
                    </div>
                </div>

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
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors group">
                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-800">{u.full_name || 'N/A'}</div>
                                        <div className="text-xs font-medium text-gray-500 mt-0.5">Joining Date: {u.joining_date || 'Not Specified'}</div>
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
        </PageWrapper>
    );
};

export default UserManagement;