import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import apiClient from '../../services/apiClient';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

const AnnouncementModal = () => {
    const { user } = useAuth();
    const [announcement, setAnnouncement] = useState(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!user) return;

        const checkAnnouncement = async () => {
            try {
                // Get the ID of the last announcement this specific user clicked "OK" on
                const storageKey = `last_announcement_seen_${user.id}`;
                const lastSeen = localStorage.getItem(storageKey);

                const response = await apiClient.get('/api/v1/announcements/active');
                
                // If the backend returns a valid announcement
                if (response.data && response.data.message) {
                    const announcementId = String(response.data.id || response.data.message);
                    
                    // If this announcement is different from the last one they saw
                    if (lastSeen !== announcementId) {
                        setAnnouncement(response.data);
                        setDismissed(false); // Force the modal to open
                    }
                }
            } catch (error) {
                // Fail silently so it doesn't interrupt the user if the network blips
                console.error("Could not fetch announcement", error);
            }
        };

        // 1. Check immediately when the dashboard loads
        checkAnnouncement();

        // 2. Set up a silent background check every 30 seconds (30000 ms)
        const intervalId = setInterval(checkAnnouncement, 30000);

        // Cleanup the interval if they navigate away from the dashboard
        return () => clearInterval(intervalId);
    }, [user]);

    const handleDismiss = () => {
        if (announcement && user) {
            // Save this exact announcement as "seen" so it never pops up again for this user
            const storageKey = `last_announcement_seen_${user.id}`;
            localStorage.setItem(storageKey, String(announcement.id || announcement.message));
            
            setDismissed(true);
            setAnnouncement(null);
        }
    };

    // If there's no new announcement, or they just clicked OK, hide the modal
    if (!announcement || dismissed) return null;

    // Use createPortal to guarantee it floats over absolutely everything on the screen
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all border border-prime-border">
                
                <div className="w-14 h-14 bg-prime-primary/10 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-prime-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-prime-text mb-2 tracking-tight">System Broadcast</h2>
                
                {/* Optional Tag showing who this is targeted to */}
                <div className="mb-4">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        To: {announcement.target_role === 'all' ? 'Everyone' : announcement.target_role + 's'}
                    </span>
                </div>
                
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