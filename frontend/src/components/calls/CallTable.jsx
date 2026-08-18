import React from 'react';
import CallStatusBadge from './CallStatusBadge';
import { formatDate } from '../../utils/formatters';

const CallTable = ({ calls }) => {
    if (!calls || calls.length === 0) {
        return (
            <div className="card-base p-16 text-center text-prime-primary/60 text-sm font-medium">
                No records yet.
            </div>
        );
    }

    return (
        <div className="card-base flex flex-col">
            <div className="overflow-x-auto flex-grow">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th scope="col" className="px-8 py-6 text-left text-[13px] font-semibold text-prime-muted tracking-wide">
                                Client Name
                            </th>
                            <th scope="col" className="px-8 py-6 text-left text-[13px] font-semibold text-prime-muted tracking-wide">
                                Date Logged
                            </th>
                            <th scope="col" className="px-8 py-6 text-left text-[13px] font-semibold text-prime-muted tracking-wide">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {calls.map((call) => (
                            <tr key={call.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                                <td className="px-8 py-5 whitespace-nowrap">
                                    <div className="text-sm font-medium text-prime-text">{call.client_name}</div>
                                </td>
                                <td className="px-8 py-5 whitespace-nowrap">
                                    <div className="text-sm text-prime-muted">{formatDate(call.created_at)}</div>
                                </td>
                                <td className="px-8 py-5 whitespace-nowrap">
                                    <CallStatusBadge status={call.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="px-8 py-5 border-t border-gray-100 flex justify-between items-center text-sm font-semibold text-prime-muted/60 bg-gray-50/30">
                <button className="hover:text-prime-primary transition-colors cursor-not-allowed">Previous</button>
                <span className="text-prime-primary">Page 1</span>
                <button className="hover:text-prime-primary transition-colors cursor-not-allowed">Next</button>
            </div>
        </div>
    );
};

export default CallTable;