import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
    const { user } = useContext(AuthContext);

    // Format the role for display (e.g., "super_admin" -> "Super Admin")
    const formatRole = (role) => {
        if (!role) return '';
        return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <header className="bg-white h-16 border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm transition-all">
            
            {/* Left Side: Search Bar Placeholder */}
            <div className="flex-1 flex items-center">
                <div className="relative w-96 hidden md:block group">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-prime-navy transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input 
                        type="text" 
                        placeholder="Search records, employees..." 
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-transparent rounded-lg text-sm focus:bg-white focus:border-prime-navy/20 focus:ring-2 focus:ring-prime-navy/10 transition-all outline-none text-prime-text placeholder-gray-400"
                    />
                </div>
            </div>
            
            {/* Right Side: Notifications & User Profile */}
            <div className="flex items-center space-x-6">
                
                {/* Notification Bell */}
                <button className="text-gray-400 hover:text-prime-navy transition-colors relative">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {/* Unread indicator */}
                    <span className="absolute top-0 right-0 w-2 h-2 bg-prime-gold rounded-full border-2 border-white"></span>
                </button>

                {/* Profile Badge */}
                <div className="flex items-center gap-3 pl-6 border-l border-gray-100 cursor-pointer group">
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-sm font-semibold text-prime-text">System User</span>
                        <span className="text-[10px] font-bold text-prime-navy bg-prime-navy/5 px-2 py-0.5 rounded-full mt-0.5 uppercase tracking-wider">
                            {formatRole(user?.role)}
                        </span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-prime-navy text-white flex items-center justify-center font-bold text-sm ring-2 ring-transparent group-hover:ring-prime-navy/20 transition-all shadow-sm">
                        {user?.full_name ? user.full_name.charAt(0).toUpperCase() : (user?.role ? user.role.charAt(0).toUpperCase() : 'U')}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;