import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext'; // 1. Import useAuth

const AnnouncementModal = () => {
    const { user } = useAuth(); // 2. Get current user details
    const [announcement, setAnnouncement] = useState(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!user) return; // Wait until user is authenticated

        // 3. Create a unique localStorage key per user
        const storageKey = `last_announcement_seen_${user.id}`;
        const lastSeen = localStorage.getItem(storageKey);

        const fetchAnnouncement = async () => {
            try {
                const response = await apiClient.get('/api/v1/announcements/active');
                if (response.data && response.data.message) {
                    const announcementId = response.data.id || response.data.message;
                    if (lastSeen !== announcementId) {
                        setAnnouncement(response.data);
                    }
                }
            } catch (error) {
                console.error("Could not fetch announcement", error);
            }
        };
        fetchAnnouncement();
    }, [user]);

    const handleDismiss = () => {
        if (announcement && user) {
            // 4. Save acknowledgement specifically for this user's ID
            const storageKey = `last_announcement_seen_${user.id}`;
            localStorage.setItem(storageKey, announcement.id || announcement.message);
            setDismissed(true);
            setAnnouncement(null);
        }
    };

    if (!announcement || dismissed) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-card max-w-md w-full p-8 transform transition-all border border-prime-border">
                <div className="w-14 h-14 bg-prime-primary/10 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-prime-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                </div>
                
                <h2 className="text-2xl font-bold text-prime-text mb-4 tracking-tight">System Broadcast</h2>
                
                <p className="text-prime-text leading-relaxed text-[15px] mb-8 font-medium">
                    {announcement.message}
                </p>
                
                <Button
                    onClick={handleDismiss}
                    variant="primary"
                    className="w-full py-3"
                >
                    Acknowledge
                </Button>
            </div>
        </div>
    );
};

export default AnnouncementModal;