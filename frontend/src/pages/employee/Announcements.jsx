import React, { useContext } from 'react';
import { AnnouncementContext } from '../../context/AnnouncementContext';
import PageWrapper from '../../components/layout/PageWrapper';

const Announcements = () => {
    const { announcement } = useContext(AnnouncementContext);

    return (
        <PageWrapper title="Company Bulletins">
            <div className="max-w-4xl mx-auto w-full">
                <div className="mb-8 px-2">
                    <h1 className="text-2xl font-bold text-prime-text tracking-tight mb-1">Company Bulletins</h1>
                    <p className="text-sm font-medium text-prime-muted">Review important updates and systemic notifications.</p>
                </div>
                
                <div className="card-base border-l-4 border-l-prime-primary p-8 mb-8 bg-white">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-prime-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-prime-primary"></span>
                        </span>
                        <h3 className="text-[11px] font-bold text-prime-muted uppercase tracking-widest">Currently Active Broadcast</h3>
                    </div>
                    <p className="text-xl text-prime-text font-medium leading-relaxed">
                        {announcement || "No active announcements at this time."}
                    </p>
                </div>

                <div className="card-base flex flex-col min-h-[300px]">
                    <div className="px-8 py-6 border-b border-gray-100">
                        <h3 className="text-[13px] font-semibold text-prime-muted tracking-wide">Past Announcements</h3>
                    </div>
                    <div className="flex-grow flex items-center justify-center p-8">
                        <p className="text-sm text-prime-primary/60 font-medium text-center">
                            Historical list of deactivated messages will populate here.
                        </p>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default Announcements;