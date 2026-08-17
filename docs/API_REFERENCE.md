# Prime Kingdom API Reference

The backend uses FastAPI. When running locally, you can view the interactive Swagger UI documentation at `http://localhost:8000/docs`.

## Authentication endpoints
* `POST /api/v1/auth/login` - Accepts `username` (email) and `password`. Returns JWT.
* `POST /api/v1/auth/register` - (Super Admin only). Provisions a new user.

## Call endpoints
* `GET /api/v1/calls/me` - (Employee). Returns list of calls logged by the authenticated employee.
* `POST /api/v1/calls/` - (Admin). Uploads a new call log mapped to a specific employee ID.

## Attendance endpoints
* `GET /api/v1/attendance/status` - Returns active shift details if the user is currently checked in.
* `POST /api/v1/attendance/check-in` - Initiates a new shift. Auto-checkout triggers after 9 hours via background task.

## Commission & Announcement endpoints
* `POST /api/v1/commissions/` - (Admin). Submits final retained call count and calculates the payout amount.
* `GET /api/v1/announcements/active` - Fetches the currently live broadcast message.
* `POST /api/v1/announcements/` - (Admin). Overwrites the current broadcast message.