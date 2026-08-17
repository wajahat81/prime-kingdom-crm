import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/auth/Login';
import EmployeeDashboard from '../pages/employee/Dashboard';
import CallLogUpload from '../pages/admin/CallLogUpload';
import CallManagement from '../pages/admin/CallManagement';
import CommissionManagement from '../pages/admin/CommissionManagement';
import AddEmployee from '../pages/admin/AddEmployee';
import UserManagement from '../pages/superadmin/UserManagement';
import AnnouncementManagement from '../pages/admin/AnnouncementManagement';
import AttendanceLogs from '../pages/admin/AttendanceLogs';  

const AppRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            {/* Dashboard - accessible by all authenticated users */}
            <Route element={<ProtectedRoute allowedRoles={['employee', 'admin', 'super_admin']} />}>
                <Route path="/dashboard" element={<EmployeeDashboard />} />
            </Route>

            {/* Admin & Super Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
                <Route path="/admin/calls/upload" element={<CallLogUpload />} />
                <Route path="/admin/calls/manage" element={<CallManagement />} />
                <Route path="/admin/attendance" element={<AttendanceLogs />} />
                <Route path="/admin/announcements" element={<AnnouncementManagement />} />
                <Route path="/admin/employees/add" element={<AddEmployee />} />
                <Route path="/admin/commissions" element={<CommissionManagement />} />
            </Route>

            {/* Super Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                <Route path="/superadmin/users" element={<UserManagement />} />
            </Route>

            {/* Enterprise 404 Fallback */}
            <Route path="*" element={
                <div className="flex flex-col items-center justify-center h-full p-8 text-center page-transition">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-prime-text">Page Not Found</h2>
                    <p className="text-sm text-prime-muted mt-2">The module you are looking for does not exist or you lack sufficient permissions.</p>
                </div>
            } />
        </Routes>
    );
};

export default AppRouter;