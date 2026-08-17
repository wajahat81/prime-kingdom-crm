from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import verify_password, create_access_token, get_password_hash
from app.db.session import supabase
from app.schemas.auth_schema import Token, UserCreate
from app.limiter import limiter
import logging
import uuid
from app.core.permissions import require_role

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        logger.info(f"Login attempt for email: {form_data.username}")
        
        response = supabase.table('profiles').select('id, role, password_hash, email, full_name').eq('email', form_data.username).execute()
        
        if not response.data:
            logger.warning(f"User not found: {form_data.username}")
            raise HTTPException(status_code=400, detail="Incorrect email or password")
            
        user_data = response.data[0]
        logger.info(f"User found: {user_data.get('email')}, role: {user_data.get('role')}")
        
        if not verify_password(form_data.password, user_data['password_hash']):
            logger.warning(f"Invalid password for user: {form_data.username}")
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        
        access_token = create_access_token(
            data={"sub": str(user_data['id']), "role": user_data['role']}
        )
        
        logger.info(f"Login successful for user: {form_data.username}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_data['id'],
                "email": user_data.get('email'),
                "full_name": user_data.get('full_name', form_data.username.split('@')[0]),
                "role": user_data['role']
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/register")
async def register_user(
    user_data: UserCreate,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Register a new user (Admin only)."""
    try:
        # Check if email already exists
        check_response = supabase.table('profiles').select('email').eq('email', user_data.email).execute()
        if check_response.data:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        new_user = {
            "id": str(uuid.uuid4()),
            "email": user_data.email,
            "full_name": user_data.full_name,
            "role": user_data.role,
            "password_hash": get_password_hash(user_data.password)
        }
        
        response = supabase.table('profiles').insert(new_user).execute()
        
        if response.data:
            return {
                "message": "User created successfully",
                "user": {
                    "id": response.data[0]['id'],
                    "email": response.data[0]['email'],
                    "full_name": response.data[0]['full_name'],
                    "role": response.data[0]['role']
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create user")
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))