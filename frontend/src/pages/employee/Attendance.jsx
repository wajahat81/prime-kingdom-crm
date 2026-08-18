import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';

const Attendance = () => {
    return (
        <PageWrapper title="Attendance Management">
            <div className="max-w-4xl mx-auto w-full">
                <div className="mb-8 px-2">
                    <h1 className="text-2xl font-bold text-prime-text tracking-tight mb-1">Attendance Management</h1>
                    <p className="text-sm font-medium text-prime-muted">Review your shift history below. Use the button in the top navigation bar to start or end your active shift.</p>
                </div>
                
                <div className="card-base flex flex-col min-h-[300px]">
                    <div className="px-8 py-6 border-b border-gray-100">
                        <h3 className="text-[13px] font-semibold text-prime-muted tracking-wide">Recent Shift History</h3>
                    </div>
                    <div className="flex-grow flex items-center justify-center p-8">
                        <p className="text-sm text-prime-primary/60 font-medium text-center">
                            Your past check-ins and check-outs will appear here.
                        </p>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default Attendance;