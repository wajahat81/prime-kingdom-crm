from fastapi import Request

async def security_headers_middleware(request: Request, call_next):
    """
    Forces strict security headers on every HTTP response to prevent
    XSS, Clickjacking, and MIME-sniffing attacks.
    """
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

def setup_middleware(app):
    """Attaches all custom middlewares to the FastAPI app."""
    app.middleware("http")(security_headers_middleware)