from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from app.api.v1 import auth, calls, attendance, announcements, users
from app.limiter import limiter  # Use this imported limiter

app = FastAPI(title="Prime Kingdom CRM API")
app.state.limiter = limiter  # This now uses the imported limiter
app.add_exception_handler(429, _rate_limit_exceeded_handler)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8000","http://192.168.18.76:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Force HTTPS and add Security Headers
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# Include routing
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(calls.router, prefix="/api/v1/calls", tags=["calls"])
app.include_router(attendance.router, prefix="/api/v1/attendance", tags=["attendance"])
app.include_router(announcements.router, prefix="/api/v1/announcements", tags=["announcements"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])