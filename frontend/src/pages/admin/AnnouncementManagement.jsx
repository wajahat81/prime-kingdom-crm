import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import PageWrapper from '../../components/layout/PageWrapper';

const AnnouncementManagement = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [currentAnnouncement, setCurrentAnnouncement] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState(null);
    
    // Dynamic Modal State
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, payload: null });

    const fetchAnnouncements = async () => {
        try {
            const activeResponse = await apiClient.get('/api/v1/announcements/active');
            if (activeResponse.data && activeResponse.data.message) {
                setCurrentAnnouncement(activeResponse.data.message);
            }
            
            const allResponse = await apiClient.get('/api/v1/announcements/');
            setAnnouncements(allResponse.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
            setLoading(false);
        }
    };

    useEffect(() => { fetchAnnouncements(); }, []);

    const executePublish = async () => {
        setSubmitting(true);
        setStatus(null);
        try {
            await apiClient.post('/api/v1/announcements/', { message: currentAnnouncement });
            setStatus({ type: 'success', text: 'Announcement saved successfully.' });
            setCurrentAnnouncement('');
            fetchAnnouncements();
        } catch (error) {
            setStatus({ type: 'error', text: 'Failed to save announcement.' });
        } finally {
            setSubmitting(false);
            setConfirmDialog({ isOpen: false, type: null, payload: null });
        }
    };

    const executeDelete = async (announcementId) => {
        try {
            await apiClient.delete(`/api/v1/announcements/${announcementId}`);
            fetchAnnouncements();
            setStatus({ type: 'success', text: 'Record deleted successfully.' });
        } catch (error) {
            setStatus({ type: 'error', text: 'Failed to delete record.' });
        } finally {
            setConfirmDialog({ isOpen: false, type: null, payload: null });
        }
    };

    const handleConfirmAction = () => {
        if (confirmDialog.type === 'publish') executePublish();
        if (confirmDialog.type === 'delete') executeDelete(confirmDialog.payload);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString([], {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh] w-full">
            <div className="w-8 h-8 border-4 border-prime-primary/20 border-t-prime-primary rounded-full animate-spin"></div>
        </div>
    );

    return (
        <PageWrapper title="System Broadcasts">
            <Modal 
                isOpen={confirmDialog.isOpen} 
                onClose={() => setConfirmDialog({ isOpen: false, type: null, payload: null })} 
                title={confirmDialog.type === 'publish' ? "Publish Announcement" : "Delete Record"}
                onConfirm={handleConfirmAction}
                confirmText="Proceed"
            >
                <p className="text-sm font-medium text-prime-muted">
                    {confirmDialog.type === 'publish' ? "Push this broadcast to all users?" : "Permanently delete this announcement record?"}
                </p>
            </Modal>

            <div className="flex justify-between items-center mb-8 px-2">
                <div className="flex items-center gap-6">
                    <h1 className="text-xl font-semibold text-prime-text">Announcement</h1>
                </div>
                <Button onClick={fetchAnnouncements} variant="outline" className="rounded-full">Refresh</Button>
            </div>

            {status && (
                <div className={`px-6 py-3 mb-8 rounded-full text-sm font-medium text-center ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {status.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-1">
                    <div className="card-base p-8 sticky top-24 bg-white">
                        <h2 className="text-lg font-bold text-prime-text mb-6">New Announcement</h2>
                        <form onSubmit={(e) => { e.preventDefault(); setConfirmDialog({ isOpen: true, type: 'publish', payload: null }); }}>
                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">Message</label>
                                <textarea
                                    value={currentAnnouncement}
                                    onChange={(e) => setCurrentAnnouncement(e.target.value)}
                                    required minLength={5} maxLength={255} rows={5}
                                    className="w-full px-5 py-4 bg-white border border-prime-border rounded-3xl text-sm text-prime-text transition-colors focus:outline-none focus:border-prime-primary resize-none"
                                />
                                <div className="flex justify-end items-center mt-2 px-2">
                                    <p className={`text-[11px] font-bold ${currentAnnouncement.length > 230 ? 'text-red-500' : 'text-gray-400'}`}>
                                        {currentAnnouncement.length}/255
                                    </p>
                                </div>
                            </div>
                            <Button type="submit" disabled={submitting || !currentAnnouncement.trim()} variant="primary" className="w-full mt-2">
                                {submitting ? 'Saving...' : 'Publish'}
                            </Button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="card-base flex flex-col min-h-[500px]">
                        <div className="overflow-x-auto flex-grow">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="px-8 py-6 text-left text-[13px] font-semibold text-prime-muted tracking-wide">History</th>
                                        <th className="px-8 py-6 text-right text-[13px] font-semibold text-prime-muted tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {announcements.length === 0 ? (
                                        <tr><td colSpan="2" className="px-8 py-32 text-center text-prime-primary/60 text-sm font-medium">No records found.</td></tr>
                                    ) : (
                                        announcements.map((announcement) => (
                                            <tr key={announcement.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        {announcement.is_active && (
                                                            <span className="flex items-center px-2 py-0.5 bg-prime-primary/10 text-prime-primary rounded-full text-[10px] font-bold uppercase tracking-wider">Active</span>
                                                        )}
                                                        <p className="text-sm font-medium text-prime-text">{announcement.message}</p>
                                                    </div>
                                                    <div className="text-[11px] text-prime-muted mt-1 ml-1">{formatDate(announcement.created_at)}</div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button onClick={() => setConfirmDialog({ isOpen: true, type: 'delete', payload: announcement.id })} className="text-gray-300 hover:text-red-500 transition-colors p-2" title="Delete">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
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

export default AnnouncementManagement;