import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PageWrapper from '../components/layout/PageWrapper';

// --- Page Imports ---
import Login from '../pages/auth/Login';
import EmployeeDashboard from '../pages/employee/Dashboard';
import CallLogUpload from '../pages/admin/CallLogUpload';
import CallManagement from '../pages/admin/CallManagement';
import CommissionManagement from '../pages/admin/CommissionManagement';
import UserManagement from '../pages/superadmin/UserManagement'; 
import AnnouncementManagement from '../pages/admin/AnnouncementManagement';
import AttendanceLogs from '../pages/admin/AttendanceLogs';
import Attendance from '../pages/employee/Attendance';
import Announcements from '../pages/employee/Announcements';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ChangePassword from '../pages/auth/ChangePassword';

const AppRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            <Route path="/login" element={<PageWrapper title="Sign In"><Login /></PageWrapper>} />
            <Route path="/forgot-password" element={<PageWrapper title="Recover Account"><ForgotPassword /></PageWrapper>} />

            {/* Dashboard & User Settings - accessible by all authenticated users */}
            <Route element={<ProtectedRoute allowedRoles={['employee', 'admin', 'super_admin']} />}>
                <Route path="/dashboard" element={<PageWrapper title="Dashboard"><EmployeeDashboard /></PageWrapper>} />
                <Route path="/attendance" element={<PageWrapper title="My Attendance"><Attendance /></PageWrapper>} />
                <Route path="/announcements" element={<PageWrapper title="Bulletins"><Announcements /></PageWrapper>} />
                
                {/* MOVED CHANGE PASSWORD HERE */}
                <Route path="/change-password" element={<PageWrapper title="Change Password"><ChangePassword /></PageWrapper>} />
            </Route>

            {/* Admin & Super Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
                <Route path="/admin/dashboard" element={<PageWrapper title="Admin Dashboard"><AdminDashboard /></PageWrapper>} />
                <Route path="/admin/calls/upload" element={<PageWrapper title="Log Call"><CallLogUpload /></PageWrapper>} />
                <Route path="/admin/calls/manage" element={<PageWrapper title="Call Logs"><CallManagement /></PageWrapper>} />
                <Route path="/admin/attendance" element={<PageWrapper title="Attendance Auditing"><AttendanceLogs /></PageWrapper>} />
                <Route path="/admin/commissions" element={<PageWrapper title="Commissions"><CommissionManagement /></PageWrapper>} />
                <Route path="/admin/users" element={<PageWrapper title="Manage Users"><UserManagement /></PageWrapper>} />
            </Route>
            
            {/* STRICT: Super Admin ONLY Routes */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                <Route path="/admin/announcements" element={<PageWrapper title="System Broadcasts"><AnnouncementManagement /></PageWrapper>} />
            </Route>

            {/* SUPER CUSTOM 404 PAGE */}
            <Route path="*" element={
                <PageWrapper title="Page Not Found">
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-12 h-12 text-prime-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h2 className="text-3xl font-bold text-prime-text mb-2">Link Not Found</h2>
                        <p className="text-prime-muted mb-8 max-w-md mx-auto">The page you are looking for may be a broken link, has been removed, or you lack the required permissions.</p>
                        <a href="/dashboard" className="px-6 py-3 bg-prime-primary text-white rounded-full font-semibold hover:bg-prime-secondary transition-colors">
                            Return to Dashboard
                        </a>
                    </div>
                </PageWrapper>
            } />
        </Routes>
    );
};

export default AppRouter;