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

def get_shift_rules_for_date(target_date_str: str, check_in_dt: datetime = None):
    """
    Fetches shift rules prioritizing date-specific overrides over weekly defaults, 
    and returns a standardized dictionary containing req_hours, start_time, and grace_mins.
    """
    try:
        response = supabase.table('office_settings').select('setting_value, overrides').eq('setting_key', 'shift_rules').execute()
        if response.data:
            row = response.data[0]
            overrides = row.get('overrides', {})
            
            # 1. Check if there is a custom override for this specific date string (e.g. "2026-09-10")
            if target_date_str in overrides:
                override_data = overrides[target_date_str]
                return {
                    "req_hours": override_data.get("req_hours", 9),
                    "start_time": override_data.get("start_time", "13:00"),
                    "grace_mins": override_data.get("grace_mins", 10)
                }
                
            # 2. Otherwise fall back to weekly settings map
            settings_val = row.get('setting_value', {})
            if check_in_dt:
                weekday = check_in_dt.weekday() # 4=Fri, 5=Sat
                if weekday == 4:
                    day_profile = settings_val.get('friday', {"start_time": "15:00", "grace_mins": 10, "req_hours": 7})
                elif weekday == 5:
                    day_profile = settings_val.get('saturday', {"start_time": "14:00", "grace_mins": 10, "req_hours": 5.75})
                else:
                    day_profile = settings_val.get('standard', {"start_time": "13:00", "grace_mins": 10, "req_hours": 9})
                
                return {
                    "req_hours": day_profile.get("req_hours", 9),
                    "start_time": day_profile.get("start_time", "13:00"),
                    "grace_mins": day_profile.get("grace_mins", 10)
                }
            return settings_val
    except Exception as e:
        print(f"Failed to load settings: {e}")
    
    # Absolute safe fallback if DB connection fails
    return {
        "req_hours": 9,
        "start_time": "13:00",
        "grace_mins": 10
    }

def get_pkt_today():
    """Always returns the exact current date in Lahore, Pakistan"""
    return datetime.now(PKT).date().isoformat()

@router.post("/check-in")
async def check_in(current_user: dict = Depends(get_current_active_user)):
    """Employee checks in (Strictly ONCE per day)."""
    try:
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
    try:
        today = get_pkt_today()
        
        response = supabase.table('attendance').select('*') \
            .eq('employee_id', current_user['id']) \
            .eq('date', today) \
            .eq('status', 'checked_in') \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="No active check-in found.")
        
        record = response.data[0]
        check_in_time = datetime.fromisoformat(record['check_in'].replace('Z', '+00:00'))
        current_time = datetime.now(timezone.utc)
        
        # --- UNIFIED DYNAMIC RULES LOGIC (Date Override & Grace Mins Aware) ---
        resolved_rules = get_shift_rules_for_date(today, check_in_time)
        req_hours = resolved_rules.get("req_hours", 9)
            
        max_duration = timedelta(hours=req_hours)
        
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
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_attendance_status(current_user: dict = Depends(get_current_active_user)):
    """Get today's exact shift status."""
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
            
            # --- THE FIX: We are removing the aggressive Python auto-checkout here. ---
            # We will rely entirely on the manual checkout or the 10-hour database cron job.
            
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

@router.get("/settings")
async def get_office_settings(current_user: dict = Depends(require_role(["admin", "super_admin"]))):
    try:
        response = supabase.table('office_settings').select('*').eq('setting_key', 'shift_rules').execute()
        return {"data": response.data[0] if response.data else {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/settings")
async def update_office_settings(
    payload: dict,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    try:
        response = supabase.table('office_settings').update({
            'setting_value': payload.get('setting_value', {}),
            'overrides': payload.get('overrides', {}),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }).eq('setting_key', 'shift_rules').execute()
        return {"message": "Settings updated", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@router.put("/{log_id}/reopen")
async def reopen_shift(
    log_id: str, 
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    try:
        # Call the raw SQL function to guarantee check_out is set to strict NULL
        response = supabase.rpc('force_reopen_shift', {'target_log_id': log_id}).execute()
        
        return {"message": "Shift forcefully reopened"}
    except Exception as e:
        print(f"CRITICAL REOPEN ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))