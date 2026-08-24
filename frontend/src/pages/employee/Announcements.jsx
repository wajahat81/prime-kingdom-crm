import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import PageWrapper from '../../components/layout/PageWrapper';
import { useAuth } from '../../context/AuthContext';

const Announcements = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const response = await apiClient.get('/api/v1/announcements/');
                const allAnnouncements = response.data.data || [];
                
                // Filter announcements to only show "all" OR their specific role
                const relevantAnnouncements = allAnnouncements.filter(
                    a => !a.target_role || a.target_role === 'all' || a.target_role === user?.role
                );
                
                setAnnouncements(relevantAnnouncements);
            } catch (error) {
                console.error('Failed to fetch announcements:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnnouncements();
    }, [user]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh] w-full">
            <div className="w-8 h-8 border-4 border-prime-primary/20 border-t-prime-primary rounded-full animate-spin"></div>
        </div>
    );

    return (
        <PageWrapper title="Company Announcements">
            <div className="max-w-4xl mx-auto pt-4">
                <div className="mb-8 px-2">
                    <h1 className="text-2xl font-bold text-prime-text tracking-tight mb-1">Company Announcements</h1>
                    <p className="text-sm text-prime-muted font-medium">Stay up to date with the latest news and targets.</p>
                </div>

                <div className="space-y-6 px-2">
                    {announcements.length === 0 ? (
                        <div className="card-base p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            </div>
                            <p className="text-prime-muted text-sm font-medium">You have no past announcements.</p>
                        </div>
                    ) : (
                        announcements.map((announcement, index) => (
                            <div key={announcement.id} className={`card-base p-6 md:p-8 relative overflow-hidden transition-all duration-300 ${index === 0 ? 'border-l-4 border-l-prime-primary' : 'border-l-4 border-l-gray-200'}`}>
                                
                                {index === 0 && (
                                    <div className="absolute top-4 right-6">
                                        <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse">New</span>
                                    </div>
                                )}
                                
                                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                                    {formatDate(announcement.created_at)}
                                </div>
                                <p className="text-base md:text-lg text-gray-800 font-medium leading-relaxed">
                                    {announcement.message}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </PageWrapper>
    );
};

export default Announcements;