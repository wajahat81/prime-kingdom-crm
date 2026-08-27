from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date
from app.db.session import supabase
from app.core.permissions import require_role
from app.core.security import get_password_hash
from app.api.v1.audit import log_audit # <-- IMPORTED HELPER
import uuid

router = APIRouter()

class ProfileFullAdminUpdateInternal(BaseModel):
    email: Optional[str] = None
    full_name: str
    password: Optional[str] = None
    role: str
    dialing_id: Optional[str] = None
    joining_date: Optional[date] = None 
    cnic: Optional[str] = None

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
    try:
        query = supabase.table('profiles').select('id, email, full_name, role, dialing_id, joining_date, cnic, created_at, is_active')
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
    try:
        response = supabase.table('profiles').select('*').eq('is_active', False).execute()
        return {"data": response.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{profile_id}/restore")
async def restore_user(
    profile_id: str,
    payload: dict,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    try:
        response = supabase.table('profiles').update({
            "is_active": True,
            "role": payload.get("role", "employee")
        }).eq('id', profile_id).execute()
        
        # LOG ACTIVITY
        restored_name = response.data[0].get('full_name', 'Unknown User') if response.data else profile_id
        restored_did = response.data[0].get('dialing_id', 'None') if response.data else 'None'
        log_audit(current_user['id'], "User Restored", f"Restored user account for {restored_name} (ID: {restored_did})")

            
        return {"message": "User successfully restored", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{profile_id}")
async def admin_edit_user_profile(
    profile_id: str,
    profile_update: ProfileFullAdminUpdateInternal,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    try:
        update_data = {
            "full_name": profile_update.full_name,
            "role": profile_update.role,
            "email": profile_update.email,
            "dialing_id": profile_update.dialing_id,
            "joining_date": profile_update.joining_date,
            "cnic": profile_update.cnic
        }
        
        if profile_update.password and profile_update.password.strip() != "":
            update_data['password_hash'] = get_password_hash(profile_update.password)

        response = supabase.table('profiles').update(update_data).eq('id', profile_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
            
        # LOG ACTIVITY
        did = profile_update.dialing_id or "None"
        log_audit(current_user['id'], "Profile Updated", f"Updated profile for {profile_update.full_name} (ID: {did})")
            
        return {"message": "User profile updated successfully", "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{profile_id}")
async def admin_delete_user_account(
    profile_id: str,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    try:
        if current_user['role'] == 'admin':
             check_profile = supabase.table('profiles').select('role').eq('id', profile_id).execute()
             if check_profile.data and check_profile.data[0]['role'] == 'super_admin':
                 raise HTTPException(status_code=403, detail="Admins cannot delete Super Admins.")
        
        if profile_id == current_user['id']:
            raise HTTPException(status_code=403, detail="You cannot delete your own active account.")
        
        response = supabase.table('profiles').update({"is_active": False, "dialing_id": None}).eq('id', profile_id).execute()
            
        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
            
        # LOG ACTIVITY
        deleted_name = response.data[0].get('full_name', 'Unknown User')
        deleted_did = response.data[0].get('dialing_id', 'None')
        log_audit(current_user['id'], "User Terminated", f"Archived/Terminated user: {deleted_name} (ID: {deleted_did})")

           
        return {"message": "User successfully archived"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{profile_id}/permanent")
async def permanent_delete_user_account(
    profile_id: str,
    current_user: dict = Depends(require_role(["super_admin"])) 
):
    try:
        # Fetch name before deleting for the log
        profile_data = supabase.table('profiles').select('full_name, dialing_id').eq('id', profile_id).execute()
        target_name = profile_data.data[0]['full_name'] if profile_data.data else profile_id
        target_did = profile_data.data[0]['dialing_id'] if profile_data.data else "None"

        supabase.table('calls').delete().eq('employee_id', profile_id).execute()
        supabase.table('attendance').delete().eq('employee_id', profile_id).execute()
        supabase.table('commissions').delete().eq('employee_id', profile_id).execute()
        
        response = supabase.table('profiles').delete().eq('id', profile_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
            
        # LOG ACTIVITY
        log_audit(current_user['id'], "User Permanently Deleted", f"Permanently deleted user: {target_name} (ID: {target_did}) and all related records")
            
        return {"message": "User permanently deleted from system"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{profile_id}/trust-device")
async def trust_device(
    profile_id: str,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    try:
        new_device_token = str(uuid.uuid4())
        response = supabase.table('profiles').update({"device_token": new_device_token}).eq('id', profile_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        # LOG ACTIVITY
        target_name = response.data[0].get('full_name', 'Unknown User')
        log_audit(current_user['id'], "Device Trusted", f"Generated hardware token for {target_name}")
            
        return {"message": "Device trusted", "device_token": new_device_token}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))