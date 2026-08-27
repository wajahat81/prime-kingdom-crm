from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from app.db.session import supabase
from app.core.permissions import require_role
from app.core.security import get_password_hash
import uuid

router = APIRouter()

class ProfileFullAdminUpdateInternal(BaseModel):
    email: Optional[str] = None
    cnic: Optional[str] = None
    full_name: str
    password: Optional[str] = None
    role: str
    dialing_id: Optional[str] = None
    joining_date: Optional[str] = None 
    @field_validator('joining_date', mode='before')
    def empty_str_to_none(cls, value):
        if value == "" or value is None:
            return None
        return value

@router.get("/")
async def get_users(
    role: str = None,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Get all active users, optionally filtered by role."""
    try:
        # Query profiles table, ensuring we only fetch active users (or those without the flag yet)
        query = supabase.table('profiles').select('id, email, full_name, role, dialing_id, joining_date, created_at, is_active')
        
        # Filter out terminated/inactive users from the main list
        query = query.or_("is_active.is.null,is_active.eq.true")
        
        if role:
            query = query.eq('role', role)
            
        response = query.execute()
        return {"data": response.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/terminated")
async def get_terminated_users(
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Fetch all archived employees where is_active is false."""
    try:
        response = supabase.table('profiles') \
            .select('*') \
            .eq('is_active', False) \
            .execute()
            
        return {"data": response.data or []}
    except Exception as e:
        print(f"Fetch terminated users error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{profile_id}/restore")
async def restore_user(
    profile_id: str,
    payload: dict,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Restore a terminated employee back to active status."""
    try:
        response = supabase.table('profiles') \
            .update({
                "is_active": True,
                "role": payload.get("role", "employee")
            }) \
            .eq('id', profile_id) \
            .execute()
            
        return {"message": "User successfully restored", "data": response.data}
    except Exception as e:
        print(f"Restore user error: {e}")
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
            "dialing_id": profile_update.dialing_id,
            "joining_date": profile_update.joining_date 
        }
        
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
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/{profile_id}")
async def admin_delete_user_account(
    profile_id: str,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Soft-delete a user: marks is_active False, and clears dialing_id for reuse."""
    try:
        if current_user['role'] == 'admin':
             check_profile = supabase.table('profiles').select('role').eq('id', profile_id).execute()
             if check_profile.data and check_profile.data[0]['role'] == 'super_admin':
                 raise HTTPException(status_code=403, detail="Admins cannot delete Super Admins.")
        
        if profile_id == current_user['id']:
            raise HTTPException(status_code=403, detail="You cannot delete your own active account.")
        
        # Soft delete: archive user AND clear dialing_id so it can be reassigned
        response = supabase.table('profiles') \
            .update({"is_active": False, "dialing_id": None}) \
            .eq('id', profile_id) \
            .execute()
            
        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
            
        return {"message": "User successfully archived and dialing ID released"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Soft delete error: {e}")
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

@router.delete("/{profile_id}/permanent")
async def permanent_delete_user_account(
    profile_id: str,
    current_user: dict = Depends(require_role(["super_admin"])) # Restricted to super admin for safety
):
    """Permanently deletes a terminated employee record and related foreign keys."""
    try:
        # Clean up related records first to avoid foreign key violations
        supabase.table('calls').delete().eq('employee_id', profile_id).execute()
        supabase.table('attendance').delete().eq('employee_id', profile_id).execute()
        supabase.table('commissions').delete().eq('employee_id', profile_id).execute()
        
        response = supabase.table('profiles').delete().eq('id', profile_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
            
        return {"message": "User permanently deleted from system"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Permanent delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))