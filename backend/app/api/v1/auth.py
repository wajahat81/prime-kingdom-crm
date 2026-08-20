from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import verify_password, create_access_token, get_password_hash, get_current_user
from app.db.session import supabase
from app.schemas.auth_schema import Token, UserCreate, ChangePasswordRequest
from app.limiter import limiter
from app.core.permissions import require_role
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/login")
@limiter.limit("5/minute")
async def login(response: Response, request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        identifier = form_data.username.strip()
        logger.info(f"Login attempt for identifier: {identifier}")
        
        # FIXED: Added 'device_token' to both select queries!
        if identifier.isdigit() and len(identifier) == 4:
            db_response = supabase.table('profiles').select('id, role, password_hash, email, full_name, dialing_id, device_token').eq('dialing_id', identifier).execute()
        else:
            db_response = supabase.table('profiles').select('id, role, password_hash, email, full_name, dialing_id, device_token').eq('email', identifier).execute()
        
        if not db_response.data:
            raise HTTPException(status_code=400, detail="Incorrect credentials")
            
        user_data = db_response.data[0]
        
        if not verify_password(form_data.password, user_data['password_hash']):
            raise HTTPException(status_code=400, detail="Incorrect credentials")
        
        # --- NEW DEVICE LOCKDOWN LOGIC ---
        if user_data['role'] not in ['admin', 'super_admin']:
            saved_token = user_data.get('device_token')
            client_token = request.headers.get("x-device-token")
            
            if not saved_token:
                raise HTTPException(status_code=403, detail="Device not assigned. Please ask an Admin to approve this computer.")
                
            if client_token != saved_token:
                raise HTTPException(status_code=403, detail="Unrecognized device. You can only log in from your specific assigned office computer.")
        # ---------------------------------
        
        access_token = create_access_token(
            data={"sub": str(user_data['id']), "role": user_data['role']}
        )
        
        # --- SMART COOKIE LOGIC ---
        is_production = "primekingdom.org" in str(request.url)
        
        response.set_cookie(
            key="access_token",
            value=access_token, 
            httponly=True,
            secure=True,
            samesite="none",
            domain=".primekingdom.org" if is_production else None,
            path="/",
            max_age=60 * 60 * 12
        )
        # ------------------------
        
        logger.info(f"Login successful for user: {identifier}")
        
        return {
            "message": "Login successful",
            "user": {
                "id": user_data['id'],
                "email": user_data.get('email'),
                "full_name": user_data.get('full_name', identifier),
                "role": user_data['role'],
                "dialing_id": user_data.get('dialing_id')
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
    """Register a new user with an optional dialing_id (Admin only)."""
    try:
        # Check if email already exists
        check_email = supabase.table('profiles').select('email').eq('email', user_data.email).execute()
        if check_email.data:
            raise HTTPException(status_code=400, detail="Email already registered")
            
        # Check if dialing_id already exists (if provided)
        if getattr(user_data, 'dialing_id', None):
            check_did = supabase.table('profiles').select('dialing_id').eq('dialing_id', user_data.dialing_id).execute()
            if check_did.data:
                raise HTTPException(status_code=400, detail="Dialing ID already assigned to another user")
        
        # Create new user
        new_user = {
            "id": str(uuid.uuid4()),
            "email": user_data.email,
            "full_name": user_data.full_name,
            "role": user_data.role,
            "dialing_id": getattr(user_data, 'dialing_id', None),
            "password_hash": get_password_hash(user_data.password)
        }
        
        response = supabase.table('profiles').insert(new_user).execute()
        
        if response.data:
            return {
                "message": "User created successfully",
                "user": response.data[0]
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create user")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/change-password")
@limiter.limit("5/minute")
async def change_password(
    request: Request,
    password_data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """Allow a logged-in user to securely change their password."""
    try:
        user_id = str(current_user['id'])
        logger.info(f"Password change attempt for user ID: {user_id}")
        
        # 1. Fetch current password hash from Supabase
        response = supabase.table('profiles').select('password_hash').eq('id', user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        user_record = response.data[0]
        
        # 2. Verify the old password is correct
        if not verify_password(password_data.current_password, user_record['password_hash']):
            logger.warning(f"Invalid current password provided by user ID: {user_id}")
            raise HTTPException(status_code=400, detail="Incorrect current password")
            
        # 3. Hash the new password
        new_hashed_password = get_password_hash(password_data.new_password)
        
        # 4. Update the database
        update_response = supabase.table('profiles').update(
            {"password_hash": new_hashed_password}
        ).eq('id', user_id).execute()
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update password in database")
            
        logger.info(f"Password successfully changed for user ID: {user_id}")
        
        return {
            "message": "Password updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Change password error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")