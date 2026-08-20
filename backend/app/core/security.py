from datetime import datetime, timedelta, timezone
from jose import jwt
import bcrypt
import os

# Updated FastAPI imports for Cookie Auth
from fastapi import Depends, HTTPException, status, Request

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "6396db6a-f393-476b-9abc-d0bb78de1834")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        plain_password_bytes = plain_password.encode('utf-8')
        hashed_password_bytes = hashed_password.encode('utf-8')
        if len(plain_password_bytes) > 72:
            plain_password_bytes = plain_password_bytes[:72]
        return bcrypt.checkpw(plain_password_bytes, hashed_password_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """Decode and verify JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.JWTError:
        raise Exception("Invalid token")


# --- UPDATED TO READ FROM SECURE COOKIE ---
# --- UPDATED TO READ FROM SECURE COOKIE ---
async def get_current_user(request: Request) -> dict:
    """Extracts the JWT token from the secure cookie and returns the user data."""
    try:
        # Read the exact token from the request cookies
        token = request.cookies.get("access_token")
        
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Not authenticated. Missing secure cookie."
            )
            
        # FIX: We completely removed the token.replace("Bearer ", "") line!
        
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Could not validate credentials"
            )
            
        return {"id": user_id, "role": payload.get("role")}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )