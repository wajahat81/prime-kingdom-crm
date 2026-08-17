import React from 'react';
import CheckInOutCard from '../../components/attendance/CheckInOutCard';

const Attendance = () => {
    return (
        <div className="max-w-4xl mx-auto p-8 w-full mt-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Attendance Management</h1>
            <p className="text-gray-500 mb-8 text-sm">Log your daily shifts. The system will automatically check you out after 9 hours.</p>
            
            <div className="mb-10">
                <CheckInOutCard />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Shift History</h3>
                <p className="text-sm text-gray-500 italic">
                    Connect this to a GET endpoint (e.g., /api/v1/attendance/history) to render a table of past check-ins and check-outs.
                </p>
            </div>
        </div>
    );
};

export default Attendance;