import React from 'react';
import CallStatusBadge from './CallStatusBadge';
import { formatDate } from '../../utils/formatters';

const CallTable = ({ calls }) => {
    if (!calls || calls.length === 0) {
        return (
            <div className="card-base p-12 text-center text-prime-muted text-sm font-medium">
                No calls logged yet.
            </div>
        );
    }

    return (
        <div className="card-base overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-prime-muted uppercase tracking-wider">
                                Client Name
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-prime-muted uppercase tracking-wider">
                                Date Logged
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-prime-muted uppercase tracking-wider">
                                Workflow Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {calls.map((call) => (
                            <tr key={call.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-prime-text">{call.client_name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-prime-muted">{formatDate(call.created_at)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <CallStatusBadge status={call.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CallTable;