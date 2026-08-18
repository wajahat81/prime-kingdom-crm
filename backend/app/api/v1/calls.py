from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Optional
from pydantic import BaseModel # New Import
from app.core.permissions import get_current_active_user, require_role
from app.db.session import supabase
import logging
import uuid # New Import

logger = logging.getLogger(__name__)

router = APIRouter()

# --- Simplified Internal Schema for Updates ---
# We use this internally in the PUT method so we don't need the schema file.
class FullCallUpdate(BaseModel):
    client_name: str
    employee_id: str
    call_duration: Optional[str] = None
    status: str
    commission: Optional[float] = 0.0

@router.post("/", status_code=201)
async def upload_call_log(
    call_in: dict,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Log a new call securely."""
    try:
        new_record = {
            "id": str(uuid.uuid4()),
            "client_name": call_in.get("client_name"),
            "employee_id": call_in.get("employee_id"),
            "call_duration": call_in.get("call_duration"),
            "status": call_in.get("status", "pending"),
            "commission": float(call_in.get("commission", 0.0) or 0.0),
            "created_by": current_user["id"] # Explicitly mapping to your foreign key column
        }
        
        response = supabase.table('calls').insert(new_record).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to insert call log into database.")
            
        return {"message": "Call log created securely", "data": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/me")
async def read_my_calls(current_user: dict = Depends(get_current_active_user)):
    """Employee gets their own calls."""
    try:
        response = supabase.table('calls').select('*') \
            .eq('employee_id', current_user['id']) \
            .order('created_at', desc=True).execute()
        return {"data": response.data}
    except Exception as e:
        logger.error(f"Get my calls error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_all_calls_endpoint(
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Admin gets all call logs, including employee names."""
    try:
        # Fetch calls joined with profiles in ONE query to be efficient
        response = supabase.table('calls') \
            .select('*, profiles!calls_employee_id_fkey(full_name)') \
            .order('created_at', desc=True).execute()
        
        calls = response.data if response.data else []
        return {"data": calls}
    except Exception as e:
        logger.error(f"Get all calls error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# NEW FULL CRUD ENDPOINTS FOR ADMIN MANAGEMENT
# ============================================

@router.put("/{call_id}")
async def full_edit_call_log(
    call_id: str,
    call_update: FullCallUpdate, # Validate the full update payload
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Admin edits all details of a call log."""
    try:
        update_dict = call_update.dict()
        
        # Security Check: Force commission to 0 if status isn't retained
        if update_dict['status'] != 'retained':
            update_dict['commission'] = 0.0
            
        response = supabase.table('calls') \
            .update(update_dict) \
            .eq('id', call_id) \
            .execute()
            
        if not response.data:
            raise HTTPException(status_code=404, detail="Call record not found.")
            
        return {"message": "Call log updated securely", "data": response.data[0]}
    except Exception as e:
        logger.error(f"Full Edit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{call_id}")
async def delete_call_log(
    call_id: str,
    # Changed this line to allow both admins and super_admins
    current_user: dict = Depends(require_role(["admin", "super_admin"])) 
):
    """Admin permanently deletes a call log."""
    try:
        response = supabase.table('calls').delete().eq('id', call_id).execute()
        
        if not response.data:
             raise HTTPException(status_code=404, detail="Call record not found.")
             
        return {"message": "Call log deleted successfully"}
    except Exception as e:
        logger.error(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))