from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded # Added to catch the error
from slowapi.util import get_remote_address
from app.api.v1 import auth, calls, attendance, announcements, users, leaves
from app.limiter import limiter  
import os

# Check if we are in production (default to 'development' if not set)
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Initialize FastAPI with conditional documentation URLs
app = FastAPI(
    title="Prime Kingdom CRM API",
    docs_url=None if ENVIRONMENT == "production" else "/docs",
    redoc_url=None if ENVIRONMENT == "production" else "/redoc",
    openapi_url=None if ENVIRONMENT == "production" else "/openapi.json"
)

# --- STRICT RATE LIMITING CONNECTION ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CONDITIONAL CORS CONFIGURATION ---
if ENVIRONMENT == "production":
    # Strictly lock down to your actual domains in production
    allowed_origins = [
        "https://primekingdom.org", 
        "https://api.primekingdom.org"
    ]
else:
    # Allow local testing environments
    allowed_origins = [
        "http://localhost:5173", 
        "http://127.0.0.1:5173", 
        "http://localhost:8000",
        "http://192.168.18.76:5173"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
app.include_router(leaves.router, prefix="/api/v1/leaves", tags=["Leaves"])