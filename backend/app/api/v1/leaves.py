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
    """Employee submits a new leave request."""
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

@router.get("/")
async def get_leave_requests(current_user: dict = Depends(get_current_active_user)):
    """Employees see their own requests; Admins see ALL requests."""
    try:
        is_admin = current_user.get('role') in ['admin', 'super_admin']
        
        # FIXED: Removed the ambiguous profiles join
        query = supabase.table('leave_requests').select('*')
        
        if not is_admin:
            query = query.eq('employee_id', current_user['id'])
            
        response = query.order('created_at', desc=True).execute()
        return {"data": response.data if response.data else []}
        
    except Exception as e:
        print(f"GET leaves error: {e}")
        # Raising an HTTPException ensures CORS headers are still attached on failure
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{leave_id}/status")
async def update_leave_status(
    leave_id: str,
    payload: LeaveStatusUpdate, 
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    try:
        # FIXED: Changed 'leaves' to 'leave_requests' to match your database!
        update_response = supabase.table('leave_requests').update({
            'status': payload.status,
            'action_by': current_user['id'] 
        }).eq('id', leave_id).execute()
        
        return {"message": "Leave updated", "data": update_response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))