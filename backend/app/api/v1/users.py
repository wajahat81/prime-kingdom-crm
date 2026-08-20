from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.db.session import supabase
from app.core.permissions import require_role
from app.core.security import get_password_hash
import uuid

router = APIRouter()

class ProfileFullAdminUpdateInternal(BaseModel):
    email: EmailStr
    full_name: str
    password: Optional[str] = None
    role: str
    dialing_id: Optional[str] = None # Added dialing_id to the schema!

@router.get("/")
async def get_users(
    role: str = None,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Get all users, optionally filtered by role."""
    try:
        query = supabase.table('profiles').select('id, email, full_name, role, dialing_id, created_at')
        if role:
            query = query.eq('role', role)
        response = query.execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{profile_id}")
async def admin_edit_user_profile(
    profile_id: str,
    profile_update: ProfileFullAdminUpdateInternal,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Securely updates a user profile matching your exact database column names."""
    try:
        update_data = {
            "full_name": profile_update.full_name,
            "role": profile_update.role,
            "email": profile_update.email,
            "dialing_id": profile_update.dialing_id # Added dialing_id to the DB update!
        }
        
        # FIXED: Use 'password_hash' to match your database schema exactly
        if profile_update.password and profile_update.password.strip() != "":
            update_data['password_hash'] = get_password_hash(profile_update.password)

        response = supabase.table('profiles').update(update_data).eq('id', profile_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
            
        return {"message": "User profile updated successfully", "data": response.data[0]}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"CRITICAL EDIT USER ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    
@router.delete("/{profile_id}")
async def admin_delete_user_account(
    profile_id: str,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Securely delete a user account."""
    try:
        if current_user['role'] == 'admin':
             check_profile = supabase.table('profiles').select('role').eq('id', profile_id).execute()
             if check_profile.data and check_profile.data[0]['role'] == 'super_admin':
                 raise HTTPException(status_code=403, detail="Admins cannot delete Super Admins.")
        
        if profile_id == current_user['id']:
            raise HTTPException(status_code=403, detail="You cannot delete your own active account.")
        
        supabase.table('calls').delete().eq('employee_id', profile_id).execute()
        supabase.table('attendance').delete().eq('employee_id', profile_id).execute()
        supabase.table('commissions').delete().eq('employee_id', profile_id).execute()
        
        response = supabase.table('profiles').delete().eq('id', profile_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
        return {"message": "User account deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{profile_id}/trust-device")
async def trust_device(
    profile_id: str,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Generates a permanent hardware token and assigns it to a user."""
    try:
        new_device_token = str(uuid.uuid4())
        
        response = supabase.table('profiles').update(
            {"device_token": new_device_token}
        ).eq('id', profile_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {"message": "Device trusted", "device_token": new_device_token}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))