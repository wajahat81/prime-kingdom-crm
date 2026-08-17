import React, { createContext, useState, useEffect } from 'react';
import { getActiveAnnouncement } from '../services/announcementService';

export const AnnouncementContext = createContext(null);

export const AnnouncementProvider = ({ children }) => {
    const [announcement, setAnnouncement] = useState(null);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            try {
                const data = await getActiveAnnouncement();
                if (data && data.message) setAnnouncement(data.message);
            } catch (error) {
                console.error("Context Error: Could not fetch announcement");
            }
        };

        fetchAnnouncement();
        const interval = setInterval(fetchAnnouncement, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <AnnouncementContext.Provider value={{ announcement, setAnnouncement }}>
            {children}
        </AnnouncementContext.Provider>
    );
};