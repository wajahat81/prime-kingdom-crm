import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import Modal from '../common/Modal';

const Sidebar = ({ closeMobileMenu }) => {
    const { user, logout } = useAuth();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    if (!user) return null;

    const getNavItems = () => {
        const items = [];
        items.push({ path: '/dashboard', label: 'Dashboard' });
        
        if (user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN) {
            items.push({ path: '/admin/calls/manage', label: 'Call Logs' });
            items.push({ path: '/admin/attendance', label: 'Attendance' });
            items.push({ path: '/admin/announcements', label: 'Announcements' }); 
            items.push({ path: '/admin/users', label: 'Manage Users' }); 
        }
        return items;
    };

    const confirmLogout = () => {
        if (closeMobileMenu) closeMobileMenu();
        setIsLogoutModalOpen(false);
        logout();
    };

    return (
        <>
            <Modal 
                isOpen={isLogoutModalOpen} 
                onClose={() => setIsLogoutModalOpen(false)} 
                title="Sign Out"
                onConfirm={confirmLogout}
                confirmText="Sign Out"
            >
                <p className="text-sm font-medium text-prime-muted">Are you sure you want to log out of your secure workspace?</p>
            </Modal>

            <div className="w-[260px] bg-white border-r border-prime-border flex flex-col h-screen z-20 flex-shrink-0">
                <div className="lg:hidden flex items-center justify-between p-4 border-b border-prime-border">
                    <span className="font-bold text-prime-primary tracking-wide">MENU</span>
                    <button onClick={closeMobileMenu} className="text-prime-muted hover:text-red-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
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

                <div className="p-4 border-t border-prime-border">
                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        type="button"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-prime-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;