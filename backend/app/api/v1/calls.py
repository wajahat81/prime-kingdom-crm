from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Optional
from pydantic import BaseModel 
from app.core.permissions import get_current_active_user, require_role
from app.db.session import supabase
from app.api.v1.audit import log_audit # <-- IMPORTED HELPER
import logging
import uuid 

logger = logging.getLogger(__name__)

router = APIRouter()

class FullCallUpdate(BaseModel):
    client_name: str
    employee_id: str
    status: str
    commission: Optional[float] = 0.0
    handy_id: Optional[str] = None
    closer_id: Optional[str] = None
    doc_sign_id: Optional[str] = None

@router.post("/", status_code=201)
async def upload_call_log(
    call_in: dict,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    try:
        new_record = {
            "id": str(uuid.uuid4()),
            "client_name": call_in.get("client_name"),
            "employee_id": call_in.get("employee_id"),
            "status": call_in.get("status", "pending"),
            "commission": float(call_in.get("commission", 0.0) or 0.0),
            "handy_id": call_in.get("handy_id"),
            "closer_id": call_in.get("closer_id"),
            "doc_sign_id": call_in.get("doc_sign_id"),
            "created_by": current_user["id"] 
        }
        
        response = supabase.table('calls').insert(new_record).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to insert call log into database.")
            
        # 🚨 LOG ACTIVITY
        log_audit(
            admin_id=current_user['id'], 
            action_type="Call Log Created", 
            description=f"Added call record for client: {call_in.get('client_name')}"
        )
            
        return {"message": "Call log created securely", "data": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/me")
async def get_my_calls(current_user: dict = Depends(get_current_active_user)):
    try:
        user_id = current_user['id']
        query = f"employee_id.eq.{user_id},handy_id.eq.{user_id},closer_id.eq.{user_id},doc_sign_id.eq.{user_id}"
        
        response = supabase.table('calls').select('*').or_(query).order('created_at', desc=True).execute()
        return {"data": response.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_all_calls_endpoint(
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    try:
        response = supabase.table('calls') \
            .select('*, profiles!calls_employee_id_fkey(full_name)') \
            .order('created_at', desc=True).execute()
        
        calls = response.data if response.data else []
        return {"data": calls}
    except Exception as e:
        logger.error(f"Get all calls error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{call_id}")
async def full_edit_call_log(
    call_id: str,
    call_update: FullCallUpdate, 
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    try:
        update_dict = call_update.dict()
        
        if update_dict['status'] != 'retained':
            update_dict['commission'] = 0.0
            
        response = supabase.table('calls') \
            .update(update_dict) \
            .eq('id', call_id) \
            .execute()
            
        if not response.data:
            raise HTTPException(status_code=404, detail="Call record not found.")
            
        # 🚨 LOG ACTIVITY
        log_audit(
            admin_id=current_user['id'], 
            action_type="Call Log Edited", 
            description=f"Updated call record for client: {update_dict['client_name']}"
        )
            
        return {"message": "Call log updated securely", "data": response.data[0]}
    except Exception as e:
        logger.error(f"Full Edit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{call_id}")
async def delete_call_log(
    call_id: str,
    current_user: dict = Depends(require_role(["admin", "super_admin"])) 
):
    try:
        # Fetch client name before deleting for the log
        call_data = supabase.table('calls').select('client_name').eq('id', call_id).execute()
        target_client = call_data.data[0]['client_name'] if call_data.data else call_id

        response = supabase.table('calls').delete().eq('id', call_id).execute()
        
        if not response.data:
             raise HTTPException(status_code=404, detail="Call record not found.")
             
        # 🚨 LOG ACTIVITY WITH CLIENT NAME
        log_audit(
            admin_id=current_user['id'], 
            action_type="Call Log Deleted", 
            description=f"Deleted call record for client: {target_client}"
        )
             
        return {"message": "Call log deleted successfully"}
    except Exception as e:
        logger.error(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))