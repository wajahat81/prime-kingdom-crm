import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import apiClient from '../../services/apiClient';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient'; // 1. Import Supabase client

const AnnouncementModal = () => {
    const { user } = useAuth();
    const [announcement, setAnnouncement] = useState(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!user) return;

        const checkAnnouncement = async () => {
            try {
                const storageKey = `last_announcement_seen_${user.id}`;
                const lastSeen = localStorage.getItem(storageKey);

                const response = await apiClient.get('/api/v1/announcements/active');
                
                if (response.data && response.data.message) {
                    const announcementId = String(response.data.id || response.data.message);
                    
                    if (lastSeen !== announcementId) {
                        setAnnouncement(response.data);
                        setDismissed(false);
                    }
                }
            } catch (error) {
                console.error("Could not fetch announcement", error);
            }
        };

        // Check immediately on load
        checkAnnouncement();

        // 2. Add real-time Supabase subscription for instant popup triggers
        const modalChannel = supabase
            .channel('announcement-modal-live')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'announcements' },
                (payload) => {
                    console.log('New announcement broadcasted live:', payload.new);
                    const newAnn = payload.new;

                    // Verify if it matches the employee's role ("all" or their specific role)
                    const isRelevant = !newAnn.target_role || newAnn.target_role === 'all' || newAnn.target_role === user?.role;

                    if (isRelevant) {
                        const storageKey = `last_announcement_seen_${user.id}`;
                        const lastSeen = localStorage.getItem(storageKey);
                        const announcementId = String(newAnn.id || newAnn.message);

                        // If they haven't seen this new one yet, trigger popup instantly
                        if (lastSeen !== announcementId) {
                            setAnnouncement(newAnn);
                            setDismissed(false);
                        }
                    }
                }
            )
            .subscribe();

        // Cleanup listener on unmount
        return () => {
            supabase.removeChannel(modalChannel);
        };
    }, [user]);

    const handleDismiss = () => {
        if (announcement && user) {
            const storageKey = `last_announcement_seen_${user.id}`;
            localStorage.setItem(storageKey, String(announcement.id || announcement.message));
            
            setDismissed(true);
            setAnnouncement(null);
        }
    };

    if (!announcement || dismissed) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all border border-prime-border">
                
                <div className="w-14 h-14 bg-prime-primary/10 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-prime-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-prime-text mb-2 tracking-tight">Announcement</h2>
                
                <p className="text-prime-text leading-relaxed text-[15px] mb-8 font-medium">
                    {announcement.message}
                </p>
                
                <Button
                    onClick={handleDismiss}
                    variant="primary"
                    className="w-full py-3 font-bold text-lg"
                >
                    OK
                </Button>
            </div>
        </div>,
        document.body
    );
};

export default AnnouncementModal;