import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

const AnnouncementBanner = () => {
    const [announcement, setAnnouncement] = useState(null);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            try {
                const response = await apiClient.get('/api/v1/announcements/active');
                if (response.data && response.data.message) {
                    setAnnouncement(response.data.message);
                }
            } catch (error) {
                console.error("Could not fetch active announcement", error);
            }
        };

        fetchAnnouncement();
        const interval = setInterval(fetchAnnouncement, 60000);
        return () => clearInterval(interval);
    }, []);

    if (!announcement) return null;

    return (
        <div className="bg-prime-navy text-white px-6 py-3 shadow-md flex items-center justify-center relative overflow-hidden">
            {/* Background Texture Effect */}
            <div className="absolute inset-0 bg-white opacity-5"></div>
            
            <div className="relative z-10 flex items-center gap-4">
                <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-prime-gold opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-prime-gold"></span>
                </span>
                <p className="text-sm font-semibold tracking-wide">{announcement}</p>
            </div>
        </div>
    );
};

export default AnnouncementBanner;