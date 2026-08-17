from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

# Initialize the rate limiter using the client's IP address
limiter = Limiter(key_func=get_remote_address)

def setup_rate_limiter(app):
    """Attaches the SlowAPI rate limiter to the FastAPI app instance."""
    app.state.limiter = limiter
    app.add_exception_handler(429, _rate_limit_exceeded_handler)