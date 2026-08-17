import { useAuth } from './useAuth';
import { ROLES } from '../utils/constants';

export const useRole = () => {
    const { user } = useAuth();

    return {
        isEmployee: user?.role === ROLES.EMPLOYEE,
        isAdmin: user?.role === ROLES.ADMIN,
        isSuperAdmin: user?.role === ROLES.SUPER_ADMIN,
        hasManagerAccess: [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role)
    };
};