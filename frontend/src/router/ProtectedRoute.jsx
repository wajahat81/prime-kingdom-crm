import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If no specific roles required or user has required role, allow access
    if (!allowedRoles || allowedRoles.includes(user?.role)) {
        return <Outlet />;
    }

    // User doesn't have required role - redirect to their default page
    if (user?.role === ROLES.SUPER_ADMIN) {
        return <Navigate to="/superadmin/users" replace />;
    } else if (user?.role === ROLES.ADMIN) {
        return <Navigate to="/admin/calls/manage" replace />;
    }
    return <Navigate to="/dashboard" replace />;
};

export default ProtectedRoute;