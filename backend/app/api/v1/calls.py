from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from app.schemas.call_schema import CallCreate, CallUpdate
from app.services.call_service import create_call_record, get_employee_calls, get_all_calls, update_call_status, update_call_commission
from app.core.permissions import get_current_active_user, require_role
from app.db.session import supabase
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", status_code=201)
async def upload_call_log(
    call_in: CallCreate,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    try:
        record = create_call_record(call_data=call_in, admin_id=current_user["id"])
        return {"message": "Call log created securely", "data": record}
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me")
async def read_my_calls(current_user: dict = Depends(get_current_active_user)):
    """Employee gets their own calls."""
    try:
        calls = get_employee_calls(employee_id=current_user["id"])
        return {"data": calls}
    except Exception as e:
        logger.error(f"Get my calls error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_all_calls_endpoint(
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Admin gets all call logs."""
    try:
        response = supabase.table('calls').select('*').order('created_at', desc=True).execute()
        calls = response.data if response.data else []
        
        # Get employee names
        for call in calls:
            if call.get('employee_id'):
                try:
                    profile_response = supabase.table('profiles').select('full_name').eq('id', call['employee_id']).execute()
                    if profile_response.data:
                        call['employee_name'] = profile_response.data[0].get('full_name', call['employee_id'])
                    else:
                        call['employee_name'] = call['employee_id'][:8] + '...'
                except Exception as e:
                    logger.error(f"Error getting employee name: {e}")
                    call['employee_name'] = call['employee_id'][:8] + '...'
        
        return {"data": calls}
    except Exception as e:
        logger.error(f"Get all calls error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{call_id}/status")
async def update_call_status_endpoint(
    call_id: str,
    update_data: CallUpdate,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    try:
        updated = update_call_status(call_id, update_data.status)
        return {"message": "Call status updated", "data": updated}
    except Exception as e:
        logger.error(f"Update status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{call_id}/commission")
async def update_call_commission_endpoint(
    call_id: str,
    commission_data: dict,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Admin updates commission for retained calls."""
    try:
        commission = commission_data.get("commission")
        if commission is None:
            raise HTTPException(status_code=400, detail="Commission amount is required")
        
        try:
            commission = float(commission)
        except ValueError:
            raise HTTPException(status_code=400, detail="Commission must be a number")
        
        if commission < 0:
            raise HTTPException(status_code=400, detail="Commission cannot be negative")
        
        updated = update_call_commission(call_id, commission)
        return {"message": "Commission updated", "data": updated}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update commission error: {e}")
        raise HTTPException(status_code=500, detail=str(e))