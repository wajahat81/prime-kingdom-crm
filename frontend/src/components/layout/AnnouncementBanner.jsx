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
        <div className="bg-prime-primary text-white px-6 py-4 flex items-center justify-center relative overflow-hidden animate-pulse border-b-4 border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.4)]">
            <div className="relative z-10 flex items-center gap-4">
                <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-100"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                <p className="text-base font-bold tracking-wide uppercase">{announcement}</p>
            </div>
        </div>
    );
};

export default AnnouncementBanner;