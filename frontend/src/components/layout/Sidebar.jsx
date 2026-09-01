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

        if (user?.role === 'employee' || user?.role === 'closer' || user?.role === ROLES.EMPLOYEE) {
            items.push({ path: '/announcements', label: 'Announcements' });
            items.push({ path: '/attendance', label: 'My Attendance' });
            items.push({ path: '/leaves', label: 'Leave Requests' });
        }

        if (user?.role === ROLES.ADMIN ) {
            // 🚨 NEW: Added 'My Leaves' link so Admins can apply for leaves
            
            
            items.push({ path: '/admin/attendance', label: 'Attendance Logs' });
            items.push({ path: '/admin/calls/manage', label: 'Manage Cases' });   
            items.push({ path: '/admin/users', label: 'Manage Users' }); 
            items.push({ path: '/leaves', label: 'Apply for Leave' });
            items.push({ path: '/admin/leaves', label: 'Manage Leave Requests' });
            items.push({ path: '/admin/office-settings', label: 'Manage Office Timings' });
            items.push({ path: '/admin/terminated-employees', label: 'Manage Terminated Employees' });
            items.push({ path: '/admin/audit-logs', label: 'Activity Logs' }); 
        }
        
        if (user?.role === ROLES.SUPER_ADMIN) {
            items.push({ path: '/admin/attendance', label: 'Attendance Logs' });
            items.push({ path: '/admin/calls/manage', label: 'Manage Cases' });   
            items.push({ path: '/admin/users', label: 'Manage Users' }); 
            items.push({ path: '/admin/leaves', label: 'Manage Leave Requests' });
            items.push({ path: '/admin/office-settings', label: 'Manage Office Timings' });
            items.push({ path: '/admin/terminated-employees', label: 'Manage Terminated Employees' });
            items.push({ path: '/admin/audit-logs', label: 'Activity Logs' }); 
            items.push({ path: '/admin/announcements', label: 'Manage Announcements' }); 
        }
        
        return items;
    };

    return (
        <div className="w-[260px] bg-white border-r border-prime-border flex flex-col h-full z-20 flex-shrink-0">
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-prime-border flex-shrink-0">
                <span className="font-bold text-prime-primary tracking-wide">MENU</span>
                <button onClick={closeMobileMenu} className="text-prime-muted hover:text-red-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
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