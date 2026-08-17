import React, { useContext } from 'react';
import { AnnouncementContext } from '../../context/AnnouncementContext';

const Announcements = () => {
    const { announcement } = useContext(AnnouncementContext);

    return (
        <div className="max-w-4xl mx-auto p-8 w-full page-transition">
            <div className="mb-8 border-b border-gray-100 pb-5">
                <h1 className="text-2xl font-extrabold text-prime-text tracking-tight mb-1">Company Bulletins</h1>
                <p className="text-sm font-medium text-prime-muted">Review important updates and systemic notifications.</p>
            </div>
            
            <div className="card-base border-l-4 border-l-prime-navy p-8 mb-8 relative overflow-hidden bg-white">
                <div className="absolute right-0 top-0 opacity-5">
                    <svg className="w-32 h-32 transform translate-x-8 -translate-y-8" fill="currentColor" viewBox="0 0 24 24"><path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-prime-green opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-prime-green"></span>
                        </span>
                        <h3 className="text-xs font-bold text-prime-muted uppercase tracking-widest">Currently Active Broadcast</h3>
                    </div>
                    <p className="text-xl text-prime-text font-medium leading-relaxed">
                        {announcement || "No active announcements at this time."}
                    </p>
                </div>
            </div>

            <div className="card-base p-8">
                <h3 className="text-lg font-bold text-prime-text mb-4">Past Announcements</h3>
                <div className="p-6 bg-gray-50/50 border border-dashed border-gray-200 rounded-lg text-center">
                    <p className="text-sm text-prime-muted font-medium">
                        Historical list of deactivated messages will populate here.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Announcements;