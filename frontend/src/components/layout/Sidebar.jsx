import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const getNavItems = () => {
        const items = [];
        items.push({ path: '/dashboard', label: 'Dashboard', icon: <svg className="w-5 h-5 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>});
        
        if (user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN) {
            items.push({ path: '/admin/calls/upload', label: 'Upload Call', icon: <svg className="w-5 h-5 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>});
            items.push({ path: '/admin/calls/manage', label: 'Manage Calls', icon: <svg className="w-5 h-5 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>});
            items.push({ path: '/admin/attendance', label: 'Attendance Logs', icon: <svg className="w-5 h-5 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>});
            items.push({ path: '/admin/announcements', label: 'Announcements', icon: <svg className="w-5 h-5 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>});
            items.push({ path: '/admin/employees/add', label: 'Add Employee', icon: <svg className="w-5 h-5 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>});
            items.push({ path: '/admin/commissions', label: 'Commissions', icon: <svg className="w-5 h-5 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>});
        }
        
        if (user?.role === ROLES.SUPER_ADMIN) {
            items.push({ path: '/superadmin/users', label: 'User Management', icon: <svg className="w-5 h-5 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>});
        }

        return items;
    };

    return (
        <div className="w-[260px] bg-gradient-to-b from-prime-primary via-prime-secondary to-prime-accent text-white flex flex-col h-screen shadow-xl z-40 flex-shrink-0">
            {/* Branding Header */}
            <div className="p-6 border-b border-white/20 flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="font-bold text-prime-primary text-lg leading-none">P</span>
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-wide leading-tight drop-shadow-sm">Prime CRM</h1>
                    <p className="text-[11px] text-white/80 font-medium tracking-wider uppercase mt-0.5">Workspace</p>
                </div>
            </div>

            {/* User Info Widget */}
            <div className="px-6 py-4 border-b border-white/20 bg-white/10 backdrop-blur-sm">
                <p className="text-sm font-bold text-white truncate drop-shadow-sm">
                    {user?.full_name || user?.name || 'Authorized User'}
                </p>
                <div className="flex items-center mt-1">
                    <span className="w-2 h-2 rounded-full bg-green-300 mr-2 shadow-[0_0_8px_rgba(134,239,172,0.8)]"></span>
                    <p className="text-xs text-white/90 capitalize font-medium">{user?.role?.replace('_', ' ')}</p>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 overflow-y-auto space-y-1">
                <ul className="space-y-1.5">
                    {getNavItems().map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                                        isActive
                                            ? 'bg-white text-prime-primary shadow-md transform scale-[1.02]'
                                            : 'text-white/90 hover:bg-white/20 hover:text-white'
                                    }`
                                }
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Logout Footer */}
            <div className="p-4 border-t border-white/20 bg-white/5">
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-bold text-prime-primary bg-white hover:bg-red-50 hover:text-red-600 shadow-md group"
                >
                    <svg className="w-4 h-4 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span>Secure Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;