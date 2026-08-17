import React from 'react';

const CallStatusBadge = ({ status }) => {
    let badgeStyle, label;

    switch (status) {
        case 'retained':
            badgeStyle = 'bg-prime-green/10 text-prime-green border-prime-green/20';
            label = 'RETAINED';
            break;
        case 'not_retained':
            badgeStyle = 'bg-red-50 text-red-600 border-red-100';
            label = 'NOT RETAINED';
            break;
        case 'pending':
        default:
            badgeStyle = 'bg-prime-gold/10 text-prime-gold border-prime-gold/20';
            label = 'PENDING REVIEW';
            break;
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badgeStyle}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
            {label}
        </span>
    );
};

export default CallStatusBadge;