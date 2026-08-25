from fastapi import APIRouter, Depends, HTTPException
from app.db.session import supabase
from app.core.permissions import get_current_active_user, require_role
from app.schemas.attendance_schema import AttendanceStatusUpdate, AttendanceTimeUpdate
from app.services.attendance_service import update_attendance_status, update_attendance_times
import uuid
from datetime import datetime, timezone, timedelta

router = APIRouter()

# --- STRICT PAKISTAN TIMEZONE (UTC+5) ---
PKT = timezone(timedelta(hours=5))

def get_pkt_today():
    """Always returns the exact current date in Lahore, Pakistan"""
    return datetime.now(PKT).date().isoformat()

@router.post("/check-in")
async def check_in(current_user: dict = Depends(get_current_active_user)):
    """Employee checks in (Strictly ONCE per day)."""
    try:
        # FIXED: Now strictly evaluates the day using PKT
        today = get_pkt_today() 
        
        check_response = supabase.table('attendance').select('*') \
            .eq('employee_id', current_user['id']) \
            .eq('date', today) \
            .execute()
        
        if check_response.data:
            raise HTTPException(status_code=400, detail="You have already logged a shift for today.")
        
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
    """Employee auto checks out with day-aware shift caps."""
    try:
        today = get_pkt_today()
        
        response = supabase.table('attendance').select('*') \
            .eq('employee_id', current_user['id']) \
            .eq('date', today) \
            .eq('status', 'checked_in') \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="No active check-in found to check out from.")
        
        record = response.data[0]
        check_in_time = datetime.fromisoformat(record['check_in'].replace('Z', '+00:00'))
        current_time = datetime.now(timezone.utc)
        
        # Determine day of week (0 = Monday, ..., 4 = Friday, 5 = Saturday, 6 = Sunday)
        # Note: python's weekday() returns 4 for Friday, 5 for Saturday
        weekday = check_in_time.weekday()
        
        if weekday == 4:  # Friday: 7 hours limit
            max_duration = timedelta(hours=7)
        elif weekday == 5:  # Saturday: 5 hours 45 minutes limit
            max_duration = timedelta(hours=5, minutes=45)
        else:  # Standard days: 9 hours limit
            max_duration = timedelta(hours=9)
        
        # Apply the correct limit cap
        if current_time - check_in_time >= max_duration:
            actual_check_out = (check_in_time + max_duration).isoformat()
        else:
            actual_check_out = current_time.isoformat()
        
        update_response = supabase.table('attendance').update({
            'check_out': actual_check_out,
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
    """Get today's exact shift status with day-aware auto-checkout enforcement."""
    try:
        today = get_pkt_today()
        current_time = datetime.now(timezone.utc)
        
        response = supabase.table('attendance').select('*') \
            .eq('employee_id', current_user['id']) \
            .eq('date', today) \
            .order('check_in', desc=True) \
            .limit(1) \
            .execute()
        
        if response.data:
            record = response.data[0]
            
            # --- DAY-AWARE AUTO-CHECKOUT LOGIC ---
            if record.get('status') == 'checked_in' and record.get('check_in'):
                check_in_time = datetime.fromisoformat(record['check_in'].replace('Z', '+00:00'))
                weekday = check_in_time.weekday()
                
                if weekday == 4:  # Friday -> 7 hours
                    max_duration = timedelta(hours=7)
                elif weekday == 5:  # Saturday -> 5 hours 45 mins
                    max_duration = timedelta(hours=5, minutes=45)
                else:  # Other days -> 9 hours
                    max_duration = timedelta(hours=9)
                
                if current_time - check_in_time >= max_duration:
                    auto_check_out_time = (check_in_time + max_duration).isoformat()
                    
                    # Force close the shift in the database
                    supabase.table('attendance').update({
                        'check_out': auto_check_out_time,
                        'status': 'checked_out'
                    }).eq('id', record['id']).execute()
                    
                    return {
                        "status": "checked_out",
                        "check_in_time": record['check_in'],
                        "check_out_time": auto_check_out_time,
                        "server_time": current_time.isoformat()
                    }
            # -----------------------------------

            return {
                "status": record.get('status', 'checked_out'),
                "check_in_time": record.get('check_in'),
                "check_out_time": record.get('check_out'),
                "server_time": current_time.isoformat()
            }
            
        return {
            "status": "not_checked_in",
            "server_time": current_time.isoformat()
        }
    except Exception as e:
        print(f"Get status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# HISTORY ROUTES (ORDER IS CRITICAL)
# ==========================================

@router.get("/history/me")
async def get_my_attendance_history(current_user: dict = Depends(get_current_active_user)):
    """Employee gets their own attendance history."""
    try:
        response = supabase.table('attendance') \
            .select('*') \
            .eq('employee_id', current_user['id']) \
            .order('date', desc=True) \
            .execute()
        return {"data": response.data if response.data else []}
    except Exception as e:
        print(f"Get my history error: {e}")
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

# ==========================================
# ADMIN ROUTES
# ==========================================

@router.put("/{log_id}/status")
async def update_status(
    log_id: str,
    payload: AttendanceStatusUpdate,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Admin manually approves or rejects an attendance record."""
    try:
        updated_record = update_attendance_status(log_id, payload.status)
        if not updated_record:
            raise HTTPException(status_code=404, detail="Attendance record not found.")
        return {"message": f"Attendance status updated to {payload.status}", "data": updated_record}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{log_id}")
async def update_times(
    log_id: str,
    payload: AttendanceTimeUpdate,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Admin manually edits the check-in or check-out times."""
    try:
        check_in_str = payload.check_in.isoformat() if payload.check_in else None
        check_out_str = payload.check_out.isoformat() if payload.check_out else None
        
        updated_record = update_attendance_times(log_id, check_in_str, check_out_str)
        if not updated_record:
            raise HTTPException(status_code=404, detail="Attendance record not found or no data provided.")
            
        return {"message": "Attendance times updated successfully", "data": updated_record}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update times error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/date/{target_date}")
async def get_attendance_by_date(
    target_date: str, 
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Fetch all attendance records for a specific YYYY-MM-DD date."""
    try:
        response = supabase.table('attendance') \
            .select('*') \
            .eq('date', target_date) \
            .execute()
            
        return {"data": response.data or []}
    except Exception as e:
        print(f"Attendance Fetch Error: {e}") 
        raise HTTPException(status_code=500, detail=str(e))