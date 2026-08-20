from fastapi import Depends, HTTPException, status, Request
from app.core.security import decode_access_token
from app.db.session import supabase

# We removed HTTPBearer() because we use enterprise HttpOnly cookies now!

async def get_current_user(request: Request):
    """Get current user from JWT token stored in secure cookie."""
    
    # 1. Read the exact token from the request cookies
    token = request.cookies.get("access_token")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Not authenticated. Missing secure cookie."
        )
        
    try:
        # 2. Decode it
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # 3. Get user profile from Supabase
        response = supabase.table('profiles').select('*').eq('id', user_id).execute()
        if not response.data:
            raise HTTPException(status_code=401, detail="User not found")
        
        return response.data[0]
        
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")

async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    """Get current active user."""
    return current_user

def require_role(allowed_roles: list):
    """Dependency to require specific roles."""
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get('role') not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker