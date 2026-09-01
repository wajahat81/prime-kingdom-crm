from fastapi import APIRouter, Depends, HTTPException
from app.db.session import supabase
from app.core.permissions import get_current_active_user, require_role
from pydantic import BaseModel
import uuid
from datetime import datetime, timezone

router = APIRouter()

class LeaveRequestCreate(BaseModel):
    start_date: str
    end_date: str
    reason: str

class LeaveStatusUpdate(BaseModel):
    status: str

@router.post("/")
async def submit_leave_request(
    payload: LeaveRequestCreate, 
    current_user: dict = Depends(get_current_active_user)
):
    new_request = {
        "id": str(uuid.uuid4()),
        "employee_id": current_user['id'],
        "start_date": payload.start_date,
        "end_date": payload.end_date,
        "reason": payload.reason,
        "status": "pending"
    }
    response = supabase.table('leave_requests').insert(new_request).execute()
    if response.data:
        return {"message": "Leave request submitted successfully", "data": response.data[0]}
    raise HTTPException(status_code=500, detail="Failed to submit leave request")

# 🚨 NEW: Endpoint for the user's personal leave history (crucial for Admins)
@router.get("/me")
async def get_my_leave_requests(current_user: dict = Depends(get_current_active_user)):
    try:
        response = supabase.table('leave_requests').select('*').eq('employee_id', current_user['id']).order('created_at', desc=True).execute()
        return {"data": response.data if response.data else []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_leave_requests(current_user: dict = Depends(get_current_active_user)):
    try:
        is_admin = current_user.get('role') in ['admin', 'super_admin']
        query = supabase.table('leave_requests').select('*')
        
        if not is_admin:
            query = query.eq('employee_id', current_user['id'])
            
        response = query.order('created_at', desc=True).execute()
        return {"data": response.data if response.data else []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{leave_id}/status")
async def update_leave_status(
    leave_id: str,
    payload: LeaveStatusUpdate, 
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    try:
        # 🚨 SECURITY LOCK: Prevent Admins from approving their own leaves
        leave_check = supabase.table('leave_requests').select('employee_id').eq('id', leave_id).execute()
        if not leave_check.data:
            raise HTTPException(status_code=404, detail="Leave request not found.")
        
        if leave_check.data[0]['employee_id'] == current_user['id']:
            raise HTTPException(status_code=403, detail="You are strictly forbidden from approving or rejecting your own leave requests.")

        update_response = supabase.table('leave_requests').update({
            'status': payload.status,
            'action_by': current_user['id'] 
        }).eq('id', leave_id).execute()
        
        return {"message": "Leave updated", "data": update_response.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))