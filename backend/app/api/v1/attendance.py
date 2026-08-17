from fastapi import APIRouter, Depends, HTTPException
from app.db.session import supabase
from app.core.permissions import get_current_active_user, require_role
import uuid
from datetime import datetime, timezone

router = APIRouter()

@router.post("/check-in")
async def check_in(current_user: dict = Depends(get_current_active_user)):
    """Employee checks in (Strictly ONCE per day)."""
    try:
        # Use explicit UTC timezone to prevent Docker local-time offsets
        today = datetime.now(timezone.utc).date().isoformat()
        
        check_response = supabase.table('attendance').select('*') \
            .eq('employee_id', current_user['id']) \
            .eq('date', today) \
            .execute()
        
        if check_response.data:
            raise HTTPException(status_code=400, detail="You have already logged a shift for today.")
        
        # Explicit UTC timestamp so the frontend converts to PKT accurately
        now = datetime.now(timezone.utc).isoformat()
        new_record = {
            "id": str(uuid.uuid4()),
            "employee_id": current_user['id'],
            "check_in": now,
            "date": today,
            "status": "checked_in"
        }
        
        response = supabase.table('attendance').insert(new_record).execute()
        
        if response.data:
            return {
                "message": "Check-in successful", 
                "status": "checked_in", 
                "check_in_time": now
            }
            
        raise HTTPException(status_code=500, detail="Failed to create attendance record")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Check-in error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check-out")
async def check_out(current_user: dict = Depends(get_current_active_user)):
    """Employee auto checks out."""
    try:
        today = datetime.now(timezone.utc).date().isoformat()
        
        response = supabase.table('attendance').select('*') \
            .eq('employee_id', current_user['id']) \
            .eq('date', today) \
            .eq('status', 'checked_in') \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="No active check-in found to check out from.")
        
        record = response.data[0]
        
        update_response = supabase.table('attendance').update({
            'check_out': datetime.now(timezone.utc).isoformat(),
            'status': 'checked_out'
        }).eq('id', record['id']).execute()
        
        return {"message": "Check-out successful", "status": "checked_out"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Check-out error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_attendance_status(current_user: dict = Depends(get_current_active_user)):
    """Get today's exact shift status."""
    try:
        today = datetime.now(timezone.utc).date().isoformat()
        
        response = supabase.table('attendance').select('*') \
            .eq('employee_id', current_user['id']) \
            .eq('date', today) \
            .order('check_in', desc=True) \
            .limit(1) \
            .execute()
        
        if response.data:
            record = response.data[0]
            return {
                "status": record.get('status', 'checked_out'),
                "check_in_time": record.get('check_in'),
                "check_out_time": record.get('check_out')
            }
        return {"status": "not_checked_in"}
    except Exception as e:
        print(f"Get status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{employee_id}")
async def get_attendance_history(
    employee_id: str,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Admin gets attendance history for a specific employee."""
    try:
        response = supabase.table('attendance').select('*').eq('employee_id', employee_id).order('date', desc=True).execute()
        return {"data": response.data if response.data else []}
    except Exception as e:
        print(f"Get history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))