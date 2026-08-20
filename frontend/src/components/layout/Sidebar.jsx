import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

const Sidebar = ({ closeMobileMenu }) => {
    const { user } = useAuth();

    if (!user) return null;

    const getNavItems = () => {
        const items = [];
        items.push({ path: '/dashboard', label: 'Dashboard' });
        items.push({ path: '/leaves', label: 'Leave Requests' });
        if (user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN) {
            items.push({ path: '/admin/calls/manage', label: 'Call Logs' });
            items.push({ path: '/admin/attendance', label: 'Attendance' });
            items.push({ path: '/admin/leaves', label: 'Manage Leave Requests' });
            items.push({ path: '/admin/users', label: 'Manage Users' }); 
        }
        
        if (user?.role === ROLES.SUPER_ADMIN) {
            items.push({ path: '/admin/announcements', label: 'Announcements' }); 
        }
        
        return items;
    };

    return (
        /* Removed 'sticky', 'top-*', and 'h-screen'. Using 'h-full' to perfectly fill the App.jsx container */
        <div className="w-[260px] bg-white border-r border-prime-border flex flex-col h-full z-20 flex-shrink-0">
            
            {/* Mobile Header (Hidden on Desktop) */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-prime-border flex-shrink-0">
                <span className="font-bold text-prime-primary tracking-wide">MENU</span>
                <button onClick={closeMobileMenu} className="text-prime-muted hover:text-red-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
                {getNavItems().map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 rounded-full transition-colors text-sm font-semibold ${
                                isActive
                                    ? 'bg-prime-primary/10 text-prime-primary'
                                    : 'text-prime-muted hover:bg-gray-50 hover:text-prime-text'
                            }`
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;