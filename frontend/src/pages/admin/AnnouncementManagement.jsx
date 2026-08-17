import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Button from '../../components/common/Button';

const AnnouncementManagement = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [currentAnnouncement, setCurrentAnnouncement] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState(null);

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

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus(null);

        try {
            await apiClient.post('/api/v1/announcements/', {
                message: currentAnnouncement
            });
            setStatus({ type: 'success', text: 'System broadcast updated successfully.' });
            setCurrentAnnouncement('');
            fetchAnnouncements();
        } catch (error) {
            setStatus({ type: 'error', text: error.response?.data?.detail || 'Failed to create broadcast.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (announcementId) => {
        if (!window.confirm('Are you sure you want to permanently delete this broadcast record?')) return;
        
        try {
            await apiClient.delete(`/api/v1/announcements/${announcementId}`);
            fetchAnnouncements();
            setStatus({ type: 'success', text: 'Broadcast record expunged.' });
        } catch (error) {
            setStatus({ type: 'error', text: 'Failed to delete broadcast.' });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString([], {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64 w-full page-transition">
            <div className="w-8 h-8 border-4 border-prime-navy/20 border-t-prime-navy rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-8 max-w-5xl mx-auto w-full page-transition">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-prime-text tracking-tight mb-1">System Broadcasts</h1>
                    <p className="text-sm text-prime-muted">Manage the live announcement banner and modal alerts for all users.</p>
                </div>
                <Button onClick={fetchAnnouncements} variant="outline" className="gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Refresh Logs
                </Button>
            </div>

            {status && (
                <div className={`p-4 mb-8 rounded-lg text-sm font-semibold border flex items-center gap-2 animate-fade-in ${status.type === 'success' ? 'bg-prime-green/10 text-prime-green border-prime-green/20' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {status.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="card-base p-6 sticky top-24">
                        <h2 className="text-lg font-bold text-prime-text mb-4">New Broadcast</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-prime-muted uppercase tracking-wider mb-2">
                                    Alert Message
                                </label>
                                <textarea
                                    value={currentAnnouncement}
                                    onChange={(e) => setCurrentAnnouncement(e.target.value)}
                                    required
                                    minLength={5}
                                    maxLength={255}
                                    rows={4}
                                    className="input-base resize-none"
                                    placeholder="Type your company-wide announcement here..."
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-[11px] font-medium text-prime-muted">Overwrites current active broadcast.</p>
                                    <p className={`text-[11px] font-bold ${currentAnnouncement.length > 230 ? 'text-prime-gold' : 'text-gray-400'}`}>
                                        {currentAnnouncement.length}/255
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={submitting || !currentAnnouncement.trim()}
                                variant="primary"
                                className="w-full mt-2"
                            >
                                {submitting ? 'Pushing to Clients...' : 'Deploy Broadcast'}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* History Section */}
                <div className="lg:col-span-2">
                    <div className="card-base overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-lg font-bold text-prime-text">Broadcast Registry</h2>
                        </div>
                        
                        {announcements.length === 0 ? (
                            <div className="p-12 text-center text-prime-muted text-sm font-medium">
                                No broadcasts have been recorded in the system.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {announcements.map((announcement) => (
                                    <div key={announcement.id} className="p-6 flex items-start justify-between hover:bg-gray-50/50 transition-colors group">
                                        <div className="flex-1 pr-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                {announcement.is_active && (
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-prime-green/10 text-prime-green border border-prime-green/20 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-prime-green animate-pulse"></span>
                                                        Active
                                                    </span>
                                                )}
                                                <p className="text-sm font-semibold text-prime-text leading-snug">
                                                    {announcement.message}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4 text-[11px] font-medium text-prime-muted uppercase tracking-wider">
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    {formatDate(announcement.created_at)}
                                                </span>
                                                {announcement.created_by && (
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                        {announcement.created_by.substring(0, 8)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(announcement.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors p-2 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Delete Broadcast"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementManagement;