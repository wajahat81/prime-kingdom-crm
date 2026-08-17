export const ROLES = {
    EMPLOYEE: 'employee',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
};

export const CALL_STATUS = {
    PENDING: 'pending',
    RETAINED: 'retained',
    NOT_RETAINED: 'not_retained'
};

export const API_ROUTES = {
    LOGIN: '/api/v1/auth/login',
    CALLS_ME: '/api/v1/calls/me',
    CALLS: '/api/v1/calls/',
    CALLS_ALL: '/api/v1/calls/', // Same as CALLS but for admin
    CALL_UPDATE: (id) => `/api/v1/calls/${id}`,
    ATTENDANCE_STATUS: '/api/v1/attendance/status',
    ATTENDANCE_CHECKIN: '/api/v1/attendance/check-in',
    ATTENDANCE_CHECKOUT: '/api/v1/attendance/check-out',
    ANNOUNCEMENTS_ACTIVE: '/api/v1/announcements/active',
    ANNOUNCEMENTS: '/api/v1/announcements/',
    COMMISSIONS: '/api/v1/commissions/',
    COMMISSIONS_ME: '/api/v1/commissions/me'
};