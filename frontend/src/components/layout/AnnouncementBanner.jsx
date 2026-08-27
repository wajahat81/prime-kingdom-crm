import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { supabase } from '../../services/supabaseClient'; 
import { useAuth } from '../../context/AuthContext'; 

const AnnouncementBanner = () => {
    const { user } = useAuth();
    const [announcement, setAnnouncement] = useState(null);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            try {
                // Fetch the active announcement on load[cite: 6]
                const response = await apiClient.get('/api/v1/announcements/active');
                if (response.data && response.data.message) {
                    setAnnouncement(response.data.message);
                }
            } catch (error) {
                console.error("Could not fetch active announcement", error);
            }
        };

        fetchAnnouncement();

        // Real-time Supabase subscription for instant banner updates[cite: 6]
        const bannerChannel = supabase
            .channel('announcement-banner-live')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'announcements' },
                (payload) => {
                    console.log('New banner broadcasted live:', payload.new);
                    const newAnn = payload.new;

                    // Verify if it matches the employee's role[cite: 6]
                    const isRelevant = !newAnn.target_role || newAnn.target_role === 'all' || newAnn.target_role === user?.role;

                    if (isRelevant && newAnn.message) {
                        setAnnouncement(newAnn.message);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(bannerChannel);
        };
    }, [user]);

    if (!announcement) return null;

    return (
        <div className="bg-prime-primary text-white flex items-center relative overflow-hidden border-b-4 border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.4)] h-14">
            
            {/* INJECTED CSS FOR SLIDING ANIMATION */}
            <style>
                {`
                @keyframes slide-left {
                    from { transform: translateX(100vw); }
                    to { transform: translateX(-100%); }
                }
                .sliding-text {
                    display: inline-block;
                    white-space: nowrap;
                    /* Adjust 25s higher for slower speed, lower for faster */
                    animation: slide-left 35s linear infinite; 
                }
                .marquee-container:hover .sliding-text {
                    animation-play-state: paused; /* Pauses when mouse hovers */
                }
                `}
            </style>

            {/* FIXED LEFT SECTION: Stays pinned so the dot doesn't scroll away */}
            <div className="relative z-20 flex items-center gap-3 px-6 h-full bg-prime-primary shadow-[10px_0_15px_rgba(0,0,0,0.2)]">
                <span className="flex h-3 w-3 relative flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-100"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 hidden sm:block">Update</span>
            </div>

            {/* SLIDING RIGHT SECTION: The text scrolls here */}
            <div className="relative flex-1 overflow-hidden marquee-container flex items-center h-full cursor-default">
                <div className="sliding-text">
                    <p className="text-base font-bold tracking-wide uppercase px-4">
                        {announcement}
                    </p>
                </div>
            </div>
            
        </div>
    );
};

export default AnnouncementBanner;